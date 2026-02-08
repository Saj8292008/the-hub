-- Add Instagram tracking columns to all listing tables

-- Watch listings
ALTER TABLE watch_listings 
ADD COLUMN IF NOT EXISTS instagram_posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS instagram_post_id TEXT;

-- Sneaker listings
ALTER TABLE sneaker_listings 
ADD COLUMN IF NOT EXISTS instagram_posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS instagram_post_id TEXT;

-- Car listings
ALTER TABLE car_listings 
ADD COLUMN IF NOT EXISTS instagram_posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS instagram_post_id TEXT;

-- Sports listings (if exists)
ALTER TABLE sports_listings 
ADD COLUMN IF NOT EXISTS instagram_posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS instagram_post_id TEXT;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_watch_instagram_posted 
  ON watch_listings(instagram_posted_at) 
  WHERE instagram_posted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sneaker_instagram_posted 
  ON sneaker_listings(instagram_posted_at) 
  WHERE instagram_posted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_car_instagram_posted 
  ON car_listings(instagram_posted_at) 
  WHERE instagram_posted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sports_instagram_posted 
  ON sports_listings(instagram_posted_at) 
  WHERE instagram_posted_at IS NULL;
