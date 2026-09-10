/* Runs in front of every Function route (static files don't come through here).
 *
 * Two jobs: make the immutability rule true at the HTTP layer as well as the
 * routing layer, and keep another site from posting as one of your visitors.
 */

import { fail } from './lib/http.js';

/* The board has no update route. Saying so with a 405 — rather than the 404 a
   missing route would give — means a client that tries gets told it's the
   METHOD that's wrong, not the jam. Withdrawing is POST /retract, because it
   sets a status rather than removing anything. */
const REFUSED = new Set(['PUT', 'PATCH', 'DELETE']);

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/api/')) return next();

  if (REFUSED.has(request.method)) {
    return fail(405, 'method_not_allowed',
      'Jams are never edited or deleted. Publish a new one, or withdraw yours.',
      { Allow: 'GET, POST, HEAD, OPTIONS' });
  }

  /* CSRF. The session cookie is SameSite=Lax, which already stops a
     cross-site form POST from carrying it, but Lax has historically had
     browser-specific holes and this costs one comparison. Browsers always
     send Origin on POST; a request without one did not come from a page. */
  if (request.method === 'POST') {
    const origin = request.headers.get('Origin');
    if (!origin || origin !== url.origin) {
      return fail(403, 'bad_origin', 'That request did not come from this site.');
    }
  }

  try {
    return await next();
  } catch (err) {
    /* Never hand a stack trace to the page. The real error still reaches
       `wrangler pages deployment tail`. */
    console.error('unhandled', url.pathname, err && err.stack || err);
    return fail(500, 'internal', 'Something broke on our end. Your loop is safe — try again.');
  }
}
