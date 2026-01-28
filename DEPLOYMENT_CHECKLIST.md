# The Hub - Deployment Checklist

Complete pre-launch checklist for production deployment.

---

## Pre-Deployment Checklist

### 1. Environment Configuration

#### Backend Environment Variables

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000` (or your hosting provider's port)
- [ ] `OPENAI_API_KEY` - Valid production key with sufficient credits
- [ ] `SUPABASE_URL` - Production Supabase URL
- [ ] `SUPABASE_KEY` - Production service role key
- [ ] `BASE_URL` - Your production domain (e.g., https://thehub.com)
- [ ] `ENABLE_DEAL_SCORING_SCHEDULER=true`
- [ ] `DEAL_SCORING_INTERVAL_MINUTES=60`

#### Frontend Environment Variables

- [ ] `VITE_API_URL` - Production API URL (e.g., https://api.thehub.com)
- [ ] `VITE_SUPABASE_URL` - Production Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Production anon key

### 2. Database Setup

- [ ] Database schema applied (`database/blog_schema.sql`)
- [ ] Row-level security (RLS) policies enabled
- [ ] Indexes created on all tables
- [ ] Sample data created (optional)
- [ ] Backup strategy configured
- [ ] Connection pooling enabled

### 3. Security

- [ ] API keys not exposed in frontend code
- [ ] `.env` files in `.gitignore`
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled on AI endpoints (60 requests/min)
- [ ] HTTPS/SSL certificate configured
- [ ] Crawler detection working (test with `curl -A "Googlebot"`)
- [ ] Admin routes protected with authentication
- [ ] No console.log statements in production code
- [ ] Error messages don't expose internal details

### 4. Testing

#### Backend API

- [ ] Health check endpoint working: `/health`
- [ ] Blog API endpoints tested:
  - GET /api/blog/posts
  - GET /api/blog/posts/:slug
  - POST /api/blog/posts (requires auth)
  - PUT /api/blog/posts/:id (requires auth)
  - DELETE /api/blog/posts/:id (requires auth)
- [ ] AI generation working: POST /api/blog/ai/generate
- [ ] Deal scoring working: POST /api/listings/score/:id
- [ ] Natural language search working: POST /api/search/watches
- [ ] Sitemap generating: /sitemap.xml
- [ ] RSS feed generating: /rss.xml
- [ ] Robots.txt accessible: /robots.txt

#### Frontend

- [ ] Blog index loads: /blog
- [ ] Blog post displays: /blog/:slug
- [ ] Blog admin requires auth: /blog/admin
- [ ] Blog editor works: /blog/editor/new
- [ ] AI generation modal works
- [ ] Admin settings accessible: /admin
- [ ] Deal scoring monitor functional
- [ ] Performance monitor functional
- [ ] Natural language search works: /watches
- [ ] All images lazy load correctly

### 5. Performance

#### Lighthouse Scores (Target: 90+)

- [ ] Performance: ___/100
- [ ] Accessibility: ___/100
- [ ] Best Practices: ___/100
- [ ] SEO: ___/100

#### Response Times

- [ ] Blog posts list: < 100ms
- [ ] Single blog post: < 50ms
- [ ] AI generation: 10-30s (acceptable)
- [ ] Natural language search: 1-3s
- [ ] Deal scoring (1000 items): < 5 min

#### Optimization

- [ ] Frontend bundle < 500KB gzipped
- [ ] Images lazy loading
- [ ] Code splitting implemented
- [ ] Caching headers set correctly
- [ ] CDN configured (optional)

### 6. SEO

#### Meta Tags

- [ ] Homepage has proper title/description
- [ ] Blog posts have unique titles
- [ ] Blog posts have meta descriptions
- [ ] Open Graph tags present
- [ ] Twitter Cards present
- [ ] Canonical links set

#### Sitemap

- [ ] Sitemap.xml accessible
- [ ] Contains all important pages
- [ ] Contains all blog posts
- [ ] Valid XML format
- [ ] Submitted to Google Search Console

#### Schema Markup

- [ ] Blog posts have Article schema
- [ ] Schema validated with Google tool
- [ ] Publisher information correct
- [ ] Author information correct

#### Robots.txt

- [ ] Robots.txt accessible
- [ ] Allows all crawlers
- [ ] References sitemap
- [ ] Blocks admin/API routes

### 7. Content

#### Initial Blog Posts

- [ ] At least 10 blog posts published
- [ ] All posts have hero images
- [ ] All posts have SEO metadata
- [ ] All posts have proper categories
- [ ] All posts have tags
- [ ] Content is high quality and reviewed

#### Images

- [ ] All images optimized (compressed)
- [ ] All images have alt text
- [ ] Hero images are high resolution
- [ ] Thumbnails generated

### 8. Monitoring & Analytics

#### Monitoring Setup

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring (UptimeRobot, etc.)
- [ ] Performance monitoring enabled
- [ ] Log aggregation configured
- [ ] Alerts set up for:
  - API errors (>5%)
  - High response times (>1s)
  - Deal scoring failures
  - OpenAI API failures

#### Analytics

- [ ] Google Analytics 4 installed
- [ ] Google Search Console configured
- [ ] Conversion tracking set up
- [ ] Email subscriber tracking
- [ ] Blog view tracking working

### 9. Backup & Recovery

- [ ] Database backups automated
- [ ] Backup restoration tested
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Rollback procedure documented

### 10. Cost Management

#### OpenAI API

- [ ] API key has sufficient credits
- [ ] Usage limits set
- [ ] Cost alerts configured
- [ ] Fallback behavior tested (when quota exceeded)

#### Hosting

- [ ] Hosting plan sufficient for traffic
- [ ] Autoscaling configured (if applicable)
- [ ] Cost monitoring enabled

#### Supabase

- [ ] Plan sufficient for database size
- [ ] Connection limits checked
- [ ] Storage limits checked

---

## Deployment Process

### Step 1: Build

```bash
# Run deployment script
./scripts/deploy.sh production

