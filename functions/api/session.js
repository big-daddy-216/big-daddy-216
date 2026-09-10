/* Trading the band's shared word for a signed cookie.
 *
 * This is the entire brute-force surface for a passphrase that is short,
 * shared, and never rotated — so the rate limit here is doing more work than
 * the hash is. Ten tries an hour per address.
 */

import { passphraseMatches, mintToken, cookieHeader, clearCookieHeader, mayPost, hashIp } from '../lib/auth.js';
import { json, fail, readJson } from '../lib/http.js';
import * as limit from '../lib/ratelimit.js';

export async function onRequestGet({ request, env }) {
  // Lets the page render "you're signed in" without making the visitor guess.
  return json({ may_post: await mayPost(request, env) });
}

export async function onRequestPost({ request, env, waitUntil }) {
  const body = await readJson(request, 4096);
  if (body.tooBig || body.bad) return fail(400, 'bad_request', 'That request did not make sense.');

  /* Signing out goes through POST too, because _middleware refuses DELETE on
     /api/* wholesale to keep the "nothing is ever deleted" rule simple. */
  if (body.value?.signout) {
    return json({ ok: true, may_post: false }, 200, { 'Set-Cookie': clearCookieHeader() });
  }

  const ipHash = await hashIp(request, env);
  const limited = await limit.check(env.DB, ipHash, 'auth-fail');
  if (limited) {
    return fail(429, 'rate_limited',
      'Too many tries. Give it an hour, or ask the band for the word again.',
      { 'Retry-After': String(limited.retryAfterSeconds) });
  }

  if (!await passphraseMatches(body.value?.passphrase, env)) {
    await limit.record(env.DB, ipHash, 'auth-fail');
    waitUntil(limit.pruneSometimes(env.DB));
    return fail(401, 'bad_passphrase', "That's not the word. Ask whoever sent you the link.");
  }

  return json({ ok: true, may_post: true }, 200,
    { 'Set-Cookie': cookieHeader(await mintToken(env)) });
}
