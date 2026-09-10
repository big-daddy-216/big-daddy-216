/* GET  /api/jams   browse the board
 * POST /api/jams   publish one
 *
 * There is no third verb. Building on somebody's jam is a POST with parent_id
 * set, which inserts a new row; the original is never touched. See the triggers
 * in migrations/0001_jams.sql — the database enforces this independently.
 */

import { mayPost, hashIp, sha256Hex } from '../../lib/auth.js';
import { json, fail, cleanText, newId, newToken } from '../../lib/http.js';
import { readLoopCode, isSilent, MAX_LOOP_CODE_CHARS } from '../../lib/loop.js';
import * as limit from '../../lib/ratelimit.js';

const PAGE_DEFAULT = 24;
const PAGE_MAX = 48;
const DEFAULT_MAX_SAMPLE_BYTES = 400000;
const DUPLICATE_WINDOW_MS = 60000;

const COLUMNS = `id, created_at, title, author, note, loop_code, bpm, note_count,
                 voices, parent_id, root_id, depth, sample_key, sample_secs,
                 remix_count, status`;

/* ---------- shaping a row for the page ---------- */

export function present(row, env) {
  return {
    id: row.id,
    created_at: row.created_at,
    title: row.title,
    author: row.author,                 // null means anonymous; the page words it
    note: row.note,
    loop: row.loop_code,
    bpm: row.bpm,
    note_count: row.note_count,
    voices: row.voices ? row.voices.split(',') : [],
    parent_id: row.parent_id,
    root_id: row.root_id,
    depth: row.depth,
    remix_count: row.remix_count,
    status: row.status,
    sample: row.sample_key
      ? { url: env.MEDIA_BASE_URL + '/' + row.sample_key, seconds: row.sample_secs }
      : null
  };
}

/* Keyset pagination rather than OFFSET: a jam published while somebody is
   paging would otherwise shove every later row down one and duplicate it. */
function encodeCursor(row, sort) {
  const key = sort === 'remixed' ? row.remix_count : row.created_at;
  return btoa(JSON.stringify([key, row.id]))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeCursor(raw) {
  try {
    let s = String(raw).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const [key, id] = JSON.parse(atob(s));
    if (typeof key !== 'number' || typeof id !== 'string') return null;
    return { key, id };
  } catch (e) {
    return null;
  }
}

/* ---------- GET ---------- */

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const sort = q.get('sort') === 'remixed' ? 'remixed' : 'recent';
  const limitN = Math.min(Math.max(parseInt(q.get('limit'), 10) || PAGE_DEFAULT, 1), PAGE_MAX);

  const where = ["status = 'public'"];
  const binds = [];

  const bpmMin = parseInt(q.get('bpm_min'), 10);
  if (Number.isFinite(bpmMin)) { where.push('bpm >= ?'); binds.push(bpmMin); }
  const bpmMax = parseInt(q.get('bpm_max'), 10);
  if (Number.isFinite(bpmMax)) { where.push('bpm <= ?'); binds.push(bpmMax); }

  const voice = q.get('voice');
  if (voice && /^[a-z]+$/.test(voice)) {
    // voices is a short csv; the wrapping commas stop 'organ' matching 'organist'.
    where.push("(',' || voices || ',') LIKE ?");
    binds.push('%,' + voice + ',%');
  }

  if (q.get('has_sample') === '1') where.push('sample_key IS NOT NULL');

  const root = q.get('root');
  if (root) { where.push('root_id = ?'); binds.push(root); }

  const parent = q.get('parent');
  if (parent) { where.push('parent_id = ?'); binds.push(parent); }

  const search = cleanText(q.get('q'), 60);
  if (search) {
    // A % or _ typed into the search box is a literal, not a wildcard.
    const like = '%' + search.replace(/[%_\\]/g, '\\$&') + '%';
    where.push("(title LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\')");
    binds.push(like, like);
  }

  const cursor = q.get('cursor') ? decodeCursor(q.get('cursor')) : null;
  const sortCol = sort === 'remixed' ? 'remix_count' : 'created_at';
  if (cursor) {
    where.push('(' + sortCol + ' < ? OR (' + sortCol + ' = ? AND id < ?))');
    binds.push(cursor.key, cursor.key, cursor.id);
  }

  // One extra row tells us whether there's another page without a COUNT.
  const sql = 'SELECT ' + COLUMNS + ' FROM jams WHERE ' + where.join(' AND ') +
              ' ORDER BY ' + sortCol + ' DESC, id DESC LIMIT ?';
  const { results } = await env.DB.prepare(sql).bind(...binds, limitN + 1).all();

  const hasMore = results.length > limitN;
  const page = hasMore ? results.slice(0, limitN) : results;

  return json({
    jams: page.map((r) => present(r, env)),
    cursor: hasMore ? encodeCursor(page[page.length - 1], sort) : null,
    has_more: hasMore
  });
}

/* ---------- POST ---------- */

