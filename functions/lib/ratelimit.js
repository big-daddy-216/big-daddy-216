/* Windowed counting against the post_attempts table.
 *
 * D1 rather than KV on purpose: the counts need to be right immediately after
 * a write (KV is eventually consistent, which would let a burst slip through),
 * the volume is tiny, and it's one fewer binding to configure.
 */

const LIMITS = {
  'auth-fail': [{ windowMs: 60 * 60 * 1000, max: 10 }],
  publish: [
    { windowMs: 60 * 60 * 1000, max: 10 },
    { windowMs: 24 * 60 * 60 * 1000, max: 60 }
  ],
  // Songs and artwork through the band word. The admin token isn't counted.
  upload: [{ windowMs: 60 * 60 * 1000, max: 30 }]
};

const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

/* -> null if allowed, or { retryAfterSeconds } if not. */
export async function check(db, ipHash, kind) {
  const rules = LIMITS[kind] || [];
  const now = Date.now();

  for (const rule of rules) {
    const since = now - rule.windowMs;
    const row = await db
      .prepare('SELECT COUNT(*) AS n FROM post_attempts WHERE ip_hash = ? AND kind = ? AND at > ?')
      .bind(ipHash, kind, since)
      .first();
    if ((row?.n ?? 0) >= rule.max) {
      return { retryAfterSeconds: Math.ceil(rule.windowMs / 1000) };
    }
  }
  return null;
}

export async function record(db, ipHash, kind) {
  await db
    .prepare('INSERT INTO post_attempts (ip_hash, at, kind) VALUES (?, ?, ?)')
    .bind(ipHash, Date.now(), kind)
    .run();
}

/* Called from waitUntil, so a slow delete never shows up in a response time.
   Sampled because pruning on every single request is wasted work. */
export async function pruneSometimes(db) {
  if (Math.random() > 0.05) return;
  await db
    .prepare('DELETE FROM post_attempts WHERE at < ?')
    .bind(Date.now() - PRUNE_AFTER_MS)
    .run();
}
