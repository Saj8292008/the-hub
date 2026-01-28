/**
 * Chrono24 Scraper
 * 
 * Scrapes watch listings from Chrono24 marketplace
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Bottleneck = require('bottleneck');
const logger = require('../../../utils/logger');
const BaseScraper = require('./BaseScraper');

class Chrono24Scraper extends BaseScraper {
  constructor() {
    super('chrono24', 'Chrono24 Watch Scraper');
    
    this.baseURL = 'https://www.chrono24.com';
    
    // Rate limiting: 1 request per 3 seconds (be respectful)
    this.limiter = new Bottleneck({
      minTime: 3000,
      maxConcurrent: 1
    });

    this.axios = axios.create({
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    });
  }

  /**
   * Build search URL for Chrono24
   */
  buildSearchUrl(query, options = {}) {
    const params = new URLSearchParams();
    
    if (query) {
      params.set('query', query);
    }
    
    // Price filters
    if (options.minPrice) {
      params.set('priceFrom', options.minPrice);
    }
    if (options.maxPrice) {
      params.set('priceTo', options.maxPrice);
    }
    
    // Sort by newest
    params.set('sortorder', '5');
    
    // Results per page
    params.set('pageSize', '60');
    
    return `${this.baseURL}/search/index.htm?${params.toString()}`;
  }

  /**
   * Scrape listings from Chrono24
   */
  async scrape(query = '', options = {}) {
    return this.limiter.schedule(async () => {
      const url = this.buildSearchUrl(query, options);
      logger.info(`Scraping Chrono24: ${url}`);
      this.stats.requests++;

      try {
        const response = await this.axios.get(url);
        const $ = cheerio.load(response.data);
        
        const listings = [];

        // Parse listing cards
        $('article.article-item, div.article-item-container, [data-article-id]').each((i, elem) => {
          try {
            const $item = $(elem);
            
            // Extract listing ID
            const articleId = $item.attr('data-article-id') || 
                            $item.find('[data-article-id]').attr('data-article-id');
            
            // Title
            const title = $item.find('.text-bold, .article-title, h3').first().text().trim();
            
            // Price
            const priceText = $item.find('.text-price-primary, .price, [class*="price"]').first().text().trim();
            const price = this.extractPrice(priceText);
            
            // URL
            let listingUrl = $item.find('a').first().attr('href') || '';
            if (listingUrl && !listingUrl.startsWith('http')) {
              listingUrl = `${this.baseURL}${listingUrl}`;
            }
            
            // Image
            const imageUrl = $item.find('img').first().attr('src') || 
                            $item.find('img').first().attr('data-src') || '';
            
            // Location
            const location = $item.find('.text-muted, .seller-location').first().text().trim();
            
            // Brand/Model extraction from title
            const { brand, model } = this.extractBrandModel(title);
            
            if (title && listingUrl) {
              listings.push({
                source: 'chrono24',
                external_id: articleId || this.generateId(listingUrl),
                title: title.substring(0, 500),
                brand,
                model,
                price,
                currency: 'USD',
                url: listingUrl,
                image_url: imageUrl,
                location: location.substring(0, 100),
                condition: this.extractCondition(title),
                created_at: new Date().toISOString()
              });
            }
          } catch (err) {
            logger.debug(`Error parsing Chrono24 listing: ${err.message}`);
          }
        });

        this.stats.successes++;
        this.stats.lastRun = new Date().toISOString();
        
        logger.info(`Chrono24: Found ${listings.length} listings`);
        return {
          listings,
          source: 'chrono24',
          query,
          scrapedAt: new Date().toISOString()
        };

      } catch (error) {
        this.stats.failures++;
        logger.error(`Chrono24 scrape error: ${error.message}`);
        throw error;
      }
    });
  }

  /**
   * Extract price from text
   */
  extractPrice(text) {
    if (!text) return null;
    
    // Remove currency symbols and extract number
    const cleaned = text.replace(/[^\d.,]/g, '').replace(/,/g, '');
    const price = parseFloat(cleaned);
    
    return isNaN(price) ? null : price;
  }

  /**
   * Extract brand and model from title
   */
  extractBrandModel(title) {
    const brands = [
      'Rolex', 'Omega', 'Tudor', 'Patek Philippe', 'Audemars Piguet',
      'Cartier', 'IWC', 'Jaeger-LeCoultre', 'Breitling', 'TAG Heuer',
      'Panerai', 'Zenith', 'Hublot', 'Grand Seiko', 'Seiko', 'Tissot',
      'Longines', 'Oris', 'Bell & Ross', 'Nomos', 'Sinn', 'Junghans'
    ];
    
    let brand = null;
    let model = title;
    
    for (const b of brands) {
      if (title.toLowerCase().includes(b.toLowerCase())) {
        brand = b;
        model = title.replace(new RegExp(b, 'i'), '').trim();
        break;
      }
    }
    
    return { 
      brand: brand?.substring(0, 100), 
      model: model?.substring(0, 100) 
    };
  }

  /**
   * Extract condition from title
   */
  extractCondition(title) {
    const lower = title.toLowerCase();
    
    if (lower.includes('unworn') || lower.includes('new')) return 'new';
    if (lower.includes('excellent')) return 'excellent';
    if (lower.includes('very good')) return 'very_good';
    if (lower.includes('good')) return 'good';
    if (lower.includes('fair')) return 'fair';
    
    return null;
  }

  /**
   * Generate unique ID from URL
   */
  generateId(url) {
    const match = url.match(/--id(\d+)/);
    return match ? match[1] : `c24-${Date.now()}`;
  }

  /**
   * Scrape popular watch brands
   */
  async scrapePopularBrands(options = {}) {
    const brands = ['Rolex', 'Omega', 'Tudor', 'Grand Seiko', 'Cartier'];
    const allListings = [];

    for (const brand of brands) {
      try {
        const result = await this.scrape(brand, options);
        allListings.push(...result.listings);
        
        // Delay between brands
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        logger.error(`Error scraping ${brand}: ${error.message}`);
      }
    }

    return {
      listings: allListings,
      source: 'chrono24',
      brands,
      scrapedAt: new Date().toISOString()
    };
  }
}

module.exports = Chrono24Scraper;
