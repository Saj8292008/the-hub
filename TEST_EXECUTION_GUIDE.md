# Test Execution Guide

Complete guide for running all tests and validating The Hub platform.

---

## Quick Start

```bash
# Run all tests
./scripts/runTests.sh

# Or manually
npm test

# With coverage
GENERATE_COVERAGE=true ./scripts/runTests.sh
```

---

## Prerequisites

### 1. Install Test Dependencies

```bash
npm install --include=dev
```

This installs:
- `mocha` - Test framework
- `chai` - Assertion library
- `supertest` - HTTP testing
- `nyc` - Coverage reporting

### 2. Set Up Test Environment

Create `.env.test` file:

```bash
cp .env.test.example .env.test
```

Or use the provided template at `/.env.test`.

### 3. (Optional) Configure Test Database

For integration tests with real database:

1. Create separate Supabase test project
2. Apply schema: `database/blog_schema.sql`
3. Add test credentials to `.env.test`

---

## Running Tests

### Backend API Tests

**Run all backend tests:**
```bash
npm run test:api
```

**Run specific test suites:**
```bash
# Blog API only
npm run test:blog

# AI features only
npm run test:ai
```

**Watch mode** (re-runs on file changes):
```bash
npm run test:watch
```

### Frontend Tests

**Run all frontend tests:**
```bash
cd the-hub
npm run test
```

**Watch mode:**
```bash
cd the-hub
npm run test:watch
```

**Generate coverage:**
```bash
cd the-hub
npm run test:coverage
```

### Integration Tests

**Full integration test suite:**
```bash
# Automated script
./scripts/runTests.sh

# Manual approach
PORT=3001 NODE_ENV=test node src/api/server.js &
SERVER_PID=$!
npm test
kill $SERVER_PID
```

### Coverage Reports

**Generate coverage for backend:**
```bash
npm run test:coverage
```

**View coverage report:**
```bash
open coverage/index.html
```

**Coverage targets:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## Test Organization

### Backend Tests (`/tests/api/`)

**`blog.test.js`** - Blog API endpoints
- GET /api/blog/posts
- GET /api/blog/posts/:slug
- POST /api/blog/posts (create)
- PUT /api/blog/posts/:id (update)
- DELETE /api/blog/posts/:id
- GET /api/blog/categories
- GET /api/blog/tags
- POST /api/blog/subscribe

**`ai-features.test.js`** - AI-powered features
- Natural language search (watches/cars/sneakers)
- Deal scoring endpoints
- Deal scoring scheduler
- AI blog generation
- Performance benchmarks

### Frontend Tests (`/tests/frontend/`)

**`blog.test.tsx`** - React components
- Blog index page
- BlogCard component
- BlogPost detail page
- BlogEditor
- Email subscription
- SEO meta tags

### Test Structure

Each test file follows this pattern:

```javascript
describe('Feature Name', () => {
  // Setup
  before(() => {
    // Runs once before all tests
  });

  // Teardown
  after(() => {
    // Runs once after all tests
  });

  beforeEach(() => {
    // Runs before each test
  });

  afterEach(() => {
    // Runs after each test
  });

  describe('Specific functionality', () => {
    it('should do something', async () => {
      // Test implementation
      const result = await someFunction();
      expect(result).to.equal(expectedValue);
    });
  });
});
```

---

## Manual Testing Procedures

### 1. Blog Platform

**Create New Post:**
1. Start dev server: `npm run dev`
2. Go to http://localhost:5173/blog/admin
3. Click "Create New Post"
4. Fill in title, content, category
5. Click "Publish"
6. Verify post appears at /blog

**AI Generation:**
1. Go to /blog/editor/new
2. Click "Generate with AI"
3. Enter topic: "Best Rolex Watches Under $10k"
4. Select category: "watches"
5. Add keywords: "rolex, price tracker"
6. Click "Generate"
7. Verify content is generated
8. Edit if needed
9. Publish

**SEO Verification:**
1. Publish a blog post
2. Visit post URL
3. View page source (Cmd+U / Ctrl+U)
4. Verify meta tags present:
   - `<title>`
   - `<meta name="description">`
   - `<meta property="og:*">` (Open Graph)
   - `<script type="application/ld+json">` (Schema.org)

