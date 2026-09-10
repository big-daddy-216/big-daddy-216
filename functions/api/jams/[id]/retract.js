/* POST /api/jams/:id/retract — take your own jam back down.
 *
 * Three things this deliberately does NOT do:
 *
 *   - It doesn't delete the row. Children point at their parent by id, and a
 *     missing row would break every lineage running through it. The row stays
 *     and its status changes; the page then says "withdrawn" where the title
 *     used to be.
 *   - It doesn't delete the R2 sample. A remix may have inherited the same
 *     sample_key, so removing the object would silently gut somebody else's
 *     loop. Four seconds of audio is not worth that risk.
 *   - It doesn't decrement the parent's remix_count. The remix happened; the
 *     count is a record of what was built, not of what is currently visible.
 *
 * Which is why this is a POST that sets a status, not a DELETE.
 */

import { json, fail, readJson } from '../../../lib/http.js';
import { sha256Hex, isAdmin } from '../../../lib/auth.js';

export async function onRequestPost({ request, params, env }) {
  const id = String(params.id || '');
  if (!/^[0-9a-z]{4,24}$/.test(id)) {
    return fail(404, 'not_found', 'No jam with that name.');
  }

  const row = await env.DB.prepare('SELECT id, delete_token, status FROM jams WHERE id = ?')
    .bind(id).first();
  if (!row) return fail(404, 'not_found', 'No jam with that name.');

  /* Already down is a success, not an error — a double-click on Withdraw
     shouldn't produce a scary message. */
  if (row.status !== 'public') return json({ ok: true, status: row.status });

  const admin = isAdmin(request, env);
  let status = 'removed';

  if (!admin) {
    const body = await readJson(request, 4096);
    if (body.tooBig || body.bad) {
      return fail(400, 'bad_request', 'That request did not make sense.');
    }
    const token = body.value && body.value.token;
    if (typeof token !== 'string' || !token) {
      return fail(403, 'bad_token', 'That withdrawal link is not right.');
    }
    /* Compare hashes, not tokens. The stored value is a digest, and a digest
       comparison is already fixed-length. */
    if (await sha256Hex(token) !== row.delete_token) {
      return fail(403, 'bad_token', 'That withdrawal link is not right.');
    }
  } else {
    status = 'hidden';   // the band taking something down reads differently
  }

  await env.DB.prepare('UPDATE jams SET status = ? WHERE id = ?').bind(status, id).run();
  return json({ ok: true, status });
}
