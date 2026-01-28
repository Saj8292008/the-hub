# Scraper Diagnostic Report
**Date:** 2026-01-26
**Issue:** Scrapers haven't updated data in 4 days

---

## 🚨 ROOT CAUSE IDENTIFIED

### **The scraper scheduler is NOT running!**

**Status Check Result:**
```json
{
  "isRunning": false,
  "schedules": {
    "reddit": "*/15 * * * *",
    "ebay": "*/30 * * * *",
    "watchuseek": "0 * * * *"
  },
  "watchlistCount": 0,
  "activeJobs": 0
}
```

**Why it's not running:**
- ❌ **Missing environment variable:** `ENABLE_SCRAPER_SCHEDULER=true` is NOT in `.env` file
- Server code (line 164 in `server.js`) checks: `if (process.env.ENABLE_SCRAPER_SCHEDULER === 'true')`
- This condition evaluates to false, so `scraperScheduler.start()` is never called
- Only `ENABLE_NEWSLETTER_SCHEDULER` and `ENABLE_SPORTS_SCHEDULER` are present in `.env`

---

## 🐛 ADDITIONAL ISSUES FOUND (Manual Test Results)

When manually triggering scrapers with:
```bash
curl -X POST http://localhost:3000/scraper/scheduler/run
```

Results:

### 1. ❌ Reddit Scraper - DATABASE ERROR
```json
{
  "source": "reddit",
  "count": 0,
  "success": false,
  "error": "Could not find the 'raw_data' column of 'watch_listings' in the schema cache"
}
```

**Problem:** Scraper trying to insert `raw_data` column that doesn't exist in database schema
**Impact:** Reddit scraper completely broken - cannot save any listings

### 2. ⚠️ eBay Scraper - NO RESULTS
```json
{
  "source": "ebay",
  "count": 0,
  "success": true
}
```

**Problem:** Returns success but finds 0 items
**Possible causes:**
- Scraper selectors may be outdated (eBay changed their HTML structure)
- Rate limiting or blocking by eBay
- Search query not finding results
- Empty watchlist (watchlistCount: 0)

### 3. ❌ WatchUSeek Scraper - 404 ERROR
```json
{
  "source": "watchuseek",
  "count": 0,
  "success": false,
  "error": "WatchUSeek scrape failed after 3 attempts: Request failed with status code 404"
}
```

**Problem:** Getting 404 errors from WatchUSeek
**Possible causes:**
- Website URL changed
- Sales forum moved to different path
- Website blocking scraper user agent
- Website requires authentication now

---

## 📊 SYSTEM STATUS

### ✅ Working Components
- **API Server:** Running at http://localhost:3000
- **Health Check:** OK
- **Database Connection:** Connected (Supabase)
- **Sports Scheduler:** Running (enabled in .env)
- **Newsletter Scheduler:** Running (enabled in .env)

### ❌ Broken Components
- **Watch Scraper Scheduler:** NOT RUNNING
- **Reddit Scraper:** Database column error
- **eBay Scraper:** No results (needs investigation)
- **WatchUSeek Scraper:** 404 errors

---

## 🔍 CONFIGURATION ISSUES

### Environment Variables (.env)

**Missing:**
```bash
ENABLE_SCRAPER_SCHEDULER=true      # ❌ CRITICAL - scheduler won't start without this
```

**Present but wrong name:**
```bash
RUN_ON_START=false                 # ❌ Should be SCRAPER_RUN_ON_START
```

**Working:**
```bash
POLL_SCHEDULE=0 * * * *            # ✅ Cron schedule (every hour)
ENABLE_SPORTS_SCHEDULER=true       # ✅ Sports scheduler enabled
ENABLE_NEWSLETTER_SCHEDULER=true   # ✅ Newsletter scheduler enabled
```

### Code vs Config Mismatches

1. **server.js line 164:**
   - Checks: `process.env.ENABLE_SCRAPER_SCHEDULER === 'true'`
   - Not in .env → scheduler never starts

