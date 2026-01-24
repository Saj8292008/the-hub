# Render.com Setup Guide - Step by Step

## Step 1: Sign Up for Render

1. **Go to:** https://render.com
2. Click **"Get Started"** or **"Sign Up"**
3. Choose sign up method:
   - **Recommended:** Sign up with GitHub (easiest for deployment)
   - Or use email/Google

4. **If using GitHub:**
   - Click "Sign up with GitHub"
   - Authorize Render to access your repositories
   - This automatically connects your GitHub account

---

## Step 2: Create New Web Service

1. Once logged in, click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your repository:
   - If you signed up with GitHub, your repos should appear
   - Find: **`Saj8292008/the-hub`**
   - Click **"Connect"**

---

## Step 3: Configure Service

### Basic Settings

**Name:** `the-hub` (or any name you prefer)
**Region:** Choose closest to you (e.g., Oregon, Frankfurt)
**Branch:** `main`
**Runtime:** `Node`

### Build & Deploy

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node src/index.js
```

### Plan

**Select:** Free (or upgrade to paid if you want 24/7)

---

## Step 4: Add Environment Variables

**Click "Advanced"** to expand environment variables section.

Add these variables one by one:

### Required Variables

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=8310191561:AAExxS9nt4a2VsUz0W75CG1H_4C0iDG-9UM
TELEGRAM_ADMIN_CHAT_ID=8427035818

# Scraper API Keys
SCRAPERAPI_KEY=c53a3b6bced75cf230ef7574feea5858
APIFY_TOKEN=apify_api_G1UEBZ6UT7XXhLxPRN8f7oMcnS8ZuD1vGz0C

# Scraper Settings
USE_REAL_SCRAPERS=false
ENABLE_SCRAPER_SCHEDULER=true
SCRAPER_RUN_ON_START=false
SCRAPER_MAX_RETRIES=3
SCRAPER_RETRY_DELAY=5000

# Polling Schedule
POLL_SCHEDULE=0 * * * *
RUN_ON_START=false
SEND_UPDATE_SUMMARY=false

# Rate Limits (milliseconds)
SCRAPER_MIN_TIME_CHRONO24=3000
SCRAPER_MIN_TIME_AUTOTRADER=2000
SCRAPER_MIN_TIME_STOCKX=4000

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Debug (optional)
DEBUG_SCREENSHOTS=false
DEBUG_HTML=false
```

### Optional - If You Have Supabase

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

**Note:** These values are already in your `render.yaml` file, so Render might auto-fill some of them.

---

## Step 5: Deploy

1. Click **"Create Web Service"** button at the bottom
2. Render will start building your app
3. Watch the logs as it:
   - Clones your repository
   - Runs `npm install`
   - Starts your application

### Expected Build Logs

You should see:
```
==> Cloning from https://github.com/Saj8292008/the-hub...
==> Checking out commit 223785b...
==> Running build command: npm install
==> Starting service with: node src/index.js
info: Starting The Hub...
info: ✅ Registered scraper: reddit (*/15 * * * *)
info: 🔍 Scraper Coordinator: Active
info: ✅ The Hub is running
```

---

## Step 6: Get Your Service URL

Once deployment completes (status: **"Live"**):

1. Look for your service URL at the top of the dashboard
2. Format: `https://the-hub-[random-id].onrender.com`
3. Copy this URL

---

## Step 7: Test Your Deployment

Replace `YOUR_URL` with your actual Render URL:

```bash
# Set your URL
export APP_URL="https://the-hub-xxxx.onrender.com"

# Test health
curl $APP_URL/health

# Expected: {"status":"OK","timestamp":"..."}

# Test scraper health
curl $APP_URL/admin/scraper/health

# Expected: {"healthy":true,"scheduler":{...}}

# Get full status
curl $APP_URL/admin/scraper/status

# Should show 3 registered scrapers
```

---

## Step 8: Verify Scheduler is Running

### Check Logs

In Render Dashboard → Logs tab, look for:

```
✅ Registered scraper: reddit (*/15 * * * *)
✅ Registered scraper: ebay (*/30 * * * *)
✅ Registered scraper: watchuseek (0 * * * *)
🔍 Scraper Coordinator: Active
```

### Wait for First Scrape

Within 15 minutes, you should see:
```
🚀 Executing job: scrape:reddit (attempt 1/3)
🔍 Starting scrape: reddit
✅ Scraped 50 listings from reddit
💾 Saved 47 new/updated listings
✅ Job scrape:reddit completed in 2345ms
```

