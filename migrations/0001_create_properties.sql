CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  uprn TEXT,
  address TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS properties_uprn_idx ON properties (uprn);

