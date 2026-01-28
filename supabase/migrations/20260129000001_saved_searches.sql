-- Saved Searches / Telegram Tracks with user linking
-- Allows users to manage their tracked searches from both Telegram and Web UI

-- Create table if not exists
CREATE TABLE IF NOT EXISTS telegram_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id BIGINT,
  username TEXT,
  search_query TEXT NOT NULL,
  category TEXT DEFAULT 'all',
  max_price NUMERIC,
  min_deal_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notify_telegram BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_notified TIMESTAMPTZ,
  notify_count INTEGER DEFAULT 0
);

-- Add user_id column if table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'telegram_tracks' AND column_name = 'user_id') THEN
    ALTER TABLE telegram_tracks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'telegram_tracks' AND column_name = 'category') THEN
    ALTER TABLE telegram_tracks ADD COLUMN category TEXT DEFAULT 'all';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'telegram_tracks' AND column_name = 'min_deal_score') THEN
    ALTER TABLE telegram_tracks ADD COLUMN min_deal_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'telegram_tracks' AND column_name = 'notify_telegram') THEN
    ALTER TABLE telegram_tracks ADD COLUMN notify_telegram BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'telegram_tracks' AND column_name = 'notify_email') THEN
    ALTER TABLE telegram_tracks ADD COLUMN notify_email BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telegram_tracks_user_id ON telegram_tracks(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_telegram_tracks_chat_id ON telegram_tracks(chat_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_telegram_tracks_search_query ON telegram_tracks(search_query) WHERE is_active = true;

-- Enable RLS
ALTER TABLE telegram_tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own tracks" ON telegram_tracks;
DROP POLICY IF EXISTS "Users can create tracks" ON telegram_tracks;
DROP POLICY IF EXISTS "Users can update own tracks" ON telegram_tracks;
DROP POLICY IF EXISTS "Users can delete own tracks" ON telegram_tracks;

-- RLS Policies: Users can only access their own tracks
CREATE POLICY "Users can view own tracks" ON telegram_tracks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create tracks" ON telegram_tracks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tracks" ON telegram_tracks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tracks" ON telegram_tracks
  FOR DELETE USING (user_id = auth.uid());

-- Service role can access all (for telegram bot matching)
CREATE POLICY "Service role full access" ON telegram_tracks
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE telegram_tracks IS 'User saved searches - synced between Telegram bot and web dashboard';
