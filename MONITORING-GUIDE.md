# 📊 The Hub - Monitoring & Observability Guide

How to monitor your production deployment and catch issues early.

---

## 🎯 What to Monitor

### Critical Metrics (Check Daily)
1. **Uptime** - Is the site accessible?
2. **Error Rate** - Any 500 errors?
3. **Response Time** - API responding quickly?
4. **Database Size** - Running out of space?
5. **Stripe Webhooks** - Payments processing?

### Important Metrics (Check Weekly)
1. **User Signups** - Growth rate
2. **Subscription Conversions** - Revenue
3. **API Usage** - Traffic patterns
4. **Database Performance** - Query speeds
5. **Resource Usage** - Railway/Vercel limits

---

## 🚀 Railway Monitoring

### View Deployment Logs

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click your project
3. Click on your service
4. Click **"Deployments"** tab
5. Click latest deployment → **"View Logs"**

**What to look for:**
- ✅ `✅ API Server is running on port 3001`
- ✅ `✅ Logger initialized`
- ✅ No red error messages
- ❌ `Error:` messages
- ❌ `ECONNREFUSED` (database connection failed)
- ❌ Stack traces

### Real-time Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Stream logs in real-time
railway logs
```

### Check Resource Usage

1. Railway Dashboard → Your Service
2. Click **"Metrics"** tab
3. Monitor:
   - **CPU Usage** - Should be <50% normally
   - **Memory** - Should be <400 MB normally
   - **Network** - Traffic patterns

**Alerts:**
- CPU >80% sustained - Consider upgrading plan or optimizing code
- Memory >500 MB - Memory leak or need bigger instance
- Network spikes - Could be attack or viral traffic

### Set Up Alerts (Manual Check for Now)

Railway doesn't have built-in alerts on free tier, but you can:
1. Check logs daily
2. Set calendar reminder to review weekly
3. Use external monitoring (see below)

---

## 🎨 Vercel Monitoring

### Deployment Status

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your project
3. See recent deployments
4. Check status (should be ✅ Ready)

### View Build Logs

1. Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click latest deployment
4. Click **"View Function Logs"** or **"Build Logs"**

**What to look for:**
- ✅ Build completed successfully
- ✅ No TypeScript errors
- ❌ Build failed
- ❌ Linting errors
- ❌ Missing environment variables

### Check Performance

1. Vercel Dashboard → Your Project
2. Click **"Speed Insights"** (if enabled)
3. Monitor:
   - **First Contentful Paint** - Should be <2s
   - **Time to Interactive** - Should be <4s
   - **Core Web Vitals** - Should be green

### Monitor Bandwidth Usage

1. Vercel Dashboard → Your Project
2. Click **"Usage"**
3. Check:
   - **Bandwidth** - Free tier: 100 GB/month
   - **Build Execution** - Time spent building
   - **Serverless Function Execution** - API calls

**Alerts:**
- >80 GB bandwidth - Optimize images or upgrade
- >80% of monthly build minutes - Reduce rebuilds

---

## 🗄️ Supabase Monitoring

### Database Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. View home dashboard metrics

**Key Metrics:**
- **Database Size** - Free tier: 500 MB limit
- **Egress** - Free tier: 2 GB/month
- **API Requests** - Free tier: 500k requests/month

### Check Database Size

```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname,
  pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) AS size
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;
```

**When to act:**
- >400 MB (80%) - Archive or delete old data
- >450 MB (90%) - Urgent cleanup needed or upgrade

### Monitor Query Performance

1. Supabase Dashboard → Database → Query Performance
2. Look for:
   - Slow queries (>1 second)
   - High frequency queries
   - Missing indexes

**Fix slow queries:**
```sql
-- See execution plan
EXPLAIN ANALYZE
SELECT * FROM watch_listings WHERE brand = 'Rolex';

