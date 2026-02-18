-- Create subscriptions table for Deal Hunter's Toolkit
-- Stores customer subscription info from Stripe webhooks

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' or 'yearly'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'incomplete', 'trialing'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: Allow service role full access
CREATE POLICY "Service role has full access" 
  ON subscriptions 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription" 
  ON subscriptions 
  FOR SELECT 
  USING (auth.uid()::bigint = user_id);
