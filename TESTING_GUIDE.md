# The Hub - Testing & Deployment Guide

## Overview

This guide covers comprehensive testing and deployment procedures for The Hub platform, including the Blog System and AI Features.

---

## Table of Contents

1. [Local Environment Setup](#local-environment-setup)
2. [Blog Platform Testing](#blog-platform-testing)
3. [AI Features Testing](#ai-features-testing)
4. [SEO Testing](#seo-testing)
5. [Performance Testing](#performance-testing)
6. [Security Audit](#security-audit)
7. [Deployment Checklist](#deployment-checklist)

---

## Local Environment Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Supabase account)
- OpenAI API Key

### Environment Variables

Create `.env` files in both root and `/the-hub`:

```bash
# Root .env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_KEY=...
BASE_URL=http://localhost:5173
ENABLE_DEAL_SCORING_SCHEDULER=true
DEAL_SCORING_INTERVAL_MINUTES=60
```

```bash
# /the-hub/.env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Start Servers

```bash
# Terminal 1: Backend API
npm start

# Terminal 2: Frontend
cd the-hub
npm run dev
```

---

## Blog Platform Testing

### 1. Blog Admin Dashboard

**URL:** `http://localhost:5173/blog/admin`

**Test Cases:**

- [ ] Dashboard loads with stats (Total Posts, Published, Drafts, Total Views)
- [ ] Posts list displays all posts with correct metadata
- [ ] Filter by "All", "Published", "Draft" works
- [ ] Delete post confirmation dialog appears
- [ ] Delete post removes from list
- [ ] Sign out redirects to blog index

**Expected:** All CRUD operations work, stats calculate correctly

---

### 2. Blog Editor

**URL:** `http://localhost:5173/blog/editor/new`

**Test Cases:**

**Basic Editing:**
- [ ] Create new post with title, content, category
- [ ] Auto-generate slug from title
- [ ] Preview mode renders Markdown correctly
- [ ] Syntax highlighting works in preview
- [ ] Save draft keeps status as "draft"
- [ ] Publish changes status to "published"

**AI Generation:**
- [ ] Click "AI Generate" opens modal
- [ ] Select topic, category, keywords
- [ ] Generate button starts generation (10-30s)
- [ ] Generated content populates all fields:
  - Title
  - Slug
  - Excerpt
  - Content (Markdown)
  - Meta title
  - Meta description
  - Keywords
  - Tags
- [ ] Can edit AI-generated content before saving

**SEO Fields:**
- [ ] Meta title defaults to post title
- [ ] Meta description defaults to excerpt
- [ ] Keywords displayed as comma-separated
- [ ] Hero image preview loads
- [ ] Tags saved correctly

**Expected:** Editor fully functional, AI generation works

---

### 3. Blog Post Display

**URL:** `http://localhost:5173/blog/[slug]`

**Test Cases:**

- [ ] Post title, hero image, excerpt display
- [ ] Author name and publish date shown
- [ ] Read time calculated correctly
- [ ] Table of Contents auto-generated from H2/H3
- [ ] TOC links scroll to sections
- [ ] Active TOC item highlights on scroll
- [ ] Markdown content renders with:
  - Headers styled correctly
  - Code blocks with syntax highlighting
  - Links, lists, tables work
  - Images load
- [ ] Related posts appear at bottom
- [ ] Email capture form works
- [ ] Social share buttons present
- [ ] View count increments

**Expected:** Premium blog post experience

---

### 4. Blog Index

**URL:** `http://localhost:5173/blog`

**Test Cases:**

- [ ] Grid/List view toggle works
- [ ] Search filters posts by title/content
- [ ] Category filter shows posts by category
- [ ] Pagination works (if >12 posts)
- [ ] Post cards show:
  - Thumbnail
  - Title
  - Excerpt
  - Category badge
  - AI badge (if AI-generated)
  - Read time
  - View count
  - Date
- [ ] Click card navigates to post

**Expected:** Fast, responsive blog index

---

## AI Features Testing

### 1. AI Blog Generation

**Test via CLI:**

```bash
# Generate 20 blog posts
./scripts/runBlogGeneration.sh
```

**Test Cases:**

- [ ] Script runs without errors
- [ ] All 20 posts generated successfully
- [ ] Posts appear in `/blog/admin`
- [ ] Posts have correct metadata:
  - Category
  - Keywords
  - Tags
  - Read time calculated
- [ ] Content quality is high
- [ ] SEO fields populated
- [ ] `ai_generated` flag set to true

**Expected:** 20 high-quality posts in ~10-15 minutes

**Cost:** ~$2.00 in OpenAI API calls

---

### 2. Deal Scoring System

**URL:** `http://localhost:5173/admin` (Deal Scoring tab)

**Test Cases:**

**Scheduler:**
- [ ] Status shows "Running" or "Stopped"
- [ ] Last run stats display
- [ ] Start/Stop buttons work
- [ ] "Run Now" triggers immediate scoring
- [ ] Stats update after run:
  - Total Runs
  - Total Scored
  - Total Errors
  - Next Run time

**Scoring Accuracy:**
- [ ] Navigate to `/watches`
- [ ] Verify listings have deal scores:
  - 90-100: **HOT DEAL** (red, animated pulse)
  - 75-89: **Good Deal** (yellow)
  - 60-74: **Fair** (green)
- [ ] Hover over badge shows score breakdown:
  - Price vs Market: X / 40
  - Condition: X / 20
  - Seller: X / 15
  - Quality: X / 15
  - Rarity: X / 10
- [ ] Filter by "Best Deals" shows highest scores first

**Expected:** Automated scoring works, badges display

---

### 3. Natural Language Search

**URL:** `http://localhost:5173/watches`

**Test Cases:**

**AI Mode ON:**
- [ ] Search bar shows "AI" badge (purple gradient)
- [ ] Type: "rolex submariner under 10k"
- [ ] Press Enter or click Search
- [ ] AI interpretation box appears:
  - "Searching for: Rolex, Submariner, under $10,000"
  - Filter badges show: brand:Rolex, model:Submariner, price_max:10000
- [ ] Results filtered correctly
- [ ] Clear button removes filters

**More Test Queries:**
- [ ] "omega speedmaster with box and papers"
  - Filters: brand=Omega, model=Speedmaster, boxPapers=yes
- [ ] "seiko excellent condition under 500"
  - Filters: brand=Seiko, condition=excellent, price_max=500
- [ ] "vintage rolex gold 1970"
  - Filters: brand=Rolex, material=gold, year_min=1970

**AI Mode OFF:**
- [ ] "AI" badge grayed out
- [ ] Search uses regular text search

**Fallback:**
- [ ] If OpenAI unavailable, shows "AI unavailable, using keyword search"
- [ ] Still returns relevant results

**Expected:** Natural language queries work accurately

---

## SEO Testing

### 1. Server-Side Rendering (SSR)

**Test as Googlebot:**

```bash
# Test blog index
curl -A "Googlebot" http://localhost:3000/blog

# Test blog post
curl -A "Googlebot" http://localhost:3000/blog/[slug]
```

**Verify HTML Contains:**
- [ ] `<title>` tag with post title
- [ ] `<meta name="description">` with excerpt
- [ ] `<meta property="og:*">` Open Graph tags
- [ ] `<meta name="twitter:*">` Twitter Card tags
- [ ] `<link rel="canonical">` tag
- [ ] `<script type="application/ld+json">` with Article schema

**Test as Regular User:**

```bash
# Should NOT get HTML, should get SPA
curl http://localhost:3000/blog
```

**Expected:** Crawlers get full HTML, users get SPA

---

### 2. Sitemap.xml

**URL:** `http://localhost:3000/sitemap.xml`

**Test Cases:**

- [ ] Sitemap loads as valid XML
- [ ] Contains homepage
- [ ] Contains category pages (/watches, /cars, /sneakers, /sports, /blog)
- [ ] Contains all published blog posts
- [ ] Each entry has:
  - `<loc>` (URL)
  - `<lastmod>` (date)
  - `<changefreq>` (daily/weekly)
  - `<priority>` (0.8-1.0)

**Validate:**

Use [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)

**Expected:** Valid sitemap with all pages

---

### 3. Robots.txt

**URL:** `http://localhost:3000/robots.txt`

**Test Cases:**

- [ ] Allows all user agents
- [ ] References sitemap: `Sitemap: [BASE_URL]/sitemap.xml`
- [ ] Disallows `/api/` and `/admin/`
- [ ] Sets crawl delay

**Expected:** Proper robots.txt configuration

---

### 4. RSS Feed

**URL:** `http://localhost:3000/rss.xml`

**Test Cases:**

- [ ] RSS loads as valid XML
- [ ] Contains recent 50 posts
- [ ] Each item has:
  - Title
  - Link
  - GUID
  - pubDate
  - Description
  - Category
  - Author
- [ ] Filter by category: `?category=watches`

**Validate:**

Use [W3C Feed Validator](https://validator.w3.org/feed/)

**Expected:** Valid RSS 2.0 feed

---

### 5. Schema Markup

**Test Any Blog Post:**

1. Open post in browser
2. View source (Cmd+U / Ctrl+U)
3. Find `<script type="application/ld+json">`
4. Copy JSON

**Validate:**

Use [Google Schema Markup Validator](https://validator.schema.org/)

**Required Fields:**
- [ ] @type: "Article"
- [ ] headline
- [ ] description
- [ ] image
- [ ] datePublished
- [ ] dateModified
- [ ] author
- [ ] publisher
- [ ] mainEntityOfPage

**Expected:** Valid Article schema

---

## Performance Testing

### 1. Frontend Performance

**Tool:** Chrome DevTools Lighthouse

**URL:** `http://localhost:5173/blog`

**Target Scores:**
- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 90+
- [ ] SEO: 95+

**Optimization Checks:**
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.8s

**Expected:** All Core Web Vitals green

---

### 2. API Performance

**Test Endpoints:**

```bash
# Blog posts list (should be <100ms)
time curl http://localhost:3000/api/blog/posts?limit=50

# Single post (should be <50ms)
time curl http://localhost:3000/api/blog/posts/[slug]

# AI generation (10-30s expected)
time curl -X POST http://localhost:3000/api/blog/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test Post","category":"general","length":"short"}'

# Natural language search (1-3s expected)
time curl -X POST http://localhost:3000/api/search/watches \
  -H "Content-Type: application/json" \
  -d '{"query":"rolex submariner under 10k"}'
```

**Expected:** Fast response times, no timeouts

---

### 3. Database Performance

**Check Indexes:**

```sql
-- Verify indexes exist
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'blog_posts';

-- Should include:
-- idx_blog_posts_slug
-- idx_blog_posts_status
-- idx_blog_posts_category
-- idx_blog_posts_published_at
```

**Slow Query Check:**

```sql
-- Enable query logging in Supabase/PostgreSQL
-- Run for 1 hour, check for queries >100ms
```

**Expected:** All queries optimized with proper indexes

---

## Security Audit

### 1. API Security

**Test Cases:**

**SQL Injection:**
- [ ] Try SQL injection in search: `' OR '1'='1`
- [ ] Verify parameterized queries used

**XSS Prevention:**
- [ ] Try injecting `<script>alert('xss')</script>` in:
  - Blog post title
  - Blog post content
  - Comment fields
- [ ] Verify content escaped

**CORS:**
- [ ] Check CORS headers allow only frontend domain
- [ ] Block unauthorized origins

**Rate Limiting:**
- [ ] Test AI generation endpoint (should limit to prevent abuse)
- [ ] Test natural language search (should limit to 60/min)

**Expected:** All injection attempts blocked

---

### 2. Authentication

**Test Cases:**

- [ ] Blog admin requires auth (redirects to /blog if not signed in)
- [ ] Blog editor requires auth
- [ ] Admin settings requires auth
- [ ] API endpoints return 401/403 for unauthorized

**Expected:** Protected routes secure

---

### 3. Environment Variables

**Check:**

- [ ] `.env` file in `.gitignore`
- [ ] No API keys in frontend code
- [ ] No secrets in error messages
- [ ] API keys validated on startup

**Expected:** No secrets exposed

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass
- [ ] Environment variables configured for production
- [ ] Database migrations applied
- [ ] Supabase RLS policies enabled
- [ ] OpenAI API key valid and funded
- [ ] Build succeeds: `cd the-hub && npm run build`

### Production Environment Variables

```bash
# Backend .env (production)
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-prod-...
SUPABASE_URL=https://prod.supabase.co
SUPABASE_KEY=prod-key-...
BASE_URL=https://thehub.com
ENABLE_DEAL_SCORING_SCHEDULER=true
DEAL_SCORING_INTERVAL_MINUTES=60
```

```bash
# Frontend .env.production
VITE_API_URL=https://api.thehub.com
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key-...
```

### Deployment Steps

1. **Backend API:**
   ```bash
   # Deploy to hosting (Heroku, Railway, Render, etc.)
   git push production main

   # Verify
   curl https://api.thehub.com/health
   ```

2. **Frontend SPA:**
   ```bash
   cd the-hub
   npm run build

   # Deploy dist/ to CDN (Vercel, Netlify, Cloudflare Pages)
   vercel deploy --prod

   # Verify
   curl -I https://thehub.com
   ```

3. **Database:**
   - Ensure Supabase production instance configured
   - Run migrations: `npm run migrate:prod`
   - Enable Row Level Security (RLS)

4. **Post-Deployment:**
   - [ ] Test all features in production
   - [ ] Submit sitemap to Google Search Console
   - [ ] Verify SSL certificate
   - [ ] Monitor error logs
   - [ ] Check API response times

### Monitoring

**Recommended Tools:**
- **Uptime:** Uptime Robot (free)
- **Errors:** Sentry
- **Analytics:** Google Analytics 4
- **Performance:** New Relic or Datadog
- **SEO:** Google Search Console

**Weekly Checks:**
- [ ] API uptime > 99.9%
- [ ] Average response time < 200ms
- [ ] Error rate < 0.1%
- [ ] Deal scoring running hourly
- [ ] Blog posts indexed by Google

---

## Cost Estimates

### Monthly Operating Costs

| Service | Usage | Cost |
|---------|-------|------|
| **OpenAI API** | 20 blog posts + 1000 searches | ~$17 |
| **Supabase** | Free tier (500MB, 2GB transfer) | $0 |
| **Hosting** | Backend + Frontend | $5-25 |
| **Domain** | thehub.com | $12/year |
| **Total** | | **~$22-42/month** |

### Scaling Considerations

- **10,000 searches/day:** ~$150/month OpenAI
- **100 blog posts/month:** ~$10/month OpenAI
- **100,000 listings scored:** ~$100/month OpenAI (if using AI rarity)

**Optimization:**
- Cache common queries
- Use GPT-3.5 for simple tasks
- Make AI rarity scoring optional

---

## Support

For issues or questions:
- **Documentation:** `/docs`
- **Issues:** GitHub Issues
- **Email:** support@thehub.com

---

## Success Metrics

### SEO Goals (3 months)

- [ ] 50+ blog posts indexed
- [ ] 1000+ organic visitors/month
- [ ] Top 10 for "rolex price tracker"
- [ ] Featured snippets for 5+ keywords

### User Engagement

- [ ] 100+ email subscribers
- [ ] 5+ minutes average session
- [ ] 30%+ return visitor rate

### Platform Performance

- [ ] 99.9% uptime
- [ ] <200ms API response time
- [ ] 90+ Lighthouse score
- [ ] 10,000+ listings scored

---

**Last Updated:** 2025-01-24
**Version:** 1.0.0
