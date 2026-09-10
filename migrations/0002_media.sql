-- Phase 2 only. Do NOT apply this yet.
--
-- Until the admin uploader exists, the music and video library is a hand-edited
-- file in the repo: assets/data/catalog.json. The column names here match that
-- file's keys exactly, so switching over is an import plus a one-line change to
-- loadCatalog() in assets/js/catalog.js — not a rewrite.

CREATE TABLE media (
  slug        TEXT PRIMARY KEY,
  kind        TEXT NOT NULL,          -- 'track' | 'video'
  title       TEXT NOT NULL,
  artist      TEXT,
  year        INTEGER,
  duration    INTEGER,                -- seconds
  src         TEXT NOT NULL,          -- R2 key, resolved against MEDIA_BASE_URL
  cover       TEXT,                   -- R2 key (tracks)
  poster      TEXT,                   -- R2 key (videos)
  description TEXT,
  credits     TEXT,
  lyrics      TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  hidden      INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_media_kind ON media(kind, sort_order) WHERE hidden = 0;
