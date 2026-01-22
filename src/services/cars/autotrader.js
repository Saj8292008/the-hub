const axios = require('axios');
const cheerio = require('cheerio');
const Bottleneck = require('bottleneck');
const logger = require('../../utils/logger');

class AutoTraderService {
  constructor() {
    this.baseURL = 'https://www.autotrader.com';

    // Rate limiting: 1 request per 2 seconds
    this.limiter = new Bottleneck({
      minTime: 2000,
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
   * Build search URL for AutoTrader
   */
  buildSearchURL(make, model, year) {
    const makeSlug = make.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = model.toLowerCase().replace(/\s+/g, '-');

    let url = `${this.baseURL}/cars-for-sale/all-cars/${makeSlug}/${modelSlug}`;

    if (year) {
      url += `?year=${year}`;
    }

    return url;
  }

  /**
   * Extract price from listing text or element
   */
  extractPrice($, priceSelector) {
    const priceText = $(priceSelector).first().text();
    return this.normalizePrice(priceText);
  }

  /**
   * Fetch car price from AutoTrader
   */
  async fetchPrice(make, model, year) {
    return this.limiter.schedule(async () => {
      if (!make || !model) {
        throw new Error('Make and model are required');
      }

      try {
        const searchKey = `${make} ${model} ${year || ''}`.trim();
        logger.info(`Fetching AutoTrader price for: ${searchKey}`);

        const searchURL = this.buildSearchURL(make, model, year);
        const response = await this.axios.get(searchURL);

        const $ = cheerio.load(response.data);

        // Collect all listing prices
        const prices = [];

        // Try multiple selectors for price
        const priceSelectors = [
          '[data-cmp="pricing"]',
          '.pricing-detail',
          '.first-price',
          '.price-section',
          '[data-testid="srp-tile-price"]'
        ];

        priceSelectors.forEach(selector => {
          $(selector).each((i, elem) => {
            const priceText = $(elem).text();
            const price = this.normalizePrice(priceText);
            if (price && price > 0) {
              prices.push(price);
            }
          });
        });

        // Fallback: regex search for price patterns
        if (prices.length === 0) {
          const priceMatches = response.data.match(/\$\s*(\d{1,3}(?:,\d{3})+)/g);
          if (priceMatches) {
            priceMatches.forEach(match => {
              const price = this.normalizePrice(match);
              if (price && price > 1000 && price < 1000000) {
                prices.push(price);
              }
            });
          }
        }

        if (prices.length === 0) {
          logger.warn(`No prices found for ${searchKey} on AutoTrader`);
          return null;
        }

        // Calculate average price from listings
        const averagePrice = Math.round(
          prices.reduce((sum, p) => sum + p, 0) / prices.length
        );

        // Also track min and max
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        const result = {
          price: averagePrice,
          minPrice,
          maxPrice,
          listingCount: prices.length,
          currency: 'USD',
          source: 'autotrader',
          timestamp: new Date().toISOString(),
          query: searchKey
        };

        logger.info(`AutoTrader price for ${searchKey}: $${averagePrice} (${prices.length} listings)`);
        return result;

      } catch (error) {
        const searchKey = `${make} ${model} ${year || ''}`.trim();

        if (error.response?.status === 429) {
          logger.error('AutoTrader rate limit hit. Increase delay between requests.');
        } else if (error.response?.status === 403) {
          logger.error('AutoTrader blocked request. Consider rotating user agents or using proxies.');
        } else if (error.response?.status === 404) {
          logger.warn(`No listings found for ${searchKey} on AutoTrader`);
          return null;
        } else {
          logger.error(`AutoTrader fetch error for ${searchKey}: ${error.message}`);
        }
        throw error;
      }
    });
  }

  /**
   * Fetch multiple car prices in batch
   */
  async fetchBatchPrices(cars) {
    const results = [];

    for (const car of cars) {
      try {
        const priceData = await this.fetchPrice(car.make, car.model, car.year);
        results.push({ car, priceData, error: null });
      } catch (error) {
        results.push({ car, priceData: null, error: error.message });
      }
    }

    return results;
  }
}

module.exports = AutoTraderService;
