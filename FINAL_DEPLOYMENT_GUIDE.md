# Final Deployment Guide - The Hub

Complete step-by-step guide to deploy The Hub to production.

---

## Pre-Deployment Checklist

Before deploying, ensure you've completed all prerequisites:

### ✅ Configuration
- [ ] API credentials configured (see `CREDENTIALS_SETUP.md`)
- [ ] Environment files ready (`.env.production`)
- [ ] Database schema applied
- [ ] Admin user created

### ✅ Testing
- [ ] All tests passing (`npm test`)
- [ ] Security audit passed (`node scripts/securityAudit.js`)
- [ ] Performance benchmark acceptable (`node scripts/performanceBenchmark.js`)
- [ ] Manual testing completed (see `TEST_EXECUTION_GUIDE.md`)

### ✅ Content
- [ ] Initial blog posts generated (20 posts recommended)
- [ ] Blog categories configured
- [ ] Hero images uploaded
- [ ] Email subscription form tested

### ✅ Optimization
- [ ] Images optimized
- [ ] Bundle size < 500KB
- [ ] Lighthouse score > 90
- [ ] Caching configured

---

## Deployment Architecture

### Recommended Stack

**Frontend:**
- Hosting: Vercel (or Netlify/Cloudflare Pages)
- Reason: Global CDN, automatic deployments, zero config

**Backend:**
- Hosting: Railway (or Heroku/Render)
- Reason: Easy Node.js deployment, environment variables, logs

**Database:**
- Hosting: Supabase
- Reason: Managed PostgreSQL, RLS, Auth, Storage

**Monitoring:**
- Error Tracking: Sentry
- Uptime: Better Uptime
- Analytics: Google Analytics 4

---

## Step-by-Step Deployment

### Step 1: Prepare Backend for Production

**1.1 Update Environment Variables**

Create `.env.production`:

```bash
# Server
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Features
ENABLE_DEAL_SCORING_SCHEDULER=true
DEAL_SCORING_INTERVAL_MINUTES=60

# Optional: Monitoring
SENTRY_DSN=https://xxxxxxxxxxxxx@sentry.io/xxxxx
```

**1.2 Build Backend**

```bash
# Install production dependencies
npm install --production

# Verify no dev dependencies
npm prune --production

# Test server
NODE_ENV=production node src/api/server.js
```

### Step 2: Deploy Backend to Railway

**2.1 Install Railway CLI**

```bash
# macOS
brew install railway

# npm
npm install -g @railway/cli

# Login
railway login
```

**2.2 Create Railway Project**

```bash
# Initialize
railway init

# Create project (follow prompts)
# Choose "Empty Project"
# Name: the-hub-api
```

**2.3 Configure Environment Variables**

```bash
# Add all variables from .env.production
railway variables set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
railway variables set SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
railway variables set NODE_ENV=production
railway variables set ENABLE_DEAL_SCORING_SCHEDULER=true

# Or import from file
railway variables --file .env.production
```

**2.4 Deploy**

```bash
# Deploy to Railway
railway up

# Assign domain
railway domain
# Choose: the-hub-api.up.railway.app (or custom domain)

# View logs
railway logs

# Get deployment URL
railway status
```

**2.5 Verify Backend**

```bash
# Test health endpoint
curl https://the-hub-api.up.railway.app/health

# Test blog API
curl https://the-hub-api.up.railway.app/api/blog/posts
```

### Step 3: Prepare Frontend for Production

**3.1 Update Environment Variables**

Create `the-hub/.env.production`:

```bash
# API
VITE_API_URL=https://the-hub-api.up.railway.app

# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**3.2 Build Frontend**

```bash
cd the-hub

# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally
npm run preview
```

**3.3 Verify Build**

```bash
# Check bundle size
ls -lh dist/assets/*.js

# Should be < 500KB gzipped
du -sh dist/
```

### Step 4: Deploy Frontend to Vercel

**4.1 Install Vercel CLI**

```bash
npm install -g vercel

# Login
vercel login
```

**4.2 Deploy**

```bash
cd the-hub

# First deployment (follow prompts)
vercel

# Production deployment
vercel --prod

# Custom domain (optional)
vercel domains add yourdomain.com
```

**4.3 Configure Vercel Settings**

In Vercel Dashboard (https://vercel.com):

1. Go to Project Settings
2. **Environment Variables:**
   - Add `VITE_API_URL`
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
   - Add `VITE_GA_MEASUREMENT_ID`

3. **Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Domains:**
   - Add custom domain
   - Configure DNS (see Step 7)

**4.4 Verify Frontend**

```bash
# Visit production URL
open https://your-project.vercel.app

# Or custom domain
open https://yourdomain.com
```

### Step 5: Configure Database (Supabase)

**5.1 Apply Schema**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref xxxxxxxxxxxxx

# Apply schema
supabase db push
```

Or manually via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `database/blog_schema.sql`
3. Click "Run"

**5.2 Verify Tables**

```bash
# List tables
supabase db tables list

# Check RLS policies
supabase db policies list
```

**5.3 Configure Storage**

1. Go to Supabase Dashboard → Storage
2. Create bucket: `blog-images`
3. Set to **Public**
4. Configure CORS if needed

**5.4 Create Admin User**

```sql
-- Run in SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@yourdomain.com',
  crypt('YourSecurePassword123!', gen_salt('bf')),
  NOW()
);

-- Grant admin role
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'admin@yourdomain.com';
```

### Step 6: Generate Initial Content

**6.1 Set Up Credentials**

Ensure `.env.production` has valid OpenAI and Supabase keys.

**6.2 Generate Blog Posts**

```bash
# SSH into backend server (Railway)
railway run bash

# Or run locally with production env
NODE_ENV=production node scripts/generateBlogPosts.js
```

This generates 20 SEO-optimized blog posts.

**6.3 Verify Posts**

```bash
# Check blog index
curl https://yourdomain.com/blog

# Check individual post
curl https://yourdomain.com/blog/best-rolex-watches-under-10000
```

### Step 7: Configure DNS and SSL

**7.1 Add DNS Records**

In your domain registrar (Namecheap, GoDaddy, etc.):

**For Vercel (Frontend):**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For Railway (API):**
```
Type: CNAME
Name: api
Value: the-hub-api.up.railway.app
```

**7.2 Configure SSL**

Both Vercel and Railway handle SSL automatically. Verify:

```bash
# Check SSL certificate
curl -I https://yourdomain.com | grep -i strict-transport

# Should see HSTS header
```

### Step 8: Submit Sitemap to Google

**8.1 Verify Sitemap**

```bash
# Check sitemap generates
curl https://yourdomain.com/sitemap.xml

# Verify valid XML
curl https://yourdomain.com/sitemap.xml | xmllint --format -
```

**8.2 Google Search Console**

1. Go to https://search.google.com/search-console
2. Add property: `https://yourdomain.com`
3. Verify ownership (DNS or HTML file)
4. Submit sitemap: `https://yourdomain.com/sitemap.xml`
5. Request indexing for key pages

**8.3 Bing Webmaster Tools**

1. Go to https://www.bing.com/webmasters
2. Add site: `https://yourdomain.com`
3. Verify ownership
4. Submit sitemap

### Step 9: Configure Monitoring

**9.1 Set Up Sentry (Error Tracking)**

```bash
# Install Sentry SDK
npm install --save @sentry/node @sentry/browser

# Configure backend (src/api/server.js)
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

# Configure frontend (the-hub/src/main.tsx)
import * as Sentry from '@sentry/browser';
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

**9.2 Set Up Better Uptime**

1. Go to https://betteruptime.com
2. Create monitor: `https://yourdomain.com/health`
3. Set check interval: 1 minute
4. Add notification channels (email, Slack)

**9.3 Configure Google Analytics**

```javascript
// the-hub/src/main.tsx
import ReactGA from 'react-ga4';

if (import.meta.env.PROD) {
  ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);
}
```

**9.4 Set Up Cost Alerts**

**OpenAI:**
1. Go to https://platform.openai.com/account/billing
2. Set monthly budget limit ($50-100)
3. Enable email notifications

**Supabase:**
1. Go to Supabase Dashboard → Billing
2. Set up usage alerts
3. Configure auto-upgrade limits

### Step 10: Post-Deployment Verification

**10.1 Functional Testing**

Run through critical user flows:

- [ ] Visit homepage
- [ ] Browse blog index
- [ ] Read blog post
- [ ] Subscribe to newsletter
- [ ] Use natural language search
- [ ] View listing with deal score
- [ ] Access admin dashboard
- [ ] Generate blog post with AI

**10.2 Performance Testing**

```bash
# Run Lighthouse
lighthouse https://yourdomain.com --view

# Run performance benchmark
node scripts/performanceBenchmark.js https://api.yourdomain.com
```

**10.3 Security Testing**

```bash
# Run security audit
node scripts/securityAudit.js

# Check SSL
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Check security headers
https://securityheaders.com/?q=yourdomain.com
```

**10.4 SEO Verification**

```bash
# Test as Googlebot
curl -A "Googlebot" https://yourdomain.com/blog | grep "<title>"

# Verify meta tags
curl https://yourdomain.com/blog/your-post | grep "meta"

# Check structured data
https://search.google.com/test/rich-results?url=https://yourdomain.com/blog/your-post
```

---

## Alternative Deployment Options

### Option 1: Docker Deployment

**Backend Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/api/server.js"]
```

**Deploy:**

```bash
# Build
docker build -t the-hub-api .

# Run
docker run -p 3000:3000 --env-file .env.production the-hub-api

# Deploy to your container platform
```

### Option 2: VPS (DigitalOcean, Linode)

**Setup:**

```bash
# SSH into server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/the-hub.git
cd the-hub

# Install dependencies
npm install --production

# Configure PM2
npm install -g pm2
pm2 start src/api/server.js --name the-hub-api
pm2 save
pm2 startup

# Configure Nginx reverse proxy
apt-get install nginx
# Configure /etc/nginx/sites-available/the-hub
```

---

## Rollback Procedure

If issues occur after deployment:

### Quick Rollback

**Vercel (Frontend):**
```bash
# List deployments
vercel list

# Rollback to previous
vercel rollback
```

**Railway (Backend):**
```bash
# View deployments
railway logs

# Rollback via dashboard
# Railway → Deployments → Select previous → Redeploy
```

### Full Rollback

```bash
# Backend
git revert HEAD
git push origin main
railway up

# Frontend
cd the-hub
git revert HEAD
git push origin main
vercel --prod
```

### Database Rollback

```bash
# Restore from backup
supabase db restore <backup-id>

# Or manually via Supabase Dashboard
```

---

## Monitoring After Launch

### Day 1 - Every Hour

- [ ] Check error logs (Sentry)
- [ ] Monitor uptime (Better Uptime)
- [ ] Verify blog posts accessible
- [ ] Check deal scoring running
- [ ] Monitor API costs (OpenAI dashboard)
- [ ] Review performance metrics

### Week 1 - Daily

- [ ] Review Google Search Console
- [ ] Check sitemap indexing
- [ ] Monitor traffic (Google Analytics)
- [ ] Review slow endpoints (Admin → Performance)
- [ ] Check cache hit rate
- [ ] Verify SSL certificate
- [ ] Test critical user flows

### Month 1 - Weekly

- [ ] SEO performance review
- [ ] Blog performance analysis
- [ ] OpenAI cost review
- [ ] Optimize slow queries
- [ ] Generate more content
- [ ] Build backlinks
- [ ] User feedback review

---

## Success Metrics

### Technical (Immediate)

- ✅ 99.9% uptime
- ✅ <200ms API response time
- ✅ <2s page load time
- ✅ 90+ Lighthouse scores
- ✅ 0% critical errors
- ✅ >60% cache hit rate

### SEO (3 Months)

- ✅ 50+ pages indexed
- ✅ 1000+ organic visitors/month
- ✅ Top 10 for 3+ keywords
- ✅ Featured snippet for 1+ keyword
- ✅ 100+ email subscribers

### Business (6 Months)

- ✅ 5000+ monthly visitors
- ✅ 500+ email subscribers
- ✅ 10+ backlinks from quality sites
- ✅ Consistent organic traffic growth
- ✅ Low bounce rate (<60%)

---

## Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Clear node_modules
rm -rf node_modules
npm install

# Clear build cache
rm -rf the-hub/dist
rm -rf .next
```

**Error: "Environment variable missing"**
```bash
# Verify environment variables
railway variables
vercel env ls

# Add missing variables
railway variables set VAR_NAME=value
vercel env add VAR_NAME
```

### Deployment Fails

**Railway:**
```bash
# View logs
railway logs

# Restart service
railway restart

# Check build logs
railway logs --build
```

**Vercel:**
```bash
# View logs
vercel logs https://your-project.vercel.app

# Redeploy
vercel --prod --force
```

### Database Issues

**Connection errors:**
```bash
# Check Supabase status
https://status.supabase.com/

# Verify credentials
supabase projects list

# Test connection
node -e "const supabase = require('./src/db/supabase'); console.log(supabase.isAvailable());"
```

### SSL/HTTPS Issues

```bash
# Force HTTPS redirect
# Add to server.js
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

---

## Emergency Contacts

**Hosting:**
- Railway Support: https://railway.app/help
- Vercel Support: support@vercel.com

**Database:**
- Supabase Support: support@supabase.com

**API:**
- OpenAI Support: https://help.openai.com

**Domain:**
- Your registrar support link

---

## Next Steps After Launch

1. ✅ Monitor for 24 hours continuously
2. ✅ Generate 10-20 more blog posts
3. ✅ Set up email newsletter automation
4. ✅ Submit to search engines
5. ✅ Build initial backlinks
6. ✅ Set up social media sharing
7. ✅ Create content calendar
8. ✅ Plan feature roadmap

---

## Documentation References

- [Credentials Setup](./CREDENTIALS_SETUP.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Testing Guide](./TEST_EXECUTION_GUIDE.md)
- [Security Audit](./SECURITY_AND_PERFORMANCE_AUDIT.md)
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION_GUIDE.md)

---

**Congratulations! The Hub is now live! 🎉**

Monitor closely for the first 24 hours and enjoy watching your platform grow.

---

**Version:** 1.0.0
**Last Updated:** January 24, 2026
