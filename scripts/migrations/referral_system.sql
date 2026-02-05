-- Referral System Database Migration
-- Run this in Supabase SQL Editor

-- ============================================================================
-- REFERRAL CODES TABLE (stores user referral codes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_referral_code UNIQUE (user_id)
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);

-- ============================================================================
-- REFERRALS TABLE (tracks referral relationships)
-- ============================================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, paid, rewarded
  converted_to_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_referred_user UNIQUE (referred_id)
);

-- Indexes for referral queries
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_converted ON referrals(converted_to_paid);

-- ============================================================================
-- REFERRAL REWARDS TABLE (tracks awarded free months)
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL, -- 'free_month', 'credit', 'badge'
  reward_value INTEGER NOT NULL, -- number of days/months/cents
  trigger_referral_count INTEGER, -- how many paid referrals triggered this
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_applied ON referral_rewards(applied);

-- ============================================================================
-- ADD COLUMNS TO USERS TABLE
-- ============================================================================
DO $$
BEGIN
  -- Add referred_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id);
  END IF;

  -- Add referral_code column for quick access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE users ADD COLUMN referral_code VARCHAR(20);
  END IF;

  -- Add bonus_days column for tracking free days earned
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'bonus_days'
  ) THEN
    ALTER TABLE users ADD COLUMN bonus_days INTEGER DEFAULT 0;
  END IF;
END $$;

-- Index for referred_by lookups
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- ============================================================================
-- USER PROFILES TABLE (for extended stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  referral_count INTEGER DEFAULT 0,
  paid_referral_count INTEGER DEFAULT 0,
  credit_balance INTEGER DEFAULT 0, -- in cents
  milestones_achieved INTEGER[] DEFAULT '{}',
  total_free_months_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_count ON user_profiles(referral_count DESC);

-- ============================================================================
-- REWARDS TABLE (for generic reward tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  reward_data JSONB,
  metadata JSONB,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(reward_type);

-- ============================================================================
-- HELPER FUNCTION: Get paid referral count for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION get_paid_referral_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM referrals
    WHERE referrer_id = p_user_id
    AND converted_to_paid = true
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Check if user qualifies for free month reward
-- ============================================================================
CREATE OR REPLACE FUNCTION check_free_month_eligibility(p_user_id UUID)
RETURNS TABLE (
  eligible BOOLEAN,
  paid_referrals INTEGER,
  pending_rewards INTEGER,
  next_reward_at INTEGER
) AS $$
DECLARE
  v_paid_count INTEGER;
  v_rewarded_count INTEGER;
BEGIN
  -- Get paid referral count
  SELECT COUNT(*)::INTEGER INTO v_paid_count
  FROM referrals
  WHERE referrer_id = p_user_id
  AND converted_to_paid = true;
  
  -- Get already rewarded count (each reward = 3 paid referrals)
  SELECT COALESCE(SUM(trigger_referral_count), 0)::INTEGER INTO v_rewarded_count
  FROM referral_rewards
  WHERE user_id = p_user_id
  AND reward_type = 'free_month';
  
  RETURN QUERY SELECT 
    (v_paid_count >= v_rewarded_count + 3) as eligible,
    v_paid_count as paid_referrals,
    ((v_paid_count - v_rewarded_count) / 3)::INTEGER as pending_rewards,
    CASE 
      WHEN v_paid_count >= v_rewarded_count + 3 THEN 0
      ELSE (v_rewarded_count + 3 - v_paid_count)
    END as next_reward_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update user_profiles on referral changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update referral counts in user_profiles
  INSERT INTO user_profiles (user_id, referral_count, paid_referral_count)
  VALUES (
    NEW.referrer_id,
    1,
    CASE WHEN NEW.converted_to_paid THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    referral_count = user_profiles.referral_count + 1,
    paid_referral_count = CASE 
      WHEN NEW.converted_to_paid AND NOT OLD.converted_to_paid 
      THEN user_profiles.paid_referral_count + 1 
      ELSE user_profiles.paid_referral_count 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_update_referral_stats ON referrals;
CREATE TRIGGER trigger_update_referral_stats
AFTER INSERT OR UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_referral_stats();

-- ============================================================================
-- SAMPLE DATA (Optional - comment out in production)
-- ============================================================================
-- INSERT INTO referral_codes (user_id, code) 
-- SELECT id, 'HUB-TEST-CODE' FROM users LIMIT 1
-- ON CONFLICT DO NOTHING;

COMMENT ON TABLE referral_codes IS 'Stores unique referral codes for each user';
COMMENT ON TABLE referrals IS 'Tracks referral relationships between users';
COMMENT ON TABLE referral_rewards IS 'Tracks free months and other rewards earned through referrals';
COMMENT ON COLUMN users.referred_by IS 'The user ID who referred this user';
COMMENT ON COLUMN users.bonus_days IS 'Free days earned through referral rewards';
