-- =====================================================
-- Newsletter & Telegram Automation System
-- Migration: Create all tables and columns needed
-- =====================================================

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  source VARCHAR(50),
  confirmed BOOLEAN DEFAULT false,
  confirmation_token TEXT,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  last_sent_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  CONSTRAINT chk_status CHECK (status IN ('active', 'unsubscribed', 'bounced'))
);

-- Email tracking table
CREATE TABLE IF NOT EXISTS email_sends (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  campaign_type VARCHAR(50),
  subject VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced BOOLEAN DEFAULT false,
  unsubscribed BOOLEAN DEFAULT false,

  CONSTRAINT chk_campaign_type CHECK (campaign_type IN ('daily', 'weekly', 'welcome', 'custom'))
);

-- Add Telegram integration columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_preferences JSONB DEFAULT '{"categories": ["watches", "cars", "sneakers", "sports"], "min_score": 8.0, "max_price": null}'::jsonb;

-- Telegram channel posts tracking
CREATE TABLE IF NOT EXISTS telegram_posts (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER,
  deal_type VARCHAR(50),
  category VARCHAR(50),
  channel_id VARCHAR(100),
  message_id BIGINT,
  posted_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_deal_type CHECK (deal_type IN ('watch', 'car', 'sneaker', 'sports'))
);

-- Telegram user alerts tracking
CREATE TABLE IF NOT EXISTS telegram_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  deal_id INTEGER,
  deal_type VARCHAR(50),
  sent_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_deal_type_alert CHECK (deal_type IN ('watch', 'car', 'sneaker', 'sports'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmed ON newsletter_subscribers(confirmed);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_sends_subscriber ON email_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_user ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_chat_id ON users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_posts_posted_at ON telegram_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_telegram_posts_deal ON telegram_posts(deal_id, deal_type);
CREATE INDEX IF NOT EXISTS idx_telegram_alerts_user ON telegram_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_alerts_sent_at ON telegram_alerts(sent_at);

-- Add comments
COMMENT ON TABLE newsletter_subscribers IS 'Email newsletter subscribers (separate from users table)';
COMMENT ON TABLE email_sends IS 'Tracks all emails sent for analytics and debugging';
COMMENT ON TABLE telegram_posts IS 'Tracks deals posted to public Telegram channel';
COMMENT ON TABLE telegram_alerts IS 'Tracks personalized Telegram alerts sent to users';

COMMENT ON COLUMN users.telegram_chat_id IS 'Telegram chat ID for sending personalized alerts';
COMMENT ON COLUMN users.telegram_preferences IS 'User preferences for Telegram alerts (categories, min_score, max_price)';
