-- Add timestamp column to listings tables for compatibility with backend queries
ALTER TABLE watch_listings ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT NOW();
ALTER TABLE car_listings ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT NOW();
ALTER TABLE sneaker_listings ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT NOW();

-- Create indexes on timestamp columns
CREATE INDEX IF NOT EXISTS idx_watch_listings_timestamp ON watch_listings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_car_listings_timestamp ON car_listings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sneaker_listings_timestamp ON sneaker_listings(timestamp DESC);

-- Update timestamp to match created_at for existing rows
UPDATE watch_listings SET timestamp = created_at WHERE timestamp IS NULL OR timestamp != created_at;
UPDATE car_listings SET timestamp = created_at WHERE timestamp IS NULL OR timestamp != created_at;
UPDATE sneaker_listings SET timestamp = created_at WHERE timestamp IS NULL OR timestamp != created_at;