2. **watchScraperScheduler.js line 230:**
   - Checks: `process.env.SCRAPER_RUN_ON_START === 'true'`
   - .env has: `RUN_ON_START` (missing SCRAPER_ prefix)

---

## 📋 DATABASE SCHEMA ISSUES

### watch_listings Table
**Missing column:** `raw_data`
- Reddit scraper tries to insert this column
- Column not in schema migration file
- Options:
  1. Add `raw_data JSONB` column to table
  2. Remove `raw_data` from scraper insert statements

### Missing table: `scraper_logs`
**No logging table exists!**
- No way to track scraper runs
- No visibility into past errors
- No metrics on items scraped

**Recommendation:** Create comprehensive logging table (see solution below)

---

## 🛠️ IMMEDIATE FIXES REQUIRED

### Priority 1: Get Scheduler Running (5 minutes)

**Add to .env:**
```bash
ENABLE_SCRAPER_SCHEDULER=true
SCRAPER_RUN_ON_START=true
```

**Restart server:**
```bash
cd /Users/sydneyjackson/the-hub
npm run dev
```

**Verify:**
```bash
curl http://localhost:3000/scraper/scheduler/status
# Should show: "isRunning": true
```

### Priority 2: Fix Reddit Scraper (10 minutes)

**Option A: Add missing column to database**
```sql
ALTER TABLE watch_listings ADD COLUMN IF NOT EXISTS raw_data JSONB;
```

**Option B: Remove raw_data from scraper** (recommended)
- Find where Reddit scraper inserts data
- Remove `raw_data` field from insert statements

### Priority 3: Fix WatchUSeek Scraper (15 minutes)
- Update URL in scraper config
- Test with curl/browser to find correct endpoint
- Update selectors if HTML structure changed
- Add better error handling

### Priority 4: Investigate eBay Scraper (20 minutes)
- Check if selectors still match eBay's HTML
- Verify search query is correct
- Test with browser dev tools
- Add debug logging

---

## 📈 RECOMMENDED ENHANCEMENTS

### 1. Scraper Logging Table
```sql
CREATE TABLE IF NOT EXISTS scraper_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  category VARCHAR(50),           -- 'watches', 'cars', 'sneakers', 'sports'
  source VARCHAR(50),              -- 'reddit', 'ebay', 'watchuseek', etc.
  status VARCHAR(20),              -- 'success', 'error', 'partial'
  items_found INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB                   -- Additional context
);

CREATE INDEX idx_scraper_logs_timestamp ON scraper_logs(timestamp DESC);
CREATE INDEX idx_scraper_logs_source ON scraper_logs(source);
CREATE INDEX idx_scraper_logs_status ON scraper_logs(status);
```

### 2. Admin Debug Dashboard
**Route:** `/admin/scraper-debug`

**Features:**
- ✅ Last update time for each category (watches, cars, sneakers, sports)
- ✅ Real-time scraper logs (last 50 entries) with color coding
- ✅ Manual trigger buttons for each scraper
- ✅ Cron job status display (running/stopped)
- ✅ Next scheduled run times countdown
- ✅ Error rate statistics (last 24 hours)
- ✅ Items scraped graph (last 7 days)

### 3. Enhanced Error Recovery
- Wrap all scraper calls in try-catch with retries
- Exponential backoff for rate limiting
- Circuit breaker pattern for failing scrapers
- Alert when scraper fails 3+ times in a row

### 4. Heartbeat Monitoring
- Each scraper pings heartbeat endpoint after run
- Dashboard shows time since last heartbeat
- Alert if no heartbeat for 2x expected interval
- Example: Reddit scrapes every 15min → alert if no heartbeat for 30min

### 5. Manual Trigger API Endpoints
```
POST /api/admin/scraper/trigger/:category
  - Manually run scraper for specific category
  - Categories: watches, cars, sneakers, sports
  - Returns: immediate response with job ID

GET /api/admin/scraper/status
  - Get status of all scrapers
  - Returns: last run time, next run time, success rate

POST /api/admin/scraper/restart-scheduler
  - Stop and restart the scheduler
  - Useful for applying config changes without full restart

GET /api/admin/scraper/logs
  - Fetch scraper logs with filters
  - Params: source, status, limit, since
```

