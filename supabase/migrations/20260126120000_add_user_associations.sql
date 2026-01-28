-- ============================================================================
-- ADD USER ASSOCIATIONS TO WATCHLISTS AND ALERTS
-- Adds user_id foreign keys to track ownership for premium tier limits
-- ============================================================================

-- Add user_id to watches table
ALTER TABLE watches ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE watches ADD CONSTRAINT fk_watches_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_watches_user_id ON watches(user_id);

-- Add user_id to cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE cars ADD CONSTRAINT fk_cars_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id);

-- Add user_id to sneakers table
ALTER TABLE sneakers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE sneakers ADD CONSTRAINT fk_sneakers_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sneakers_user_id ON sneakers(user_id);

-- Add user_id to sports_teams table
ALTER TABLE sports_teams ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE sports_teams ADD CONSTRAINT fk_sports_teams_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sports_teams_user_id ON sports_teams(user_id);

-- Add user_id to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);

-- Rename alerts table to price_alerts for clarity
ALTER TABLE IF EXISTS alerts RENAME TO price_alerts;

-- Update RLS policies for user-specific access
ALTER TABLE watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE sneakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own watchlist items
CREATE POLICY "Users can view own watches" ON watches
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own watches" ON watches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watches" ON watches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watches" ON watches
  FOR DELETE USING (auth.uid() = user_id);

-- Same for cars
CREATE POLICY "Users can view own cars" ON cars
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own cars" ON cars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cars" ON cars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cars" ON cars
  FOR DELETE USING (auth.uid() = user_id);

-- Same for sneakers
CREATE POLICY "Users can view own sneakers" ON sneakers
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own sneakers" ON sneakers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sneakers" ON sneakers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sneakers" ON sneakers
  FOR DELETE USING (auth.uid() = user_id);

-- Same for sports_teams
CREATE POLICY "Users can view own sports_teams" ON sports_teams
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own sports_teams" ON sports_teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sports_teams" ON sports_teams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sports_teams" ON sports_teams
  FOR DELETE USING (auth.uid() = user_id);

-- Same for price_alerts
CREATE POLICY "Users can view own alerts" ON price_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON price_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON price_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON price_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- COMPLETE!
-- ============================================================================
