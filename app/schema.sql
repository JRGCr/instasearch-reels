-- InstaSearch D1 schema. Tracks competitor/creator professional accounts and
-- captures metric snapshots over time so the dashboard can show real trends.

CREATE TABLE IF NOT EXISTS accounts (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_ig_id         TEXT NOT NULL,          -- the app user's own IG business id
  username            TEXT NOT NULL,          -- tracked target (public professional acct)
  name                TEXT,
  biography           TEXT,
  website             TEXT,
  profile_picture_url TEXT,
  added_at            INTEGER NOT NULL,       -- unix seconds
  UNIQUE (owner_ig_id, username)
);

-- One row per refresh: lets us chart follower / media-count growth.
CREATE TABLE IF NOT EXISTS snapshots (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id      INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  followers_count INTEGER,
  media_count     INTEGER,
  captured_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_account ON snapshots(account_id, captured_at);

-- Latest-known metrics per media item (upserted each refresh).
CREATE TABLE IF NOT EXISTS media (
  id                 TEXT PRIMARY KEY,        -- IG media id
  account_id         INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  caption            TEXT,
  media_type         TEXT,
  media_product_type TEXT,
  permalink          TEXT,
  thumbnail_url      TEXT,
  timestamp          TEXT,
  like_count         INTEGER,
  comments_count     INTEGER,
  captured_at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_account ON media(account_id, timestamp);
