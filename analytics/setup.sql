-- Analytics Schema for The Hub
-- Run this in your Supabase SQL Editor

-- ============================================
-- DAILY METRICS TABLE
-- ============================================

-- Stores daily snapshots of key metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  
  -- User metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  premium_users INTEGER DEFAULT 0,
  
  -- Revenue metrics
  mrr DECIMAL(10,2) DEFAULT 0,
  
  -- Engagement metrics
  alerts_sent INTEGER DEFAULT 0,
  deals_scraped INTEGER DEFAULT 0,
  blog_views INTEGER DEFAULT 0,
  
  -- Channel metrics
  telegram_members INTEGER DEFAULT 0,
  email_subscribers INTEGER DEFAULT 0,
  discord_members INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- ============================================

-- Stores individual analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  user_id UUID,
  session_id VARCHAR(100),
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id, created_at DESC);

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Weekly metrics summary
CREATE OR REPLACE VIEW weekly_metrics_summary AS
SELECT 
  date_trunc('week', date) as week,
  SUM(new_users) as new_users,
  AVG(active_users)::INTEGER as avg_active_users,
  MAX(mrr) as mrr_end_of_week,
  SUM(alerts_sent) as total_alerts,
  SUM(deals_scraped) as total_deals_scraped,
  SUM(blog_views) as total_blog_views,
  MAX(telegram_members) as telegram_members,
  MAX(email_subscribers) as email_subscribers
FROM daily_metrics
GROUP BY date_trunc('week', date)
ORDER BY week DESC;

-- Monthly metrics summary
CREATE OR REPLACE VIEW monthly_metrics_summary AS
SELECT 
  date_trunc('month', date) as month,
  SUM(new_users) as new_users,
  AVG(active_users)::INTEGER as avg_active_users,
  MAX(mrr) as mrr_end_of_month,
  MAX(premium_users) as premium_users,
  SUM(alerts_sent) as total_alerts,
  SUM(deals_scraped) as total_deals_scraped,
  SUM(blog_views) as total_blog_views,
  MAX(telegram_members) as telegram_members,
  MAX(email_subscribers) as email_subscribers
FROM daily_metrics
GROUP BY date_trunc('month', date)
ORDER BY month DESC;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get metrics for a date range
CREATE OR REPLACE FUNCTION get_metrics_range(start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  total_users INTEGER,
  mrr DECIMAL(10,2),
  alerts_sent INTEGER,
  blog_views INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dm.date,
    dm.total_users,
    dm.mrr,
    dm.alerts_sent,
    dm.blog_views
  FROM daily_metrics dm
  WHERE dm.date BETWEEN start_date AND end_date
  ORDER BY dm.date;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate week-over-week growth
CREATE OR REPLACE FUNCTION get_wow_growth()
RETURNS TABLE (
  metric TEXT,
  this_week NUMERIC,
  last_week NUMERIC,
  growth_percent NUMERIC
) AS $$
DECLARE
  this_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  last_week_start DATE := (date_trunc('week', CURRENT_DATE) - INTERVAL '1 week')::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    'new_users'::TEXT,
    COALESCE(SUM(CASE WHEN d.date >= this_week_start THEN d.new_users END), 0)::NUMERIC,
    COALESCE(SUM(CASE WHEN d.date >= last_week_start AND d.date < this_week_start THEN d.new_users END), 0)::NUMERIC,
    CASE 
      WHEN COALESCE(SUM(CASE WHEN d.date >= last_week_start AND d.date < this_week_start THEN d.new_users END), 0) = 0 
      THEN 0
      ELSE ROUND(
        (COALESCE(SUM(CASE WHEN d.date >= this_week_start THEN d.new_users END), 0)::NUMERIC - 
         COALESCE(SUM(CASE WHEN d.date >= last_week_start AND d.date < this_week_start THEN d.new_users END), 0)::NUMERIC) /
        COALESCE(SUM(CASE WHEN d.date >= last_week_start AND d.date < this_week_start THEN d.new_users END), 1)::NUMERIC * 100, 1
      )
    END
  FROM daily_metrics d;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Admin can read/write metrics
CREATE POLICY "Authenticated users can manage daily_metrics" ON daily_metrics
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage analytics_events" ON analytics_events
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'daily_metrics' as table_name, COUNT(*) as row_count FROM daily_metrics
UNION ALL
SELECT 'analytics_events', COUNT(*) FROM analytics_events;
