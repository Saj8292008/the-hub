-- ============================================================================
-- NEW FEATURES MIGRATION
-- Price History, Referrals, Push Notifications
-- ============================================================================

-- ============================================================================
-- PRICE HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type VARCHAR(50) NOT NULL, -- 'watch', 'sneaker', 'car'
  item_id UUID NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  source VARCHAR(50),
  recorded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_item ON price_history(item_type, item_id, recorded_at DESC);
CREATE INDEX idx_price_history_time ON price_history(recorded_at DESC);

-- ============================================================================
-- REFERRAL CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);

-- ============================================================================
-- REFERRALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, expired
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- ============================================================================
-- REWARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  reward_data JSONB,
  metadata JSONB,
  awarded_at TIMESTAMP DEFAULT NOW(),
  redeemed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rewards_user ON rewards(user_id);
CREATE INDEX idx_rewards_type ON rewards(reward_type);

-- ============================================================================
-- USER PROFILES (Extended)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_count INTEGER DEFAULT 0,
  credit_balance INTEGER DEFAULT 0, -- In cents
  milestones_achieved INTEGER[] DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{"telegram": true, "email": false, "webpush": true}',
  push_subscription TEXT, -- Web push subscription JSON
  telegram_chat_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Price history: Public read, service write
CREATE POLICY "Anyone can read price history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Service can write price history" ON price_history FOR INSERT WITH CHECK (true);

-- Referral codes: Users can see their own
CREATE POLICY "Users can view own referral code" ON referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create referral code" ON referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals: Users can see referrals they made
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Service can manage referrals" ON referrals FOR ALL USING (true);

-- Rewards: Users can see their own rewards
CREATE POLICY "Users can view own rewards" ON rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage rewards" ON rewards FOR INSERT WITH CHECK (true);

-- User profiles: Users can manage their own
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE price_history IS 'Historical price data for trend analysis';
COMMENT ON TABLE referral_codes IS 'User referral codes for growth program';
COMMENT ON TABLE referrals IS 'Tracks referral relationships';
COMMENT ON TABLE rewards IS 'User rewards from referrals and milestones';
COMMENT ON TABLE user_profiles IS 'Extended user profile data';
