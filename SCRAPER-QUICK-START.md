# 🚀 Scraper Framework - Quick Start Guide

Get the modular scraping framework up and running in under 5 minutes.

## ✅ Prerequisites

All dependencies are already installed! The framework uses:
- `axios` - HTTP client
- `cheerio` - HTML parsing
- `bottleneck` - Rate limiting
- `node-cron` - Job scheduling

## 🎯 Step 1: Test the Scrapers (2 minutes)

Run the test suite to verify everything works:

```bash
npm run scrape
```

This will test:
- ✅ Reddit r/Watchexchange (API-based, most reliable)
- ✅ eBay watch listings
- ✅ WatchUSeek forums
- ✅ Multi-source search
- ✅ Database save functionality

**Expected Output:**
```
🔬 TEST 1: Reddit r/Watchexchange Scraper
✅ SUCCESS! Found 10 listings

Sample Listings:
1. [WTS] Rolex Submariner 116610LN - $8,500
   Brand: Rolex
   Condition: excellent
   Seller: watchenthusiast
   ...
```

If you see listings, you're good to go! 🎉

## 🗄️ Step 2: Set Up Database (Optional, 3 minutes)

### Option A: Use Local Storage (No Setup Required)

By default, listings are saved to `data/watch_listings.json`. No configuration needed!

### Option B: Use Supabase (Recommended for Production)

1. **Already have Supabase configured?** Skip to step 4

2. **Create free Supabase account**: https://supabase.com

3. **Add credentials to `.env`**:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

4. **Run this SQL in Supabase Dashboard** (SQL Editor):

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_watch_listings_source ON watch_listings(source);
CREATE INDEX idx_watch_listings_brand_model ON watch_listings(brand, model);
CREATE INDEX idx_watch_listings_price ON watch_listings(price);
CREATE UNIQUE INDEX idx_watch_listings_url ON watch_listings(url);
```

Done! The framework will automatically use Supabase if configured.

## 🔄 Step 3: Manual Scraping

### Test Individual Scrapers

```bash
# Test Reddit (fastest, most reliable)
node -e "
const ScraperManager = require('./src/services/scraping/ScraperManager');
const manager = new ScraperManager();
manager.scrapeSource('reddit', null, { sort: 'new', limit: 5 })
  .then(r => console.log(JSON.stringify(r.listings, null, 2)));
"
```

```bash
# Test eBay (search for specific watch)
node -e "
const ScraperManager = require('./src/services/scraping/ScraperManager');
const manager = new ScraperManager();
manager.scrapeSource('ebay', 'Seiko SKX007', { page: 1 })
  .then(r => console.log(JSON.stringify(r.listings.slice(0, 3), null, 2)));
"
```

### Search All Sources

```bash
node -e "
const ScraperManager = require('./src/services/scraping/ScraperManager');
const manager = new ScraperManager();
manager.searchWatch('Omega', 'Speedmaster')
  .then(r => {
    console.log('Total found:', r.stats.total);
    console.log('By source:', r.stats.bySource);
    console.log('Price range: \$' + r.stats.priceRange.min + ' - \$' + r.stats.priceRange.max);
  });
"
```

## 🤖 Step 4: Enable Automated Scraping (Optional)

Add to your `.env` file:

```bash
ENABLE_SCRAPER_SCHEDULER=true
SCRAPER_RUN_ON_START=true
```

Then start the API server:

```bash
npm run server
```

The scheduler will automatically:
- Scrape Reddit every 15 minutes
- Scrape eBay every 30 minutes
- Scrape WatchUSeek every hour
- Save all listings to database
- Send WebSocket updates to dashboard

## 📡 Step 5: Use the API

Once the server is running, you can access the scraper via API:

### Get All Listings

```bash
curl http://localhost:3000/scraper/listings?limit=10
```

### Filter by Brand

```bash
curl http://localhost:3000/scraper/listings?brand=Rolex&limit=5
```

### Manually Trigger Scrape

```bash
curl -X POST http://localhost:3000/scraper/scrape/reddit \
  -H "Content-Type: application/json" \
  -d '{"options": {"sort": "new", "limit": 25}}'
```

### Search for Specific Watch

```bash
curl -X POST http://localhost:3000/scraper/search \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Rolex",
    "model": "Submariner",
    "options": {
      "reddit": {"limit": 10},
      "ebay": {"minPrice": 5000}
    }
  }'
```

### Get Statistics

```bash
curl http://localhost:3000/scraper/stats
```

## 🎯 Common Use Cases

### 1. Monitor Specific Watch

```javascript
// Add to your code or run via API
const ScraperManager = require('./src/services/scraping/ScraperManager');
const manager = new ScraperManager();

// Search for Rolex Submariner every hour
setInterval(async () => {
  const results = await manager.searchWatch('Rolex', 'Submariner');

  // Check for good deals (below average price)
  const avgPrice = results.stats.priceRange.average;
  const goodDeals = results.allListings.filter(
    listing => listing.price < avgPrice * 0.85
  );

  if (goodDeals.length > 0) {
    console.log('🎯 Found good deals!', goodDeals);
    // Send notification...
  }
}, 60 * 60 * 1000); // Every hour
```

### 2. Build Price History

The framework automatically saves all listings. Query historical data:

```javascript
const localWatchListings = require('./src/db/localWatchListings');

// Get all Rolex listings
const listings = await localWatchListings.getWatchListings({
  brand: 'Rolex',
  limit: 100
});

// Calculate average price over time
const prices = listings.data.map(l => l.price);
const avgPrice = prices.reduce((a, b) => a + b) / prices.length;
```

### 3. Alert on New Listings

```javascript
const WatchScraperScheduler = require('./src/schedulers/watchScraperScheduler');
const scheduler = new WatchScraperScheduler(io);

// Add watches to monitor
scheduler.addToWatchlist('Omega', 'Speedmaster', {
  minPrice: 2000,
  maxPrice: 5000
});

scheduler.addToWatchlist('Rolex', 'Submariner', {
  condition: 'excellent'
});

// Start monitoring
scheduler.start();

// The scheduler will automatically:
// - Search for these watches every 2 hours
// - Alert you when good deals are found
// - Save all listings to database
```

## 🔍 Verify Everything Works

Run this comprehensive check:

```bash
# 1. Test scrapers
npm run scrape

# 2. Check database
node -e "
const localListings = require('./src/db/localWatchListings');
localListings.getStats().then(stats => console.log('Database stats:', stats));
"

# 3. Start server
npm run server
# Then visit: http://localhost:3000/scraper/stats
```

## 🎉 What's Next?

1. **Integrate with Dashboard**: Display scraped listings in your React dashboard
2. **Set Up Alerts**: Get notified when good deals appear
3. **Add More Scrapers**: Extend with Chrono24, Hodinkee, etc.
4. **Deploy to Production**: The framework is production-ready!

## 📚 Full Documentation

See `SCRAPER-FRAMEWORK.md` for:
- Complete API reference
- Adding new scrapers
- Advanced configuration
- Troubleshooting
- Architecture details

## 🆘 Quick Troubleshooting

**No listings found?**
- Check internet connection
- Try `npm run scrape` to verify
- Check source website is accessible

**Database errors?**
- Local storage works without setup
- For Supabase, verify credentials in `.env`

**Rate limit errors?**
- Normal! Scrapers will retry automatically
- Wait a few minutes between manual tests

**Still stuck?**
Check the logs in `logs/` directory or open an issue.

---

**You're all set!** The framework is running and collecting watch listings. 🎊