# Or manually:
npm install --production
cd the-hub && npm run build && cd ..
```

### Step 2: Backend Deployment

Choose your hosting provider:

#### Heroku

```bash
git push heroku main
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set SUPABASE_URL=https://...
# ... set all environment variables
```

#### Railway

```bash
railway up
# Configure environment variables in Railway dashboard
```

#### Render

```bash
# Push to GitHub
# Configure service in Render dashboard
# Set environment variables in Render
```

#### Vercel (Serverless Functions)

```bash
vercel --prod
# Configure environment variables in Vercel dashboard
```

### Step 3: Frontend Deployment

Choose your CDN provider:

#### Vercel

```bash
cd the-hub
vercel --prod
```

#### Netlify

```bash
cd the-hub
netlify deploy --prod --dir=dist
```

#### Cloudflare Pages

```bash
cd the-hub
wrangler pages deploy dist
```

### Step 4: Database

```bash
# Apply schema to production database
supabase db push

# Or manually via Supabase dashboard SQL Editor
```

### Step 5: DNS Configuration

- [ ] Point domain to backend API
- [ ] Point domain to frontend CDN
- [ ] Configure SSL/TLS certificate
- [ ] Test HTTPS working
- [ ] Configure www → non-www redirect (or vice versa)

### Step 6: Post-Deployment Verification

```bash
# Test backend
curl https://api.thehub.com/health

# Test frontend
curl -I https://thehub.com

# Test blog
curl https://thehub.com/blog

# Test sitemap
curl https://thehub.com/sitemap.xml

# Test as Googlebot (should get SSR)
curl -A "Googlebot" https://thehub.com/blog
```

### Step 7: SEO Setup

#### Google Search Console

1. Go to https://search.google.com/search-console
2. Add property: `https://thehub.com`
3. Verify ownership (DNS or HTML file)
4. Submit sitemap: `https://thehub.com/sitemap.xml`
5. Request indexing for key pages

#### Google Analytics

1. Create GA4 property
2. Add tracking code to frontend
3. Verify data flowing

### Step 8: Generate Initial Content

```bash
# SSH into backend server or run locally with production env
./scripts/runBlogGeneration.sh

# Or via API
curl -X POST https://api.thehub.com/api/blog/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Best Rolex Watches Under $10k in 2025",
    "category": "watches",
    "targetKeywords": ["rolex", "submariner"],
    "length": "long"
  }'
```

---

## Post-Launch Checklist

### Day 1

- [ ] Monitor error logs (check every hour)
- [ ] Verify deal scoring scheduler running
- [ ] Check OpenAI API usage
- [ ] Monitor response times
- [ ] Verify blog posts accessible
- [ ] Test natural language search
- [ ] Check email subscriptions working

### Week 1

- [ ] Review Google Search Console for crawl errors
- [ ] Check sitemap indexing status
- [ ] Monitor traffic analytics
- [ ] Review slow endpoints (Admin → Performance)
- [ ] Check cache hit rate (should be >60%)
- [ ] Verify SSL certificate valid
- [ ] Test all critical user flows

### Month 1

- [ ] Review SEO performance:
  - Indexed pages
  - Average position
  - Click-through rate
  - Impressions
- [ ] Analyze blog performance:
  - Most viewed posts
  - Average read time
  - Bounce rate
- [ ] Review OpenAI costs:
  - Blog generation usage
  - Search query usage
  - Deal scoring usage
- [ ] Optimize slow queries
- [ ] Generate more content (10-20 posts)
- [ ] Build backlinks

---

## Rollback Procedure

If critical issues occur:

### 1. Identify Issue

- Check error logs
- Review monitoring alerts
- Verify database connectivity

### 2. Quick Fixes

```bash
# Restart services
heroku restart  # or your hosting provider's command

# Clear cache if corrupted
curl -X POST https://api.thehub.com/api/admin/cache/clear

# Disable schedulers temporarily
heroku config:set ENABLE_DEAL_SCORING_SCHEDULER=false
```

### 3. Full Rollback

```bash
# Backend
git revert HEAD
git push heroku main

# Frontend
vercel rollback  # or your CDN's rollback command
```

### 4. Database Rollback

```bash
# Restore from backup
supabase db restore <backup-id>
```

---

## Success Criteria

### Technical

- ✅ 99.9% uptime
- ✅ <200ms average API response time
- ✅ <2s page load time
- ✅ 90+ Lighthouse scores
- ✅ No critical security vulnerabilities
- ✅ Error rate <0.5%

### SEO (3 months)

- ✅ 50+ pages indexed by Google
- ✅ 1000+ organic visitors/month
- ✅ Top 10 for 3+ target keywords
- ✅ Featured snippet for 1+ keyword
- ✅ 100+ email subscribers

### User Experience

- ✅ Fast, responsive interface
- ✅ Natural language search feels intuitive
- ✅ Deal scores help users find value
- ✅ Blog content provides actionable insights
- ✅ Platform seen as authority

---

## Emergency Contacts

**Technical Issues:**
- Hosting support: [link]
- Database support: support@supabase.com
- CDN support: [link]

**API Issues:**
- OpenAI support: https://help.openai.com

**Domain Issues:**
- Domain registrar: [link]

---

## Documentation Links

- [Quick Start Guide](./QUICK_START.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [AI Features Documentation](./AI_FEATURES_README.md)
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

**Version:** 1.0.0
**Last Updated:** January 24, 2025

**Deployment Date:** __________
**Deployed By:** __________
**Production URL:** __________
**API URL:** __________
