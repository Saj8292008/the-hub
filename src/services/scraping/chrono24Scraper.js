const browserManager = require('./browserManager');
const logger = require('../../utils/logger');
const Bottleneck = require('bottleneck');

/**
 * Real Chrono24 Scraper with Anti-Detection
 * Scrapes actual watch prices from Chrono24.com
 */
class Chrono24Scraper {
  constructor() {
    this.baseURL = 'https://www.chrono24.com';

    // Rate limiter: max 1 request per 5 seconds
    this.limiter = new Bottleneck({
      minTime: 5000,
      maxConcurrent: 1
    });

    // Selector strategies (try multiple)
    this.priceSelectors = [
      '[data-testid="price"]',
      '.price',
      '.js-price-value',
      '.price-wrapper .value',
      '[class*="Price"]',
      '.m-price'
    ];

    this.titleSelectors = [
      '[data-testid="title"]',
      '.listing-title',
      '.article-item-title',
      'h1.heading',
      '[class*="Title"]'
    ];
  }

  /**
   * Search for a watch and get price
   */
  async fetchPrice(brand, model, specificModel) {
    return this.limiter.schedule(async () => {
      let page = null;

      try {
        const query = this.buildSearchQuery(brand, model, specificModel);
        logger.info(`🔍 Chrono24: Searching for "${query}"`);

        // Create browser page
        page = await browserManager.createPage();

        // Build search URL
        const searchURL = `${this.baseURL}/search/index.htm?query=${encodeURIComponent(query)}`;

        // Navigate with retry
        await browserManager.navigateWithRetry(page, searchURL);

        // Check if blocked
        if (await browserManager.isBlocked(page)) {
          await browserManager.screenshot(page, 'chrono24-blocked');
          throw new Error('Blocked by Chrono24 anti-bot');
        }

        // Wait for results to load
        await page.waitForSelector('.article-item, .search-result-item, [data-testid="search-result"]', {
          timeout: 10000
        }).catch(() => {
          logger.warn('No search results found');
        });

        // Take screenshot for debugging
        if (process.env.DEBUG_SCREENSHOTS === 'true') {
          await browserManager.screenshot(page, `chrono24-${query.replace(/\s+/g, '-')}`);
        }

        // Extract price using multiple strategies
        const priceData = await this.extractPriceData(page);

        if (!priceData) {
          logger.warn(`No price found for ${query} on Chrono24`);
          return null;
        }

        // Extract product URL for affiliate links
        const productURL = await this.extractProductURL(page);

        const result = {
          price: priceData.price,
          currency: priceData.currency || 'USD',
          source: 'chrono24',
          timestamp: new Date().toISOString(),
          productURL,
          query,
          title: priceData.title
        };

        logger.info(`✅ Chrono24: Found ${query} at $${priceData.price}`);
        return result;

      } catch (error) {
        logger.error(`❌ Chrono24 scraping failed: ${error.message}`);

        if (page) {
          await browserManager.screenshot(page, 'chrono24-error');
        }

        throw error;
      } finally {
        if (page) {
          await page.close();
        }
      }
    });
  }

  /**
   * Extract price data from page
   */
  async extractPriceData(page) {
    // Strategy 1: Try structured data selectors
    for (const selector of this.priceSelectors) {
      try {
        const priceText = await browserManager.extractText(page, selector);
        if (priceText) {
          const price = this.normalizePrice(priceText);
          if (price) {
            const title = await this.extractTitle(page);
            return { price, title, currency: 'USD' };
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Strategy 2: Find all elements with price-like text
    const allText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const prices = [];

      for (const el of elements) {
        const text = el.textContent;
        if (text && /\$[\d,]+/.test(text)) {
          prices.push(text);
        }
      }

      return prices;
    });

    if (allText.length > 0) {
      // Take the first price-like text
      for (const text of allText) {
        const price = this.normalizePrice(text);
        if (price && price > 100) { // Reasonable watch price
          const title = await this.extractTitle(page);
          return { price, title, currency: 'USD' };
        }
      }
    }

    return null;
  }

  /**
   * Extract product title
   */
  async extractTitle(page) {
    for (const selector of this.titleSelectors) {
      const title = await browserManager.extractText(page, selector);
      if (title && title.length > 5) {
        return title;
      }
    }
    return null;
  }

  /**
   * Extract product URL (for affiliate links)
   */
  async extractProductURL(page) {
    try {
      // Get first product link
      const url = await page.evaluate(() => {
        const link = document.querySelector('a.article-item-link, a[href*="/detail/"], .search-result-item a');
        return link ? link.href : null;
      });

      return url;
    } catch (error) {
      logger.debug(`Failed to extract product URL: ${error.message}`);
      return null;
    }
  }

  /**
   * Build search query from watch details
   */
  buildSearchQuery(brand, model, specificModel) {
    const parts = [brand, model, specificModel].filter(Boolean);
    return parts.join(' ').trim();
  }

  /**
   * Normalize price string to number
   */
  normalizePrice(priceStr) {
    if (!priceStr) return null;
    if (typeof priceStr === 'number') return priceStr;

    // Remove everything except digits and decimal point
    const cleaned = String(priceStr)
      .replace(/[^0-9.,]/g, '')
      .replace(/,/g, '');

    const price = parseFloat(cleaned);
    return isNaN(price) ? null : Math.round(price);
  }

  /**
   * Batch fetch multiple watches
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
        results.push({ watch, priceData: null, error: error.message });
      }

      // Add delay between batches
      await browserManager.randomDelay(3000, 6000);
    }

    return results;
  }
}

module.exports = Chrono24Scraper;
