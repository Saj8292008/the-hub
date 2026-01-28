-- ============================================================================
-- SCRAPER LOGS TABLE
-- Comprehensive logging for all scraper runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS scraper_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Scraper identification
  category VARCHAR(50),              -- 'watches', 'cars', 'sneakers', 'sports'
  source VARCHAR(50),                -- 'reddit', 'ebay', 'watchuseek', 'autotrader', 'stockx', etc.

  -- Run status
  status VARCHAR(20),                -- 'success', 'error', 'partial', 'no_results'

  -- Metrics
  items_found INTEGER DEFAULT 0,     -- Total items scraped
  items_new INTEGER DEFAULT 0,       -- New items added to database
  items_updated INTEGER DEFAULT 0,   -- Existing items updated
  duration_ms INTEGER,               -- How long the scrape took

  -- Error tracking
  error_message TEXT,                -- Full error message if failed
  retry_count INTEGER DEFAULT 0,     -- Number of retries attempted

  -- Additional context
  metadata JSONB,                    -- Any additional data (query used, filters, etc.)

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scraper_logs_timestamp ON scraper_logs(timestamp DESC);
CREATE INDEX idx_scraper_logs_category ON scraper_logs(category);
CREATE INDEX idx_scraper_logs_source ON scraper_logs(source);
CREATE INDEX idx_scraper_logs_status ON scraper_logs(status);
CREATE INDEX idx_scraper_logs_category_source ON scraper_logs(category, source);

-- Function to clean up old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_scraper_logs() RETURNS void AS $$
BEGIN
  DELETE FROM scraper_logs WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- View for quick stats
CREATE OR REPLACE VIEW scraper_stats AS
SELECT
  category,
  source,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
  COUNT(*) FILTER (WHERE status = 'error') as failed_runs,
  SUM(items_found) as total_items_found,
  SUM(items_new) as total_items_new,
  AVG(duration_ms) as avg_duration_ms,
  MAX(timestamp) as last_run_at
FROM scraper_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY category, source
ORDER BY last_run_at DESC;

-- View for recent errors
CREATE OR REPLACE VIEW scraper_recent_errors AS
SELECT
  timestamp,
  category,
  source,
  error_message,
  retry_count,
  duration_ms
FROM scraper_logs
WHERE status = 'error'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 50;

-- Comment the table
COMMENT ON TABLE scraper_logs IS 'Comprehensive logging for all scraper runs across all categories';
COMMENT ON COLUMN scraper_logs.category IS 'Category of items: watches, cars, sneakers, sports';
COMMENT ON COLUMN scraper_logs.source IS 'Specific source/website: reddit, ebay, watchuseek, etc.';
COMMENT ON COLUMN scraper_logs.status IS 'Run status: success, error, partial, no_results';
COMMENT ON COLUMN scraper_logs.items_found IS 'Total items found by scraper';
COMMENT ON COLUMN scraper_logs.items_new IS 'New items inserted into database';
COMMENT ON COLUMN scraper_logs.items_updated IS 'Existing items updated';
COMMENT ON COLUMN scraper_logs.duration_ms IS 'Duration of scrape in milliseconds';
COMMENT ON COLUMN scraper_logs.metadata IS 'Additional context like search query, filters used, etc.';

-- ============================================================================
-- COMPLETE!
-- ============================================================================
