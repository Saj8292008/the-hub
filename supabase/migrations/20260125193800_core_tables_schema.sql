-- ============================================================================
-- CORE TABLES FOR THE HUB
-- Watches, Cars, Sneakers, Sports, and Watch Listings
-- ============================================================================

-- ============================================================================
-- WATCHES TABLE (User Watchlist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS watches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  specific_model VARCHAR(200),
  target_price DECIMAL(10, 2),
  current_price DECIMAL(10, 2),
  last_checked TIMESTAMP DEFAULT NOW(),
  alert_enabled BOOLEAN DEFAULT true,
  sources TEXT[] DEFAULT ARRAY['reddit', 'ebay', 'watchuseek'],
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_watches_brand_model ON watches(brand, model);
CREATE INDEX idx_watches_created_at ON watches(created_at DESC);

-- ============================================================================
-- CARS TABLE (User Watchlist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER,
  target_price DECIMAL(10, 2),
  current_price DECIMAL(10, 2),
  last_checked TIMESTAMP DEFAULT NOW(),
  alert_enabled BOOLEAN DEFAULT true,
  sources TEXT[] DEFAULT ARRAY['autotrader', 'cargurus', 'ebay'],
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cars_make_model ON cars(make, model);
CREATE INDEX idx_cars_created_at ON cars(created_at DESC);

-- ============================================================================
-- SNEAKERS TABLE (User Watchlist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sneakers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  size VARCHAR(10),
  colorway VARCHAR(100),
  target_price DECIMAL(10, 2),
  current_price DECIMAL(10, 2),
  last_checked TIMESTAMP DEFAULT NOW(),
  alert_enabled BOOLEAN DEFAULT true,
  sources TEXT[] DEFAULT ARRAY['stockx', 'goat', 'ebay'],
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sneakers_brand_model ON sneakers(brand, model);
CREATE INDEX idx_sneakers_created_at ON sneakers(created_at DESC);

-- ============================================================================
-- SPORTS TEAMS TABLE (User Watchlist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sports_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  league VARCHAR(20) NOT NULL CHECK (league IN ('nfl', 'nba', 'mlb', 'nhl', 'mls', 'epl', 'uefa')),
  alert_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_name, league)
);

CREATE INDEX idx_sports_teams_league ON sports_teams(league);
CREATE INDEX idx_sports_teams_created_at ON sports_teams(created_at DESC);

-- ============================================================================
-- WATCH LISTINGS TABLE (Scraped Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS watch_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  url TEXT UNIQUE NOT NULL,

  -- Watch Details
  title TEXT NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  specific_model VARCHAR(200),
  reference VARCHAR(100),

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  price_history JSONB DEFAULT '[]',

  -- Condition & Features
  condition VARCHAR(50),
  year INTEGER,
  case_material VARCHAR(50),
  case_diameter DECIMAL(5, 2),
  movement VARCHAR(50),
  box_and_papers VARCHAR(20),

  -- Seller Info
  seller_name TEXT,
  seller_rating DECIMAL(3, 2),
  seller_type VARCHAR(20),
  location TEXT,

  -- Media
  images TEXT[],
  description TEXT,

  -- Deal Scoring (AI-Powered)
  deal_score INTEGER DEFAULT 0,
  score_breakdown JSONB,

  -- Metadata
  scraped_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for watch_listings
CREATE INDEX idx_watch_listings_brand ON watch_listings(brand);
CREATE INDEX idx_watch_listings_model ON watch_listings(model);
CREATE INDEX idx_watch_listings_price ON watch_listings(price);
CREATE INDEX idx_watch_listings_source ON watch_listings(source);
CREATE INDEX idx_watch_listings_deal_score ON watch_listings(deal_score DESC);
CREATE INDEX idx_watch_listings_created_at ON watch_listings(created_at DESC);
CREATE INDEX idx_watch_listings_brand_model ON watch_listings(brand, model);

-- Full-text search index for watch listings
ALTER TABLE watch_listings ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION watch_listings_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER watch_listings_search_vector_trigger
  BEFORE INSERT OR UPDATE ON watch_listings
  FOR EACH ROW
  EXECUTE FUNCTION watch_listings_search_vector_update();

CREATE INDEX idx_watch_listings_search ON watch_listings USING GIN(search_vector);

-- ============================================================================
-- CAR LISTINGS TABLE (Scraped Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS car_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  url TEXT UNIQUE NOT NULL,

  -- Car Details
  title TEXT NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  price_history JSONB DEFAULT '[]',

  -- Specifications
  mileage INTEGER,
  vin VARCHAR(17),
  body_style VARCHAR(50),
  transmission VARCHAR(20),
  fuel_type VARCHAR(30),
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),

  -- Condition & History
  condition VARCHAR(50),
  title_status VARCHAR(50),
  owners INTEGER,
  has_service_history BOOLEAN,
  accident_history BOOLEAN,

  -- Seller Info
  seller_name TEXT,
  seller_rating DECIMAL(3, 2),
  location TEXT,

  -- Media
  images TEXT[],
  description TEXT,

  -- Deal Scoring (AI-Powered)
  deal_score INTEGER DEFAULT 0,
  score_breakdown JSONB,

  -- Metadata
  scraped_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for car_listings
CREATE INDEX idx_car_listings_make ON car_listings(make);
CREATE INDEX idx_car_listings_model ON car_listings(model);
CREATE INDEX idx_car_listings_year ON car_listings(year DESC);
CREATE INDEX idx_car_listings_price ON car_listings(price);
CREATE INDEX idx_car_listings_mileage ON car_listings(mileage);
CREATE INDEX idx_car_listings_source ON car_listings(source);
CREATE INDEX idx_car_listings_deal_score ON car_listings(deal_score DESC);
CREATE INDEX idx_car_listings_created_at ON car_listings(created_at DESC);
CREATE INDEX idx_car_listings_make_model ON car_listings(make, model);

-- Full-text search for cars
ALTER TABLE car_listings ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION car_listings_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER car_listings_search_vector_trigger
  BEFORE INSERT OR UPDATE ON car_listings
  FOR EACH ROW
  EXECUTE FUNCTION car_listings_search_vector_update();

CREATE INDEX idx_car_listings_search ON car_listings USING GIN(search_vector);

-- ============================================================================
-- SNEAKER LISTINGS TABLE (Scraped Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sneaker_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  url TEXT UNIQUE NOT NULL,

  -- Sneaker Details
  title TEXT NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  colorway VARCHAR(100),
  style_code VARCHAR(50),
  size VARCHAR(10),
  gender VARCHAR(20),

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  retail_price DECIMAL(10, 2),
  resale_value DECIMAL(10, 2),
  price_history JSONB DEFAULT '[]',

  -- Condition & Authentication
  condition VARCHAR(50),
  authenticity_guarantee BOOLEAN,
  release_date DATE,
  release_year INTEGER,

  -- Seller Info
  seller_name TEXT,
  seller_rating DECIMAL(3, 2),
  location TEXT,

  -- Media
  images TEXT[],
  description TEXT,

  -- Deal Scoring (AI-Powered)
  deal_score INTEGER DEFAULT 0,
  score_breakdown JSONB,

  -- Metadata
  scraped_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for sneaker_listings
CREATE INDEX idx_sneaker_listings_brand ON sneaker_listings(brand);
CREATE INDEX idx_sneaker_listings_model ON sneaker_listings(model);
CREATE INDEX idx_sneaker_listings_size ON sneaker_listings(size);
CREATE INDEX idx_sneaker_listings_price ON sneaker_listings(price);
CREATE INDEX idx_sneaker_listings_source ON sneaker_listings(source);
CREATE INDEX idx_sneaker_listings_deal_score ON sneaker_listings(deal_score DESC);
CREATE INDEX idx_sneaker_listings_created_at ON sneaker_listings(created_at DESC);
CREATE INDEX idx_sneaker_listings_brand_model ON sneaker_listings(brand, model);

-- Full-text search for sneakers
ALTER TABLE sneaker_listings ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION sneaker_listings_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.colorway, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sneaker_listings_search_vector_trigger
  BEFORE INSERT OR UPDATE ON sneaker_listings
  FOR EACH ROW
  EXECUTE FUNCTION sneaker_listings_search_vector_update();

CREATE INDEX idx_sneaker_listings_search ON sneaker_listings USING GIN(search_vector);

-- ============================================================================
-- ALERTS TABLE (Price Alerts for Users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(20) NOT NULL CHECK (category IN ('watch', 'car', 'sneaker', 'sports')),
  item_id UUID NOT NULL,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('price_drop', 'price_target', 'new_listing', 'score_threshold')),

  -- Alert Conditions
  target_price DECIMAL(10, 2),
  price_change_percent DECIMAL(5, 2),
  score_threshold INTEGER,

  -- Alert Status
  enabled BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,

  -- Notification Preferences
  notify_email BOOLEAN DEFAULT true,
  notify_telegram BOOLEAN DEFAULT false,
  email_address VARCHAR(255),
  telegram_chat_id VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_category_item ON alerts(category, item_id);
CREATE INDEX idx_alerts_enabled ON alerts(enabled) WHERE enabled = true;

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_watches_updated_at BEFORE UPDATE ON watches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sneakers_updated_at BEFORE UPDATE ON sneakers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sports_teams_updated_at BEFORE UPDATE ON sports_teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_listings_updated_at BEFORE UPDATE ON watch_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_listings_updated_at BEFORE UPDATE ON car_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sneaker_listings_updated_at BEFORE UPDATE ON sneaker_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional, enable if using Supabase Auth
-- ============================================================================

-- For now, allow public read access to listings
-- In production, you may want to restrict this

ALTER TABLE watch_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sneaker_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read watch listings" ON watch_listings
  FOR SELECT USING (true);

CREATE POLICY "Public can read car listings" ON car_listings
  FOR SELECT USING (true);

CREATE POLICY "Public can read sneaker listings" ON sneaker_listings
  FOR SELECT USING (true);

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample watch listings
INSERT INTO watch_listings (source, url, title, brand, model, price, currency, condition, images, deal_score, score_breakdown)
VALUES
  ('reddit', 'https://reddit.com/r/Watchexchange/sample1', 'Rolex Submariner Date 16610 - Excellent Condition', 'Rolex', 'Submariner', 12500, 'USD', 'excellent', ARRAY['https://via.placeholder.com/400'], 85, '{"price": 35, "condition": 18, "seller": 12, "quality": 13, "rarity": 7}'),
  ('reddit', 'https://reddit.com/r/Watchexchange/sample2', 'Omega Speedmaster Professional Moonwatch', 'Omega', 'Speedmaster', 4800, 'USD', 'very-good', ARRAY['https://via.placeholder.com/400'], 78, '{"price": 32, "condition": 15, "seller": 12, "quality": 12, "rarity": 7}'),
  ('ebay', 'https://ebay.com/itm/sample3', 'Seiko SKX007 Automatic Dive Watch - Modded', 'Seiko', 'SKX007', 280, 'USD', 'good', ARRAY['https://via.placeholder.com/400'], 72, '{"price": 28, "condition": 13, "seller": 10, "quality": 13, "rarity": 8}'),
  ('watchuseek', 'https://watchuseek.com/sample4', 'Tudor Black Bay 58 Navy Blue', 'Tudor', 'Black Bay 58', 3200, 'USD', 'excellent', ARRAY['https://via.placeholder.com/400'], 92, '{"price": 38, "condition": 19, "seller": 14, "quality": 14, "rarity": 7}'),
  ('reddit', 'https://reddit.com/r/Watchexchange/sample5', 'Grand Seiko SBGA211 Snowflake', 'Grand Seiko', 'SBGA211', 4600, 'USD', 'mint', ARRAY['https://via.placeholder.com/400'], 88, '{"price": 36, "condition": 20, "seller": 13, "quality": 12, "rarity": 7}');

-- Insert sample car listings
INSERT INTO car_listings (source, url, title, make, model, year, price, currency, mileage, condition, body_style, transmission, images, deal_score, score_breakdown)
VALUES
  ('autotrader', 'https://autotrader.com/sample1', '2015 Porsche 911 Carrera', 'Porsche', '911', 2015, 68900, 'USD', 45000, 'excellent', 'coupe', 'manual', ARRAY['https://via.placeholder.com/400'], 90, '{"price": 37, "condition": 18, "seller": 14, "quality": 14, "rarity": 7}'),
  ('cargurus', 'https://cargurus.com/sample2', '2020 Tesla Model 3 Long Range', 'Tesla', 'Model 3', 2020, 38500, 'USD', 28000, 'very-good', 'sedan', 'automatic', ARRAY['https://via.placeholder.com/400'], 82, '{"price": 34, "condition": 16, "seller": 12, "quality": 13, "rarity": 7}'),
  ('ebay', 'https://ebay.com/motors/sample3', '2018 BMW M3 Competition Package', 'BMW', 'M3', 2018, 52000, 'USD', 35000, 'excellent', 'sedan', 'automatic', ARRAY['https://via.placeholder.com/400'], 85, '{"price": 35, "condition": 18, "seller": 12, "quality": 13, "rarity": 7}');

-- Insert sample sneaker listings
INSERT INTO sneaker_listings (source, url, title, brand, model, colorway, size, price, currency, condition, authenticity_guarantee, images, deal_score, score_breakdown)
VALUES
  ('stockx', 'https://stockx.com/sample1', 'Nike Dunk Low Panda', 'Nike', 'Dunk Low', 'Black/White', '10', 180, 'USD', 'ds', true, ARRAY['https://via.placeholder.com/400'], 88, '{"price": 36, "condition": 20, "seller": 15, "quality": 10, "rarity": 7}'),
  ('goat', 'https://goat.com/sample2', 'Air Jordan 1 Retro High OG Chicago', 'Jordan', 'Air Jordan 1', 'Chicago', '11', 1850, 'USD', 'vnds', true, ARRAY['https://via.placeholder.com/400'], 75, '{"price": 30, "condition": 17, "seller": 15, "quality": 8, "rarity": 5}'),
  ('ebay', 'https://ebay.com/sample3', 'Yeezy Boost 350 V2 Cream White', 'Adidas', 'Yeezy 350 V2', 'Cream White', '9.5', 285, 'USD', 'used', false, ARRAY['https://via.placeholder.com/400'], 68, '{"price": 26, "condition": 12, "seller": 10, "quality": 12, "rarity": 8}');

-- ============================================================================
-- COMPLETE!
-- ============================================================================
