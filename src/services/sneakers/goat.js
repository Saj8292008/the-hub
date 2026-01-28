/**
 * GOAT Sneaker Service
 * 
 * Fetches sneaker prices and listings from GOAT
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Bottleneck = require('bottleneck');
const logger = require('../../utils/logger');

class GOATService {
  constructor() {
    this.baseURL = 'https://www.goat.com';
    this.apiURL = 'https://www.goat.com/api';
    
    // Rate limiting: 1 request per 3 seconds
    this.limiter = new Bottleneck({
      minTime: 3000,
      maxConcurrent: 1
    });

    this.axios = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      lastRun: null
    };
  }

  /**
   * Search for sneakers on GOAT
   */
  async search(query, options = {}) {
    return this.limiter.schedule(async () => {
      this.stats.requests++;
      
      try {
        const searchUrl = `${this.baseURL}/search?query=${encodeURIComponent(query)}`;
        logger.info(`GOAT search: ${query}`);
        
        const response = await this.axios.get(searchUrl);
        const $ = cheerio.load(response.data);
        
        const results = [];
        
        // Parse product grid
        $('[data-testid="product-card"], .product-card, [class*="ProductCard"]').each((i, elem) => {
          try {
            const $item = $(elem);
            
            const name = $item.find('[class*="name"], .product-name, h3').first().text().trim();
            const priceText = $item.find('[class*="price"], .price').first().text().trim();
            const price = this.normalizePrice(priceText);
            const link = $item.find('a').first().attr('href') || '';
            const image = $item.find('img').first().attr('src') || '';
            
            if (name) {
              results.push({
                name,
                price,
                url: link.startsWith('http') ? link : `${this.baseURL}${link}`,
                image,
                source: 'goat'
              });
            }
          } catch (err) {
            // Skip parsing errors
          }
        });

        this.stats.successes++;
        this.stats.lastRun = new Date().toISOString();
        
        logger.info(`GOAT: Found ${results.length} results for "${query}"`);
        return results;
        
      } catch (error) {
        this.stats.failures++;
        logger.error(`GOAT search error: ${error.message}`);
        return [];
      }
    });
  }

  /**
   * Fetch price for a specific sneaker
   */
  async fetchPrice(brand, model, size = null) {
    const query = `${brand} ${model}`.trim();
    
    return this.limiter.schedule(async () => {
      this.stats.requests++;
      
      try {
        logger.info(`GOAT price fetch: ${query} ${size ? `size ${size}` : ''}`);
        
        // Search for the sneaker
        const searchUrl = `${this.baseURL}/search?query=${encodeURIComponent(query)}`;
        const response = await this.axios.get(searchUrl);
        const $ = cheerio.load(response.data);
        
        // Find lowest price from results
        let lowestPrice = null;
        
        $('[class*="price"], .price').each((i, elem) => {
          const priceText = $(elem).text();
          const price = this.normalizePrice(priceText);
          
          if (price && (!lowestPrice || price < lowestPrice)) {
            lowestPrice = price;
          }
        });

        // Try to find size-specific pricing from JSON data
        $('script[type="application/json"], script[type="application/ld+json"]').each((i, elem) => {
          try {
            const json = JSON.parse($(elem).html());
            
            if (json.offers) {
              const offers = Array.isArray(json.offers) ? json.offers : [json.offers];
              
              for (const offer of offers) {
                const price = parseFloat(offer.price);
                if (price && (!lowestPrice || price < lowestPrice)) {
                  lowestPrice = price;
                }
              }
            }
          } catch (e) {
            // Skip JSON parse errors
          }
        });

        this.stats.successes++;
        this.stats.lastRun = new Date().toISOString();

        return {
          source: 'goat',
          query,
          size,
          lowestPrice,
          fetchedAt: new Date().toISOString()
        };
        
      } catch (error) {
        this.stats.failures++;
        logger.error(`GOAT price fetch error: ${error.message}`);
        return { source: 'goat', query, size, lowestPrice: null, error: error.message };
      }
    });
  }

  /**
   * Get trending sneakers
   */
  async getTrending(limit = 20) {
    return this.limiter.schedule(async () => {
      this.stats.requests++;
      
      try {
        const trendingUrl = `${this.baseURL}/sneakers`;
        const response = await this.axios.get(trendingUrl);
        const $ = cheerio.load(response.data);
        
        const trending = [];
        
        $('[data-testid="product-card"], .product-card').slice(0, limit).each((i, elem) => {
          try {
            const $item = $(elem);
            
            const name = $item.find('[class*="name"], h3').first().text().trim();
            const priceText = $item.find('[class*="price"]').first().text().trim();
            const price = this.normalizePrice(priceText);
            const link = $item.find('a').first().attr('href') || '';
            const image = $item.find('img').first().attr('src') || '';
            
            if (name) {
              trending.push({
                name,
                price,
                url: link.startsWith('http') ? link : `${this.baseURL}${link}`,
                image,
                rank: i + 1,
                source: 'goat'
              });
            }
          } catch (err) {
            // Skip
          }
        });

        this.stats.successes++;
        this.stats.lastRun = new Date().toISOString();
        
        return trending;
        
      } catch (error) {
        this.stats.failures++;
        logger.error(`GOAT trending error: ${error.message}`);
        return [];
      }
    });
  }

  /**
   * Normalize price string to number
   */
  normalizePrice(priceStr) {
    if (!priceStr) return null;
    if (typeof priceStr === 'number') return priceStr;
    
    const cleaned = String(priceStr)
      .replace(/[^0-9.,]/g, '')
      .replace(/,/g, '');
    
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  /**
   * Get service stats
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.requests > 0 
        ? `${Math.round((this.stats.successes / this.stats.requests) * 100)}%`
        : 'N/A'
    };
  }
}

module.exports = GOATService;