---

## Troubleshooting

### Issue: Build Failed

**Common causes:**
- Missing `package.json` - Check it's in root directory
- Node version mismatch - Render uses Node 18+ by default

**Solution:**
- Check build logs for specific error
- Fix the issue locally
- Commit and push: `git push origin main`
- Render will auto-redeploy

### Issue: Service Won't Start

**Check:**
- Environment variables are set correctly
- `PORT=3000` is set
- Start command is: `node src/index.js`

**Solution:**
- Go to Settings → Update environment variables
- Click "Manual Deploy" after changes

### Issue: Scheduler Not Running

**Symptoms:** Logs show "Scraper Coordinator: Disabled"

**Solution:**
1. Go to Environment variables
2. Verify `ENABLE_SCRAPER_SCHEDULER=true`
3. If missing or wrong, add/fix it
4. Manual Deploy

### Issue: Can't Access Service

**Symptoms:** URLs return connection errors

**Check:**
- Service status is "Live" not "Building" or "Deploy failed"
- Using HTTPS not HTTP
- URL is correct (copy from dashboard)

**Solution:**
- Wait for deployment to complete
- Check for errors in logs
- Try health endpoint: `/health`

---

## Understanding Render Plans

### Free Plan
- ✅ Good for testing and development
- ⚠️ Service spins down after 15 minutes of inactivity
- ⚠️ Cold start takes 30-60 seconds
- ⚠️ Scheduler stops when service sleeps
- 750 hours/month free

### Paid Plan ($7/month)
- ✅ 24/7 uptime (no sleeping)
- ✅ Scheduler runs continuously
- ✅ No cold starts
- ✅ Better for production

**Recommendation:** Start with free, upgrade if you need continuous scraping.

---

## Free Tier Workarounds

### Option 1: External Uptime Monitor

Use UptimeRobot (free) to ping your service every 5 minutes:

1. Go to https://uptimerobot.com
2. Create account
3. Add monitor:
   - Type: HTTP(s)
   - URL: Your Render URL + `/health`
   - Interval: 5 minutes
4. This keeps your service awake

### Option 2: Render Cron Jobs

Create a cron job in `render.yaml` to wake service:

```yaml
services:
  - type: web
    name: the-hub
    # ... existing config ...

  - type: cron
    name: keep-alive
    schedule: "*/5 * * * *"
    command: "curl https://your-app.onrender.com/health"
```

---

## Auto-Deploy Setup

Enable auto-deploy so every git push triggers deployment:

1. Go to Render Dashboard → Your Service → Settings
2. Scroll to "Build & Deploy"
3. Check: **"Auto-Deploy"** is set to **"Yes"**
4. Branch: `main`

Now, every time you push to GitHub, Render will automatically:
- Pull the latest code
- Run build
- Deploy new version

---

## Success Checklist

After setup, verify:

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Service created and configured
- [ ] All environment variables added
- [ ] Build completed successfully
- [ ] Service status shows "Live"
- [ ] Health endpoint returns 200
- [ ] Scheduler logs show "Active"
- [ ] First scrape runs within 15 minutes
- [ ] No errors in logs

---

## Next Steps After Setup

1. **Save your service URL** - You'll need it for testing
2. **Set up monitoring** (UptimeRobot recommended)
3. **Test all endpoints** using `test-scheduler.sh`
4. **Add watches with target prices** to test alerts
5. **Monitor logs** for first hour to catch any issues

---

## Quick Reference

**Dashboard:** https://dashboard.render.com
**Docs:** https://render.com/docs
**Status:** https://status.render.com

**Your Service URL:** `https://the-hub-[your-id].onrender.com`

**Key Endpoints:**
- `/health` - Health check
- `/admin/scraper/health` - Scheduler health
- `/admin/scraper/status` - Full status
- `/scraper/listings` - View scraped data

---

## Support

If you get stuck:

1. Check Render logs for errors
2. Review environment variables
3. Verify GitHub connection
4. Check this guide's troubleshooting section
5. Render support: https://render.com/docs/support

---

## Estimated Setup Time

- Sign up: 2 minutes
- Configure service: 5 minutes
- First deployment: 3-5 minutes
- **Total: ~10 minutes**

---

## 🚀 Ready to Deploy!

Follow the steps above to get your scheduler running on Render.

**Start here:** https://render.com → Sign Up

Once you create the service, Render will automatically deploy your latest code (commit `223785b`).

Good luck! 🎉
