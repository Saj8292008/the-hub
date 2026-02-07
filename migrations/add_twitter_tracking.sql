-- Migration: Add Twitter Tracking to Deals
-- Created: 2026-02-06
-- Purpose: Track which deals have been posted to @TheHubDeals

-- Add columns for Twitter tracking
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS twitter_posted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS twitter_tweet_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_deals_twitter_posted ON deals(twitter_posted_at);

-- Create index for quick lookup of unposted hot deals
CREATE INDEX IF NOT EXISTS idx_deals_twitter_queue ON deals(score DESC, twitter_posted_at) 
WHERE twitter_posted_at IS NULL;

COMMENT ON COLUMN deals.twitter_posted_at IS 'When this deal was posted to Twitter';
COMMENT ON COLUMN deals.twitter_tweet_id IS 'Twitter tweet ID for tracking engagement';
