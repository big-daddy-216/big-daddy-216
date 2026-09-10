/* Small helpers so every handler answers in the same shape. */

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers
    }
  });
}

/* Errors carry a machine-readable `error` and a `message` written for the
   person who will actually read it on the page. */
export function fail(status, error, message, headers = {}) {
  return json({ error, message }, status, headers);
}

export async function readJson(request, maxBytes = 1024 * 1024) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > maxBytes) return { tooBig: true };
  const text = await request.text();
  if (text.length > maxBytes) return { tooBig: true };
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    return { bad: true };
  }
}

/* Trim, collapse newlines out of single-line fields, and enforce a cap.
   Returns null for anything that was blank to begin with. */
export function cleanText(value, maxLen, { multiline = false } = {}) {
  if (typeof value !== 'string') return null;
  let s = value.replace(/\r\n/g, '\n');
  s = multiline ? s.replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  // Strip control characters that would render as nothing or break layout.
  s = s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  s = s.trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen).trim() : s;
}

/* Crockford-ish base32 over random bytes: short, URL-safe, no vowels, so it
   won't accidentally spell anything and won't be misread aloud. */
export function newId(length = 12) {
  const alphabet = '0123456789bcdfghjkmnpqrstvwxyz';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
