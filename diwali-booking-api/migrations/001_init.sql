-- D1 schema for bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  message TEXT,
  ip TEXT,
  ua TEXT,
  status TEXT DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

