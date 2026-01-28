# The Hub - Quick Start Guide 🚀

**Last Updated:** 2026-01-26

This guide will get your entire Hub platform operational in **under 10 minutes**.

---

## 🎯 What You're Setting Up

After following this guide, you'll have:

1. ✅ **Scraper System** - Auto-updates watch/car/sneaker listings every 15-60 minutes
2. ✅ **Newsletter System** - Auto-sends weekly newsletters every Friday 9am EST
3. ✅ **Monitoring Dashboards** - Real-time visibility into both systems
4. ✅ **AI Services** - Deal scoring, blog generation, natural search
5. ✅ **Complete Platform** - Frontend + Backend fully operational

---

## ⚡ QUICK START (3 Steps)

### Step 1: Fix NPM Permissions (Required)

```bash
# This will prompt for your password
sudo chown -R $(id -u):$(id -g) "/Users/sydneyjackson/.npm"
```

**Why:** NPM cache has root-owned files preventing package installation.

### Step 2: Run Database Migrations (Required)

**A. Scraper Logging System:**
1. Go to [Supabase Dashboard](https://app.supabase.com/project/sysvawxchniqelifyenl/sql)
2. Click "New query"
3. Open: `supabase/migrations/20260126180000_scraper_logs_table.sql`
4. Copy all contents and paste
5. Click "Run"

**B. Newsletter System:**
1. Same Supabase SQL Editor
2. Click "New query"
3. Open: `supabase/migrations/20260126000000_newsletter_system.sql`
4. Copy all contents and paste
5. Click "Run"

### Step 3: Install Dependencies & Start Server

```bash
cd /Users/sydneyjackson/the-hub

# Install missing dependencies
npm install

# Start backend server
npm run dev
```

**In a new terminal, start frontend:**
```bash
cd /Users/sydneyjackson/the-hub/the-hub
npm run dev
```

---

## ✅ Verify Everything Works

### 1. Backend Health Check

```bash
# Server should show:
✅ Server started on port 3000
✅ Watch scraper scheduler started
📧 Newsletter scheduler started
```

### 2. Test Scraper System

```bash
# Check scheduler status
curl http://localhost:3000/api/scraper-debug/scheduler/status

# Expected: {"success":true,"scheduler":{"isRunning":true,...}}

# Trigger Reddit scraper manually
curl -X POST http://localhost:3000/api/scraper-debug/trigger/reddit

# Expected: {"success":true,"source":"reddit","itemsFound":15,...}
```

**View Dashboard:**
- Open: http://localhost:5173/admin/scraper-debug
- Should see: Scheduler running, recent logs, source statistics

### 3. Test Newsletter System

```bash
# Check scheduler status
curl http://localhost:3000/api/newsletter/scheduler/status

# Expected: {"isRunning":true,"lastRun":null,...}

# Test subscription
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "name": "Test User",
    "source": "quick_start_test"
  }'

# Expected: {"success":true,"message":"Subscription successful! Check your email..."}
```

**Check your email:**
- You should receive confirmation email from newsletter@thehub.com
- Click "Confirm My Subscription"
- You should receive welcome email

**View Dashboard:**
- Open: http://localhost:5173/newsletter/admin
- Should see: Scheduler status, subscriber count, campaigns list

### 4. Test AI Generation

```bash
# Generate newsletter content with AI
curl -X POST http://localhost:3000/api/newsletter/generate

# Expected: {"success":true,"subject_lines":[...],"content_html":"...",...}
```

### 5. Access Admin Dashboards

**Main Admin Settings:**
- URL: http://localhost:5173/admin
- Tabs: Deal Scoring, Performance, Blog, Newsletter, AI Services, Database

**Scraper Debug Dashboard:**
- URL: http://localhost:5173/admin/scraper-debug
- Features: Scheduler status, manual triggers, logs, statistics, errors

**Newsletter Admin Dashboard:**
- URL: http://localhost:5173/newsletter/admin
- Tabs: Monitor, Campaigns, Subscribers, Analytics

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'bcrypt'"

**Cause:** Dependencies not installed
**Fix:**
```bash
npm install bcrypt jsonwebtoken nodemailer express-rate-limit
```

### Error: "Could not find the 'scraper_logs' table"

**Cause:** Scraper migration not run
**Fix:** Run Step 2A above

### Error: "Could not find the 'newsletter_campaigns' table"

**Cause:** Newsletter migration not run
**Fix:** Run Step 2B above

### Error: "Resend API key invalid"

**Cause:** API key expired or incorrect
**Fix:** Verify key at [resend.com/api-keys](https://resend.com/api-keys)

Update `.env`:
```bash
RESEND_API_KEY=your_new_key_here
```

### Reddit Scraper Returns Errors

**Check logs:**
```bash
curl http://localhost:3000/api/scraper-debug/logs?source=reddit&status=error
```

**Common issues:**
- Rate limiting (wait 15 minutes)
- Reddit API changes (check `/r/Watchexchange` still exists)
- Network issues (check internet connection)

### Newsletter Not Sending

**Debug steps:**
1. Check scheduler status: `curl http://localhost:3000/api/newsletter/scheduler/status`
2. Check Resend dashboard: [resend.com/emails](https://resend.com/emails)
3. Check server logs for errors
4. Verify you have active subscribers: `curl http://localhost:3000/api/newsletter/subscribers?confirmed=true`

---

## 📊 Expected Behavior

### Scrapers (Automatic)
- **Reddit:** Every 15 minutes → scrapes /r/Watchexchange
- **eBay:** Every 30 minutes → scrapes watch listings
- **WatchUSeek:** Every hour → scrapes forums (currently has 404 errors - known issue)

**Check logs:**
```bash
curl http://localhost:3000/api/scraper-debug/logs?limit=10
```

### Newsletter (Automatic)
- **Schedule:** Every Friday at 9:00 AM EST
- **Process:**
  1. AI generates content (top 5 deals, market insights)
  2. Creates campaign in database
  3. Sends to all active subscribers
  4. Tracks opens and clicks
  5. Updates analytics

**Manual trigger:**
```bash
curl -X POST http://localhost:3000/api/newsletter/scheduler/run-now
```

### Deal Scoring (Automatic)
- **Schedule:** Every 6 hours
- **Process:**
  1. Fetches all unscored listings
  2. Calculates deal_score (0-10) based on 5 factors
  3. Optionally uses AI for rarity assessment
  4. Updates listings in database

**Manual trigger:**
```bash
curl -X POST http://localhost:3000/api/deal-scoring/run-now
```

---

## 🔧 Configuration Files

### `.env` - Main configuration
```bash
# Key Settings (already configured)
ENABLE_SCRAPER_SCHEDULER=true
ENABLE_NEWSLETTER_SCHEDULER=true
RESEND_API_KEY=re_LwqJPi5k_2sNqph4WLrNd6LX9hpNHQMvY
OPENAI_API_KEY=your_openai_api_key_here

# Schedules (cron format)
SCRAPER_RUN_ON_START=true
NEWSLETTER_SCHEDULE=0 9 * * 5  # Fridays 9am
```

### `package.json` - Dependencies
All required packages are listed. If you see "Cannot find module" errors, run:
```bash
npm install
```

---

## 📱 Access Points

### Frontend (http://localhost:5173)
- `/` - Main dashboard
- `/watches` - Watch listings
- `/cars` - Car listings
- `/sneakers` - Sneaker listings
- `/sports` - Sports scores
- `/blog` - Blog posts
- `/admin` - Admin settings
- `/admin/scraper-debug` - Scraper monitoring
- `/newsletter/admin` - Newsletter management

### Backend (http://localhost:3000)
- `/api/scraper-debug/*` - Scraper API
- `/api/newsletter/*` - Newsletter API
- `/api/deal-scoring/*` - Deal scoring API
- `/api/blog/*` - Blog API
- `/health` - Health check

---

## 🚀 Next Steps

### 1. Populate Database with Listings

Currently you may have few/no listings. Options:

**A. Wait for scrapers (slow):**
- Reddit scraper runs every 15 minutes
- After 1 hour, you should have ~50 listings

**B. Manual trigger (fast):**
```bash
# Trigger all scrapers now
curl -X POST http://localhost:3000/api/scraper-debug/trigger/reddit
curl -X POST http://localhost:3000/api/scraper-debug/trigger/ebay
curl -X POST http://localhost:3000/api/scraper-debug/trigger/watchuseek
```

**C. Import test data (fastest):**
```bash
# TODO: Create seed script if needed
```

### 2. Fix WatchUSeek 404 Errors

**Current status:** WatchUSeek scraper returns 404 errors

**Action needed:**
1. Visit https://www.watchuseek.com/forums/f29/ in browser
2. Check if URL changed or requires authentication
3. Update scraper configuration if needed
4. File: `src/services/scraping/sources/watchuseek/*`

### 3. Add Watches to Watchlist

Scrapers work better with a watchlist. Add items:

```bash
curl -X POST http://localhost:3000/scraper/watchlist \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Rolex",
    "model": "Submariner",
    "keywords": ["116610", "no date", "ceramic"]
  }'
```

### 4. Build Subscriber List

**Add email capture to high-traffic pages:**
- Blog posts (already integrated)
- Homepage
- Category pages (watches, cars, sneakers)

**Promote newsletter:**
- Social media posts
- Forum signatures
- Word of mouth

### 5. Configure Production Settings

**For deployment to production:**

**A. Update URLs in `.env`:**
```bash
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
NEWSLETTER_FROM_EMAIL=newsletter@yourdomain.com
```

**B. Verify custom domain in Resend:**
- Add DNS records (SPF, DKIM, DMARC)
- Improves email deliverability

**C. Add authentication to admin endpoints:**
```javascript
// In src/api/server.js
const { authenticateToken, requireAdmin } = require('./middleware/auth');

app.use('/api/scraper-debug', authenticateToken, requireAdmin, scraperDebugRouter);
app.use('/api/newsletter/subscribers', authenticateToken, requireAdmin, ...);
```

**D. Set production secrets:**
```bash
# Generate new JWT secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Add to production .env
```

---

## 📈 Success Metrics

### Week 1
- [ ] 50+ watch listings in database
- [ ] Scrapers running without errors
- [ ] 10+ newsletter subscribers
- [ ] First test newsletter sent

### Month 1
- [ ] 500+ listings across all categories
- [ ] 100+ newsletter subscribers
- [ ] 4 automated newsletters sent
- [ ] 80%+ email deliverability
- [ ] 20%+ open rate

### Month 3
- [ ] 2,000+ listings
- [ ] 500+ newsletter subscribers
- [ ] Consistent 20%+ open rate
- [ ] 2%+ click rate
- [ ] 1+ premium conversions from newsletter

---

## 📚 Additional Resources

### Documentation Files
- `SCRAPER_IMPLEMENTATION_COMPLETE.md` - Complete scraper system guide
- `NEWSLETTER_SYSTEM_STATUS.md` - Complete newsletter system guide
- `SCRAPER_DIAGNOSTIC_REPORT.md` - Initial diagnostic findings
- `AI_FEATURES_README.md` - AI services documentation

### API Documentation
All endpoints documented in code comments:
- `src/api/scraperDebug.js` - Scraper API
- `src/api/newsletter.js` - Newsletter API
- `src/api/dealScoring.js` - Deal scoring API

### Configuration
- `.env` - All environment variables with comments
- `package.json` - All dependencies

---

## 💡 Pro Tips

### Optimize Scraper Performance
1. Add items to watchlist for targeted scraping
2. Monitor success rates in dashboard
3. Adjust cron schedules if needed
4. Check error logs regularly

### Grow Newsletter List
1. Place email capture on popular blog posts
2. Offer lead magnet (free guide, checklist)
3. Create exclusive content for subscribers
4. Run giveaways (subscribe to enter)

### Improve Email Engagement
1. Send consistently (same day/time each week)
2. Test subject lines with A/B testing
3. Keep content valuable and concise
4. Include clear call-to-action
5. Monitor open/click rates weekly

### Monitor System Health
1. Check dashboards daily
2. Set up alerts for failures
3. Review error logs weekly
4. Keep dependencies updated

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] NPM permissions fixed
- [ ] Both database migrations run
- [ ] Dependencies installed (`npm install`)
- [ ] Backend server running (port 3000)
- [ ] Frontend server running (port 5173)
- [ ] Scraper scheduler shows `isRunning: true`
- [ ] Newsletter scheduler shows `isRunning: true`
- [ ] At least 1 scraper tested successfully
- [ ] Test newsletter subscription works
- [ ] Confirmation email received
- [ ] Admin dashboards accessible
- [ ] No critical errors in server logs

---

## 🎉 You're Ready!

Once all checklist items are complete, your Hub platform is **fully operational**.

**What happens automatically:**
- ⏰ Scrapers run every 15-60 minutes adding new listings
- 📧 Newsletters send every Friday 9am with AI-generated content
- 🤖 Deal scoring runs every 6 hours rating all listings
- 📊 Analytics track everything for monitoring

**You can:**
- 👀 Monitor everything via admin dashboards
- 🎮 Manually trigger any scheduler
- 📝 Create/edit newsletter campaigns
- 👥 Manage subscribers
- 📈 View analytics and performance

**Need help?**
- Check troubleshooting sections in documentation files
- Review server logs: `tail -f logs/server.log` (if logging configured)
- Check Supabase logs in dashboard
- Review API documentation in code comments

---

**Welcome to The Hub! 🚀**
