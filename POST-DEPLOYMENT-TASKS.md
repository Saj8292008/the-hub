# 📝 The Hub - Post-Deployment Tasks

Important tasks to complete after your initial deployment.

---

## ⚠️ Immediate (Before Launch)

### 1. Fix Security Vulnerabilities
**Current Status:** 12 vulnerabilities detected (9 moderate, 1 high, 2 critical)

```bash
# Check what's vulnerable
npm audit

# Fix automatically (safe fixes only)
npm audit fix

# If that doesn't fix everything, try:
npm audit fix --force
# ⚠️ Warning: May cause breaking changes, test after!

# Update package-lock.json and commit
git add package-lock.json
git commit -m "Fix security vulnerabilities"
git push
```

**Railway will auto-redeploy with updates.**

### 2. Test Backend Startup Locally
```bash
cd /Users/sydneyjackson/the-hub

# Ensure all dependencies installed
npm install

# Test startup (will use your .env file)
npm start

# Expected output:
# 🚀 Starting The Hub...
# ✅ API Server is running on port 3001
# ✅ Logger initialized

# Press Ctrl+C to stop
```

If errors occur, fix before deploying to Railway.

### 3. Switch Stripe to Live Mode (When Ready)

**⚠️ Only do this when you're ready to accept real payments!**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch from "Test mode" to "Live mode" (toggle in top right)
3. Get your LIVE API keys:
   - Live Secret Key: `sk_live_...`
   - Live Publishable Key: `pk_live_...`
   - Create new webhook for live mode

4. Update Railway environment variables:
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_live_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
   STRIPE_WEBHOOK_SECRET=whsec_your_new_webhook_secret
   ```

5. Update Vercel environment variables:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
   ```

6. Update Stripe price IDs (products created in live mode):
   ```bash
   STRIPE_PRICE_ID_PRO_MONTHLY=price_live_...
   STRIPE_PRICE_ID_PRO_YEARLY=price_live_...
   STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_live_...
   STRIPE_PRICE_ID_PREMIUM_YEARLY=price_live_...
   ```

7. Test with a real $0.50 payment (minimum Stripe amount)

---

## 🔧 Within 24 Hours

### 4. Set Up Uptime Monitoring

