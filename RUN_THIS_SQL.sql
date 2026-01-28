-- ============================================================================
-- URGENT MIGRATION: Add missing columns to blog_subscribers
-- Copy this entire file and run in Supabase SQL Editor
-- Time: 30 seconds | Required before 8AM newsletter send
-- ============================================================================

-- Add confirmation_token for email verification
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS confirmation_token TEXT;

-- Add confirmed status
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;

-- Add subscriber name
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add signup source tracking
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- Add unsubscribe tracking
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT false;
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP;

-- Add email tracking
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP;
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirmation_token ON blog_subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirmed ON blog_subscribers(confirmed);

-- Verify migration completed
SELECT 'Migration complete! All columns added successfully.' as status;

-- ============================================================================
-- After running this, test with: bash test-newsletter-subscribe.sh
-- ============================================================================