**Newsletter Subscription:**
1. Visit any blog post
2. Scroll to newsletter form
3. Enter email: test@example.com
4. Click "Subscribe"
5. Check Supabase `blog_subscribers` table
6. Try subscribing again (should show "already subscribed")

### 2. Natural Language Search

**Watches:**
1. Go to /watches
2. Enter query: "rolex submariner under 10000"
3. Click "AI Search"
4. Verify:
   - Interpreted filters shown
   - Results match filters
   - Message explains what was searched

**Test Queries:**
```
- "omega speedmaster excellent condition"
- "vintage rolex with box and papers under 15000"
- "patek philippe nautilus"
- "seiko dive watch under 500"
```

**Sneakers:**
1. Go to /sneakers
2. Enter query: "jordan 1 size 11"
3. Verify size filter applied

**Test Queries:**
```
- "nike dunk low size 10"
- "yeezy boost 350 deadstock"
- "jordan 4 retro good condition"
```

**Cars:**
1. Go to /cars
2. Enter query: "porsche 911 under 100k miles"
3. Verify mileage filter applied

**Test Queries:**
```
- "ferrari 458 less than 50000 miles"
- "lamborghini huracan 2015 or newer"
- "mclaren 720s excellent condition"
```

### 3. Deal Scoring

**View Scores:**
1. Go to /watches (or /cars, /sneakers)
2. Check listings for score badges:
   - 🔥 HOT DEAL (90-100)
   - 💰 Good Deal (75-89)

**Manual Scoring:**
1. Go to /admin
2. Select "Deal Scoring" tab
3. Click "Run Scoring Now"
4. Verify:
   - Progress indicator shows
   - Stats update
   - Listings updated with scores

**Scheduler:**
1. Go to /admin → Deal Scoring
2. Verify scheduler status
3. Start/stop scheduler
4. Check "Last Run" timestamp
5. Verify automatic runs every hour

### 4. Performance Monitoring

**View Metrics:**
1. Go to /admin
2. Select "Performance" tab
3. Verify metrics shown:
   - Total requests
   - Average response time
   - Error rate
   - Slow endpoints

**Cache Statistics:**
1. Check cache entries count
2. View cache size (KB)
3. Clear cache
4. Verify entries = 0

**Export Metrics:**
1. Click "Export" button
2. Download JSON file
3. Verify contains all metrics

### 5. Image Optimization

**Lazy Loading:**
1. Visit /blog
2. Open DevTools → Network
3. Filter by Images
4. Scroll down page
5. Verify images load as they come into view

**Responsive Images:**
1. Visit blog post
2. Resize browser window
3. Verify hero image adapts to screen size
4. Check Network tab for appropriate image size loaded

---

## Automated Testing Checklist

### Pre-Deployment Tests

- [ ] All backend tests pass (`npm run test:api`)
- [ ] All frontend tests pass (`cd the-hub && npm run test`)
- [ ] Integration tests pass
- [ ] Coverage > 80% for critical paths
- [ ] No console errors during tests
- [ ] Performance benchmarks met:
  - API responses < 200ms average
  - Natural language search < 3s
  - Blog posts list < 100ms

### API Endpoint Tests

**Blog Endpoints:**
- [ ] GET /api/blog/posts (pagination, filtering, search)
- [ ] GET /api/blog/posts/:slug
- [ ] POST /api/blog/posts (create)
- [ ] PUT /api/blog/posts/:id (update)
- [ ] DELETE /api/blog/posts/:id
- [ ] GET /api/blog/categories
- [ ] GET /api/blog/tags
- [ ] POST /api/blog/subscribe

**AI Endpoints:**
- [ ] POST /api/blog/ai/generate
- [ ] POST /api/blog/ai/suggest-titles
- [ ] POST /api/blog/ai/enhance
- [ ] GET /api/blog/ai/stats
- [ ] POST /api/search/watches
- [ ] POST /api/search/sneakers
- [ ] POST /api/search/cars

**Deal Scoring:**
- [ ] POST /api/listings/score/:id
- [ ] GET /api/deal-scoring/scheduler/status
- [ ] POST /api/deal-scoring/scheduler/start
- [ ] POST /api/deal-scoring/scheduler/stop
- [ ] POST /api/deal-scoring/scheduler/run-now
- [ ] GET /api/deal-scoring/scheduler/stats

