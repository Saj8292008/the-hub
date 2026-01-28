-- ============================================================================
-- DEAL ALERTS TABLE
-- Tracks sent alerts to avoid spamming users with duplicate notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel VARCHAR(50) DEFAULT 'telegram',
  deal_type VARCHAR(50) DEFAULT 'watch',
  price_at_alert DECIMAL(10, 2),
  target_price DECIMAL(10, 2),
  savings DECIMAL(10, 2),
  deal_score INTEGER,
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for checking recent alerts
CREATE INDEX idx_deal_alerts_listing_sent ON deal_alerts(listing_id, sent_at DESC);
CREATE INDEX idx_deal_alerts_user_sent ON deal_alerts(user_id, sent_at DESC);
CREATE INDEX idx_deal_alerts_created ON deal_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE deal_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own alerts
CREATE POLICY "Users can view own alerts"
  ON deal_alerts FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Service can insert alerts
CREATE POLICY "Service can insert alerts"
  ON deal_alerts FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE deal_alerts IS 'Tracks deal alerts sent to users to prevent duplicate notifications';
