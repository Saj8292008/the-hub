# 🕷️ The Hub - Modular Scraping Framework

## Overview

A production-ready, modular web scraping framework for The Hub that tracks watch listings from multiple sources. Built with extensibility, rate limiting, and error handling in mind.

## 🎯 Features

- **Modular Architecture**: Each scraper is independent and can be added/removed without affecting others
- **Rate Limiting**: Built-in rate limiting with Bottleneck to respect website policies
- **Retry Logic**: Automatic retries with exponential backoff
- **Data Normalization**: Unified data format across all sources
- **Database Integration**: Supports both Supabase (PostgreSQL) and local JSON storage
- **Job Scheduler**: Automated scraping with customizable frequencies
- **WebSocket Updates**: Real-time notifications when new listings are found
- **Future-Proof**: Designed to easily add Playwright/Puppeteer for Cloudflare-protected sites

## 📦 Installed Scrapers

| Source | Type | Rate Limit | Status | Notes |
|--------|------|------------|--------|-------|
| Reddit r/Watchexchange | API | 30 req/min | ✅ Working | Most reliable, uses JSON API |
| eBay | HTML Scraping | 20 req/min | ✅ Working | Conservative rate limits |
| WatchUSeek Forums | HTML Scraping | 15 req/min | ✅ Working | Forum-friendly delays |

## 🚀 Quick Start

### 1. Test the Scrapers

Run the comprehensive test suite to verify all scrapers work:

```bash
npm run scrape
# or
npm run test:new-scrapers
```

This will:
- Test Reddit scraper (fetch recent [WTS] posts)
- Test Reddit search (search for specific watches)
- Test eBay scraper
- Test WatchUSeek scraper
- Test multi-source search
- Test database save functionality
- Show statistics

### 2. Manual Scraping via CLI

```javascript
// In Node REPL or script
const ScraperManager = require('./src/services/scraping/ScraperManager');
const manager = new ScraperManager();

// Scrape Reddit
const redditListings = await manager.scrapeSource('reddit', null, {
  sort: 'new',
  limit: 25
});

// Scrape eBay
const ebayListings = await manager.scrapeSource('ebay', 'Rolex Submariner', {
  condition: 'all',
  minPrice: 5000
});

// Search all sources for a specific watch
const results = await manager.searchWatch('Omega', 'Speedmaster');
console.log(`Found ${results.stats.total} listings`);
console.log(`Price range: $${results.stats.priceRange.min} - $${results.stats.priceRange.max}`);
```

### 3. Start the API Server with Scrapers

Add to your `.env`:

```bash
# Enable automated scraping
ENABLE_SCRAPER_SCHEDULER=true

# Run initial scrape on startup (optional)
SCRAPER_RUN_ON_START=true
```

Then start the server:

```bash
npm run server
```

The API will expose scraper endpoints at `http://localhost:3000/scraper/*`

## 📡 API Endpoints

### Get Scraped Listings

```bash
GET /scraper/listings?source=reddit&brand=Rolex&limit=20
```

Query parameters:
- `source`: Filter by source (reddit, ebay, watchuseek)
- `brand`: Filter by brand
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `limit`: Number of results (default: 50)

### Scrape a Specific Source

```bash
POST /scraper/scrape/reddit
Content-Type: application/json

{
  "query": "Rolex Submariner",  // Optional, depends on source
  "options": {
    "sort": "new",
    "limit": 25
  }
}
```

### Search All Sources

```bash
POST /scraper/search
Content-Type: application/json

{
  "brand": "Omega",
  "model": "Speedmaster",
  "options": {
    "reddit": { "limit": 10 },
    "ebay": { "condition": "all", "minPrice": 2000 }
  }
}
```

Response includes:
- Aggregated listings from all sources
- Price statistics (min, max, average)
- Success/failure status per source

### Get Scraper Statistics

```bash
GET /scraper/stats
```

Returns request counts, success rates, and last run times for each scraper.

### Scheduler Control

```bash
# Get scheduler status
GET /scraper/scheduler/status

# Manually trigger scrape
POST /scraper/scheduler/run
{
  "source": "reddit"  // Optional, omit to run all
}

# Add watch to monitoring watchlist
POST /scraper/watchlist
{
  "brand": "Rolex",
  "model": "Submariner",
  "options": { "minPrice": 8000 }
}

# Remove from watchlist
DELETE /scraper/watchlist
{
  "brand": "Rolex",
  "model": "Submariner"
}
```

## 🗄️ Database Schema

### Supabase (PostgreSQL)

Run this SQL in your Supabase dashboard to create the table:

