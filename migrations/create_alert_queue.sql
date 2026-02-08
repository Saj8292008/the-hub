-- Create alert_queue table for premium alert scheduling
CREATE TABLE IF NOT EXISTS alert_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preference_id BIGINT,
  deal_id BIGINT,
  deal_data JSONB NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_channel TEXT NOT NULL, -- 'email', 'telegram', 'sms'
  delivery_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient pending alert queries
CREATE INDEX IF NOT EXISTS idx_alert_queue_pending 
  ON alert_queue(delivery_status, scheduled_at) 
  WHERE delivery_status = 'pending';

-- Index for user history
CREATE INDEX IF NOT EXISTS idx_alert_queue_user 
  ON alert_queue(user_id, created_at DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alert_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_queue_updated_at
  BEFORE UPDATE ON alert_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_queue_updated_at();
