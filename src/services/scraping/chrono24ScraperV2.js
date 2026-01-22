const proxyManager = require('./proxyManager');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const Bottleneck = require('bottleneck');

/**
 * Chrono24 Scraper V2 - Uses Proxy Services
 * Works with ScraperAPI, Apify, and Crawlbase free tiers
 */
class Chrono24ScraperV2 {
  constructor() {
    this.baseURL = 'https://www.chrono24.com';

    // Rate limiter: 1 request per 3 seconds (gentler on free tiers)
    this.limiter = new Bottleneck({
      minTime: 3000,
      maxConcurrent: 1
    });

    // Selectors for price extraction
    this.priceSelectors = [
      '.js-article-price',
      '[data-testid="price"]',
      '.price',
      '.m-price',
      '.article-price',
      '[class*="price"]'
    ];
  }

  /**
   * Fetch watch price
   */
  async fetchPrice(brand, model, specificModel) {
    return this.limiter.schedule(async () => {
      try {
        const query = this.buildSearchQuery(brand, model, specificModel);
        logger.info(`🔍 Chrono24 V2: Searching for "${query}"`);

        // Check if proxy services available
        if (!proxyManager.isAvailable()) {
          throw new Error('No scraping services available. Please configure API keys in .env');
        }

        // Build search URL
        const searchURL = `${this.baseURL}/search/index.htm?query=${encodeURIComponent(query)}`;

        // Scrape with proxy service
        const result = await proxyManager.scrape(searchURL, {
          javascript: true, // Need JS for dynamic content
          country: 'us'
        });

        // Parse HTML
        const $ = cheerio.load(result.html);

        // Debug: Save HTML if enabled
        if (process.env.DEBUG_HTML === 'true') {
          const fs = require('fs');
          const debugPath = `/tmp/chrono24-debug-${Date.now()}.html`;
          fs.writeFileSync(debugPath, result.html);
          logger.info(`Debug HTML saved to: ${debugPath}`);
        }

        // Extract price
        const priceData = this.extractPriceFromHTML($);

        if (!priceData) {
          logger.warn(`No price found for ${query}`);
          return null;
        }

        // Extract product URL
        const productURL = this.extractProductURL($);

        const response = {
          price: priceData.price,
          currency: 'USD',
          source: 'chrono24',
          proxyService: result.service,
          timestamp: new Date().toISOString(),
          productURL,
          query,
          title: priceData.title
        };

        logger.info(`✅ Chrono24: Found "${query}" at $${priceData.price} via ${result.service}`);

        return response;

      } catch (error) {
        logger.error(`❌ Chrono24 V2 scraping failed: ${error.message}`);
        throw error;
      }
    });
  }

  /**
   * Extract price from HTML using Cheerio
   */
  extractPriceFromHTML($) {
    // Strategy 1: Try known selectors
    for (const selector of this.priceSelectors) {
      const priceElement = $(selector).first();

      if (priceElement.length) {
        const priceText = priceElement.text().trim();
        const price = this.normalizePrice(priceText);

        if (price && price > 100) {
          const title = this.extractTitle($);
          return { price, title };
        }
      }
    }

    // Strategy 2: Find all text containing dollar signs
    const bodyText = $('body').text();
    const priceMatches = bodyText.match(/\$[\d,]+/g);

    if (priceMatches && priceMatches.length > 0) {
      // Take first reasonable price
      for (const match of priceMatches) {
        const price = this.normalizePrice(match);
        if (price && price > 100 && price < 1000000) {
          const title = this.extractTitle($);
          return { price, title };
        }
      }
    }

    // Strategy 3: Look for meta tags
    const ogPrice = $('meta[property="og:price:amount"]').attr('content');
    if (ogPrice) {
      const price = this.normalizePrice(ogPrice);
      if (price) {
        const title = this.extractTitle($);
        return { price, title };
      }
    }

    return null;
  }

  /**
   * Extract product title
   */
  extractTitle($) {
    // Try multiple selectors
    const titleSelectors = [
      'h1',
      '.article-item-title',
      '[data-testid="title"]',
      '.listing-title',
      'title'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 5) {
        return title.substring(0, 200); // Limit length
      }
    }

    return null;
  }

  /**
   * Extract product URL for affiliate links
   */
  extractProductURL($) {
    const linkSelectors = [
      'a.article-item-link',
      'a[href*="/watch/"]',
      'a[href*="/detail/"]',
      '.search-result-item a'
    ];

    for (const selector of linkSelectors) {
      const href = $(selector).first().attr('href');
      if (href) {
        // Make absolute URL
        if (href.startsWith('http')) {
          return href;
        } else if (href.startsWith('/')) {
          return this.baseURL + href;
        }
      }
    }

    return null;
  }

  /**
   * Build search query
   */
  buildSearchQuery(brand, model, specificModel) {
    const parts = [brand, model, specificModel].filter(Boolean);
    return parts.join(' ').trim();
  }

  /**
   * Normalize price to number
   */
  normalizePrice(priceStr) {
    if (!priceStr) return null;
    if (typeof priceStr === 'number') return priceStr;

    // Remove everything except digits
    const cleaned = String(priceStr)
      .replace(/[^0-9]/g, '');

    const price = parseInt(cleaned, 10);
    return isNaN(price) ? null : price;
  }

  /**
   * Batch fetch watches
   */
  async fetchBatchPrices(watches) {
    const results = [];

    for (const watch of watches) {
      try {
        const priceData = await this.fetchPrice(
          watch.brand,
          watch.model,
          watch.specificModel || watch.specific_model
        );

        results.push({ watch, priceData, error: null });
      } catch (error) {
        logger.error(`Batch fetch failed for watch ${watch.id}: ${error.message}`);
        results.push({ watch, priceData: null, error: error.message });
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  /**
   * Get usage stats
   */
  getStats() {
    return proxyManager.getStats();
  }
}

module.exports = Chrono24ScraperV2;
