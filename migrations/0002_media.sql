-- The music and video library.
--
-- Before this table existed the library was a hand-edited file in the repo,
-- assets/data/catalog.js. The column names here are that file's keys, exactly,
-- so the pages read both through one code path (assets/js/catalog.js merges
-- them) and the old file keeps working as a fallback for anything still in it.
--
-- Rows land here through the upload panel on music.html (gated by the band
-- word) or scripts/upload-song.mjs (gated by ADMIN_TOKEN). Nothing here is
-- immutable the way jams are — a typo in a title is a one-line UPDATE — but
-- taking a song down is a status change, not a DELETE, so the file in the
-- bucket is never orphaned by accident.

CREATE TABLE media (
  slug        TEXT PRIMARY KEY,           -- from the title; unique; in the address bar
  kind        TEXT NOT NULL CHECK (kind IN ('track', 'video')),
  title       TEXT NOT NULL,              -- 1..120 chars
  album       TEXT,                       -- NULL means a single
  year        INTEGER,
  duration_s  REAL,                       -- measured in the browser before upload; NULL if unknown
  src         TEXT NOT NULL,              -- key in the bucket, e.g. music/4-minute-clinic/4-minute-clinic.m4a
  cover       TEXT,                       -- tracks: artwork, a bucket key or an assets/ path
  poster      TEXT,                       -- videos: the still shown before play
  blurb       TEXT,                       -- <= 500 chars
  credits     TEXT,                       -- <= 300 chars
  sort_order  INTEGER NOT NULL DEFAULT 0, -- bigger comes first; new uploads go on top
  status      TEXT NOT NULL DEFAULT 'public'
                CHECK (status IN ('public', 'hidden')),
  bytes       INTEGER,
  mime        TEXT,
  created_at  INTEGER NOT NULL            -- unix ms
);

-- The one query the pages make: everything public of one kind, in running order.
CREATE INDEX idx_media_kind ON media(kind, status, sort_order DESC, created_at DESC);
