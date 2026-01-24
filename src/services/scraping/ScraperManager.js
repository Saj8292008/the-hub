const RedditScraper = require('./sources/RedditScraper');
const EbayScraper = require('./sources/EbayScraper');
const WatchUSeekScraper = require('./sources/WatchUSeekScraper');
const logger = require('../../utils/logger');

/**
 * Scraper Manager
 * Orchestrates all scrapers with a unified interface
 */
class ScraperManager {
  constructor() {
    // Initialize all scrapers
    this.scrapers = {
      reddit: new RedditScraper(),
      ebay: new EbayScraper(),
      watchuseek: new WatchUSeekScraper()
    };

    logger.info('✅ Scraper Manager initialized with 3 sources');
  }

  /**
   * Get a specific scraper by name
   */
  getScraper(source) {
    const scraper = this.scrapers[source];
    if (!scraper) {
      throw new Error(`Unknown scraper source: ${source}. Available: ${this.getAvailableSources().join(', ')}`);
    }
    return scraper;
  }

  /**
   * Get list of available scraper sources
   */
  getAvailableSources() {
    return Object.keys(this.scrapers);
  }

  /**
   * Scrape from a specific source
   */
  async scrapeSource(source, query, options = {}) {
    const scraper = this.getScraper(source);

    try {
      logger.info(`Starting scrape from ${source}...`);
      const result = await scraper.scrape(query, options);
      logger.info(`✅ Scraped ${result.listings?.length || result.length || 0} listings from ${source}`);
      return result;
    } catch (error) {
      logger.error(`❌ Failed to scrape ${source}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scrape from all sources
   * Returns aggregated results from all scrapers
   */
  async scrapeAll(query, options = {}) {
    logger.info(`Scraping all sources for: "${query}"`);

    const results = {
      query,
      timestamp: new Date(),
      sources: {},
      allListings: [],
      stats: {
        total: 0,
        bySource: {}
      }
    };

    // Scrape each source
    for (const [source, scraper] of Object.entries(this.scrapers)) {
      try {
        logger.info(`Scraping ${source}...`);

        let sourceResult;
        if (source === 'reddit') {
          // Reddit: use scrape method directly
          sourceResult = await scraper.scrape(null, options.reddit || {});
        } else if (source === 'ebay') {
          // eBay: pass query
          sourceResult = await scraper.scrape(query, options.ebay || {});
        } else if (source === 'watchuseek') {
          // WatchUSeek: use general scrape (could also use search)
          sourceResult = await scraper.scrape(null, options.watchuseek || {});
        }

        const listings = sourceResult.listings || sourceResult || [];

        results.sources[source] = {
          success: true,
          count: listings.length,
          listings: listings,
          pagination: sourceResult.pagination
        };

        results.allListings.push(...listings);
        results.stats.bySource[source] = listings.length;
        results.stats.total += listings.length;

        logger.info(`✅ ${source}: ${listings.length} listings`);
      } catch (error) {
        logger.error(`❌ ${source} failed: ${error.message}`);
        results.sources[source] = {
          success: false,
          error: error.message,
          count: 0,
          listings: []
        };
        results.stats.bySource[source] = 0;
      }
    }

    logger.info(`✅ Total scraped: ${results.stats.total} listings from ${Object.keys(results.sources).length} sources`);

    return results;
  }

  /**
   * Search for a specific watch across all sources
   */
  async searchWatch(brand, model, options = {}) {
    const query = `${brand} ${model}`.trim();
    logger.info(`Searching for watch: "${query}"`);

    const results = {
      brand,
      model,
      query,
      timestamp: new Date(),
      sources: {},
      allListings: [],
      stats: {
        total: 0,
        bySource: {},
        priceRange: {
          min: null,
          max: null,
          average: null
        }
      }
    };

    // Search each source
    for (const [source, scraper] of Object.entries(this.scrapers)) {
      try {
        let listings = [];

        if (source === 'reddit' && scraper.searchWatch) {
          listings = await scraper.searchWatch(query, options.reddit || {});
        } else if (source === 'ebay' && scraper.searchWatch) {
          const result = await scraper.searchWatch(brand, model, options.ebay || {});
          listings = result.listings || result || [];
        } else if (source === 'watchuseek' && scraper.searchWatch) {
          listings = await scraper.searchWatch(query, options.watchuseek || {});
        }

        results.sources[source] = {
          success: true,
          count: listings.length,
          listings: listings
        };

        results.allListings.push(...listings);
        results.stats.bySource[source] = listings.length;
        results.stats.total += listings.length;

        logger.info(`✅ ${source}: ${listings.length} listings`);
      } catch (error) {
        logger.error(`❌ ${source} search failed: ${error.message}`);
        results.sources[source] = {
          success: false,
          error: error.message,
          count: 0,
          listings: []
        };
        results.stats.bySource[source] = 0;
      }
    }

    // Calculate price statistics
    if (results.allListings.length > 0) {
      const prices = results.allListings
        .filter(listing => listing.price && listing.price > 0)
        .map(listing => listing.price);

      if (prices.length > 0) {
        results.stats.priceRange.min = Math.min(...prices);
        results.stats.priceRange.max = Math.max(...prices);
        results.stats.priceRange.average = prices.reduce((a, b) => a + b, 0) / prices.length;
      }
    }

    logger.info(`✅ Found ${results.stats.total} total listings`);
    if (results.stats.priceRange.average) {
      logger.info(`💰 Price range: $${results.stats.priceRange.min} - $${results.stats.priceRange.max} (avg: $${results.stats.priceRange.average.toFixed(2)})`);
    }

    return results;
  }

  /**
   * Get statistics for all scrapers
   */
  getStats() {
    const stats = {};
    for (const [source, scraper] of Object.entries(this.scrapers)) {
      stats[source] = scraper.getStats();
    }
    return stats;
  }

  /**
   * Reset statistics for all scrapers
   */
  resetStats() {
    for (const scraper of Object.values(this.scrapers)) {
      scraper.resetStats();
    }
    logger.info('✅ All scraper stats reset');
  }

  /**
   * Get a summary of scraper health
   */
  getHealthCheck() {
    const health = {
      timestamp: new Date(),
      sources: {}
    };

    for (const [source, scraper] of Object.entries(this.scrapers)) {
      const stats = scraper.getStats();
      health.sources[source] = {
        name: stats.name,
        isHealthy: stats.failures < 3, // Consider unhealthy if 3+ consecutive failures
        requests: stats.requests,
        successRate: stats.successRate,
        lastRun: stats.lastRun
      };
    }

    return health;
  }
}

module.exports = ScraperManager;