**Option A: UptimeRobot (Free)**
1. Go to [uptimerobot.com](https://uptimerobot.com) and sign up
2. Add monitor:
   - Name: "The Hub Backend"
   - URL: `https://your-app.up.railway.app/health`
   - Type: HTTP(s)
   - Interval: 5 minutes
3. Add email alerts
4. Add another monitor for frontend:
   - Name: "The Hub Frontend"
   - URL: `https://your-app.vercel.app`

**Option B: Better Uptime**
- Sign up at [betteruptime.com](https://betteruptime.com)
- Similar setup, nicer interface
- Free tier: 10 monitors

### 5. Set Up Error Tracking (Optional but Recommended)

**Sentry Setup:**
```bash
# Install Sentry
npm install @sentry/node @sentry/react

# Get your DSN from sentry.io (after signing up)
# Add to Railway:
SENTRY_DSN=https://xxx@sentry.io/xxx

# Add to backend (src/index.js):
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

# Add to frontend (src/main.tsx):
import * as Sentry from '@sentry/react';
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });

# Commit and push
```

### 6. Create First Admin User

1. Sign up through your app's UI
2. Get your user ID from Supabase:
   ```sql
   SELECT id, email FROM users WHERE email = 'your@email.com';
   ```
3. Set as admin (if you have admin features):
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'your@email.com';
   ```

### 7. Test All Core Features

- [ ] User signup
- [ ] User login
- [ ] Browse watch listings
- [ ] Browse car listings
- [ ] Browse sneaker listings
- [ ] View sports scores (if enabled)
- [ ] Read blog posts (if applicable)
- [ ] Upgrade to premium (test mode)
- [ ] Check premium features unlock
- [ ] Test mobile view (responsiveness)

---

## 📈 Within One Week

### 8. Enable Production Features Gradually

Don't enable everything at once. Test each feature:

```bash
# Week 1: Just core features
ENABLE_SCRAPER_SCHEDULER=false
ENABLE_SPORTS_SCHEDULER=false

# Week 2: Enable sports if you want live scores
ENABLE_SPORTS_SCHEDULER=true

# Week 3: Enable scrapers if you want auto-updates
ENABLE_SCRAPER_SCHEDULER=true

# Later: Enable other features as needed
ENABLE_DEAL_ALERTS=true
ENABLE_NEWSLETTER_SCHEDULER=true
```

**Why gradual?** Each feature uses resources (CPU, memory, API calls). Enable one at a time so you can:
- Monitor resource usage
- Catch errors early
- Stay within free tier limits

### 9. Set Up Analytics (Optional)

**Vercel Analytics:**
1. Go to Vercel → Your Project → Settings → Analytics
2. Enable "Vercel Analytics"
3. Free tier: 100k events/month
4. See page views, performance, user behavior

**Google Analytics (Alternative):**
```bash
# Add to frontend:
npm install react-ga4

# In src/main.tsx:
import ReactGA from 'react-ga4';
ReactGA.initialize('G-XXXXXXXXXX');

# Track page views on route change
```

### 10. Optimize Database

**Add Indexes for Common Queries:**
```sql
-- If you notice slow queries, add indexes:
CREATE INDEX IF NOT EXISTS idx_watch_listings_brand_price 
ON watch_listings(brand, price);

CREATE INDEX IF NOT EXISTS idx_car_listings_make_year 
ON car_listings(make, year);

CREATE INDEX IF NOT EXISTS idx_sneaker_listings_brand_size 
ON sneaker_listings(brand, size);

-- Verify indexes exist:
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 11. Set Up Database Backups (Optional)

Supabase automatically backs up daily, but you can:

1. **Manual Backup:**
   - Supabase Dashboard → Database → Backups
   - Click "Create backup"
   - Download and store securely

2. **Automated Backup Script:**
   ```bash
   #!/bin/bash
   # scripts/backup-database.sh
   
   DATE=$(date +%Y-%m-%d)
   pg_dump $DATABASE_URL > backups/backup-$DATE.sql
   
   # Compress
   gzip backups/backup-$DATE.sql
   
   # Optional: Upload to S3 or similar
   ```

3. **Schedule with cron:**
   ```bash
   # Run weekly backups
   0 2 * * 0 /path/to/backup-database.sh
   ```

---

## 🎨 Within One Month

### 12. Custom Domain Setup (Optional)

**For Frontend (Vercel):**
1. Buy domain (e.g., from Namecheap, Google Domains)
2. Go to Vercel → Settings → Domains
3. Add your domain: `thehub.com`
4. Follow DNS instructions (add A record or CNAME)
5. Wait 24-48 hours for DNS propagation
6. SSL certificate auto-issued

**For Backend (Railway):**
1. Go to Railway → Settings → Domains
2. Add your API subdomain: `api.thehub.com`
3. Configure DNS with provided values
4. Update Vercel's `VITE_API_URL` to: `https://api.thehub.com`
5. Update Railway's `FRONTEND_URL` to: `https://thehub.com`

### 13. Set Up Email Service (For Newsletters)

**Resend Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. Add to Railway:
   ```bash
   RESEND_API_KEY=re_your_key_here
   FROM_EMAIL=noreply@yourdomain.com
   NEWSLETTER_FROM_EMAIL=newsletter@yourdomain.com
   NEWSLETTER_FROM_NAME=The Hub
   ```
4. Verify your domain in Resend dashboard
5. Test send an email

### 14. Configure Social Media Auto-Posting (Optional)

**Instagram:**
1. Create Facebook Business Account
2. Link Instagram Business Account
3. Get access token from [developers.facebook.com](https://developers.facebook.com)
4. Add to Railway:
   ```bash
   INSTAGRAM_ACCESS_TOKEN=your_token
   INSTAGRAM_ACCOUNT_ID=your_account_id
   ENABLE_INSTAGRAM_POSTER=true
   ```

**Twitter:**
1. Apply for Twitter Developer Account
2. Create app and get API keys
3. Add to Railway:
   ```bash
   TWITTER_API_KEY=your_key
   TWITTER_API_SECRET=your_secret
   TWITTER_ACCESS_TOKEN=your_token
   TWITTER_ACCESS_SECRET=your_secret
   ```

**Telegram Channel:**
Already configured if you have `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_ID`

### 15. Optimize Performance

**Frontend Optimizations:**
```bash
# Analyze bundle size
cd the-hub/the-hub
npm run build

# Check bundle size (should be <500KB per chunk)
# If too large, implement code splitting

# Add to vite.config.ts:
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui-vendor': ['lucide-react', 'react-hot-toast'],
        'charts': ['chart.js', 'react-chartjs-2']
      }
    }
  }
}
```

**Backend Optimizations:**
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Cache static data
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Use in routes:
app.get('/api/watches', (req, res) => {
  const cached = cache.get('watches');
  if (cached) return res.json(cached);
  
  // ... fetch from database
  cache.set('watches', data);
  res.json(data);
});
```

---

## 🔐 Ongoing Maintenance

### Monthly Tasks
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Update dependencies: `npm update`
- [ ] Review Railway logs for errors
- [ ] Check database size (Supabase dashboard)
- [ ] Review Stripe subscriptions
- [ ] Check uptime monitor reports
- [ ] Review security checklist

### Quarterly Tasks
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] User feedback analysis
- [ ] Feature usage analytics
- [ ] Cost optimization review
- [ ] Backup testing (restore from backup)

### Yearly Tasks
- [ ] Major dependency updates
- [ ] SSL certificate renewal (automatic, but verify)
- [ ] Full system audit
- [ ] Disaster recovery test
- [ ] Review and update documentation

---

## 📊 Key Metrics to Track

### Health Metrics
- **Uptime:** >99.9% (UptimeRobot)
- **Response Time:** <2 seconds (Vercel Analytics)
- **Error Rate:** <0.1% (Sentry)
- **Database Size:** <400 MB (Supabase)

### Business Metrics
- **User Signups:** Track weekly
- **Subscription Rate:** % of users who upgrade
- **Churn Rate:** % of users who cancel
- **MRR (Monthly Recurring Revenue):** From Stripe

### Technical Metrics
- **API Calls:** Stay under Supabase limit (500k/month)
- **Bandwidth:** Stay under Vercel limit (100GB/month)
- **Build Time:** Aim for <3 minutes (Vercel)
- **Database Query Time:** <100ms average

---

## 🎯 Success Milestones

### Week 1
- [ ] 10 user signups
- [ ] No critical errors
- [ ] 99% uptime
- [ ] All core features working

### Month 1
- [ ] 100 user signups
- [ ] 5 premium subscribers
- [ ] <$20/month hosting costs
- [ ] Database optimized

### Month 3
- [ ] 500 user signups
- [ ] 25 premium subscribers
- [ ] Positive user feedback
- [ ] All optional features working

### Month 6
- [ ] 1,000+ users
- [ ] $500+ MRR (Monthly Recurring Revenue)
- [ ] Break-even on costs
- [ ] Consider scaling infrastructure

---

## 🆘 If Things Go Wrong

### High Resource Usage
- Disable non-critical features
- Add caching
- Optimize database queries
- Consider upgrading Railway plan

### Database Full
- Archive old data
- Delete unused listings
- Run `VACUUM FULL` to reclaim space
- Consider Supabase Pro plan

### Too Many Errors
- Check Sentry dashboard
- Review Railway logs
- Test locally to reproduce
- Roll back to previous deployment if needed

### Stripe Issues
- Check webhook delivery in Stripe dashboard
- Verify webhook secret is correct
- Review Railway logs for webhook errors
- Test with Stripe CLI

---

## ✅ Final Checklist

Before considering deployment "complete":

- [ ] All documentation read
- [ ] Security vulnerabilities fixed
- [ ] Uptime monitoring set up
- [ ] Error tracking enabled
- [ ] Backups configured
- [ ] All core features tested
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
- [ ] Analytics set up
- [ ] Stripe tested (test mode)
- [ ] Custom domain configured (optional)
- [ ] Social media connected (optional)
- [ ] Email service configured (optional)
- [ ] Team has access to all dashboards
- [ ] Emergency contacts documented

---

**Created:** 2026-02-08  
**Last Updated:** 2026-02-08  
**Next Review:** 2026-03-08
