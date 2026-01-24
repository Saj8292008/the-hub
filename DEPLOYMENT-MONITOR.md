# Render.com Deployment - Monitoring Guide

## 🚀 Deployment Status

**Git Commit:** `223785b`
**Pushed to:** `https://github.com/Saj8292008/the-hub.git`
**Branch:** `main`

---

## Step 1: Verify Render Deployment Started

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your service: **the-hub**
3. Check if deployment started automatically (should see "Deploying..." status)

If not auto-deploying:
- Click "Manual Deploy" → "Deploy latest commit"
- Select branch: `main`

---

## Step 2: Monitor Deployment Logs

In Render Dashboard → Your Service → Logs tab, you should see:

```
==> Starting build...
==> Running: npm install
==> Build completed successfully
==> Starting service...
info: ========================================
info: Starting The Hub...
info: ========================================
info: 🌐 API Server: Active
info: 📱 Telegram bot: Active
info: ✅ Registered scraper: reddit (*/15 * * * *)
info: ✅ Registered scraper: ebay (*/30 * * * *)
info: ✅ Registered scraper: watchuseek (0 * * * *)
info: 🚀 Starting Scraper Coordinator...
info: ✅ Scheduler started with 3 jobs
info: 🔍 Scraper Coordinator: Active
info: ========================================
info: ✅ The Hub is running
info: 📊 Price polling: 0 * * * *
info: 🔍 Scraper scheduler: Enabled
info: ========================================
```

**⚠️ Watch for errors** like:
- Missing environment variables
- Database connection issues
- Port binding issues

---

## Step 3: Verify Environment Variables

Go to Render Dashboard → Your Service → Environment

**Required Variables:**
```
✅ TELEGRAM_BOT_TOKEN
✅ TELEGRAM_ADMIN_CHAT_ID
✅ SCRAPERAPI_KEY (if using real scrapers)
✅ ENABLE_SCRAPER_SCHEDULER=true
✅ PORT=3000
✅ NODE_ENV=production
```

**New Variables Added:**
```
✅ SCRAPER_RUN_ON_START=false
✅ SCRAPER_MAX_RETRIES=3
✅ SCRAPER_RETRY_DELAY=5000
```

If any are missing, add them and redeploy.

---

## Step 4: Test Deployment

Once deployment is complete (status: "Live"), run these tests:

### Test 1: Health Check
```bash
curl https://the-hub-[your-id].onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-23T..."
}
```

### Test 2: Scraper Health
```bash
curl https://the-hub-[your-id].onrender.com/admin/scraper/health
```

Expected response (HTTP 200):
```json
{
  "healthy": true,
  "scheduler": {
    "isPaused": false,
    "activeJobs": 0,
    "successRate": 0
  },
  "timestamp": "2024-01-23T..."
}
```

### Test 3: Scraper Status
```bash
curl https://the-hub-[your-id].onrender.com/admin/scraper/status
```

Expected response:
```json
{
  "success": true,
  "data": {
    "scheduler": {
      "totalExecutions": 0,
      "successfulExecutions": 0,
      "failedExecutions": 0,
      "activeJobs": 0,
      "isPaused": false,
      "registeredJobs": 3
    },
    "sources": {
      "reddit": {
        "enabled": true,
        "consecutiveFailures": 0,
        "schedule": "*/15 * * * *"
      },
      ...
    }
  }
}
```

### Test 4: Manual Trigger (Optional)
```bash
curl -X POST https://the-hub-[your-id].onrender.com/admin/scraper/run/reddit
```

This will trigger an immediate scrape to verify everything works.

---

## Step 5: Monitor Scheduler Execution

The scheduler will automatically start scraping based on the configured schedules:

- **Reddit**: Every 15 minutes
- **eBay**: Every 30 minutes
- **WatchUSeek**: Every hour

Watch logs for:
```
info: 🚀 Executing job: scrape:reddit (attempt 1/3)
info: 🔍 Starting scrape: reddit
info: ✅ Scraped 50 listings from reddit
info: 💾 Saved 47 new/updated listings
info: ✅ Job scrape:reddit completed in 2345ms
```

---

## Step 6: Verify Notifications (If Configured)

If you have `TELEGRAM_ADMIN_CHAT_ID` configured:

1. **Test Price Alert:**
   - Add a watch with a very low target price (e.g., $1)
   - Wait for scraper to run (or trigger manually)
   - Check Telegram for price alert message

2. **Check Alert in Logs:**
```
grep "Alert triggered" logs
```

---

## Troubleshooting

### Issue: Deployment Failed

**Check Render logs for errors:**
- `npm install` failures → Check `package.json`
- Port binding errors → Verify `PORT=3000` env var
- Module not found → Check file paths and imports

**Solution:**
1. Fix the error locally
2. Commit and push
3. Redeploy

### Issue: Scheduler Not Starting

**Symptoms:** Logs show "Scraper Coordinator: Disabled"

**Solution:**
1. Go to Environment variables
2. Set `ENABLE_SCRAPER_SCHEDULER=true`
3. Click "Save Changes"
4. Redeploy

### Issue: Jobs Not Executing

**Check:**
1. Scheduler status: `curl .../admin/scraper/status`
2. Look for `"isPaused": true`
3. If paused, resume: `curl -X POST .../admin/scraper/resume`

### Issue: High Failure Rate

**Check:**
1. Rate limits being exceeded
2. Source websites blocking requests
3. Network issues

**Solution:**
1. Increase `minInterval` in source config
2. Check if `USE_REAL_SCRAPERS=false` (uses mock data)
3. Review error logs for specific issues

### Issue: Service Keeps Sleeping (Free Tier)

**Symptoms:** Service spins down after 15 minutes

**Solutions:**
1. Upgrade to paid tier ($7/month) for 24/7 operation
2. Use external uptime monitor (UptimeRobot)
3. Set up Render Cron Jobs to wake service

---

## Monitoring Setup

### Option 1: UptimeRobot (Free)

1. Go to [UptimeRobot](https://uptimerobot.com)
2. Create new monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.onrender.com/admin/scraper/health`
   - Interval: 5 minutes
   - Expected Status: 200

### Option 2: Render Cron Jobs

Create a cron job to ping your service every 5 minutes:

```yaml
# In render.yaml
jobs:
  - type: cron
    name: keep-alive
    schedule: "*/5 * * * *"
    command: "curl https://the-hub-[your-id].onrender.com/health"
```

---

## Success Checklist

After deployment, verify:

- [ ] Service is "Live" on Render dashboard
- [ ] Health check returns 200
- [ ] Scraper health endpoint returns healthy
- [ ] Status endpoint shows 3 registered jobs
- [ ] Logs show "Scraper Coordinator: Active"
- [ ] First scrape executed successfully (within 15 min)
- [ ] No error messages in logs
- [ ] Telegram bot is active (if configured)
- [ ] Price alerts working (if configured)

---

## Next Steps

Once deployed and verified:

1. **Test all admin endpoints** with the test script:
   ```bash
   ./test-scheduler.sh https://your-app.onrender.com
   ```

2. **Set up monitoring** (UptimeRobot or similar)

3. **Monitor logs** for first few hours to catch any issues

4. **Add watches with target prices** to test notifications

5. **Consider upgrading to paid tier** for 24/7 operation

---

## Support

- **Logs:** Render Dashboard → Your Service → Logs
- **Metrics:** Render Dashboard → Your Service → Metrics
- **Events:** Render Dashboard → Your Service → Events

For issues:
1. Check logs for error messages
2. Verify environment variables
3. Test endpoints manually
4. Review `SCHEDULER-DOCUMENTATION.md`

---

## Quick Reference

**Service URL:** `https://the-hub-[your-id].onrender.com`

**Key Endpoints:**
- `/health` - Basic health check
- `/admin/scraper/health` - Scraper health
- `/admin/scraper/status` - Full status
- `/admin/scraper/stats` - Statistics
- `/scraper/listings` - View scraped data

**Logs:**
```bash
# View real-time logs
render logs --tail

# Search logs
render logs | grep "ERROR"
render logs | grep "scraper"
```

---

## 🎉 Deployment Complete!

If all checks pass, your automated scheduler is now running in production!

The system will:
- ✅ Scrape sources on schedule
- ✅ Check for price alerts
- ✅ Send Telegram notifications
- ✅ Track source health
- ✅ Auto-disable failing sources
- ✅ Retry with exponential backoff

**Congratulations! The Hub is now fully automated.** 🚀