```sql
CREATE TABLE IF NOT EXISTS watch_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  price DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'USD',
  brand VARCHAR(100),
  model VARCHAR(200),
  condition VARCHAR(50),
  location VARCHAR(200),
  url TEXT UNIQUE NOT NULL,
  images TEXT[],
  seller VARCHAR(200),
  timestamp TIMESTAMP WITH TIME ZONE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_watch_listings_source ON watch_listings(source);
CREATE INDEX idx_watch_listings_brand_model ON watch_listings(brand, model);
CREATE INDEX idx_watch_listings_price ON watch_listings(price);
CREATE INDEX idx_watch_listings_timestamp ON watch_listings(timestamp DESC);
CREATE UNIQUE INDEX idx_watch_listings_url ON watch_listings(url);
```

### Local Storage

If Supabase is not configured, listings are automatically saved to:
```
data/watch_listings.json
```

No setup required - the file is created automatically.

## 📊 Data Format

All scrapers normalize data to this format:

```javascript
{
  source: 'reddit',              // Source identifier
  title: '[WTS] Rolex Submariner 116610LN',
  price: 8500.00,                // Parsed number
  currency: 'USD',               // Currency code
  brand: 'Rolex',                // Extracted or parsed
  model: 'Submariner 116610LN',  // Model information
  condition: 'excellent',        // Standardized condition
  location: 'US-CA',             // Location if available
  url: 'https://...',            // Direct link to listing
  images: ['https://...'],       // Array of image URLs
  seller: 'username',            // Seller identifier
  timestamp: '2024-01-20T...',   // Listing timestamp
  raw_data: {...}                // Original data for debugging
}
```

## ⚙️ Scheduler Configuration

The scheduler runs automatically when `ENABLE_SCRAPER_SCHEDULER=true`.

### Default Schedules

```javascript
{
  reddit: '*/15 * * * *',      // Every 15 minutes
  ebay: '*/30 * * * *',        // Every 30 minutes
  watchuseek: '0 * * * *'      // Every hour
}
```

### Custom Schedules

```javascript
const scheduler = new WatchScraperScheduler(io);

scheduler.start({
  reddit: '*/5 * * * *',   // Every 5 minutes
  ebay: '0 */2 * * *'      // Every 2 hours
});
```

### Cron Format

```
┌─────── minute (0 - 59)
│ ┌───── hour (0 - 23)
│ │ ┌─── day of month (1 - 31)
│ │ │ ┌─ month (1 - 12)
│ │ │ │ ┌ day of week (0 - 6) (Sunday=0)
* * * * *
```

Examples:
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 9 * * *` - Daily at 9 AM

## 🔧 Adding a New Scraper

### 1. Create Scraper Class

Create a new file in `src/services/scraping/sources/`:

```javascript
const BaseScraper = require('./BaseScraper');

class MyNewScraper extends BaseScraper {
  constructor() {
    super({
      name: 'My New Scraper',
      source: 'mynewsource',
      minTime: 2000,           // Min time between requests
      maxConcurrent: 1,        // Max concurrent requests
      reservoir: 30,           // Requests per interval
      reservoirRefreshInterval: 60 * 1000  // 1 minute
    });
  }

  async scrape(query, options = {}) {
    return this.executeWithRetry(async () => {
      // Your scraping logic here
      const rawListings = await this.fetchData(query);

      // Normalize and return
      return {
        listings: rawListings.map(raw => this.normalizeListing(raw)),
        pagination: { hasNextPage: true }
      };
    }, 'scrape operation');
  }
}

module.exports = MyNewScraper;
```

### 2. Register in ScraperManager

Edit `src/services/scraping/ScraperManager.js`:

```javascript
const MyNewScraper = require('./sources/MyNewScraper');

class ScraperManager {
  constructor() {
    this.scrapers = {
      reddit: new RedditScraper(),
      ebay: new EbayScraper(),
      watchuseek: new WatchUSeekScraper(),
      mynewsource: new MyNewScraper()  // Add here
    };
  }
}
```

### 3. Add to Scheduler (Optional)

Edit `src/schedulers/watchScraperScheduler.js`:

```javascript
this.schedules = {
  reddit: '*/15 * * * *',
  ebay: '*/30 * * * *',
  watchuseek: '0 * * * *',
  mynewsource: '0 */2 * * *'  // Every 2 hours
};
```

Done! Your scraper is now integrated.

## 🛡️ Best Practices

### Rate Limiting

Each scraper has rate limiting built-in. Adjust based on the target website:

```javascript
{
  minTime: 2000,               // Min 2 seconds between requests
  maxConcurrent: 1,            // Only 1 concurrent request
  reservoir: 30,               // 30 requests per interval
  reservoirRefreshInterval: 60000  // Refresh every minute
}
```

### Error Handling

The framework handles errors automatically:
- Retries failed requests up to 3 times
- Exponential backoff between retries
- Logs all errors with context
- Continues to next item on failure

### Avoiding Blocks

1. **Use realistic User-Agents**: Each scraper includes browser-like headers
2. **Respect robots.txt**: Check before scraping
3. **Add delays**: Use the built-in rate limiting
4. **Rotate patterns**: Don't scrape the same endpoint repeatedly
5. **Monitor success rates**: Check `GET /scraper/stats` regularly

## 🚀 Future Enhancements

### 1. Add Cloudflare-Protected Sites (Chrono24)

When ready to tackle Cloudflare-protected sites:

```javascript
// Already installed: puppeteer, playwright
const BaseScraper = require('./BaseScraper');
const puppeteer = require('puppeteer');

