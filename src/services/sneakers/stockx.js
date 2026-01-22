const axios = require('axios');
const cheerio = require('cheerio');
const Bottleneck = require('bottleneck');
const logger = require('../../utils/logger');

class StockXService {
  constructor() {
    this.baseURL = 'https://stockx.com';
    this.searchURL = 'https://stockx.com/api/browse';

    // Rate limiting: 1 request per 4 seconds (StockX is strict)
    this.limiter = new Bottleneck({
      minTime: 4000,
      maxConcurrent: 1
    });

    this.axios = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Referer': 'https://stockx.com/'
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
   * Build search query
   */
  buildSearchQuery(brand, model) {
    const parts = [brand, model].filter(Boolean);
    return parts.join(' ').trim();
  }

  /**
   * Fetch sneaker price from StockX
   * Note: Size is important for sneakers - prices vary by size!
   */
  async fetchPrice(brand, model, size) {
    return this.limiter.schedule(async () => {
      const query = this.buildSearchQuery(brand, model);

      if (!query) {
        throw new Error('No search query provided');
      }

      try {
        const searchKey = `${query} ${size ? `size ${size}` : ''}`.trim();
        logger.info(`Fetching StockX price for: ${searchKey}`);

        // Method 1: Try web scraping the product page
        const searchURL = `${this.baseURL}/search?s=${encodeURIComponent(query)}`;
        const response = await this.axios.get(searchURL);

        const $ = cheerio.load(response.data);

        // Extract prices from search results
        let lowestAsk = null;

        // Try to find price in various locations
        const priceSelectors = [
          '[data-testid="ProductPrice"]',
          '.product-price',
          '.price-ask',
          '.lowest-ask',
          '[class*="LowestAsk"]'
        ];

        for (const selector of priceSelectors) {
          const priceElem = $(selector).first();
          if (priceElem.length) {
            const priceText = priceElem.text();
            lowestAsk = this.normalizePrice(priceText);
            if (lowestAsk) break;
          }
        }

        // Fallback: Look for JSON data in script tags
        if (!lowestAsk) {
          $('script[type="application/json"], script[type="application/ld+json"]').each((i, elem) => {
            try {
              const json = JSON.parse($(elem).html());
              if (json.offers?.price) {
                lowestAsk = this.normalizePrice(json.offers.price);
                return false; // break
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          });
        }

        // Fallback: Regex search for price
        if (!lowestAsk) {
          const priceMatch = response.data.match(/["']lowestAsk["']:\s*["']?\$?(\d+)/);
          if (priceMatch) {
            lowestAsk = this.normalizePrice(priceMatch[1]);
          }
        }

        if (!lowestAsk) {
          logger.warn(`No price found for ${searchKey} on StockX`);
          return null;
        }

        const result = {
          price: lowestAsk,
          size: size || 'various',
          currency: 'USD',
          source: 'stockx',
          timestamp: new Date().toISOString(),
          query,
          note: size ? `Size ${size}` : 'Average across sizes'
        };

        logger.info(`StockX price for ${searchKey}: $${lowestAsk}`);
        return result;

      } catch (error) {
        const searchKey = `${query} ${size ? `size ${size}` : ''}`.trim();

        if (error.response?.status === 429) {
          logger.error('StockX rate limit hit. Increase delay between requests.');
        } else if (error.response?.status === 403) {
          logger.error('StockX blocked request. May need to rotate IPs or use proxies.');
        } else if (error.response?.status === 404) {
          logger.warn(`Product not found: ${searchKey}`);
          return null;
        } else {
          logger.error(`StockX fetch error for ${searchKey}: ${error.message}`);
        }
        throw error;
      }
    });
  }

  /**
   * Fetch multiple sneaker prices in batch
   */
  async fetchBatchPrices(sneakers) {
    const results = [];

    for (const sneaker of sneakers) {
      try {
        const priceData = await this.fetchPrice(sneaker.brand, sneaker.model, sneaker.size);
        results.push({ sneaker, priceData, error: null });
      } catch (error) {
        results.push({ sneaker, priceData: null, error: error.message });
      }
    }

    return results;
  }
}

module.exports = StockXService;
