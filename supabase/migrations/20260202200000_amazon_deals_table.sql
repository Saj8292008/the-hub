-- Amazon Deals table for The Hub
-- Stores scraped Amazon deals for watches and sneakers

CREATE TABLE IF NOT EXISTS amazon_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin VARCHAR(20) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  discount_percent INTEGER DEFAULT 0,
  brand VARCHAR(100),
  category VARCHAR(50), -- 'watches' or 'sneakers'
  rating DECIMAL(2, 1),
  review_count INTEGER DEFAULT 0,
  url TEXT NOT NULL,
  affiliate_url TEXT,
  images TEXT[], -- Array of image URLs
  prime BOOLEAN DEFAULT false,
  deal_score INTEGER DEFAULT 5,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  external_id VARCHAR(100) UNIQUE, -- For upsert matching
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  price_history JSONB DEFAULT '[]'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_amazon_deals_category ON amazon_deals(category);
CREATE INDEX IF NOT EXISTS idx_amazon_deals_brand ON amazon_deals(brand);
CREATE INDEX IF NOT EXISTS idx_amazon_deals_deal_score ON amazon_deals(deal_score DESC);
CREATE INDEX IF NOT EXISTS idx_amazon_deals_price ON amazon_deals(price);
CREATE INDEX IF NOT EXISTS idx_amazon_deals_discount ON amazon_deals(discount_percent DESC);
CREATE INDEX IF NOT EXISTS idx_amazon_deals_timestamp ON amazon_deals(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_amazon_deals_prime ON amazon_deals(prime) WHERE prime = true;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_amazon_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_amazon_deals_updated_at ON amazon_deals;
CREATE TRIGGER trigger_amazon_deals_updated_at
  BEFORE UPDATE ON amazon_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_amazon_deals_updated_at();

-- Add external_id to watch_listings for Amazon fallback if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'watch_listings' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE watch_listings ADD COLUMN external_id VARCHAR(100) UNIQUE;
  END IF;
END $$;

-- Comment
COMMENT ON TABLE amazon_deals IS 'Amazon product deals for watches and sneakers with affiliate tracking';
