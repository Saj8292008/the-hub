# 🚀 Scraper Framework - Quick Reference

## One-Command Actions

```bash
# Test all scrapers
npm run scrape

# Start API server (with auto-scraping if enabled)
npm run server

# Start API server only
npm run api
```

## Enable Auto-Scraping

Add to `.env`:
```bash
ENABLE_SCRAPER_SCHEDULER=true
SCRAPER_RUN_ON_START=true
```

## API Endpoints (Copy & Paste)

```bash
# Get all listings
curl http://localhost:3000/scraper/listings

# Get Reddit listings only
curl http://localhost:3000/scraper/listings?source=reddit

# Get Rolex listings
curl "http://localhost:3000/scraper/listings?brand=Rolex"

# Get listings under $5000
curl "http://localhost:3000/scraper/listings?maxPrice=5000"

# Scrape Reddit now
curl -X POST http://localhost:3000/scraper/scrape/reddit

# Search all sources for a watch
curl -X POST http://localhost:3000/scraper/search \
  -H "Content-Type: application/json" \
  -d '{"brand":"Omega","model":"Speedmaster"}'

# Get scraper stats
curl http://localhost:3000/scraper/stats

# Get scheduler status
curl http://localhost:3000/scraper/scheduler/status

# Run all scrapers manually
curl -X POST http://localhost:3000/scraper/scheduler/run

# Add to watchlist
curl -X POST http://localhost:3000/scraper/watchlist \
  -H "Content-Type: application/json" \
  -d '{"brand":"Rolex","model":"Submariner"}'
```

## Quick JavaScript Examples

```javascript
// Get listings in JavaScript/React
const response = await fetch('http://localhost:3000/scraper/listings?limit=20');
const listings = await response.json();

// Search for a watch
const searchResults = await fetch('http://localhost:3000/scraper/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brand: 'Omega',
    model: 'Speedmaster'
  })
});
const data = await searchResults.json();
console.log(`Found ${data.stats.total} listings`);
console.log(`Price range: $${data.stats.priceRange.min} - $${data.stats.priceRange.max}`);

// Trigger manual scrape
await fetch('http://localhost:3000/scraper/scheduler/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: 'reddit' })
});
```

## Database Locations

- **Supabase**: Table `watch_listings` (if configured)
- **Local**: `data/watch_listings.json` (auto-created)

## File Locations

```
src/services/scraping/sources/     # Individual scrapers
src/services/scraping/ScraperManager.js  # Main orchestrator
src/schedulers/watchScraperScheduler.js  # Automation
src/api/server.js                  # API endpoints (line 80+)
```

## Adding a New Scraper (3 Steps)

1. **Create scraper**: `src/services/scraping/sources/MyNewScraper.js`
```javascript
const BaseScraper = require('./BaseScraper');
class MyNewScraper extends BaseScraper {
  constructor() {
    super({ name: 'My Scraper', source: 'mysource' });
  }
  async scrape(query, options = {}) {
    return this.executeWithRetry(async () => {
      // Your logic here
      return { listings: [] };
    });
  }
}
module.exports = MyNewScraper;
```

2. **Register**: Edit `src/services/scraping/ScraperManager.js`
```javascript
const MyNewScraper = require('./sources/MyNewScraper');
// In constructor:
this.scrapers = {
  ...
  mysource: new MyNewScraper()
};
```

3. **Test**: `npm run scrape`

## Scheduler Cron Format

```
┌─────── minute (0-59)
│ ┌───── hour (0-23)
│ │ ┌─── day (1-31)
│ │ │ ┌─ month (1-12)
│ │ │ │ ┌ weekday (0-6)
* * * * *

Examples:
*/15 * * * *   # Every 15 minutes
0 * * * *      # Every hour
0 */6 * * *    # Every 6 hours
0 9 * * *      # Daily at 9 AM
```

## Troubleshooting

**No listings found?**
- Check internet connection
- Try: `npm run scrape` to test
- Verify source website is up

**Database errors?**
- Local storage works automatically (no setup)
- For Supabase: check credentials in `.env`

**Rate limit errors?**
- Normal - scrapers retry automatically
- Wait a few minutes between tests

## Documentation Files

- `SCRAPER-QUICK-START.md` - 5-minute setup
- `SCRAPER-FRAMEWORK.md` - Complete docs
- `SCRAPER-INTEGRATION-EXAMPLE.md` - React examples
- `SCRAPER-SETUP-COMPLETE.md` - What was built

## Key Features

✅ Reddit scraper (100% working)
✅ eBay scraper (ready to use)
✅ Rate limiting built-in
✅ Automatic retries
✅ Data normalization
✅ Deduplication
✅ REST API
✅ WebSocket updates
✅ Job scheduler
✅ Price history
✅ Watchlist monitoring
✅ Production-ready

---

**Quick Start**: Run `npm run scrape` and see live Reddit watch listings!
