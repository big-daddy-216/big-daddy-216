/* Posting to the board is gated by one shared word the band hands out.
 *
 * Three things follow from that being a LOW-entropy secret:
 *
 *   1. It is stretched with PBKDF2 rather than plain SHA-256. Online guessing
 *      is what rate limiting stops; stretching is about the day the secret
 *      leaks, and about the fact that people reuse words across sites.
 *   2. The comparison is constant-time, so a wrong guess cannot be told from a
 *      near-miss by how long the answer took.
 *   3. The passphrase is checked once and traded for a signed cookie. It never
 *      goes into localStorage and is never resent, so it is not sitting in
 *      readable storage on anybody's laptop.
 *
 * JAM_PASSPHRASE_HASH holds salt and digest together as "<saltHex>:<hashHex>",
 * so there is one secret to set rather than two that must be kept in step.
 * Generate it with: npm run secret:hash -- "the band word"
 */

const PBKDF2_ITERATIONS = 100000;

const COOKIE = 'bd_post';
const TTL_MS = 90 * 24 * 60 * 60 * 1000;   // 90 days

const enc = new TextEncoder();

export async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* Compares in time proportional to length, not to how far the strings match.
   Length differences are folded in rather than returned early. */
function constantTimeEqual(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function derivePassphrase(passphrase, saltHex) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS },
    key, 256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function passphraseMatches(passphrase, env) {
  const stored = env.JAM_PASSPHRASE_HASH;
  if (!stored || !stored.includes(':')) return false;   // unconfigured => nobody posts
  if (typeof passphrase !== 'string' || !passphrase.trim()) return false;

  const [saltHex, expected] = stored.trim().split(':');
  if (!/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(expected)) return false;

  const actual = await derivePassphrase(passphrase.trim(), saltHex);
  return constantTimeEqual(actual, expected.toLowerCase());
}

/* Addresses are never stored. This is only ever used as a bucket key for
   throttling, so a salted digest carries all the information we need. */
export async function hashIp(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  return (await sha256Hex(ip + '|' + (env.IP_SALT || 'unsalted'))).slice(0, 32);
}

/* ---- the "may post" cookie: payload.signature, both base64url ---- */

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(str) {
  let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(env) {
  if (!env.SESSION_HMAC_KEY) throw new Error('SESSION_HMAC_KEY is not set');
  return crypto.subtle.importKey(
    'raw', enc.encode(env.SESSION_HMAC_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

export async function mintToken(env) {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now() + TTL_MS })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env), enc.encode(payload));
  return payload + '.' + b64url(new Uint8Array(sig));
}

export async function tokenIsValid(token, env) {
  try {
    if (!token || typeof token !== 'string') return false;
    const dot = token.indexOf('.');
    if (dot < 1) return false;
    const payload = token.slice(0, dot);
    const sig = unb64url(token.slice(dot + 1));
    // crypto.subtle.verify is itself constant-time.
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(env), sig, enc.encode(payload));
    if (!ok) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    return typeof exp === 'number' && exp > Date.now();
  } catch (e) {
    return false;
  }
}

export function readCookie(request, name = COOKIE) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function cookieHeader(token) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${Math.floor(TTL_MS / 1000)}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearCookieHeader() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export async function mayPost(request, env) {
  return tokenIsValid(readCookie(request), env);
}

/* The admin escape hatch, for hiding something that shouldn't be up. */
export function isAdmin(request, env) {
  const given = request.headers.get('X-Admin-Token');
  if (!given || !env.ADMIN_TOKEN) return false;
  return constantTimeEqual(given, env.ADMIN_TOKEN);
}
