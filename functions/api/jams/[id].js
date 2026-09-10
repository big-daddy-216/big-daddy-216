/* GET /api/jams/:id — one jam, plus enough of its family to draw the lineage.
 *
 * A withdrawn jam answers 410 rather than 404. Links get shared; "this was
 * taken down" is a better answer than "this never existed", and it stops the
 * page from telling someone their friend's link was always broken.
 */

import { json, fail } from '../../lib/http.js';
import { present } from './index.js';

const COLUMNS = `id, created_at, title, author, note, loop_code, bpm, note_count,
                 voices, parent_id, root_id, depth, sample_key, sample_secs,
                 remix_count, status`;

const SUMMARY = 'id, title, author, created_at, status, depth';

function summarise(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    created_at: row.created_at,
    depth: row.depth,
    gone: row.status !== 'public'
  };
}

export async function onRequestGet({ params, env }) {
  const id = String(params.id || '');
  if (!/^[0-9a-z]{4,24}$/.test(id)) {
    return fail(404, 'not_found', 'No jam with that name.');
  }

  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM jams WHERE id = ?`)
    .bind(id).first();
  if (!row) return fail(404, 'not_found', 'No jam with that name.');

  if (row.status !== 'public') {
    return fail(410, row.status === 'removed' ? 'retracted' : 'hidden',
      row.status === 'removed'
        ? 'Whoever posted this took it back down.'
        : 'The band took this one down.');
  }

  /* The chain upwards. Capped because the page collapses long lineages
     anyway — and the cap takes the NEAREST ancestors (depth DESC) so a deep
     chain keeps the immediate parent rather than a distant root, then flips
     to oldest-first for display. */
  const ancestorRows = row.parent_id
    ? (await env.DB.prepare(
        `WITH RECURSIVE chain(id, parent_id, title, author, created_at, status, depth) AS (
           SELECT id, parent_id, title, author, created_at, status, depth
             FROM jams WHERE id = ?
           UNION ALL
           SELECT j.id, j.parent_id, j.title, j.author, j.created_at, j.status, j.depth
             FROM jams j JOIN chain c ON j.id = c.parent_id
         )
         SELECT ${SUMMARY} FROM chain ORDER BY depth DESC LIMIT 12`
      ).bind(row.parent_id).all()).results
    : [];
  const ancestors = ancestorRows.slice().reverse();   // oldest first, for display

  const children = (await env.DB.prepare(
    `SELECT ${SUMMARY} FROM jams
     WHERE parent_id = ? AND status = 'public'
     ORDER BY created_at DESC LIMIT 24`
  ).bind(id).all()).results;

  const tree = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM jams WHERE root_id = ? AND status = 'public'"
  ).bind(row.root_id).first();

  return json({
    jam: present(row, env),
    ancestors: ancestors.map(summarise),
    children: children.map(summarise),
    tree_total: tree ? tree.n : 1
  });
}
