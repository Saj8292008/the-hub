# The Hub - AI Features Documentation

## Overview

The Hub now includes two powerful AI-driven systems:

1. **SEO-Optimized Blog Platform with AI Content Generation**
2. **AI-Powered Deal Scoring & Natural Language Search**

Both systems leverage OpenAI GPT-4 and integrate seamlessly with your existing React + Express architecture.

---

## Table of Contents

1. [Blog Platform](#blog-platform)
2. [AI Content Generation](#ai-content-generation)
3. [Deal Scoring System](#deal-scoring-system)
4. [Natural Language Search](#natural-language-search)
5. [SEO Features](#seo-features)
6. [API Documentation](#api-documentation)
7. [Usage Examples](#usage-examples)

---

## Blog Platform

### Features

✅ **Custom Admin Interface** - No vendor lock-in, full control
✅ **Markdown Content** - Portable, developer-friendly
✅ **Rich Text Editor** - Live preview, syntax highlighting
✅ **SEO Optimization** - Meta tags, Open Graph, Schema.org
✅ **Email Subscriptions** - Newsletter system built-in
✅ **Categories & Tags** - Organized content structure
✅ **Analytics** - View counts, read time tracking
✅ **Related Posts** - Auto-suggested based on category/tags

### Pages

| Page | URL | Description |
|------|-----|-------------|
| Blog Index | `/blog` | Grid/list view, filters, search |
| Blog Post | `/blog/:slug` | Individual post with TOC, related posts |
| Blog Admin | `/blog/admin` | Manage posts, view stats |
| Blog Editor | `/blog/editor/:id` | Create/edit posts, AI generation |

### Creating a Blog Post

**Manual Creation:**

1. Navigate to `/blog/admin`
2. Click "New Post"
3. Fill in:
   - Title (auto-generates slug)
   - Category (watches, cars, sneakers, sports, general)
   - Content (Markdown)
   - Excerpt
   - Hero image URL
   - SEO fields (meta title, description, keywords)
   - Tags
4. Click "Save Draft" or "Publish"

**With AI Generation:**

1. Navigate to `/blog/editor/new`
2. Click "AI Generate" button
3. In modal, enter:
   - **Topic:** "Best Rolex Watches Under $10,000 in 2025"
   - **Category:** Watches
   - **Keywords:** rolex, submariner, investment
   - **Tone:** Authoritative
   - **Length:** Long (1800-2500 words)
   - **Include Market Data:** ✓ (fetches real data from your database)
4. Click "Generate Post" (takes 10-30 seconds)
5. Review AI-generated content
6. Edit as needed
7. Click "Publish"

---

## AI Content Generation

### How It Works

The AI blog generator:

1. **Fetches Market Data** - Gets recent listings, prices, brands from your database
2. **Builds Context-Rich Prompt** - Includes data insights, target keywords
3. **Calls GPT-4 with Function Calling** - Structured output guaranteed
4. **Returns Complete Post:**
   - Title (50-70 chars, includes year if relevant)
   - Slug (URL-friendly)
   - Excerpt (120-150 chars)
   - Content (Markdown with H2/H3 headings)
   - Meta title (50-60 chars)
   - Meta description (150-160 chars)
   - Keywords (5-10 SEO keywords)
   - Tags (3-5 relevant tags)
   - Suggested internal links

### Bulk Generation Script

Generate 20 SEO-optimized posts at once:

```bash
./scripts/runBlogGeneration.sh
```

**Topics included:**
- 6 watch posts (Rolex, Omega, buying guides)
- 4 car posts (Porsche, Ferrari, investment guides)
- 4 sneaker posts (Air Jordan, Nike Dunk, investing)
- 2 sports posts (memorabilia, trading cards)
- 4 general posts (platform guides, market trends)

**Time:** ~10-15 minutes
**Cost:** ~$2.00 in OpenAI API calls
**Output:** 20 fully-formatted, SEO-optimized posts

### Generated Content Quality

- ✅ **Unique insights** using real market data
- ✅ **SEO-optimized** with target keywords (1-2% density)
- ✅ **Well-structured** with clear headings
- ✅ **Data-driven** with specific examples and numbers
- ✅ **Internal links** to category pages
- ✅ **Actionable advice** for readers
- ✅ **Professional tone** matching luxury brand voice

---

## Deal Scoring System

### How It Works

Every listing (watch, car, sneaker) receives a **Deal Score (0-100)** based on 5 weighted factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Price vs Market** | 40% | Compares to historical average |
| **Condition** | 20% | New, Excellent, Good, Fair, Poor |
| **Seller Reputation** | 15% | Verified dealer, Reddit karma, Unknown |
| **Listing Quality** | 15% | Images, description detail |
| **Rarity/Demand** | 10% | Popular models, limited editions |

### Score Interpretation

| Score | Badge | Display |
|-------|-------|---------|
| 90-100 | 🔥 **HOT DEAL** | Red, animated pulse |
| 75-89 | 💰 **Good Deal** | Yellow |
| 60-74 | ✅ **Fair** | Green |
| <60 | - | No badge |

### Automated Scoring

**Scheduler runs automatically every hour:**

1. Fetches all listings (watches, cars, sneakers)
2. Scores each listing using the algorithm
3. Updates database with `deal_score` and `score_breakdown`
4. Logs progress and errors
5. Emits real-time updates via WebSocket

**Control the Scheduler:**

Admin Settings → Deal Scoring tab

- **Status:** View scheduler state, last run, next run
- **Start/Stop:** Control scheduler
- **Run Now:** Trigger immediate scoring
- **Stats:** Total runs, total scored, error count

**API Endpoints:**

```bash
# Get scheduler status
GET /api/deal-scoring/scheduler/status

# Start scheduler
POST /api/deal-scoring/scheduler/start
Body: { "intervalMinutes": 60 }

# Stop scheduler
POST /api/deal-scoring/scheduler/stop

# Force run now
POST /api/deal-scoring/scheduler/run-now
```

### Manual Scoring

Score a specific listing:

```bash
POST /api/listings/score/:id
```

Score all listings at once:

```bash
POST /api/listings/score-all
```

### Viewing Deal Scores

**On Listing Cards:**

Navigate to `/watches`, `/cars`, or `/sneakers`. Listings with scores ≥60 show badges in the top-right corner.

**Score Breakdown Tooltip:**

Hover over any badge to see:
- Price vs Market: 35 / 40
- Condition: 18 / 20
- Seller: 12 / 15
- Quality: 14 / 15
- Rarity: 8 / 10
- **Total: 87 / 100**

**Filter by Deals:**

Use the sort dropdown → "Best Deals" to show highest-scored items first.

---

## Natural Language Search

### How It Works

Users can search using natural language instead of filters:

**Traditional Search:**
- Brand: Rolex
- Model: Submariner
- Max Price: $10,000

**Natural Language:**
- "rolex submariner under 10k"

The system:
1. **Parses query** using GPT-4
2. **Extracts structured filters:**
   - brand: "Rolex"
   - model: "Submariner"
   - price_max: 10000
3. **Queries database** with filters
4. **Returns results** + interpreted filters

### Supported Queries

**Watches:**
- "rolex submariner under 10k"
- "omega speedmaster with box and papers"
- "seiko excellent condition under 500"
- "vintage rolex gold 1970"
- "automatic watches 40mm steel"

**Sneakers:**
- "jordan 1 size 11 good condition"
- "yeezy 350 new under 300"
- "nike dunk low panda"

**Cars:**
- "porsche 911 turbo less than 100k miles"
- "ferrari f430 manual transmission"
- "bmw m3 2015 or newer"

### Using Natural Language Search

**Frontend (Watches page):**

1. Navigate to `/watches`
2. Ensure "AI" button is purple (active)
3. Type natural query in search bar
4. Press Enter or click "Search"
5. See interpreted filters box:
   - "Searching for: Rolex, Submariner, under $10,000"
   - Filter badges show: `brand:Rolex`, `model:Submariner`, `price_max:10000`
6. Results filtered automatically

**Toggle AI Mode:**

Click the "AI" button to switch between:
- **AI Mode ON:** Natural language parsing
- **AI Mode OFF:** Regular keyword search

**Fallback:**

If OpenAI is unavailable, the system falls back to simple keyword extraction using regex patterns.

### API Usage

```bash
# Search watches
POST /api/search/watches
Body: {
  "query": "rolex submariner under 10k",
  "options": { "limit": 50 }
}

# Response
{
  "success": true,
  "query": "rolex submariner under 10k",
  "interpreted_filters": {
    "brand": "Rolex",
    "model": "Submariner",
    "price_max": 10000
  },
  "results": [...],
  "count": 42,
  "message": "Searching for: Rolex, Submariner, under $10,000"
}
```

---

## SEO Features

### Server-Side Rendering (SSR)

**How It Works:**

1. Express detects search engine crawlers via User-Agent
2. For crawlers, renders full HTML with:
   - Complete meta tags
   - Open Graph tags
   - Twitter Cards
   - Schema.org JSON-LD
   - Canonical links
3. For regular users, serves React SPA

**Detected Crawlers:**
- Googlebot
- Bingbot
- Facebookbot
- Twitterbot
- LinkedInBot
- And 20+ more

**Test SSR:**

```bash
# As Googlebot (gets HTML)
curl -A "Googlebot" http://localhost:3000/blog

# As regular user (gets SPA)
curl http://localhost:3000/blog
```

### Sitemap.xml

**URL:** `/sitemap.xml`

**Includes:**
- Homepage
- Category pages (/watches, /cars, /sneakers, /sports, /blog)
- All published blog posts

**Auto-updates** when new posts are published.

**Submit to Google:**

1. Visit [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://thehub.com`
3. Submit sitemap: `https://thehub.com/sitemap.xml`

### RSS Feed

**URL:** `/rss.xml`

**Features:**
- Recent 50 posts
- Category filtering: `/rss.xml?category=watches`
- Includes post images, tags, metadata
- Valid RSS 2.0 format

**JSON Feed Alternative:** `/feed.json`

### Robots.txt

**URL:** `/robots.txt`

**Configuration:**
- Allows all crawlers
- References sitemap
- Blocks `/api/` and `/admin/`
- Sets crawl delay: 1 second

### Schema Markup

Every blog post includes **Article schema** (JSON-LD):

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Post Title",
  "description": "Post excerpt",
  "image": "https://...",
  "datePublished": "2025-01-24T...",
  "dateModified": "2025-01-24T...",
  "author": {
    "@type": "Person",
    "name": "The Hub Team"
  },
  "publisher": {
    "@type": "Organization",
    "name": "The Hub"
  }
}
```

**Benefits:**
- Rich snippets in Google
- Better SEO ranking
- Featured snippets eligibility

---

## API Documentation

### Blog API Endpoints

```bash
# Get all posts
GET /api/blog/posts
Query: ?category=watches&status=published&limit=50&page=1&search=rolex

# Get single post by slug
GET /api/blog/posts/:slug

# Get single post by ID
GET /api/blog/posts/id/:id

# Create post (admin)
POST /api/blog/posts
Body: { title, slug, content, category, ... }

# Update post (admin)
PUT /api/blog/posts/:id
Body: { title, content, ... }

# Delete post (admin)
DELETE /api/blog/posts/:id

# Get categories
GET /api/blog/categories

# Track post view
POST /api/blog/posts/:id/view

# Get post analytics
GET /api/blog/analytics/:id

# Subscribe to newsletter
POST /api/blog/subscribe
Body: { email, name, source }

# Get subscribers (admin)
GET /api/blog/subscribers
```

### AI Generation API Endpoints

```bash
# Generate single post
POST /api/blog/ai/generate
Body: {
  "topic": "Best Rolex Watches Under $10k in 2025",
  "category": "watches",
  "targetKeywords": ["rolex", "submariner"],
  "includeData": true,
  "tone": "authoritative",
  "length": "long"
}

# Generate multiple posts (max 10)
POST /api/blog/ai/generate-batch
Body: {
  "topics": ["Topic 1", "Topic 2", ...],
  "category": "watches",
  ...
}

# Suggest titles
POST /api/blog/ai/suggest-titles
Body: {
  "topic": "watch investing",
  "category": "watches",
  "count": 5
}

# Enhance content
POST /api/blog/ai/enhance
Body: {
  "content": "Original content...",
  "enhancement": "seo" | "expand" | "simplify" | "professional"
}

# Get AI stats
GET /api/blog/ai/stats
```

### Deal Scoring API Endpoints

```bash
# Score single listing
POST /api/listings/score/:id

# Score all listings
POST /api/listings/score-all

# Get hot deals (score ≥90)
GET /api/listings/hot-deals
Query: ?category=watches&limit=10

# Get score stats
GET /api/listings/score-stats

# Toggle AI rarity scoring
POST /api/listings/ai-rarity
Body: { "enabled": true }

# Scheduler control
GET /api/deal-scoring/scheduler/status
POST /api/deal-scoring/scheduler/start
POST /api/deal-scoring/scheduler/stop
POST /api/deal-scoring/scheduler/run-now
```

### Natural Language Search API

```bash
# Search watches
POST /api/search/watches
Body: { "query": "rolex submariner under 10k" }

# Search sneakers
POST /api/search/sneakers
Body: { "query": "jordan 1 size 11 good condition" }

# Search cars
POST /api/search/cars
Body: { "query": "porsche 911 turbo less than 100k miles" }
```

---

## Usage Examples

### Example 1: Generate Blog Post via API

```javascript
const response = await fetch('http://localhost:3000/api/blog/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Top 10 Watch Investments Under $5,000 for Beginners',
    category: 'watches',
    targetKeywords: ['watch investment', 'affordable luxury watches', 'beginner collecting'],
    includeData: true,
    tone: 'friendly',
    length: 'medium'
  })
});

const { success, post } = await response.json();

console.log(post.title);    // "Top 10 Watch Investments Under $5,000 for Beginners"
console.log(post.slug);     // "top-10-watch-investments-under-5000-for-beginners"
console.log(post.content);  // Full Markdown content (1200-1800 words)
console.log(post.keywords); // ["watch investment", "affordable luxury", ...]
```

### Example 2: Natural Language Search

```javascript
const response = await fetch('http://localhost:3000/api/search/watches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'rolex submariner under 10k with box and papers'
  })
});

const data = await response.json();

console.log(data.interpreted_filters);
// {
//   brand: "Rolex",
//   model: "Submariner",
//   price_max: 10000,
//   box_and_papers: true
// }

console.log(data.message);
// "Searching for: Rolex, Submariner, under $10,000, with box and papers"

console.log(data.results.length); // 42 matching listings
```

### Example 3: Get Deal Scores

```javascript
const response = await fetch('http://localhost:3000/api/listings/hot-deals?category=watches&limit=10');
const deals = await response.json();

deals.forEach(listing => {
  console.log(`${listing.brand} ${listing.model}`);
  console.log(`Score: ${listing.deal_score}/100`);
  console.log(`Breakdown:`, listing.score_breakdown);
  console.log('---');
});

// Output:
// Rolex Submariner
// Score: 94/100
// Breakdown: { price: 38, condition: 20, seller: 15, quality: 15, rarity: 6 }
// ---
```

---

## Cost Optimization

### OpenAI API Costs

| Operation | Model | Cost per Call | Usage |
|-----------|-------|---------------|-------|
| Blog generation | GPT-4 Turbo | ~$0.10 | 20 posts = $2.00 |
| Natural language search | GPT-4 Turbo | ~$0.005 | 1000 searches = $5.00 |
| Rarity scoring (optional) | GPT-3.5 Turbo | ~$0.001 | 1000 listings = $1.00 |
| Title suggestions | GPT-3.5 Turbo | ~$0.002 | 100 calls = $0.20 |

**Monthly Estimate:**
- 20 blog posts: $2.00
- 1000 natural searches: $5.00
- 1000 listings with rarity: $1.00 (optional)
- **Total: ~$8-17/month**

### Optimization Tips

1. **Cache common queries** - Store frequently searched terms
2. **Use GPT-3.5 for simple tasks** - Title suggestions, simple parsing
3. **Make AI rarity optional** - Disable for cost-sensitive environments
4. **Batch operations** - Generate multiple posts in one session
5. **Rate limit search** - Prevent abuse (60 queries/min recommended)

---

## Troubleshooting

### "OpenAI client not available"

**Cause:** Missing or invalid `OPENAI_API_KEY`

**Solution:**
1. Check `.env` file has `OPENAI_API_KEY=sk-...`
2. Verify key is valid: https://platform.openai.com/api-keys
3. Restart server

### "Supabase not available"

**Cause:** Missing or invalid Supabase credentials

**Solution:**
1. Check `.env` has `SUPABASE_URL` and `SUPABASE_KEY`
2. Verify credentials at https://supabase.com
3. Restart server

### Blog posts not indexing

**Cause:** Sitemap not submitted to Google

**Solution:**
1. Generate sitemap: Visit `/sitemap.xml`
2. Submit to Google Search Console
3. Wait 24-48 hours for indexing

### Natural language search not working

**Cause:** OpenAI rate limit or quota exceeded

**Solution:**
1. Check OpenAI dashboard for usage
2. Add billing information if needed
3. System will fallback to keyword search automatically

### Deal scoring not running

**Cause:** Scheduler disabled or error in scoring

**Solution:**
1. Check `/admin` → Deal Scoring tab
2. View status and errors
3. Click "Run Now" to test manually
4. Check server logs for errors

---

## Support & Resources

**Documentation:**
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Reference](./API.md)

**External Resources:**
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Schema.org](https://schema.org)
- [Google Search Console](https://search.google.com/search-console)

**Contact:**
- GitHub Issues: https://github.com/yourusername/the-hub/issues
- Email: support@thehub.com

---

**Version:** 1.0.0
**Last Updated:** 2025-01-24
**Powered by:** OpenAI GPT-4 Turbo + Supabase
