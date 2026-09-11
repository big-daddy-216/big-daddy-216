/* Shared pieces of the music and video library: what a row looks like on the
 * way out, and how a file's type and name are decided on the way in.
 */

import { cleanText } from './http.js';

/* Browsers disagree about what to call an .m4a (audio/x-m4a, audio/mp4, or
   nothing at all on Windows), so the extension decides and the reported type
   is only a fallback. What's stored is what the bucket will serve as
   Content-Type, which is what makes Safari play it. */
const AUDIO_BY_EXT = {
  m4a: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg',
  opus: 'audio/ogg', flac: 'audio/flac', webm: 'audio/webm', weba: 'audio/webm'
};
const VIDEO_BY_EXT = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
const IMAGE_BY_EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

const TABLES = { track: AUDIO_BY_EXT, video: VIDEO_BY_EXT, image: IMAGE_BY_EXT };
const PREFIX = { track: 'audio/', video: 'video/', image: 'image/' };

export function extensionOf(filename) {
  const m = String(filename || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

/* -> { ext, mime } or null when the file isn't the kind of thing asked for.
   `reported` is the browser's Content-Type; trusted only for the broad
   audio/video/image class, never for the exact subtype. */
export function classify(kind, filename, reported) {
  const table = TABLES[kind];
  if (!table) return null;
  const ext = extensionOf(filename);
  if (table[ext]) return { ext, mime: table[ext] };

  const mime = String(reported || '').split(';')[0].trim().toLowerCase();
  if (!mime.startsWith(PREFIX[kind])) return null;
  // Known type, unusual or missing extension: pick the extension from the type.
  for (const e in table) if (table[e] === mime) return { ext: e, mime };
  return /^[a-z]+\/[a-z0-9.+-]+$/.test(mime) ? { ext: ext || 'bin', mime } : null;
}

/* "4 Minute Clinic" -> "4-minute-clinic". ASCII only, because the slug goes
   in the address bar and in the bucket key. */
export function slugify(text) {
  return String(text || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '') || 'untitled';
}

/* The fields a caller may set, each cleaned and capped. Anything else in the
   request is ignored rather than refused. */
export function readMeta(raw) {
  const meta = raw && typeof raw === 'object' ? raw : {};
  const year = parseInt(meta.year, 10);
  const duration = Number(meta.duration_s);
  return {
    kind: meta.kind === 'video' ? 'video' : 'track',
    title: cleanText(meta.title, 120),
    album: cleanText(meta.album, 120),
    year: Number.isFinite(year) && year >= 1900 && year <= 2100 ? year : null,
    duration_s: Number.isFinite(duration) && duration > 0 && duration < 36000
      ? Math.round(duration * 10) / 10 : null,
    blurb: cleanText(meta.blurb, 500, { multiline: true }),
    credits: cleanText(meta.credits, 300, { multiline: true }),
    filename: cleanText(meta.filename, 200),
    // Bucket keys from /api/media/art, or a path into assets/ — nothing else.
    cover: keyOrAssetPath(meta.cover),
    poster: keyOrAssetPath(meta.poster)
  };
}

function keyOrAssetPath(value) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (/^(music|video|assets)\/[A-Za-z0-9._\/-]+$/.test(s) && !s.includes('..')) return s;
  return null;
}

/* The shape the pages already read from assets/data/catalog.js. Keys stay as
   keys — assets/js/catalog.js turns them into addresses, same as for the
   file, so the two sources are interchangeable. */
export function present(row) {
  return {
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    album: row.album,
    year: row.year,
    duration_s: row.duration_s,
    src: row.src,
    cover: row.cover,
    poster: row.poster,
    blurb: row.blurb,
    credits: row.credits,
    sort_order: row.sort_order,
    created_at: row.created_at
  };
}
