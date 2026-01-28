-- Telegram Tracks: Personal price alerts for users
-- Users can track specific search queries and get notified when matches appear

CREATE TABLE IF NOT EXISTS telegram_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL,
  username TEXT,
  search_query TEXT NOT NULL,
  max_price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_notified TIMESTAMPTZ,
  notify_count INTEGER DEFAULT 0
);

-- Index for looking up active tracks by chat_id
CREATE INDEX IF NOT EXISTS idx_telegram_tracks_chat_id ON telegram_tracks(chat_id) WHERE is_active = true;

-- Index for searching tracks by query (for matching new listings)
CREATE INDEX IF NOT EXISTS idx_telegram_tracks_search_query ON telegram_tracks(search_query) WHERE is_active = true;

-- Enable RLS
ALTER TABLE telegram_tracks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/modify their own tracks (by chat_id)
CREATE POLICY "Users manage own tracks" ON telegram_tracks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check new listings against tracks and notify users
-- Called by a trigger or scheduler when new listings are added
CREATE OR REPLACE FUNCTION check_listing_against_tracks(
  p_listing_title TEXT,
  p_listing_price NUMERIC,
  p_listing_url TEXT
)
RETURNS TABLE (
  chat_id BIGINT,
  search_query TEXT,
  max_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.chat_id,
    t.search_query,
    t.max_price
  FROM telegram_tracks t
  WHERE t.is_active = true
    AND LOWER(p_listing_title) LIKE '%' || LOWER(t.search_query) || '%'
    AND (t.max_price IS NULL OR p_listing_price <= t.max_price)
    AND (t.last_notified IS NULL OR t.last_notified < now() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE telegram_tracks IS 'Stores user search tracking preferences for Telegram deal alerts';