export async function onRequestPost({ request, env, waitUntil }) {
  if (!await mayPost(request, env)) {
    return fail(401, 'not_authorised',
      'You need the band word before you can put a jam on the wall.');
  }

  const ipHash = await hashIp(request, env);
  const limited = await limit.check(env.DB, ipHash, 'publish');
  if (limited) {
    return fail(429, 'rate_limited', "That's a lot of jams in one sitting. Give it an hour.",
      { 'Retry-After': String(limited.retryAfterSeconds) });
  }

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return fail(400, 'bad_request', 'That upload did not arrive in one piece. Try again.');
  }

  let meta;
  try {
    meta = JSON.parse(form.get('meta'));
    if (!meta || typeof meta !== 'object') throw new Error('shape');
  } catch (e) {
    return fail(400, 'bad_request', 'That request did not make sense.');
  }

  /* ---- the loop itself ---- */
  const loopCode = typeof meta.loop === 'string' ? meta.loop.trim() : '';
  if (loopCode.length > MAX_LOOP_CODE_CHARS) {
    return fail(400, 'invalid_loop', 'That loop code is too long to be real.');
  }
  const info = readLoopCode(loopCode);
  if (!info.ok) {
    return fail(400, 'invalid_loop', "That loop didn't decode. Try copying it again.");
  }
  if (isSilent(loopCode)) {
    return fail(400, 'empty_pattern', 'There is nothing in that loop yet — put a beat down first.');
  }

  /* ---- the words around it ---- */
  const title = cleanText(meta.title, 80);
  if (!title) {
    return fail(400, 'title_required', 'Give it a name so people know what they are clicking.');
  }
  const author = cleanText(meta.author, 40);          // null => anonymous
  const note = cleanText(meta.note, 500, { multiline: true });

  /* ---- lineage ---- */
  let parent = null;
  if (meta.parent_id) {
    parent = await env.DB.prepare(
      `SELECT id, root_id, depth, sample_key, sample_secs, sample_bytes, sample_mime
       FROM jams WHERE id = ?`
    ).bind(String(meta.parent_id)).first();
    if (!parent) {
      return fail(404, 'unknown_parent', 'The jam this was built on is no longer there.');
    }
  }

  /* A double-tap on Publish, or a retry after a dropped response, shouldn't
     put the same loop on the wall twice. */
  const parentId = parent ? parent.id : null;
  const dupe = await env.DB.prepare(
    `SELECT id FROM jams
     WHERE loop_code = ? AND created_at > ?
       AND ((parent_id IS NULL AND ? IS NULL) OR parent_id = ?)
     LIMIT 1`
  ).bind(loopCode, Date.now() - DUPLICATE_WINDOW_MS, parentId, parentId).first();
  if (dupe) {
    return fail(409, 'duplicate', 'That one is already up.', { 'X-Existing-Id': dupe.id });
  }

  const id = newId(12);

  /* ---- the mic sample ---- */
  let sample = { key: null, secs: null, bytes: null, mime: null };
  const file = form.get('sample');
  const maxBytes = Number(env.JAM_MAX_SAMPLE_BYTES) || DEFAULT_MAX_SAMPLE_BYTES;
  const inherited = !!(meta.inherit_sample && parent && parent.sample_key);

  if (inherited) {
    /* A remix that keeps the original's sample points at the SAME object rather
       than uploading a copy. This is why withdrawing a jam never deletes its
       sample — other people's loops may be leaning on it. */
    sample = {
      key: parent.sample_key, secs: parent.sample_secs,
      bytes: parent.sample_bytes, mime: parent.sample_mime
    };
  } else if (file && typeof file.arrayBuffer === 'function' && file.size > 0) {
    if (file.size > maxBytes) {
      return fail(413, 'payload_too_large', 'That recording is bigger than we can take.');
    }
    const mime = String(file.type || '').split(';')[0].trim();
    if (!/^audio\/[a-z0-9.+-]+$/i.test(mime)) {
      return fail(400, 'bad_field', 'That sample is not audio.');
    }
    sample = {
      key: 'jams/samples/' + id + '.wav',
      secs: Number(meta.sample_seconds) || null,
      bytes: file.size,
      mime
    };
    await env.MEDIA.put(sample.key, file.stream(), {
      httpMetadata: {
        contentType: mime,
        // Immutable: the key carries the jam id and nothing overwrites it.
        cacheControl: 'public, max-age=31536000, immutable'
      }
    });
  }

  /* ---- write ---- */
  const deleteToken = newToken();
  const now = Date.now();

  const statements = [
    env.DB.prepare(
      `INSERT INTO jams (id, created_at, title, author, note, loop_code, bpm,
         note_count, voices, parent_id, root_id, depth, sample_key, sample_secs,
         sample_bytes, sample_mime, delete_token, ip_hash)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id, now, title, author, note, loopCode, info.bpm,
      info.noteCount, (info.voices || []).join(','),
      parentId, parent ? parent.root_id : id, parent ? parent.depth + 1 : 0,
      sample.key, sample.secs, sample.bytes, sample.mime,
      await sha256Hex(deleteToken), ipHash
    )
  ];
  if (parent) {
    statements.push(
      env.DB.prepare('UPDATE jams SET remix_count = remix_count + 1 WHERE id = ?')
        .bind(parent.id)
    );
  }

  try {
    await env.DB.batch(statements);
  } catch (err) {
    /* Don't leave the object behind if the row never landed. Only ours, though
       — an inherited key belongs to the parent and must survive. */
    if (sample.key && !inherited) {
      waitUntil(env.MEDIA.delete(sample.key).catch(() => {}));
    }
    throw err;
  }

  await limit.record(env.DB, ipHash, 'publish');
  waitUntil(limit.pruneSometimes(env.DB));

  const origin = new URL(request.url).origin;
  return json({
    id,
    url: origin + '/jam.html?jam=' + id,
    delete_token: deleteToken      // shown once; only its hash is stored
  }, 201);
}