---

## 🧪 TESTING CHECKLIST

After implementing fixes:

### Test Scheduler
- [ ] Verify `ENABLE_SCRAPER_SCHEDULER=true` in .env
- [ ] Restart server
- [ ] Check `/scraper/scheduler/status` shows `isRunning: true`
- [ ] Verify cron jobs are scheduled (activeJobs > 0)
- [ ] Wait 15 minutes, check if Reddit scraper ran
- [ ] Check database for new listings

### Test Each Scraper Individually
- [ ] **Reddit:** `curl -X POST http://localhost:3000/scraper/scheduler/run -H "Content-Type: application/json" -d '{"source":"reddit"}'`
  - Should return `success: true`
  - Should find > 0 items
  - Database should have new entries

- [ ] **eBay:** Same test with `"source":"ebay"`
  - Should return `success: true`
  - Should find > 0 items

- [ ] **WatchUSeek:** Same test with `"source":"watchuseek"`
  - Should return `success: true`
  - Should not get 404 error

### Test Admin Dashboard
- [ ] Navigate to `/admin/scraper-debug`
- [ ] Verify last update times display correctly
- [ ] Click manual trigger button for Reddit
- [ ] Verify new log entry appears
- [ ] Check that next run time counts down

### Test Logging
- [ ] Run any scraper
- [ ] Check `scraper_logs` table has new entry
- [ ] Verify all fields populated correctly
- [ ] Check error_message if scraper failed

---

## 📊 EXPECTED IMPROVEMENTS

After implementing all fixes:

### Immediate (< 1 hour)
- Scheduler starts automatically on server boot
- Reddit scraper works without database errors
- WatchUSeek scraper handles 404s gracefully
- New listings appear in database

### Short Term (< 1 day)
- All scrapers running on schedule
- 50+ new listings per day
- Complete visibility via logs
- Admin can manually trigger when needed

### Long Term (< 1 week)
- Stable, reliable scraping
- Automatic recovery from failures
- Comprehensive monitoring
- Historical data and trends

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### For Render.com (If Deployed There)
**Issue:** Web services on Render sleep after 15 minutes of inactivity
- Cron jobs won't run if service is asleep
- Need to use **Worker service** instead of Web service

**Solutions:**
1. **Convert to Worker Service** (Recommended)
   - Change service type from Web to Worker
   - Set start command: `node src/api/server.js`
   - Workers don't sleep and are perfect for scheduled tasks

2. **Add Keep-Alive Ping**
   - Use external service (e.g., UptimeRobot) to ping every 10 minutes
   - Keeps web service awake
   - Not ideal but works for testing

3. **Use Render Cron Jobs** (Best for production)
   - Create separate cron job services
   - Each scraper gets its own cron job
   - Invoke via webhook endpoint
   - Most reliable option

---

## 📝 SUMMARY

**Why scrapers stopped:**
1. ❌ Scheduler never started (missing env variable)
2. ❌ Reddit scraper has database error
3. ❌ WatchUSeek scraper getting 404s
4. ⚠️ eBay scraper not finding results
5. ❌ No logging or monitoring to detect issues

**Quick fix (5 minutes):**
```bash
# Add to .env
echo "ENABLE_SCRAPER_SCHEDULER=true" >> .env
echo "SCRAPER_RUN_ON_START=true" >> .env

# Restart server
npm run dev
```

**Full fix (2-3 hours):**
1. Add environment variables
2. Create scraper_logs table
3. Fix Reddit scraper database error
4. Fix WatchUSeek scraper 404s
5. Add comprehensive logging
6. Build admin debug dashboard
7. Add manual trigger endpoints
8. Test all scrapers
9. Deploy to production

---

**Next step:** Implement the fixes starting with Priority 1 (getting scheduler running).
