-- The jam board.
--
-- The governing rule: a published jam is never edited. Building on somebody
-- else's work means publishing a NEW row that points back at theirs. That is
-- enforced twice over — the API exposes no PUT or PATCH, and the triggers at
-- the bottom of this file refuse the write even if something else tries.

CREATE TABLE jams (
  id           TEXT PRIMARY KEY,            -- 12-char base32, generated server-side
  created_at   INTEGER NOT NULL,            -- unix ms

  title        TEXT NOT NULL,               -- 1..80 chars
  author       TEXT,                        -- NULL means posted anonymously
  note         TEXT,                        -- optional, <= 500 chars

  loop_code    TEXT NOT NULL,               -- base64url, the engine's v2 format
  bpm          INTEGER NOT NULL,            -- read out of loop_code server-side
  note_count   INTEGER NOT NULL,            -- ditto; never trusted from the client
  voices       TEXT NOT NULL DEFAULT '',    -- ditto; csv of distinct voice ids, for filtering

  parent_id    TEXT REFERENCES jams(id),    -- NULL for an original
  root_id      TEXT NOT NULL,               -- top of the tree; equals id when original
  depth        INTEGER NOT NULL DEFAULT 0,

  -- A remix may INHERIT its parent's sample rather than re-uploading it, so one
  -- R2 object can back several rows. That is why retracting a jam never deletes
  -- the object: doing so would silently gut somebody else's loop.
  sample_key   TEXT,                        -- R2 key, NULL when there's no mic sample
  sample_secs  REAL,
  sample_bytes INTEGER,
  sample_mime  TEXT,

  remix_count  INTEGER NOT NULL DEFAULT 0,  -- bumped when a child is inserted
  status       TEXT NOT NULL DEFAULT 'public'
                 CHECK (status IN ('public', 'hidden', 'removed')),
                 -- public: on the wall. removed: the poster withdrew it.
                 -- hidden: the band took it down. The page words these differently.

  delete_token TEXT NOT NULL,               -- SHA-256; the plaintext is shown to the poster once
  ip_hash      TEXT                         -- SHA-256(ip + IP_SALT), for rate limiting only
);

-- The board's views: newest first, most built-on, and one loop's family.
CREATE INDEX idx_jams_recent ON jams(status, created_at DESC);
CREATE INDEX idx_jams_remix  ON jams(status, remix_count DESC);
CREATE INDEX idx_jams_parent ON jams(parent_id);
CREATE INDEX idx_jams_root   ON jams(root_id, depth, created_at);

-- Counters and moderation stay writable. The creative content does not.
-- IS NOT is SQLite's null-safe "differs from", so filling in a NULL author is
-- caught the same way as changing one name to another.
CREATE TRIGGER jams_immutable BEFORE UPDATE ON jams
FOR EACH ROW WHEN
     OLD.loop_code   IS NOT NEW.loop_code
  OR OLD.title       IS NOT NEW.title
  OR OLD.author      IS NOT NEW.author
  OR OLD.note        IS NOT NEW.note
  OR OLD.parent_id   IS NOT NEW.parent_id
  OR OLD.root_id     IS NOT NEW.root_id
  OR OLD.depth       IS NOT NEW.depth
  OR OLD.sample_key  IS NOT NEW.sample_key
  OR OLD.created_at  IS NOT NEW.created_at
  OR OLD.id          IS NOT NEW.id
BEGIN
  SELECT RAISE(ABORT, 'jams are immutable - publish a new one');
END;

-- Children point at their parent by id. If a row vanished, the lineage would
-- break, so withdrawal is a status change and rows are never removed.
CREATE TRIGGER jams_no_delete BEFORE DELETE ON jams
BEGIN
  SELECT RAISE(ABORT, 'set status = removed instead of deleting');
END;

-- Enough to throttle passphrase guessing and flooding, and nothing more:
-- rows carry a salted hash, never an address. Pruned opportunistically.
CREATE TABLE post_attempts (
  ip_hash TEXT NOT NULL,
  at      INTEGER NOT NULL,
  kind    TEXT NOT NULL                     -- 'auth-fail' | 'publish'
);
CREATE INDEX idx_attempts ON post_attempts(ip_hash, at);
