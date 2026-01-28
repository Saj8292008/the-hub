const cron = require('node-cron');
const ScraperManager = require('../services/scraping/ScraperManager');
const supabase = require('../db/supabase');
const localWatchListings = require('../db/localWatchListings');
const logger = require('../utils/logger');
const { logScraperRun } = require('../db/scraperLogsQueries');

/**
 * Watch Scraper Scheduler
 * Automates scraping jobs with different frequencies per source
 */
class WatchScraperScheduler {
  constructor(io = null) {
    this.scraperManager = new ScraperManager();
    this.io = io; // WebSocket for real-time updates
    this.jobs = {};
    this.isRunning = false;

    // Default schedules (can be overridden)
    this.schedules = {
      reddit: '*/15 * * * *',      // Every 15 minutes (Reddit updates frequently)
      ebay: '*/30 * * * *',        // Every 30 minutes
      watchuseek: '0 * * * *'      // Every hour (forums are slower)
    };

    // Track watches to monitor
    this.watchlist = [];
  }

  /**
   * Add a watch to monitor
   */
  addToWatchlist(brand, model, options = {}) {
    this.watchlist.push({
      brand,
      model,
      options,
      addedAt: new Date()
    });
    logger.info(`Added to watchlist: ${brand} ${model}`);
  }

  /**
   * Remove from watchlist
   */
  removeFromWatchlist(brand, model) {
    const index = this.watchlist.findIndex(w => w.brand === brand && w.model === model);
    if (index !== -1) {
      this.watchlist.splice(index, 1);
      logger.info(`Removed from watchlist: ${brand} ${model}`);
    }
  }

