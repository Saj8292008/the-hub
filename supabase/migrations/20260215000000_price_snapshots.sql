-- ============================================================================
-- Price Snapshots Table
-- Captures point-in-time price data from watch_listings for trend analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES watch_listings(id) ON DELETE SET NULL,
  brand VARCHAR(100),
  model VARCHAR(200),
  reference_number VARCHAR(100),
  price NUMERIC(12, 2) NOT NULL,
  source TEXT,
  snapshot_date TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups by brand/model and time-range queries
CREATE INDEX IF NOT EXISTS idx_price_snapshots_brand ON price_snapshots(brand);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_model ON price_snapshots(model);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_snapshot_date ON price_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_brand_model_date ON price_snapshots(brand, model, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_listing_id ON price_snapshots(listing_id);
