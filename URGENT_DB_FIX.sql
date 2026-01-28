-- URGENT: Add missing columns to blog_subscribers table
-- Run this in Supabase SQL Editor NOW before 8AM!

-- Add confirmation_token column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS confirmation_token TEXT;

-- Add confirmed column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT false;

-- Add name column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add source column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- Add unsubscribed column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT false;

-- Add unsubscribe_reason column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;

-- Add unsubscribed_at column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP;

-- Add last_sent_at column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP;

-- Add open_count column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;

-- Add click_count column
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create index on confirmation_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirmation_token
ON blog_subscribers(confirmation_token);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email
ON blog_subscribers(email);

-- Done!
SELECT 'Newsletter database columns added successfully!' as status;