  /**
   * Scrape a specific source
   */
  async scrapeSource(source, options = {}) {
    const startTime = Date.now();
    logger.info(`Starting scheduled scrape for ${source}`);

    let itemsFound = 0;
    let itemsNew = 0;
    let itemsUpdated = 0;
    let status = 'success';
    let errorMessage = null;
    let retryCount = 0;

    try {
      let result;

      if (source === 'reddit') {
        // Reddit: scrape recent [WTS] posts
        result = await this.scraperManager.scrapeSource(source, null, {
          sort: 'new',
          limit: 50
        });
      } else if (source === 'ebay') {
        // eBay: search for watches in watchlist or general "luxury watch"
        if (this.watchlist.length > 0) {
          const watch = this.watchlist[0]; // Rotate through watchlist
          const query = `${watch.brand} ${watch.model}`;
          result = await this.scraperManager.scrapeSource(source, query, {
            condition: 'all',
            ...watch.options
          });
        } else {
          result = await this.scraperManager.scrapeSource(source, 'luxury watch', {
            condition: 'all',
            minPrice: 1000
          });
        }
      } else if (source === 'watchuseek') {
        // WatchUSeek: scrape sales corner
        result = await this.scraperManager.scrapeSource(source, null, {
          page: 1
        });
      }

      const listings = result.listings || result || [];
      itemsFound = listings.length;
      logger.info(`Scraped ${itemsFound} listings from ${source}`);

      // Save to database
      if (listings.length > 0) {
        const saveResult = await this.saveListings(listings);

        // Track new vs updated items
        if (saveResult && saveResult.data) {
          itemsNew = saveResult.data.length; // All saved items are considered new for now
        }

        // Broadcast to WebSocket
        if (this.io) {
          this.io.emit('scraper:newListings', {
            source,
            count: listings.length,
            timestamp: new Date()
          });
        }
      } else {
        status = 'no_results';
      }

      const duration = Date.now() - startTime;

      // Log to database
      await logScraperRun({
        category: 'watches',
        source,
        status,
        items_found: itemsFound,
        items_new: itemsNew,
        items_updated: itemsUpdated,
        duration_ms: duration,
        error_message: null,
        retry_count: 0,
        metadata: { watchlistCount: this.watchlist.length }
      });

      return { source, count: itemsFound, success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      errorMessage = error.message;
      status = 'error';

      logger.error(`Failed to scrape ${source}: ${errorMessage}`);

      // Log error to database
      await logScraperRun({
        category: 'watches',
        source,
        status: 'error',
        items_found: 0,
        items_new: 0,
        items_updated: 0,
        duration_ms: duration,
        error_message: errorMessage,
        retry_count: retryCount,
        metadata: { watchlistCount: this.watchlist.length }
      });

      return { source, count: 0, success: false, error: errorMessage, duration };
    }
  }

  /**
   * Save listings to database
   */
  async saveListings(listings) {
    try {
      // Truncate strings to fit DB column limits
      const truncate = (str, maxLen) => str ? String(str).substring(0, maxLen) : str;
      
      // Filter out listings without price or valid URL (DB constraints)
      const validListings = listings.filter(l => {
        if (!l.price || l.price <= 0) {
          return false;
        }
        if (!l.url || l.url.includes('?listing_type=')) {
          return false; // Invalid/generic URL
        }
        return true;
      });
      
      if (validListings.length === 0) {
        logger.info('No valid listings to save (all filtered out)');
        return { data: [], error: null };
      }
      
      logger.info(`Filtered ${listings.length} → ${validListings.length} valid listings`);
      
      // Only include fields that exist in the watch_listings table
      const sanitizedListings = validListings.map(l => ({
        source: truncate(l.source, 50),
        title: l.title,
        price: l.price,
        currency: truncate(l.currency || 'USD', 10),
        brand: truncate(l.brand, 100),
        model: truncate(l.model, 200),
        condition: truncate(l.condition, 50),
        location: truncate(l.location, 200),
        url: l.url,
        images: l.images,
        timestamp: l.timestamp
      }));

      let result;

      if (supabase.isAvailable()) {
        result = await supabase.addWatchListingsBatch(sanitizedListings);
      } else {
        result = await localWatchListings.addWatchListingsBatch(sanitizedListings);
      }

      if (result.error) {
        logger.error(`Failed to save listings: ${result.error.message}`);
      } else {
        logger.info(`✅ Saved ${result.data.length} listings to database`);
      }

      return result;
    } catch (error) {
      logger.error(`Error saving listings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run scrape for all watchlist items
   */
  async scrapeWatchlist() {
    if (this.watchlist.length === 0) {
      logger.info('Watchlist is empty, skipping targeted scrape');
      return;
    }

    logger.info(`Scraping watchlist (${this.watchlist.length} items)`);

    for (const watch of this.watchlist) {
      try {
        const result = await this.scraperManager.searchWatch(
          watch.brand,
          watch.model,
          watch.options
        );

        logger.info(`Found ${result.stats.total} listings for ${watch.brand} ${watch.model}`);

        // Save all listings
        if (result.allListings.length > 0) {
          await this.saveListings(result.allListings);

          // Check for good deals (price below average)
          const avgPrice = result.stats.priceRange.average;
          if (avgPrice) {
            const goodDeals = result.allListings.filter(
              listing => listing.price && listing.price < avgPrice * 0.85 // 15% below average
            );

            if (goodDeals.length > 0) {
              logger.info(`🎯 Found ${goodDeals.length} good deals for ${watch.brand} ${watch.model}`);

              // Broadcast alert
              if (this.io) {
                this.io.emit('scraper:goodDeal', {
                  watch: `${watch.brand} ${watch.model}`,
                  deals: goodDeals,
                  averagePrice: avgPrice
                });
              }
            }
          }
        }

        // Rate limiting between searches
        await this.sleep(5000);
      } catch (error) {
        logger.error(`Failed to scrape watchlist item ${watch.brand} ${watch.model}: ${error.message}`);
      }
    }
  }

  /**
   * Start the scheduler
   */
  start(customSchedules = {}) {
    if (this.isRunning) {
      logger.warn('Scraper scheduler is already running');
      return;
    }

    // Merge custom schedules
    this.schedules = { ...this.schedules, ...customSchedules };

    // Schedule each source
    for (const [source, schedule] of Object.entries(this.schedules)) {
      if (!cron.validate(schedule)) {
        logger.error(`Invalid cron expression for ${source}: ${schedule}`);
        continue;
      }

      this.jobs[source] = cron.schedule(schedule, async () => {
        await this.scrapeSource(source);
      });

      logger.info(`✅ Scheduled ${source} scraper: ${schedule}`);
    }

    // Schedule watchlist scraping (every 2 hours)
    this.jobs.watchlist = cron.schedule('0 */2 * * *', async () => {
      await this.scrapeWatchlist();
    });

    this.isRunning = true;
    logger.info('✅ Watch scraper scheduler started');

    // Run initial scrape if configured
    if (process.env.SCRAPER_RUN_ON_START === 'true') {
      logger.info('Running initial scrape...');
      setTimeout(() => this.runAll(), 5000);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    for (const [source, job] of Object.entries(this.jobs)) {
      if (job) {
        job.stop();
        logger.info(`Stopped ${source} scraper`);
      }
    }

    this.jobs = {};
    this.isRunning = false;
    logger.info('Watch scraper scheduler stopped');
  }

  /**
   * Run all scrapers immediately (manual trigger)
   */
  async runAll() {
    logger.info('Running all scrapers manually...');

    const results = [];

    for (const source of Object.keys(this.schedules)) {
      const result = await this.scrapeSource(source);
      results.push(result);
    }

    // Also run watchlist
    await this.scrapeWatchlist();

    logger.info('Manual scrape completed');
    return results;
  }

  /**
   * Run a specific source immediately
   */
  async runSource(source) {
    return await this.scrapeSource(source);
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedules: this.schedules,
      watchlistCount: this.watchlist.length,
      activeJobs: Object.keys(this.jobs).length
    };
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    return this.scraperManager.getStats();
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WatchScraperScheduler;