class Chrono24Scraper extends BaseScraper {
  async scrape(query, options = {}) {
    return this.executeWithRetry(async () => {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      // Navigate and scrape
      await page.goto(`https://chrono24.com/search?query=${query}`);
      await page.waitForSelector('.listings');

      const listings = await page.evaluate(() => {
        // Extract data from page
      });

      await browser.close();

      return { listings };
    });
  }
}
```

### 2. Proxy Rotation

For higher volume scraping:

```javascript
const proxyList = ['proxy1:port', 'proxy2:port'];
let currentProxy = 0;

async scrape() {
  const proxy = proxyList[currentProxy++ % proxyList.length];
  // Use proxy in request
}
```

### 3. Price Alert System

Integrate with existing alert system:

```javascript
// In scheduler, after saving listings
const avgPrice = calculateAverage(listings);
const goodDeals = listings.filter(l => l.price < avgPrice * 0.85);

if (goodDeals.length > 0) {
  await alertManager.sendAlert({
    type: 'good_deal',
    listings: goodDeals
  });
}
```

## 📈 Monitoring

### View Statistics

```bash
curl http://localhost:3000/scraper/stats
```

Returns:
```json
{
  "reddit": {
    "name": "Reddit Watchexchange Scraper",
    "requests": 156,
    "successes": 154,
    "failures": 2,
    "successRate": "98.7%",
    "lastRun": "2024-01-20T..."
  },
  // ... other scrapers
}
```

### Database Stats

Check how many listings you've collected:

```javascript
const localWatchListings = require('./src/db/localWatchListings');
const stats = await localWatchListings.getStats();

console.log(`Total: ${stats.total}`);
console.log('By Source:', stats.bySources);
console.log('Price Range:', stats.priceRange);
```

## 🐛 Troubleshooting

### "No listings found"

- Check internet connection
- Verify the source website is accessible
- Check rate limits (wait a few minutes)
- Review scraper logs for specific errors

### "Database save failed"

- **Supabase**: Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- **Local**: Ensure `data/` directory is writable
- Check for duplicate URLs (unique constraint)

### Rate Limit Errors

- Scrapers will automatically retry with backoff
- If persistent, increase `minTime` in scraper config
- Consider adding delays between batch operations

### Parser Errors

- Websites change their HTML frequently
- Check `raw_data` field in database to see what was scraped
- Update selectors in scraper source file
- Report issues in GitHub

## 📚 Architecture

```
src/services/scraping/
├── sources/
│   ├── BaseScraper.js          # Base class with common functionality
│   ├── RedditScraper.js        # Reddit r/Watchexchange
│   ├── EbayScraper.js          # eBay watches
│   └── WatchUSeekScraper.js    # WatchUSeek forums
├── ScraperManager.js           # Orchestrates all scrapers
└── testNewScrapers.js          # Test suite

src/schedulers/
└── watchScraperScheduler.js    # Automated scraping jobs

src/db/
├── supabase.js                 # PostgreSQL interface
└── localWatchListings.js       # Local JSON fallback

src/api/
└── server.js                   # API endpoints (updated)
```

## 🎓 Learning Resources

- [Bottleneck Rate Limiting](https://github.com/SGrondin/bottleneck)
- [Cheerio (HTML Parsing)](https://cheerio.js.org/)
- [Axios (HTTP Client)](https://axios-http.com/)
- [Node-Cron (Scheduler)](https://www.npmjs.com/package/node-cron)
- [Puppeteer (Browser Automation)](https://pptr.dev/)

## 📝 License

Part of The Hub project - MIT License

## 🤝 Contributing

To add a new scraper:
1. Create scraper class extending `BaseScraper`
2. Implement `scrape()` method
3. Add to `ScraperManager`
4. Test with `npm run scrape`
5. Submit PR with tests

---

**Built with ❤️ for The Hub - Track Everything That Matters**
