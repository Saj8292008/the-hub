-- Premium Alerts System Migration
-- Run this in Supabase SQL Editor

-- User Alert Preferences (stores webhook URLs and filter criteria)
CREATE TABLE IF NOT EXISTS user_alert_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alert channels
  email_enabled BOOLEAN DEFAULT true,
  email_address VARCHAR(255),
  
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id VARCHAR(100),
  telegram_bot_token VARCHAR(255), -- optional: use user's own bot
  
  discord_enabled BOOLEAN DEFAULT false,
  discord_webhook_url TEXT,
  
  -- Custom webhook support
  custom_webhook_enabled BOOLEAN DEFAULT false,
  custom_webhook_url TEXT,
  custom_webhook_headers JSONB DEFAULT '{}',
  
  -- Alert filters
  brands TEXT[] DEFAULT '{}', -- empty = all brands
  categories TEXT[] DEFAULT '{}', -- 'watches', 'sneakers', 'cars'
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  min_deal_score INTEGER DEFAULT 0, -- 0-100
  min_discount_percent INTEGER DEFAULT 0, -- minimum % off
  
  -- Notification preferences
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME, -- e.g., '08:00'
  max_alerts_per_day INTEGER DEFAULT 50,
  bundle_alerts BOOLEAN DEFAULT false, -- batch alerts into digests
  bundle_interval_minutes INTEGER DEFAULT 30,
  
  -- Tier-related
  tier VARCHAR(50) DEFAULT 'free',
  alert_delay_minutes INTEGER DEFAULT 15, -- 0 for premium, 15 for free
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Alert queue (for delayed delivery to free users)
CREATE TABLE IF NOT EXISTS alert_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_id UUID NOT NULL REFERENCES user_alert_preferences(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL,
  deal_data JSONB NOT NULL, -- snapshot of deal at alert time
  
  -- Delivery tracking
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL, -- when to send (now for premium, +15min for free)
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivery_status VARCHAR(50) DEFAULT 'pending', -- pending, delivered, failed, expired
  delivery_channel VARCHAR(50), -- email, telegram, discord, webhook
  delivery_error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert delivery log (for analytics and debugging)
CREATE TABLE IF NOT EXISTS alert_delivery_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID REFERENCES alert_queue(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL,
  
  -- Delivery details
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_code INTEGER,
  response_body TEXT,
  latency_ms INTEGER,
  
  -- Deal snapshot for analytics
  deal_brand VARCHAR(100),
  deal_category VARCHAR(50),
  deal_price DECIMAL(12,2),
  deal_score INTEGER,
  deal_discount_percent INTEGER
);

-- Brand watchlist (users can follow specific brands)
CREATE TABLE IF NOT EXISTS user_brand_watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- watches, sneakers, cars
  min_deal_score INTEGER DEFAULT 70,
  max_price DECIMAL(12,2),
  notify_all_deals BOOLEAN DEFAULT false, -- even below score threshold
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, brand, category)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_prefs_user ON user_alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_prefs_tier ON user_alert_preferences(tier);
CREATE INDEX IF NOT EXISTS idx_alert_queue_scheduled ON alert_queue(scheduled_at) WHERE delivery_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_alert_queue_user ON alert_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_log_user ON alert_delivery_log(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_log_delivered ON alert_delivery_log(delivered_at);
CREATE INDEX IF NOT EXISTS idx_brand_watchlist_user ON user_brand_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_watchlist_brand ON user_brand_watchlist(brand, category);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_alert_prefs_updated_at ON user_alert_preferences;
CREATE TRIGGER update_alert_prefs_updated_at
    BEFORE UPDATE ON user_alert_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Row Level Security)
ALTER TABLE user_alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brand_watchlist ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY user_alert_prefs_policy ON user_alert_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY alert_queue_policy ON alert_queue
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY alert_log_policy ON alert_delivery_log
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY brand_watchlist_policy ON user_brand_watchlist
    FOR ALL USING (auth.uid() = user_id);

-- Grant service role full access (for backend)
GRANT ALL ON user_alert_preferences TO service_role;
GRANT ALL ON alert_queue TO service_role;
GRANT ALL ON alert_delivery_log TO service_role;
GRANT ALL ON user_brand_watchlist TO service_role;
