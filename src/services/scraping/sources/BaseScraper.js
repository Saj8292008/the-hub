const logger = require('../../../utils/logger');
const Bottleneck = require('bottleneck');

/**
 * Base class for all scrapers
 * Provides common functionality: rate limiting, error handling, retry logic
 */
class BaseScraper {
  constructor(config = {}) {
    this.name = config.name || 'UnknownScraper';
    this.source = config.source || 'unknown';

    // Rate limiter to respect website policies
    this.limiter = new Bottleneck({
      minTime: config.minTime || 1000, // Min time between requests (ms)
      maxConcurrent: config.maxConcurrent || 1, // Max concurrent requests
      reservoir: config.reservoir || 10, // Max requests per interval
      reservoirRefreshAmount: config.reservoirRefreshAmount || 10,
      reservoirRefreshInterval: config.reservoirRefreshInterval || 60 * 1000 // 1 minute
    });

    // Retry configuration
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 2000;

    // Stats
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      lastRun: null
    };

    logger.info(`✅ ${this.name} initialized with rate limiting`);
  }

  /**
   * Abstract method - must be implemented by child classes
   * Should return normalized listings
   */
  async scrape(query, options = {}) {
    throw new Error(`${this.name} must implement scrape() method`);
  }

  /**
   * Wrap any async function with rate limiting and retry logic
   */
  async executeWithRetry(fn, context = 'operation') {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.stats.requests++;
        const result = await this.limiter.schedule(() => fn());
        this.stats.successes++;
        this.stats.lastRun = new Date();
        return result;
      } catch (error) {
        lastError = error;
        this.stats.failures++;

        logger.warn(
          `${this.name} ${context} failed (attempt ${attempt}/${this.maxRetries}): ${error.message}`
        );

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt; // Exponential backoff
          logger.info(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `${this.name} ${context} failed after ${this.maxRetries} attempts: ${lastError.message}`
    );
  }

  /**
   * Normalize a listing to standard format
   */
  normalizeListing(rawData) {
    return {
      source: this.source,
      title: rawData.title || '',
      price: rawData.price || null,
      currency: rawData.currency || 'USD',
      brand: rawData.brand || this.extractBrand(rawData.title),
      model: rawData.model || '',
      condition: rawData.condition || 'unknown',
      location: rawData.location || '',
      url: rawData.url || '',
      images: rawData.images || [],
      seller: rawData.seller || '',
      timestamp: rawData.timestamp || new Date(),
      raw_data: rawData
    };
  }

  /**
   * Extract brand from title (basic implementation)
   * Child classes should override with source-specific logic
   */
  extractBrand(title) {
    const brands = [
      'Rolex', 'Omega', 'Tudor', 'Seiko', 'Casio', 'Citizen',
      'Tag Heuer', 'Breitling', 'IWC', 'Patek Philippe', 'Audemars Piguet',
      'Cartier', 'Panerai', 'Jaeger-LeCoultre', 'Vacheron Constantin',
      'Grand Seiko', 'Hamilton', 'Longines', 'Tissot', 'Oris'
    ];

    const upperTitle = title.toUpperCase();
    for (const brand of brands) {
      if (upperTitle.includes(brand.toUpperCase())) {
        return brand;
      }
    }
    return 'Unknown';
  }

  /**
   * Parse price from string
   * Handles various formats: $1,234.56, 1234.56, $1234, etc.
   */
  parsePrice(priceString) {
    if (!priceString) return null;

    // Remove currency symbols and commas
    const cleaned = priceString.toString()
      .replace(/[$£€¥,]/g, '')
      .replace(/[^\d.]/g, '');

    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  /**
   * Extract currency from price string
   */
  extractCurrency(priceString) {
    if (!priceString) return 'USD';

    const currencyMap = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP'
    };

    for (const [symbol, code] of Object.entries(currencyMap)) {
      if (priceString.includes(symbol)) {
        return code;
      }
    }

    return 'USD';
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    return {
      name: this.name,
      source: this.source,
      ...this.stats,
      successRate: this.stats.requests > 0
        ? ((this.stats.successes / this.stats.requests) * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      lastRun: null
    };
  }
}

module.exports = BaseScraper;
