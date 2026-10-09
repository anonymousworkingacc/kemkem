-- Migrations are named <UTC timestamp>_<name>.sql (`npm run db:new <name>`)
-- so two branches never pick the same file name.
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
