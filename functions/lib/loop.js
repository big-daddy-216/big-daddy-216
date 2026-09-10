/* Server-side reading of a loop code.
 *
 * This mirrors decodeLoop() in assets/js/jam-engine.js, but it is deliberately
 * NOT a full decoder: the board never needs to render a pattern on the server.
 * It needs two things — a yes/no on whether the code is well formed, and the
 * tempo and note count read out of the bytes themselves.
 *
 * Deriving those rather than accepting them from the request is the point. A
 * client can claim any BPM it likes; what ends up on the board is whatever is
 * actually encoded, so the card can never disagree with the loop it plays.
 *
 * If the engine's format grows a version 3, teach this file about it at the
 * same time, or new codes will be rejected on the way in.
 */

const MAGIC = 0xbd;
const VERSION = 2;
const STEPS = 32;
const LANES = 6;
const MAX_LAYERS = 4;
const MAX_NOTES = 96;
const BPM_MIN = 60;
const BPM_MAX = 180;
// Index order must match VOICES in assets/js/jam-engine.js:41. If a voice is
// added there, add it here too or every loop using it is rejected on the way in.
const VOICES = ['organ', 'fuzzbass', 'epiano', 'synth', 'choir'];
const VOICE_COUNT = VOICES.length;

export const MAX_LOOP_CODE_CHARS = 4096;

function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }

/* Workers give us atob(), but a stray character would throw rather than
   return, and the caller wants a reason instead of an exception. */
function fromBase64Url(str) {
  if (typeof str !== 'string' || !/^[A-Za-z0-9_-]+$/.test(str)) return null;
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  try {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch (e) {
    return null;
  }
}

function bytesPerLane(count) { return Math.ceil(count / 8); }

/* Version 1 was a single 16-step bar with one keys track. Old links are still
   out in the world and still decode in the browser, so they are still allowed
   onto the board. */
function readV1(b) {
  const HEADER = 17;
  if (b.length < HEADER) return { ok: false, reason: 'truncated' };
  const count = b[16];
  if (b.length < HEADER + count * 3) return { ok: false, reason: 'truncated' };
  // v1 carried a single keys track, its voice in byte 3.
  const voice = VOICES[b[3]] || VOICES[0];
  return {
    ok: true,
    version: 1,
    bpm: clamp(b[2] + 40, BPM_MIN, BPM_MAX),
    noteCount: count,
    layerCount: count > 0 ? 1 : 0,
    voices: count > 0 ? [voice] : []
  };
}

function readV2(b) {
  const steps = b[3] || STEPS;
  if (steps < 1 || steps > 64) return { ok: false, reason: 'bad-steps' };

  const layerCount = b[4];
  if (layerCount > MAX_LAYERS) return { ok: false, reason: 'too-many-layers' };

  const laneBytes = bytesPerLane(steps);
  let offset = 5 + LANES * laneBytes;
  if (b.length < offset) return { ok: false, reason: 'truncated' };

  let noteCount = 0;
  const voices = [];
  for (let li = 0; li < layerCount; li++) {
    if (offset + 2 > b.length) return { ok: false, reason: 'truncated' };
    const flags = b[offset++];
    const count = b[offset++];
    if ((flags & 0x0f) >= VOICE_COUNT) return { ok: false, reason: 'bad-voice' };
    if (count > MAX_NOTES) return { ok: false, reason: 'too-many-notes' };
    if (offset + count * 3 > b.length) return { ok: false, reason: 'truncated' };
    offset += count * 3;
    noteCount += count;
    // Only voices you can actually hear: a layer with no notes, or a muted
    // one, shouldn't make the loop show up under that instrument's filter.
    const voice = VOICES[flags & 0x0f];
    const muted = !!(flags & 0x80);
    if (count > 0 && !muted && !voices.includes(voice)) voices.push(voice);
  }

  /* Trailing bytes mean the code is not what it says it is. The browser's
     decoder would shrug and ignore them; on the way into shared storage,
     anything unaccounted for is a reason to say no. */
  if (offset !== b.length) return { ok: false, reason: 'trailing-bytes' };

  return {
    ok: true,
    version: 2,
    bpm: clamp(b[2] + 40, BPM_MIN, BPM_MAX),
    noteCount,
    layerCount,
    voices
  };
}

/* -> { ok:true, version, bpm, noteCount, layerCount }
 *    { ok:false, reason }
 */
export function readLoopCode(code) {
  if (typeof code !== 'string' || !code) return { ok: false, reason: 'missing' };
  if (code.length > MAX_LOOP_CODE_CHARS) return { ok: false, reason: 'too-long' };

  const b = fromBase64Url(code);
  if (!b) return { ok: false, reason: 'not-base64url' };
  if (b.length < 5) return { ok: false, reason: 'truncated' };
  if (b[0] !== MAGIC) return { ok: false, reason: 'bad-magic' };

  if (b[1] === 1) return readV1(b);
  if (b[1] !== VERSION) return { ok: false, reason: 'unknown-version' };
  return readV2(b);
}

/* A loop with nothing in it is not worth a slot on the board. Drum-only
   loops are legitimate, so this checks the drum lanes too rather than
   leaning on noteCount alone. */
export function isSilent(code) {
  const b = fromBase64Url(code);
  if (!b) return true;
  const info = readLoopCode(code);
  if (!info.ok) return true;
  if (info.noteCount > 0) return false;

  const steps = b[1] === 1 ? 16 : (b[3] || STEPS);
  const laneBytes = b[1] === 1 ? 2 : bytesPerLane(steps);
  const start = b[1] === 1 ? 4 : 5;
  for (let i = start; i < start + LANES * laneBytes && i < b.length; i++) {
    if (b[i] !== 0) return false;
  }
  return true;
}
