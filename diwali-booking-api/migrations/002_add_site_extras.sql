-- Add multi-site support and extras blob
ALTER TABLE bookings ADD COLUMN site TEXT NOT NULL DEFAULT 'default';
ALTER TABLE bookings ADD COLUMN extras TEXT;

-- Helpful index for filtering by site and sorting by recency
CREATE INDEX IF NOT EXISTS idx_bookings_site_created ON bookings(site, datetime(created_at) DESC);

