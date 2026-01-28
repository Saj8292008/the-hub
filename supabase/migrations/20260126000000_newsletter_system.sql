-- Newsletter System Database Schema
-- Complete schema for email newsletter functionality
-- Created: 2026-01-26

-- ============================================
-- ENHANCE EXISTING blog_subscribers TABLE
-- ============================================

-- Add new columns to existing blog_subscribers table
ALTER TABLE blog_subscribers
ADD COLUMN IF NOT EXISTS category_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS send_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_unsubscribe_token
ON blog_subscribers(unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirmed_unsubscribed
ON blog_subscribers(confirmed, unsubscribed);

CREATE INDEX IF NOT EXISTS idx_blog_subscribers_category_prefs
ON blog_subscribers USING GIN(category_preferences);

-- ============================================
-- NEWSLETTER CAMPAIGNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Campaign details
  name VARCHAR(200) NOT NULL,
  subject_line TEXT NOT NULL,
  subject_line_variant TEXT, -- For A/B testing

  -- Content
  content_markdown TEXT,
  content_html TEXT NOT NULL,
  preview_text VARCHAR(150),

  -- Metadata
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  campaign_type VARCHAR(50) DEFAULT 'weekly' CHECK (campaign_type IN ('weekly', 'promotional', 'announcement', 'digest')),

  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  send_started_at TIMESTAMP WITH TIME ZONE,
  send_completed_at TIMESTAMP WITH TIME ZONE,

  -- Targeting (for future segmentation)
  target_segments JSONB DEFAULT '[]'::jsonb,

  -- Sending stats
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,

  -- A/B test tracking
  ab_test_enabled BOOLEAN DEFAULT false,
  ab_variant_a_count INTEGER DEFAULT 0,
  ab_variant_b_count INTEGER DEFAULT 0,

  -- AI generation
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  ai_model VARCHAR(50),

  -- Metadata
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for newsletter_campaigns
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status
ON newsletter_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled
ON newsletter_campaigns(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created
ON newsletter_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_type
ON newsletter_campaigns(campaign_type);

-- ============================================
-- NEWSLETTER SENDS TABLE (Send Log)
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  campaign_id UUID NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES blog_subscribers(id) ON DELETE CASCADE,

  -- Personalization
  personalized_subject TEXT,
  personalized_content_html TEXT,

  -- A/B test variant
  ab_variant VARCHAR(1) CHECK (ab_variant IN ('A', 'B')),

  -- Send status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Resend tracking
  resend_email_id VARCHAR(100) UNIQUE,

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate sends
  UNIQUE(campaign_id, subscriber_id)
);

-- Indexes for newsletter_sends
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_campaign
ON newsletter_sends(campaign_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_subscriber
ON newsletter_sends(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_status
ON newsletter_sends(status);

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_resend_id
ON newsletter_sends(resend_email_id) WHERE resend_email_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_sends_pending
ON newsletter_sends(campaign_id, status) WHERE status = 'pending';

-- ============================================
-- NEWSLETTER EVENTS TABLE (Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  send_id UUID REFERENCES newsletter_sends(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES blog_subscribers(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('open', 'click', 'unsubscribe', 'bounce', 'complaint')),

  -- Click tracking
  link_url TEXT,
  link_id VARCHAR(100),

  -- Metadata
  user_agent TEXT,
  ip_address INET,
  country VARCHAR(100),

  -- Resend webhook data
  resend_event_id VARCHAR(100),
  resend_event_data JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for newsletter_events
CREATE INDEX IF NOT EXISTS idx_newsletter_events_send
ON newsletter_events(send_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_events_campaign
ON newsletter_events(campaign_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_events_subscriber
ON newsletter_events(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_events_type
ON newsletter_events(event_type);

CREATE INDEX IF NOT EXISTS idx_newsletter_events_created
ON newsletter_events(created_at DESC);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_newsletter_events_campaign_type
ON newsletter_events(campaign_id, event_type, created_at DESC);

-- ============================================
-- NEWSLETTER SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Schedule configuration
  schedule_enabled BOOLEAN DEFAULT true,
  schedule_cron VARCHAR(50) DEFAULT '0 9 * * 5', -- Fridays at 9am EST
  schedule_timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Sending configuration
  batch_size INTEGER DEFAULT 100,
  batch_delay_seconds INTEGER DEFAULT 2,

  -- Content generation
  ai_generation_enabled BOOLEAN DEFAULT true,
  min_deal_score DECIMAL(3,2) DEFAULT 8.5,
  top_deals_count INTEGER DEFAULT 5,

  -- A/B testing
  ab_test_enabled BOOLEAN DEFAULT true,
  ab_split_percentage INTEGER DEFAULT 50 CHECK (ab_split_percentage >= 0 AND ab_split_percentage <= 100),

  -- Email configuration
  from_email VARCHAR(100) DEFAULT 'newsletter@thehub.com',
  from_name VARCHAR(100) DEFAULT 'The Hub',
  reply_to_email VARCHAR(100),

  -- Last run tracking
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status VARCHAR(20),
  last_run_campaign_id UUID REFERENCES newsletter_campaigns(id),

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings (single row)
INSERT INTO newsletter_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp on newsletter_campaigns
CREATE OR REPLACE FUNCTION update_newsletter_campaign_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for newsletter_campaigns
DROP TRIGGER IF EXISTS trigger_update_newsletter_campaign_timestamp ON newsletter_campaigns;
CREATE TRIGGER trigger_update_newsletter_campaign_timestamp
  BEFORE UPDATE ON newsletter_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_campaign_timestamp();

-- Function to update updated_at timestamp on newsletter_settings
CREATE OR REPLACE FUNCTION update_newsletter_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for newsletter_settings
DROP TRIGGER IF EXISTS trigger_update_newsletter_settings_timestamp ON newsletter_settings;
CREATE TRIGGER trigger_update_newsletter_settings_timestamp
  BEFORE UPDATE ON newsletter_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_settings_timestamp();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to get campaign analytics
CREATE OR REPLACE FUNCTION get_campaign_analytics(p_campaign_id UUID)
RETURNS TABLE (
  total_sent BIGINT,
  total_opens BIGINT,
  total_clicks BIGINT,
  total_unsubscribes BIGINT,
  unique_opens BIGINT,
  unique_clicks BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM newsletter_sends WHERE campaign_id = p_campaign_id AND status = 'sent')::BIGINT as total_sent,
    (SELECT COUNT(*) FROM newsletter_events WHERE campaign_id = p_campaign_id AND event_type = 'open')::BIGINT as total_opens,
    (SELECT COUNT(*) FROM newsletter_events WHERE campaign_id = p_campaign_id AND event_type = 'click')::BIGINT as total_clicks,
    (SELECT COUNT(*) FROM newsletter_events WHERE campaign_id = p_campaign_id AND event_type = 'unsubscribe')::BIGINT as total_unsubscribes,
    (SELECT COUNT(DISTINCT subscriber_id) FROM newsletter_events WHERE campaign_id = p_campaign_id AND event_type = 'open')::BIGINT as unique_opens,
    (SELECT COUNT(DISTINCT subscriber_id) FROM newsletter_events WHERE campaign_id = p_campaign_id AND event_type = 'click')::BIGINT as unique_clicks,
    CASE
      WHEN (SELECT COUNT(*) FROM newsletter_sends WHERE campaign_id = p_campaign_id AND status = 'sent') > 0
      THEN (SELECT COUNT(DISTINCT subscriber_id) FROM newsletter_events WHERE campaign_id = p_campaign_id AND event_type = 'open')::NUMERIC /
           (SELECT COUNT(*) FROM newsletter_sends WHERE campaign_id = p_campaign_id AND status = 'sent')::NUMERIC * 100
      ELSE 0
    END as open_rate,
    CASE
      WHEN (SELECT COUNT(*) FROM newsletter_sends WHERE campaign_id = p_campaign_id AND status = 'sent') > 0
      THEN (SELECT COUNT(DISTINCT subscriber_id) FROM newsletter_events WHERE campaign_id = p_campaign_id AND event_type = 'click')::NUMERIC /
           (SELECT COUNT(*) FROM newsletter_sends WHERE campaign_id = p_campaign_id AND status = 'sent')::NUMERIC * 100
      ELSE 0
    END as click_rate;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on newsletter tables
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies
-- Admins can do everything
CREATE POLICY "Admins can manage campaigns" ON newsletter_campaigns
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Sends Policies
-- Service role can insert/update (for backend processing)
CREATE POLICY "Service role can manage sends" ON newsletter_sends
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- Events Policies
-- Anyone can insert events (for tracking)
CREATE POLICY "Anyone can insert events" ON newsletter_events
  FOR INSERT WITH CHECK (true);

-- Admins can read events
CREATE POLICY "Admins can read events" ON newsletter_events
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- Settings Policies
-- Admins can manage settings
CREATE POLICY "Admins can manage settings" ON newsletter_settings
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE newsletter_campaigns IS 'Stores newsletter campaigns (drafts, scheduled, sent)';
COMMENT ON TABLE newsletter_sends IS 'Log of individual email sends with tracking IDs';
COMMENT ON TABLE newsletter_events IS 'Tracking events (opens, clicks, unsubscribes)';
COMMENT ON TABLE newsletter_settings IS 'System configuration for newsletter scheduler';

COMMENT ON COLUMN newsletter_campaigns.ab_test_enabled IS 'Whether to use subject_line_variant for A/B testing';
COMMENT ON COLUMN newsletter_sends.resend_email_id IS 'Email ID from Resend API for status tracking';
COMMENT ON COLUMN newsletter_events.event_type IS 'Type: open, click, unsubscribe, bounce, complaint';

-- ============================================
-- SAMPLE DATA (For Development/Testing)
-- ============================================

-- Uncomment below to insert sample campaign for testing
/*
INSERT INTO newsletter_campaigns (name, subject_line, content_html, status, campaign_type) VALUES
(
  'Sample Newsletter',
  'Your Weekly Deal Digest',
  '<h1>Top Deals This Week</h1><p>Here are the best deals...</p>',
  'draft',
  'weekly'
);
*/
