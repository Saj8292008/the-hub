CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(200) NOT NULL,
  avg_price DECIMAL(12,2) NOT NULL,
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  median_price DECIMAL(12,2),
  sample_count INTEGER NOT NULL DEFAULT 0,
  source_breakdown JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand, model)
);

CREATE INDEX IF NOT EXISTS idx_market_prices_brand ON market_prices(brand);
CREATE INDEX IF NOT EXISTS idx_market_prices_brand_model ON market_prices(brand, model);
