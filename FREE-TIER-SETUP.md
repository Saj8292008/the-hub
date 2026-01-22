# Free Tier Scraping Services Setup

## 🎁 Free Requests Available: 7,000/month

### 1. ScraperAPI (1,000 free/month)

**Sign up:** https://www.scraperapi.com/signup

**Steps:**
1. Create free account (no credit card needed)
2. Get your API key from dashboard
3. Add to `.env`: `SCRAPERAPI_KEY=your_key_here`

**Features:**
- Auto-rotating proxies
- JavaScript rendering
- CAPTCHA solving
- 1,000 requests/month free

---

### 2. Apify (5,000 free/month)

**Sign up:** https://apify.com/sign-up

**Steps:**
1. Create free account
2. Go to Settings → Integrations
3. Copy your API token
4. Add to `.env`: `APIFY_TOKEN=your_token_here`

**Features:**
- 5,000 actor run minutes/month
- Residential proxies
- Browser automation
- Most generous free tier!

---

### 3. Crawlbase (1,000 free/month)

**Sign up:** https://crawlbase.com/signup

**Steps:**
1. Create free account
2. Get your JavaScript token (for dynamic sites)
3. Add to `.env`: `CRAWLBASE_TOKEN=your_token_here`

**Features:**
- 1,000 requests/month free
- JavaScript rendering
- Auto-rotation
- Good for e-commerce sites

---

## 📝 Add to .env

```env
# Free Tier Scraping Services
SCRAPERAPI_KEY=your_scraperapi_key
APIFY_TOKEN=your_apify_token
CRAWLBASE_TOKEN=your_crawlbase_token

# Enable real scraping (vs mock data)
USE_REAL_SCRAPERS=true

# Scraping strategy
SCRAPER_ROTATION=auto
```

---

## 💡 Usage Strategy

The system will automatically:
1. Try ScraperAPI first (fastest)
2. Fallback to Apify if ScraperAPI fails
3. Fallback to Crawlbase if Apify fails
4. Fallback to mock data if all fail

**Request Distribution:**
- ScraperAPI: Quick one-off scrapes
- Apify: Batch operations (most credits)
- Crawlbase: Backup for complex sites

**Monthly capacity:**
- ~200 items × daily updates = 6,000 requests/month
- Fits perfectly in free tiers!

---

## 🔄 Testing

After adding keys to `.env`:

```bash
# Test each service
node src/services/scraping/testScrapers.js

# Test with real watch
npm run test:scrape

# Enable in production
# Set USE_REAL_SCRAPERS=true in .env
```

---

## 📊 Monitoring

Check usage at:
- ScraperAPI: https://dashboard.scraperapi.com
- Apify: https://console.apify.com
- Crawlbase: https://crawlbase.com/dashboard

---

## 🚀 Upgrade Path

When you hit limits:
1. **$29/mo** - ScraperAPI Pro (100k requests)
2. **$49/mo** - Apify Platform (200k runs)
3. **Revenue Covers It** - One affiliate sale pays for 2 months!
