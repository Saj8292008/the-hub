-- ============================================================================
-- CHANNEL POSTS TABLE
-- Tracks what deals have been posted to social channels
-- ============================================================================

CREATE TABLE IF NOT EXISTS channel_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL DEFAULT 'telegram',
  posted_at TIMESTAMP DEFAULT NOW(),
  engagement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_channel_posts_listing ON channel_posts(listing_id);
CREATE INDEX idx_channel_posts_channel_time ON channel_posts(channel, posted_at DESC);

-- Enable RLS
ALTER TABLE channel_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (internal service use)
CREATE POLICY "Service can manage channel posts"
  ON channel_posts FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE channel_posts IS 'Tracks deals posted to social channels to avoid duplicates';
