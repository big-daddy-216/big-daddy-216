/* Talking to the jam board's database from this machine — plain Node, no Wrangler.
 *
 * Wrangler can't run on Windows ARM64: its runtime, workerd, has no build for
 * that platform and never has (there is no @cloudflare/workerd-windows-arm64
 * package at all). It crashes on *every* command, not just the ones that need
 * a local runtime, because the runtime is loaded when the CLI starts.
 *
 * That's the same wall the Ohio Crash Scanner hit, and this is the same way
 * round it: the deploy happens on Cloudflare's own Linux builders via the git
 * integration, and anything administrative is a small script talking to the
 * REST API directly. See ohio-crash-reporting/docs — "Deploy via cloud build
 * (Workers Builds); skip the local CLI", and its key-minting CLI, which runs
 * "plain Node — no Wrangler".
 *
 *   node scripts/d1.mjs migrate            apply anything in migrations/ that hasn't run
 *   node scripts/d1.mjs status             what's applied, and how many jams there are
 *   node scripts/d1.mjs recent [n]         the last n jams
 *   node scripts/d1.mjs hide <jam-id>      take one down (shows as removed by the band)
 *   node scripts/d1.mjs unhide <jam-id>    put it back
 *   node scripts/d1.mjs songs              everything on the music page, with slugs
 *   node scripts/d1.mjs hide-song <slug>   take a song off the page (the file stays)
 *   node scripts/d1.mjs unhide-song <slug> put it back
 *   node scripts/d1.mjs sql "SELECT …"     anything else
 *
 * To put a song UP from here, see scripts/upload-song.mjs.
 *
 * Credentials come from .dev.vars (gitignored) or the environment:
 *
 *   CLOUDFLARE_ACCOUNT_ID   Cloudflare dashboard, right-hand column
 *   CLOUDFLARE_API_TOKEN    My Profile > API Tokens > Create Token,
 *                           with the "D1:Edit" permission and nothing else
 *   D1_DATABASE_ID          the id you pasted into wrangler.toml
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.cloudflare.com/client/v4';

/* ---- credentials ---- */