-- Add index if needed
CREATE INDEX idx_watch_listings_brand ON watch_listings(brand);
```

### Check Connection Pool

1. Supabase Dashboard → Database → Connection Pooling
2. Monitor:
   - **Active connections** - Free tier: 60 max
   - **Idle connections**
   - **Wait time**

**Alerts:**
- >50 connections - App might have connection leak
- High wait time - Need connection pooling or upgrade

### Enable Realtime Logs (Optional)

1. Supabase Dashboard → Logs
2. View:
   - API logs
   - Database logs
   - Auth logs
   - Realtime logs

---

## 💳 Stripe Monitoring

### Webhook Status

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click your webhook endpoint
3. Check:
   - **Success rate** - Should be >99%
   - **Recent attempts** - No failed deliveries
   - **Endpoint status** - Should be "Enabled"

**If webhooks failing:**
1. Check Railway logs for errors
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Test endpoint manually: `curl https://your-app.up.railway.app/api/webhooks/stripe`

### Payment Activity

1. Stripe Dashboard → Payments
2. Monitor:
   - Successful payments
   - Failed payments
   - Refunds
   - Disputes

### Subscription Metrics

1. Stripe Dashboard → Billing → Subscriptions
2. Track:
   - Active subscriptions
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - New subscriptions

**Set up Stripe email alerts:**
1. Stripe Dashboard → Settings → Emails
2. Enable alerts for:
   - Failed payments
   - New subscriptions
   - Cancellations
   - Disputes

---

## 🔍 External Monitoring Services

### Uptime Monitoring

**UptimeRobot** (Free)
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - **URL:** `https://your-app.up.railway.app/health`
   - **Type:** HTTP(s)
   - **Interval:** 5 minutes
   - **Alert:** Email when down
3. Add another for frontend:
   - **URL:** `https://your-app.vercel.app`

