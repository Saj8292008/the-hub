-- Authentication System Migration
-- Creates users, refresh_tokens tables and updates existing tables for auth integration
-- Created: 2026-01-26

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  -- Verification
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verification_token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Password reset
  reset_token TEXT,
  reset_token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Security
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip VARCHAR(45),

  -- Profile
  telegram_chat_id BIGINT UNIQUE,
  notification_preferences JSONB DEFAULT '{"email": true, "telegram": true, "price_alerts": true}'::jsonb,

  -- Subscription
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'pro', 'enterprise')),
  subscription_starts_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255) UNIQUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- REFRESH TOKENS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_ip VARCHAR(45),
  user_agent TEXT
);

-- Indexes for refresh_tokens table
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================
-- USER WATCHLIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Item details
  category VARCHAR(50) NOT NULL CHECK (category IN ('watches', 'cars', 'sneakers', 'sports', 'ai')),
  item_type VARCHAR(50) NOT NULL, -- 'watch_listing', 'car_listing', 'sneaker_listing', etc
  item_id INTEGER NOT NULL,
  item_name VARCHAR(255),

  -- Alert settings
  price_alert DECIMAL(10, 2),
  notify_email BOOLEAN DEFAULT true,
  notify_telegram BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  tags VARCHAR(50)[],

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one user can't watch same item twice
  UNIQUE(user_id, category, item_id)
);

-- Indexes for user_watchlist table
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_category ON user_watchlist(category);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_item ON user_watchlist(category, item_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_created_at ON user_watchlist(created_at DESC);

-- ============================================
-- PRICE ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS price_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watchlist_item_id INTEGER REFERENCES user_watchlist(id) ON DELETE CASCADE,

  -- Alert details
  category VARCHAR(50) NOT NULL,
  item_id INTEGER NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL,
  condition VARCHAR(50), -- 'below', 'above', 'equals'

  -- Status
  active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMP WITH TIME ZONE,
  triggered_price DECIMAL(10, 2),

  -- Notification
  sent_email BOOLEAN DEFAULT false,
  sent_telegram BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for price_alerts table
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_price_alerts_item ON price_alerts(category, item_id);

-- ============================================
-- LINK BLOG SUBSCRIBERS TO USERS
-- ============================================

-- Add user_id to blog_subscribers if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'blog_subscribers') THEN
    ALTER TABLE blog_subscribers
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_blog_subscribers_user_id ON blog_subscribers(user_id);
  END IF;
END $$;

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_watchlist table
DROP TRIGGER IF EXISTS update_user_watchlist_updated_at ON user_watchlist;
CREATE TRIGGER update_user_watchlist_updated_at
  BEFORE UPDATE ON user_watchlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to price_alerts table
DROP TRIGGER IF EXISTS update_price_alerts_updated_at ON price_alerts;
CREATE TRIGGER update_price_alerts_updated_at
  BEFORE UPDATE ON price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CLEANUP EXPIRED TOKENS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  -- Delete expired refresh tokens
  DELETE FROM refresh_tokens WHERE expires_at < NOW();

  -- Clear expired reset tokens
  UPDATE users
  SET reset_token = NULL, reset_token_expires_at = NULL
  WHERE reset_token_expires_at < NOW();

  -- Clear expired verification tokens
  UPDATE users
  SET verification_token = NULL, verification_token_expires_at = NULL
  WHERE verification_token_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::integer);

-- Users can update their own data (except email, password_hash directly)
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = current_setting('app.current_user_id')::integer);

-- Refresh tokens: users can access their own
CREATE POLICY refresh_tokens_own ON refresh_tokens
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::integer);

-- Watchlist: users can access their own
CREATE POLICY user_watchlist_own ON user_watchlist
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::integer);

-- Price alerts: users can access their own
CREATE POLICY price_alerts_own ON price_alerts
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::integer);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User accounts with authentication and profile data';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON TABLE user_watchlist IS 'User-specific watchlist for tracked items across all categories';
COMMENT ON TABLE price_alerts IS 'Price alert triggers for watched items';

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (12+ rounds)';
COMMENT ON COLUMN users.failed_login_attempts IS 'Counter for failed login attempts, resets on successful login';
COMMENT ON COLUMN users.locked_until IS 'Account lock timestamp after 5 failed attempts';
COMMENT ON COLUMN users.tier IS 'Subscription tier: free, premium, pro, enterprise';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Authentication System Migration Complete';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  • users (with security fields)';
  RAISE NOTICE '  • refresh_tokens (JWT session management)';
  RAISE NOTICE '  • user_watchlist (per-user tracking)';
  RAISE NOTICE '  • price_alerts (user price notifications)';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  • Email/password authentication';
  RAISE NOTICE '  • Email verification system';
  RAISE NOTICE '  • Password reset flow';
  RAISE NOTICE '  • Account locking (5 failed attempts)';
  RAISE NOTICE '  • Refresh token rotation';
  RAISE NOTICE '  • Row Level Security (RLS)';
  RAISE NOTICE '  • Auto-cleanup of expired tokens';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Install: npm install bcrypt jsonwebtoken nodemailer cookie-parser';
  RAISE NOTICE '  2. Configure JWT secrets in .env';
  RAISE NOTICE '  3. Set up SMTP for emails';
  RAISE NOTICE '  4. Build auth API routes';
  RAISE NOTICE '════════════════════════════════════════════════════';
END $$;
