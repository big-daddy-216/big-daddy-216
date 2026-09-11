/* GET  /api/media?kind=tracks|videos   the library, for the music and video pages
 * POST /api/media                      put a song (or a clip) up
 *
 * The upload is the raw file as the request body, with the words about it in
 * an X-Media-Meta header (JSON, URL-encoded so it stays ASCII). Not multipart,
 * on purpose: formData() reads the whole body into memory, and a WAV of a
 * four-minute song is 40 MB against a 128 MB Worker. A raw body streams
 * straight into the bucket and never sits in memory at all.
 *
 * Two ways in: the band-word cookie (the panel on music.html) or the admin
 * token (scripts/upload-song.mjs, from your own machine).
 */

import { mayPost, isAdmin, hashIp } from '../../lib/auth.js';
import { json, fail } from '../../lib/http.js';
import { classify, slugify, readMeta, present } from '../../lib/media.js';
import * as limit from '../../lib/ratelimit.js';

const DEFAULT_MAX_BYTES = 80 * 1024 * 1024;   // under the 100 MB request cap on the free plan
const COLUMNS = 'slug, kind, title, album, year, duration_s, src, cover, poster, blurb, credits, sort_order, created_at';

/* ---------- GET ---------- */

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const kind = q.get('kind') === 'videos' ? 'video' : 'track';

  const { results } = await env.DB.prepare(
    'SELECT ' + COLUMNS + " FROM media WHERE kind = ? AND status = 'public'" +
    ' ORDER BY sort_order DESC, created_at DESC'
  ).bind(kind).all();

  return json({ items: results.map(present) });
}

/* ---------- POST ---------- */

export async function onRequestPost({ request, env, waitUntil }) {
  const admin = isAdmin(request, env);
  if (!admin && !await mayPost(request, env)) {
    return fail(401, 'not_authorised', 'You need the band word before you can put a song up.');
  }

  if (!env.MEDIA) {
    return fail(503, 'no_storage', "The bucket isn't connected yet, so there's nowhere to put the file.");
  }

  /* The admin token is yours alone; the band word is handed round, so it
     gets the same kind of ceiling the board has. */
  const ipHash = await hashIp(request, env);
  if (!admin) {
    const limited = await limit.check(env.DB, ipHash, 'upload');
    if (limited) {
      return fail(429, 'rate_limited', "That's a lot of songs in one sitting. Give it an hour.",
        { 'Retry-After': String(limited.retryAfterSeconds) });
    }
  }

  /* ---- the words ---- */
  let meta;
  try {
    meta = readMeta(JSON.parse(decodeURIComponent(request.headers.get('X-Media-Meta') || '')));
  } catch (e) {
    return fail(400, 'bad_request', 'That request did not make sense.');
  }
  if (!meta.title) {
    return fail(400, 'title_required', 'Give it a name so people know what they are clicking.');
  }

  /* ---- the file ---- */
  const size = Number(request.headers.get('Content-Length'));
  if (!Number.isFinite(size) || size <= 0) {
    return fail(411, 'length_required', 'That upload arrived without a size. Try again.');
  }
  const maxBytes = Number(env.MEDIA_MAX_BYTES) || DEFAULT_MAX_BYTES;
  if (size > maxBytes) {
    return fail(413, 'payload_too_large',
      'That file is bigger than we can take (' + Math.round(maxBytes / 1048576) + ' MB).');
  }
  const file = classify(meta.kind, meta.filename, request.headers.get('Content-Type'));
  if (!file) {
    return fail(400, 'bad_field', meta.kind === 'video'
      ? 'That file is not a video we can play.'
      : 'That file is not audio we can play. MP3, M4A, WAV, OGG or FLAC.');
  }

  /* ---- where it goes ---- */
  const slug = await freeSlug(env.DB, slugify(meta.title));
  const folder = meta.kind === 'video' ? 'video' : 'music/' + slugify(meta.album || slug);
  const key = folder + '/' + slug + '.' + file.ext;

  /* A song added to a record that already has artwork gets the same
     artwork, so the album keeps one cover instead of one per upload. */
  let cover = meta.cover;
  if (!cover && meta.kind === 'track' && meta.album) {
    const sibling = await env.DB.prepare(
      "SELECT cover FROM media WHERE kind = 'track' AND album = ? AND cover IS NOT NULL" +
      ' ORDER BY created_at DESC LIMIT 1'
    ).bind(meta.album).first();
    if (sibling) cover = sibling.cover;
  }

  /* New uploads go on top: the pages sort by sort_order descending. Starts
     well above anything in assets/data/catalog.js so the two sources don't
     interleave by accident. */
  const top = await env.DB.prepare(
    'SELECT COALESCE(MAX(sort_order), 990) AS n FROM media WHERE kind = ?'
  ).bind(meta.kind).first();
  const sortOrder = ((top && top.n) || 990) + 10;

  /* ---- the upload itself ---- */
  await env.MEDIA.put(key, request.body, {
    httpMetadata: {
      contentType: file.mime,
      // The key carries the slug and nothing overwrites it, so browsers and
      // the CDN can keep it as long as they like.
      cacheControl: 'public, max-age=31536000, immutable'
    }
  });

  /* ---- the row ---- */
  const now = Date.now();
  const row = {
    slug, kind: meta.kind, title: meta.title, album: meta.album, year: meta.year,
    duration_s: meta.duration_s, src: key,
    cover: meta.kind === 'track' ? cover : null,
    poster: meta.kind === 'video' ? meta.poster : null,
    blurb: meta.blurb, credits: meta.credits, sort_order: sortOrder, created_at: now
  };
  try {
    await env.DB.prepare(
      'INSERT INTO media (slug, kind, title, album, year, duration_s, src, cover, poster,' +
      ' blurb, credits, sort_order, status, bytes, mime, created_at)' +
      " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'public',?,?,?)"
    ).bind(
      row.slug, row.kind, row.title, row.album, row.year, row.duration_s, row.src,
      row.cover, row.poster, row.blurb, row.credits, row.sort_order, size, file.mime, now
    ).run();
  } catch (err) {
    // Don't leave the object behind if the row never landed.
    waitUntil(env.MEDIA.delete(key).catch(() => {}));
    throw err;
  }

  if (!admin) {
    await limit.record(env.DB, ipHash, 'upload');
    waitUntil(limit.pruneSometimes(env.DB));
  }

  return json({ item: present(row) }, 201);
}

/* Two songs with the same name get "-2", "-3" — never a silent overwrite. */
async function freeSlug(db, base) {
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? base : base + '-' + n;
    const taken = await db.prepare('SELECT 1 FROM media WHERE slug = ?').bind(candidate).first();
    if (!taken) return candidate;
  }
  throw new Error('could not find a free slug for ' + base);
}