**Better Uptime** (Free)
- Alternative to UptimeRobot
- [betteruptime.com](https://betteruptime.com)
- Better interface, more features

### Error Tracking

**Sentry** (Recommended)
```bash
# Install Sentry SDK
npm install @sentry/node @sentry/react

# Add to backend (src/index.js):
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://your-dsn@sentry.io/project-id',
  environment: process.env.NODE_ENV
});

# Add to frontend (src/main.tsx):
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://your-dsn@sentry.io/project-id',
  environment: 'production'
});
```

### Performance Monitoring

**LogRocket** (for frontend)
- Records user sessions
- Catches frontend errors
- Free tier: 1,000 sessions/month
- [logrocket.com](https://logrocket.com)

---

## 📈 Custom Health Check Script

Create a simple health monitoring script:

```javascript
// /Users/sydneyjackson/the-hub/scripts/health-check.js
const axios = require('axios');

const BACKEND_URL = process.env.RAILWAY_URL || 'https://your-app.up.railway.app';
const FRONTEND_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';

async function checkHealth() {
  console.log('🔍 Running health checks...\n');

  // Check backend
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    if (response.data.status === 'OK') {
      console.log('✅ Backend: Healthy');
    } else {
      console.log('❌ Backend: Unhealthy', response.data);
    }
  } catch (error) {
    console.log('❌ Backend: DOWN', error.message);
  }

  // Check frontend
  try {
    const response = await axios.get(FRONTEND_URL);
    if (response.status === 200) {
      console.log('✅ Frontend: Healthy');
    } else {
      console.log('❌ Frontend: Unhealthy', response.status);
    }
  } catch (error) {
    console.log('❌ Frontend: DOWN', error.message);
  }

  // Check database connection (through API)
  try {
    const response = await axios.get(`${BACKEND_URL}/api/watches?limit=1`);
    if (response.status === 200) {
      console.log('✅ Database: Connected');
    }
  } catch (error) {
    console.log('❌ Database: Connection failed', error.message);
  }

  console.log('\n✅ Health check complete');
}

checkHealth();
```

**Run manually:**
```bash
node scripts/health-check.js
```

**Run on schedule (cron):**
```bash
# Add to your crontab (runs every 5 minutes)
*/5 * * * * cd /Users/sydneyjackson/the-hub && node scripts/health-check.js >> logs/health-check.log 2>&1
```

---

## 📊 Analytics Dashboard

### Build a Simple Status Page

Create `/Users/sydneyjackson/the-hub/scripts/status-dashboard.js`:

```javascript
const axios = require('axios');

async function getDashboardStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check Railway backend
  try {
    const start = Date.now();
    await axios.get(process.env.RAILWAY_URL + '/health');
    status.services.backend = {
      status: 'operational',
      responseTime: Date.now() - start + 'ms'
    };
  } catch (error) {
    status.services.backend = {
      status: 'down',
      error: error.message
    };
  }

  // Check Vercel frontend
  try {
    const start = Date.now();
    await axios.get(process.env.VERCEL_URL);
    status.services.frontend = {
      status: 'operational',
      responseTime: Date.now() - start + 'ms'
    };
  } catch (error) {
    status.services.frontend = {
      status: 'down',
      error: error.message
    };
  }

  // Check Supabase
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const start = Date.now();
    const { error } = await supabase.from('watches').select('id').limit(1);
    
    if (!error) {
      status.services.database = {
        status: 'operational',
        responseTime: Date.now() - start + 'ms'
      };
    } else {
      status.services.database = {
        status: 'degraded',
        error: error.message
      };
    }
  } catch (error) {
    status.services.database = {
      status: 'down',
      error: error.message
    };
  }

  console.log(JSON.stringify(status, null, 2));
  return status;
}

getDashboardStatus();
```

---

## 🚨 Alert Thresholds

### When to Act

**Immediate Action Required:**
- ❌ Backend health check failing
- ❌ Frontend returning 500 errors
- ❌ Database connection errors
- ❌ Stripe webhook success rate <95%
- ❌ CPU usage >90% for >10 minutes

**Action Within 24 Hours:**
- ⚠️ Response time >3 seconds
- ⚠️ Database size >400 MB (80% of free tier)
- ⚠️ Error rate >1%
- ⚠️ Stripe webhook success rate <99%

**Action Within 1 Week:**
- 📊 Bandwidth usage >80 GB (80% of free tier)
- 📊 Memory usage trending upward
- 📊 Slow queries detected
- 📊 Failed user signups trending up

---

## 📝 Daily Monitoring Checklist

**Every Morning (5 minutes):**
- [ ] Check Railway logs for errors (last 24 hours)
- [ ] Check Vercel deployment status
- [ ] Check Stripe webhook success rate
- [ ] Verify site loads correctly
- [ ] Check for any user-reported issues

**Every Week (15 minutes):**
- [ ] Review Railway metrics (CPU, memory, network)
- [ ] Check Supabase database size
- [ ] Review API usage trends
- [ ] Check Stripe subscription metrics
- [ ] Review error logs for patterns

**Every Month (30 minutes):**
- [ ] Full security audit (`npm audit`)
- [ ] Review and update dependencies
- [ ] Check SSL certificate expiration
- [ ] Review backup status
- [ ] Analyze user growth and churn

---

## 🔧 Troubleshooting Common Issues

### High CPU Usage

**Symptoms:** Railway shows CPU >80%

**Possible causes:**
- Inefficient code (loops, regex, etc.)
- Too many concurrent requests
- Background jobs consuming resources
- Memory leak causing GC pressure

**Debug:**
```bash
# Check which process is using CPU
railway run node --inspect src/index.js

# Use Chrome DevTools to profile
```

### High Memory Usage

**Symptoms:** Railway shows memory >500 MB

**Possible causes:**
- Memory leak
- Large data loaded into memory
- Not releasing database connections
- Image processing

**Debug:**
```bash
# Enable memory profiling
railway run node --inspect --max-old-space-size=512 src/index.js
```

### Slow Response Times

**Symptoms:** API requests taking >2 seconds

**Possible causes:**
- Slow database queries
- Large payload sizes
- External API calls blocking
- No caching

**Debug:**
```javascript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} - ${Date.now() - start}ms`);
  });
  next();
});
```

---

## 📞 Resources

**Monitoring Tools:**
- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Better Uptime](https://betteruptime.com) - Advanced uptime monitoring
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay

**Documentation:**
- [Railway Metrics](https://docs.railway.app/reference/metrics)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/monitoring)

---

**Last Updated:** 2026-02-08
**Review Frequency:** Monthly
