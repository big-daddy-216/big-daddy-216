/* Put a song on the Music page from this machine — no browser, no band word.
 *
 *   node scripts/upload-song.mjs "C:\path\to\4 Minute Clinic.m4a"
 *   node scripts/upload-song.mjs song.mp3 --title "Pretzel Sunday" --album "Arena Sized" --year 2026
 *   node scripts/upload-song.mjs song.mp3 --blurb "Live at the Shred Shed." --cover art.jpg
 *
 * It talks to the same /api/media the upload panel on music.html uses, but
 * signs in with ADMIN_TOKEN from .dev.vars instead of the band word. The
 * title defaults to the filename without its extension. Add --site to point
 * at a preview deployment instead of the live site.
 *
 * The length of the song is read from the file's own header (M4A/MP4, WAV,
 * or MP3) so the page can show it before anything loads. If that fails the
 * song still goes up; pass --duration <seconds> or let the page work it out
 * the first time somebody plays it.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, extname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SITE = 'https://bigdaddyand.co';

/* ---- arguments ---- */

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { out[key] = next; i++; }
      else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const filePath = args._[0];

if (!filePath || args.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .split('\n').slice(1, 16).map((l) => l.replace(/^ \* ?| ?\*\/$/, '')).join('\n'));
  process.exit(filePath ? 0 : 1);
}

/* ---- credentials, same file d1.mjs reads ---- */

function loadEnv() {
  const env = { ...process.env };
  const file = join(ROOT, '.dev.vars');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const SITE = String(args.site || env.SITE_URL || DEFAULT_SITE).replace(/\/+$/, '');

if (!env.ADMIN_TOKEN) {
  console.error('ADMIN_TOKEN is missing. It lives in .dev.vars — the same value that is set in Pages > Settings.');
  process.exit(1);
}

/* ---- how long is it? ---- */

/* MP4/M4A: the movie header atom holds a timescale and a duration in those
   units. It's tiny and unique, so a scan for the tag is enough. */
function mp4Duration(buf) {
  const at = buf.indexOf('mvhd');
  if (at < 0) return null;
  const version = buf[at + 4];
  if (version === 1) {
    const timescale = buf.readUInt32BE(at + 24);
    const duration = Number(buf.readBigUInt64BE(at + 28));
    return timescale ? duration / timescale : null;
  }
  const timescale = buf.readUInt32BE(at + 16);
  const duration = buf.readUInt32BE(at + 20);
  return timescale ? duration / timescale : null;
}

/* WAV: data bytes over bytes-per-second, both straight out of the header. */
function wavDuration(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
  let pos = 12;
  let byteRate = 0;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') byteRate = buf.readUInt32LE(pos + 16);
    if (id === 'data') return byteRate ? size / byteRate : null;
    pos += 8 + size + (size % 2);
  }
  return null;
}

/* MP3: assumes a constant bitrate, read from the first frame. Good enough
   for a number on the page; the player shows the real one once it plays. */
function mp3Duration(buf) {
  const RATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  let start = 0;
  if (buf.toString('ascii', 0, 3) === 'ID3') {
    start = 10 + ((buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]);
  }
  for (let i = start; i < Math.min(buf.length - 4, start + 65536); i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      const mpeg1 = (buf[i + 1] & 0x18) === 0x18;
      const layer3 = (buf[i + 1] & 0x06) === 0x02;
      if (!mpeg1 || !layer3) continue;
      const kbps = RATES[buf[i + 2] >> 4];
      if (!kbps) continue;
      return (buf.length - start) * 8 / (kbps * 1000);
    }
  }
  return null;
}

function measure(buf, ext) {
  try {
    if (ext === 'm4a' || ext === 'mp4' || ext === 'aac') return mp4Duration(buf);
    if (ext === 'wav') return wavDuration(buf);
    if (ext === 'mp3') return mp3Duration(buf);
  } catch (e) { /* a strange header is not a reason to stop */ }
  return null;
}

const TYPES = {
  m4a: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac', mp3: 'audio/mpeg', wav: 'audio/wav',
  ogg: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac', webm: 'audio/webm',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp'
};

/* ---- the upload ---- */

async function send(path, buf, type, meta) {
  const res = await fetch(SITE + path, {
    method: 'POST',
    headers: {
      'X-Admin-Token': env.ADMIN_TOKEN,
      // _middleware refuses a POST whose Origin isn't the site's own.
      Origin: SITE,
      'Content-Type': type,
      'X-Media-Meta': encodeURIComponent(JSON.stringify(meta))
    },
    body: buf
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    throw new Error((data && data.message) || ('HTTP ' + res.status) +
      (res.status === 401 ? ' — is ADMIN_TOKEN in .dev.vars the one set in Pages > Settings?' : ''));
  }
  return data;
}

async function main() {
  if (!existsSync(filePath)) throw new Error('No such file: ' + filePath);
  const buf = readFileSync(filePath);
  const name = basename(filePath);
  const ext = extname(name).slice(1).toLowerCase();
  if (!TYPES[ext] || !TYPES[ext].startsWith('audio/')) {
    throw new Error('Not an audio file we can play: .' + ext + ' (MP3, M4A, WAV, OGG or FLAC).');
  }

  const duration = args.duration ? Number(args.duration) : measure(buf, ext);
  const title = args.title || name.replace(/\.[a-z0-9]+$/i, '').replace(/_+/g, ' ').trim();

  let cover = null;
  if (args.cover) {
    if (!existsSync(args.cover)) throw new Error('No such file: ' + args.cover);
    const art = readFileSync(args.cover);
    const artExt = extname(args.cover).slice(1).toLowerCase();
    if (!TYPES[artExt] || !TYPES[artExt].startsWith('image/')) {
      throw new Error('Artwork needs to be a JPEG, PNG or WebP.');
    }
    process.stdout.write('artwork … ');
    cover = (await send('/api/media/art', art, TYPES[artExt], { filename: basename(args.cover) })).key;
    console.log(cover);
  }

  process.stdout.write(`"${title}" (${(buf.length / 1048576).toFixed(1)} MB) → ${SITE} … `);
  const { item } = await send('/api/media', buf, TYPES[ext], {
    kind: 'track',
    filename: name,
    title,
    album: args.album || null,
    year: args.year ? Number(args.year) : new Date().getFullYear(),
    blurb: args.blurb || null,
    credits: args.credits || null,
    duration_s: duration,
    cover
  });
  console.log('up.');
  console.log(`  ${SITE}/music.html   (slug: ${item.slug}` +
    (item.duration_s ? `, ${Math.floor(item.duration_s / 60)}:${String(Math.round(item.duration_s % 60)).padStart(2, '0')}` : ', length unknown') + ')');
  console.log('  To take it down: node scripts/d1.mjs hide-song ' + item.slug);
}

main().catch((err) => {
  console.error('\n' + err.message);
  process.exitCode = 1;
});