**Performance:**
- [ ] GET /api/admin/performance/summary
- [ ] GET /api/admin/performance/metrics
- [ ] GET /api/admin/performance/slow
- [ ] GET /api/admin/performance/errors
- [ ] GET /api/admin/performance/export
- [ ] POST /api/admin/performance/clear

**Cache:**
- [ ] GET /api/admin/cache/stats
- [ ] POST /api/admin/cache/clear
- [ ] POST /api/admin/cache/invalidate

**SEO:**
- [ ] GET /sitemap.xml
- [ ] GET /rss.xml
- [ ] GET /robots.txt
- [ ] GET /blog/:slug (SSR for crawlers)

### Component Tests

**Blog Components:**
- [ ] Blog index renders
- [ ] BlogCard displays correctly
- [ ] BlogPost renders markdown
- [ ] BlogEditor validates input
- [ ] AI generation modal works
- [ ] Email subscription validates

**Listing Components:**
- [ ] Deal score badges display
- [ ] AI search bar parses queries
- [ ] Interpreted filters shown
- [ ] Results update correctly

**Admin Components:**
- [ ] DealScoringMonitor controls work
- [ ] PerformanceMonitor displays metrics
- [ ] Cache management functions

### Security Tests

- [ ] XSS protection (sanitize user input)
- [ ] SQL injection prevention
- [ ] CORS configured correctly
- [ ] Rate limiting active (60 req/min)
- [ ] API keys not exposed in frontend
- [ ] Admin routes require authentication
- [ ] RLS policies enforced

### Performance Tests

- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB gzipped
- [ ] Images lazy load
- [ ] Code splitting works
- [ ] Cache hit rate > 60%
- [ ] API response times < 200ms avg
- [ ] No memory leaks

---

## Troubleshooting

### Tests Failing

**"OpenAI client not available"**
- Set valid `OPENAI_API_KEY` in `.env.test`
- Or mock OpenAI in test setup

**"Supabase not available"**
- Set valid Supabase credentials in `.env.test`
- Or use mock Supabase client

**"Port 3001 already in use"**
- Kill existing process: `lsof -ti:3001 | xargs kill -9`
- Or change `PORT` in `.env.test`

**"Timeout errors"**
- Increase timeout: `--timeout 30000`
- Check network connectivity
- Verify server is running

### Coverage Not Generating

```bash
# Install nyc globally
npm install -g nyc

# Run with coverage
nyc npm test

# Generate HTML report
nyc report --reporter=html
```

### Frontend Tests Not Running

```bash
# Install frontend test dependencies
cd the-hub
npm install --include=dev

# Run tests
npm run test
```

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run backend tests
        run: npm run test:api
        env:
          NODE_ENV: test
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Run frontend tests
        run: cd the-hub && npm install && npm run test

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Test Data

### Sample Blog Post

```json
{
  "title": "Best Rolex Watches Under $10,000",
  "content": "# Introduction\n\nRolex watches are...",
  "excerpt": "Discover the best Rolex models available under $10k",
  "category": "watches",
  "tags": ["rolex", "luxury", "investment"],
  "status": "published",
  "meta_title": "Best Rolex Watches Under $10K | The Hub",
  "meta_description": "Complete guide to affordable Rolex watches",
  "keywords": ["rolex price tracker", "affordable rolex"]
}
```

### Sample Natural Language Queries

**Watches:**
- "rolex submariner under 10000"
- "omega speedmaster with box and papers"
- "vintage patek philippe"
- "seiko dive watch excellent condition"

**Sneakers:**
- "jordan 1 high size 10"
- "yeezy boost 350 deadstock"
- "nike dunk low panda"
- "off-white jordan 4 sail"

**Cars:**
- "porsche 911 turbo less than 50000 miles"
- "ferrari 458 2015 or newer"
- "lamborghini huracan excellent condition"
- "mclaren 720s under 200000"

---

## Next Steps

After all tests pass:

1. ✅ Review test coverage report
2. ✅ Fix any failing tests
3. ✅ Add tests for new features
4. ✅ Set up CI/CD pipeline
5. ✅ Run security audit (Task #21)
6. ✅ Deploy to staging
7. ✅ Run smoke tests on staging
8. ✅ Deploy to production

---

**Version:** 1.0.0
**Last Updated:** January 24, 2026
