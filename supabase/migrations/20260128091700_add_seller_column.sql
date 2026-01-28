-- Add seller column to watch_listings table
-- This column stores the seller username/handle for scraped listings

ALTER TABLE watch_listings 
ADD COLUMN IF NOT EXISTS seller VARCHAR(200);

-- Add index for seller lookups
CREATE INDEX IF NOT EXISTS idx_watch_listings_seller ON watch_listings(seller);