function loadEnv() {
  const env = { ...process.env };
  const file = join(ROOT, '.dev.vars');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      // Anything already in the real environment wins over the file.
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const ACCOUNT = env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = env.CLOUDFLARE_API_TOKEN;
const DATABASE = env.D1_DATABASE_ID;

function requireCredentials() {
  const missing = [
    ['CLOUDFLARE_ACCOUNT_ID', ACCOUNT],
    ['CLOUDFLARE_API_TOKEN', TOKEN],
    ['D1_DATABASE_ID', DATABASE]
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) {
    console.error('Missing: ' + missing.join(', '));
    console.error('Put them in .dev.vars (it is gitignored) or the environment.');
    console.error('The token needs the D1:Edit permission and nothing else.');
    process.exit(1);
  }
}

/* ---- the one call everything goes through ---- */

async function query(sql, params = []) {
  const res = await fetch(`${API}/accounts/${ACCOUNT}/d1/database/${DATABASE}/query`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });

  let body;
  try { body = await res.json(); } catch (e) { body = null; }

  if (!res.ok || !body || body.success === false) {
    const errs = (body && body.errors) || [];
    const detail = errs.map((e) => `${e.code}: ${e.message}`).join('; ')
      || `HTTP ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new Error(detail + '\nCheck the token has D1:Edit and the account id is right.');
    }
    throw new Error(detail);
  }

  // One entry per statement; the last one is usually what a caller wants.
  return body.result || [];
}

function rows(result) {
  const last = result[result.length - 1];
  return (last && last.results) || [];
}

/* ---- migrations ---- */

const TRACKING = `CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
)`;

async function migrate({ dryRun }) {
  await query(TRACKING);
  const done = new Set(rows(await query('SELECT name FROM _migrations')).map((r) => r.name));

  const files = readdirSync(join(ROOT, 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !done.has(f));

  if (!pending.length) {
    console.log('Nothing to apply. ' + files.filter((f) => done.has(f)).length + ' migration(s) already in.');
    return;
  }

  for (const file of pending) {
    const sql = readFileSync(join(ROOT, 'migrations', file), 'utf8');
    if (dryRun) { console.log('would apply ' + file + ' (' + sql.length + ' chars)'); continue; }

    process.stdout.write('applying ' + file + ' … ');
    /* Sent whole rather than split on semicolons — the immutability trigger
       has semicolons inside its BEGIN…END body, and naive splitting would
       cut it in half. */
    await query(sql);
    await query('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)', [file, Date.now()]);
    console.log('done');
  }
}

/* ---- the rest ---- */

async function status() {
  // Before the first migrate there is no tracking table, which is a fine
  // state to be in and shouldn't read as an error.
  let applied = [];
  try {
    applied = rows(await query('SELECT name, applied_at FROM _migrations ORDER BY name'));
  } catch (e) {
    console.log('No migrations applied yet.');
    return;
  }
  for (const r of applied) {
    console.log('applied  ' + r.name + '  ' + new Date(r.applied_at).toISOString().slice(0, 16).replace('T', ' '));
  }
  const counts = rows(await query(
    `SELECT status, COUNT(*) AS n FROM jams GROUP BY status ORDER BY status`
  ));
  if (!counts.length) console.log('\nNo jams yet.');
  else {
    console.log('');
    for (const c of counts) console.log(String(c.n).padStart(6) + '  ' + c.status);
  }
}

async function recent(limit) {
  const list = rows(await query(
    `SELECT id, title, author, bpm, status, remix_count, created_at
     FROM jams ORDER BY created_at DESC LIMIT ?`, [limit]
  ));
  if (!list.length) { console.log('Nothing on the board yet.'); return; }
  for (const j of list) {
    const when = new Date(j.created_at).toISOString().slice(0, 16).replace('T', ' ');
    const who = j.author || 'Anonymous';
    const flag = j.status === 'public' ? '' : '  [' + j.status + ']';
    const built = j.remix_count ? '  (' + j.remix_count + ' built on it)' : '';
    console.log(`${j.id}  ${when}  ${j.bpm}bpm  ${j.title} — ${who}${built}${flag}`);
  }
}

async function setStatus(id, status) {
  /* Throwing rather than exiting: process.exit() while a fetch is still
     settling trips a libuv assertion on Windows and prints a crash on top of
     the real message. The catch at the bottom sets the exit code instead. */
  if (!id) throw new Error('Which jam? Pass its id.');
  const found = rows(await query('SELECT id, title, status FROM jams WHERE id = ?', [id]));
  if (!found.length) throw new Error('No jam with the id ' + id + '.');

  await query('UPDATE jams SET status = ? WHERE id = ?', [status, id]);
  console.log(`"${found[0].title}" is now ${status}.`);
  if (status === 'hidden') {
    // Worth saying, because it's the surprising part of the design.
    console.log('Anything built on it stays up — the row is kept so lineage still works.');
  }
}

/* ---- the music page ---- */

async function songs() {
  const list = rows(await query(
    `SELECT slug, title, album, year, duration_s, status, bytes, created_at
     FROM media WHERE kind = 'track' ORDER BY sort_order DESC, created_at DESC`
  ));
  if (!list.length) { console.log('Nothing on the music page yet (from the database, that is).'); return; }
  for (const t of list) {
    const when = new Date(t.created_at).toISOString().slice(0, 10);
    const len = t.duration_s
      ? Math.floor(t.duration_s / 60) + ':' + String(Math.round(t.duration_s % 60)).padStart(2, '0')
      : '?:??';
    const mb = t.bytes ? (t.bytes / 1048576).toFixed(1) + ' MB' : '';
    const flag = t.status === 'public' ? '' : '  [' + t.status + ']';
    console.log(`${t.slug.padEnd(28)} ${when}  ${len.padStart(5)}  ${mb.padStart(7)}  ${t.title}${t.album ? ' — ' + t.album : ''}${flag}`);
  }
}

async function setSongStatus(slug, status) {
  if (!slug) throw new Error('Which song? Pass its slug (see: songs).');
  const found = rows(await query('SELECT slug, title FROM media WHERE slug = ?', [slug]));
  if (!found.length) throw new Error('No song with the slug ' + slug + '.');
  await query('UPDATE media SET status = ? WHERE slug = ?', [status, slug]);
  console.log(`"${found[0].title}" is now ${status}.`);
  if (status === 'hidden') console.log('The file is still in the bucket; only the listing is gone.');
}

/* ---- entry ---- */

const [command, ...args] = process.argv.slice(2);

const commands = {
  migrate: () => migrate({ dryRun: args.includes('--dry-run') }),
  status,
  recent: () => recent(Math.min(Math.max(parseInt(args[0], 10) || 20, 1), 200)),
  hide: () => setStatus(args[0], 'hidden'),
  unhide: () => setStatus(args[0], 'public'),
  songs,
  'hide-song': () => setSongStatus(args[0], 'hidden'),
  'unhide-song': () => setSongStatus(args[0], 'public'),
  sql: async () => {
    if (!args[0]) throw new Error('Pass some SQL in quotes.');
    const out = rows(await query(args[0]));
    console.log(out.length ? JSON.stringify(out, null, 2) : 'OK (no rows returned)');
  }
};

if (!command || !commands[command]) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .split('\n').slice(1, 32).map((l) => l.replace(/^ \* ?| ?\*\/$/, '')).join('\n'));
  process.exit(command ? 1 : 0);
}

requireCredentials();
commands[command]().catch((err) => {
  console.error('\n' + err.message);
  process.exitCode = 1;      // not process.exit(); see setStatus above
});
