/* POST /api/media/art   upload a cover image, get back its key
 *
 * Artwork goes up before the song does, so the song's row can point at it
 * from the moment it exists. The key comes back to the page, which passes it
 * as `cover` in the next request. Same auth and same raw-body shape as
 * /api/media, just smaller.
 */

import { mayPost, isAdmin } from '../../lib/auth.js';
import { json, fail, newId } from '../../lib/http.js';
import { classify } from '../../lib/media.js';

const MAX_BYTES = 6 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  if (!isAdmin(request, env) && !await mayPost(request, env)) {
    return fail(401, 'not_authorised', 'You need the band word before you can put artwork up.');
  }
  if (!env.MEDIA) {
    return fail(503, 'no_storage', "The bucket isn't connected yet, so there's nowhere to put the file.");
  }

  const size = Number(request.headers.get('Content-Length'));
  if (!Number.isFinite(size) || size <= 0) {
    return fail(411, 'length_required', 'That upload arrived without a size. Try again.');
  }
  if (size > MAX_BYTES) {
    return fail(413, 'payload_too_large', 'Artwork tops out at 6 MB. A 1500px JPEG is plenty.');
  }

  let filename = '';
  try {
    filename = JSON.parse(decodeURIComponent(request.headers.get('X-Media-Meta') || '{}')).filename || '';
  } catch (e) { /* the type header can still carry it */ }

  const file = classify('image', filename, request.headers.get('Content-Type'));
  if (!file) return fail(400, 'bad_field', 'Artwork needs to be a JPEG, PNG or WebP.');

  const key = 'music/covers/' + newId(10) + '.' + file.ext;
  await env.MEDIA.put(key, request.body, {
    httpMetadata: { contentType: file.mime, cacheControl: 'public, max-age=31536000, immutable' }
  });

  return json({ key }, 201);
}
