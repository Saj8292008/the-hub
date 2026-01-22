const axios = require('axios');
const cheerio = require('cheerio');
const Bottleneck = require('bottleneck');
const logger = require('../../utils/logger');

class Chrono24Service {
  constructor() {
    this.baseURL = 'https://www.chrono24.com';

    // Rate limiting: 1 request per 3 seconds
    this.limiter = new Bottleneck({
      minTime: 3000,
      maxConcurrent: 1
    });

    this.axios = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    });
  }

  /**
   * Normalize price string to number
   */
  normalizePrice(priceStr) {
    if (!priceStr) return null;
    if (typeof priceStr === 'number') return priceStr;

    // Remove currency symbols, commas, and non-numeric chars except dots
    const cleaned = String(priceStr)
      .replace(/[^0-9.,]/g, '')
      .replace(/,/g, '');

    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  /**
   * Build search query from watch details
   */
  buildSearchQuery(brand, model, specificModel) {
    const parts = [brand, model, specificModel].filter(Boolean);
    return parts.join(' ').trim();
  }

  /**
   * Fetch watch price from Chrono24
   */
  async fetchPrice(brand, model, specificModel) {
    return this.limiter.schedule(async () => {
      const query = this.buildSearchQuery(brand, model, specificModel);

      if (!query) {
        throw new Error('No search query provided');
      }

      try {
        logger.info(`Fetching Chrono24 price for: ${query}`);

        const searchURL = `${this.baseURL}/search/index.htm?query=${encodeURIComponent(query)}`;
        const response = await this.axios.get(searchURL);

        const $ = cheerio.load(response.data);

        // Try multiple selectors for price
        let priceText = null;

        // Selector 1: .article-item .m-price
        if (!priceText) {
          const priceElem = $('.article-item .m-price').first();
          if (priceElem.length) {
            priceText = priceElem.text();
          }
        }

        // Selector 2: [data-testid="price"]
        if (!priceText) {
          const priceElem = $('[data-testid="price"]').first();
          if (priceElem.length) {
            priceText = priceElem.text();
          }
        }

        // Selector 3: .price, .article-price
        if (!priceText) {
          const priceElem = $('.price, .article-price').first();
          if (priceElem.length) {
            priceText = priceElem.text();
          }
        }

        // Fallback: regex search for price pattern
        if (!priceText) {
          const priceMatch = response.data.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
          if (priceMatch) {
            priceText = priceMatch[1];
          }
        }

        if (!priceText) {
          logger.warn(`No price found for ${query} on Chrono24`);
          return null;
        }

        const price = this.normalizePrice(priceText);

        if (!price) {
          logger.warn(`Could not parse price from: ${priceText}`);
          return null;
        }

        const result = {
          price,
          currency: 'USD',
          source: 'chrono24',
          timestamp: new Date().toISOString(),
          raw: priceText.trim(),
          query
        };

        logger.info(`Chrono24 price for ${query}: $${price}`);
        return result;

      } catch (error) {
        if (error.response?.status === 429) {
          logger.error('Chrono24 rate limit hit. Increase delay between requests.');
        } else if (error.response?.status === 403) {
          logger.error('Chrono24 blocked request. Consider rotating user agents or using proxies.');
        } else {
          logger.error(`Chrono24 fetch error for ${query}: ${error.message}`);
        }
        throw error;
      }
    });
  }

  /**
   * Fetch multiple watch prices in batch
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
    }

    return results;
  }
}

module.exports = Chrono24Service;
