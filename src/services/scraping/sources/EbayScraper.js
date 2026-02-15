const BaseScraper = require('./BaseScraper');
const browserManager = require('../browserManager');
const logger = require('../../../utils/logger');

/**
 * eBay Watch Listings Scraper (Browser-based)
 * Uses Puppeteer with stealth mode to bypass bot detection
 * Rate limit: Conservative to avoid blocks
 */
class EbayScraper extends BaseScraper {
  constructor() {
    super({
      name: 'eBay Watch Scraper',
      source: 'ebay',
      minTime: 5000, // 5 seconds between requests (longer for browser automation)
      maxConcurrent: 1,
      reservoir: 15, // 15 requests per hour (more conservative)
      reservoirRefreshInterval: 60 * 60 * 1000 // 1 hour
    });

    this.baseUrl = 'https://www.ebay.com';
    this.searchUrl = 'https://www.ebay.com/sch/i.html';
  }

  /**
   * Scrape watch listings from eBay using browser automation
   * @param {string} query - Search query (e.g., "Rolex Submariner")
   * @param {Object} options - Search options
   * @param {string} options.condition - new, used, or all
   * @param {string} options.sort - Sort order
   * @param {number} options.minPrice - Minimum price
   * @param {number} options.maxPrice - Maximum price
   * @param {number} options.page - Page number (default 1)
   * @returns {Array} Normalized watch listings
   */
  async scrape(query, options = {}) {
    const {
      condition = 'all',
      sort = 'BestMatch',
      minPrice = null,
      maxPrice = null,
      page: pageNum = 1
    } = options;

    logger.info(`Scraping eBay for: "${query}" (page ${pageNum}) using browser automation`);

    return this.executeWithRetry(async () => {
      // Build search URL
      const params = new URLSearchParams({
        '_nkw': query,
        '_sop': this.getSortCode(sort),
        '_pgn': pageNum
      });

      // Add condition filter
      if (condition === 'new') {
        params.append('LH_ItemCondition', '1000');
      } else if (condition === 'used') {
        params.append('LH_ItemCondition', '3000');
      }

      // Add price filters
      if (minPrice) {
        params.append('_udlo', minPrice);
      }
      if (maxPrice) {
        params.append('_udhi', maxPrice);
      }

      const url = `${this.searchUrl}?${params.toString()}`;

      // Create browser page
      const browserPage = await browserManager.createPage();

      try {
        // Navigate to eBay search
        await browserManager.navigateWithRetry(browserPage, url);

        // Check if blocked
        const blocked = await browserManager.isBlocked(browserPage);
        if (blocked) {
          logger.error('eBay is blocking our request - need to implement CAPTCHA solver or wait longer');
          throw new Error('eBay bot detection triggered');
        }

        // Wait for results to load
        await browserPage.waitForSelector('ul.srp-results, .srp-river-results', { timeout: 10000 });

        // Extract listings using page.evaluate for better performance
        const listings = await browserPage.evaluate((query) => {
          const results = [];
          
          // Try multiple selectors that eBay might use
          let items = document.querySelectorAll('li.s-item');
          
          // If s-item doesn't work, try other selectors
          if (items.length === 0) {
            items = document.querySelectorAll('ul.srp-results > li');
          }
          
          items.forEach((item, index) => {
            try {
              // Skip ads and promoted items
              if (item.classList.contains('s-item--top-level-merchant') || 
                  item.classList.contains('s-item--ad')) {
                return;
              }

              // Title
              const titleEl = item.querySelector('.s-item__title, h3');
              const title = titleEl ? titleEl.textContent.trim() : '';
              
              if (!title || title === '' || title === 'Shop on eBay') {
                return;
              }

              // URL
              const linkEl = item.querySelector('.s-item__link, a[href*="/itm/"]');
              const url = linkEl ? linkEl.getAttribute('href') : '';
              
              if (!url) {
                return;
              }

              // Price
              const priceEl = item.querySelector('.s-item__price');
              let priceText = priceEl ? priceEl.textContent.trim() : '';
              
              // Remove "to" for price ranges, take the first price
              if (priceText.includes('to')) {
                priceText = priceText.split('to')[0].trim();
              }
              
              // Extract numeric price
              const priceMatch = priceText.match(/[\d,]+\.?\d*/);
              const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
              
              if (!price || price <= 0) {
                return;
              }

              // Image
              const imgEl = item.querySelector('.s-item__image-img, img');
              const image = imgEl ? imgEl.getAttribute('src') : '';
              
              // Condition
              const conditionEl = item.querySelector('.SECONDARY_INFO');
              const condition = conditionEl ? conditionEl.textContent.trim() : '';

              // Location
              const locationEl = item.querySelector('.s-item__location, .s-item__itemLocation');
              let location = locationEl ? locationEl.textContent.trim() : '';
              location = location.replace('From ', '').replace('from ', '');

              // Seller
              const sellerEl = item.querySelector('.s-item__seller-info-text');
              const seller = sellerEl ? sellerEl.textContent.trim() : '';

              results.push({
                title,
                price,
                currency: 'USD',
                url,
                images: image ? [image] : [],
                condition,
                location,
                seller,
                rawCondition: condition,
                query
              });
            } catch (error) {
              console.error(`Error parsing item ${index}:`, error.message);
            }
          });

          return results;
        }, query);

        logger.info(`Parsed ${listings.length} valid listings from eBay`);

        // Close the page
        await browserPage.close();

        // Normalize listings
        const normalizedListings = listings.map(listing => {
          const watchInfo = this.extractWatchInfo(listing.title, query);
          
          return this.normalizeListing({
            ...listing,
            brand: watchInfo.brand,
            model: watchInfo.model,
            condition: this.normalizeCondition(listing.rawCondition),
            url: this.cleanEbayUrl(listing.url),
            timestamp: new Date()
          });
        });

        return {
          listings: normalizedListings,
          pagination: {
            currentPage: pageNum,
            hasNextPage: listings.length > 0 // Simplified check
          }
        };

      } catch (error) {
        // Make sure to close the page on error
        try {
          await browserPage.close();
        } catch (closeError) {
          logger.error(`Error closing page: ${closeError.message}`);
        }
        throw error;
      }

    }, `eBay scrape for "${query}"`);
  }

  /**
   * Extract watch brand and model from title
   */
  extractWatchInfo(title, query) {
    const brand = this.extractBrand(query) !== 'Unknown'
      ? this.extractBrand(query)
      : this.extractBrand(title);

    let model = query;
    if (brand !== 'Unknown') {
      model = query.replace(new RegExp(brand, 'gi'), '').trim();
    }

    return { brand, model };
  }

  /**
   * Normalize eBay condition strings
   */
  normalizeCondition(conditionText) {
    const text = conditionText.toLowerCase();

    if (text.includes('new') || text.includes('brand new')) return 'new';
    if (text.includes('open box')) return 'open box';
    if (text.includes('excellent') || text.includes('like new')) return 'excellent';
    if (text.includes('very good')) return 'very good';
    if (text.includes('good')) return 'good';
    if (text.includes('acceptable') || text.includes('fair')) return 'fair';
    if (text.includes('used')) return 'used';
    if (text.includes('refurbished')) return 'refurbished';
    if (text.includes('for parts')) return 'parts';

    return 'unknown';
  }

  /**
   * Get eBay sort code
   */
  getSortCode(sort) {
    const sortCodes = {
      'BestMatch': '12',
      'EndTimeSoonest': '1',
      'PricePlusShippingLowest': '15',
      'PricePlusShippingHighest': '16',
      'Newest': '10'
    };

    return sortCodes[sort] || '12';
  }

  /**
   * Clean eBay URL (remove tracking parameters)
   */
  cleanEbayUrl(url) {
    try {
      const urlObj = new URL(url);
      const cleanUrl = urlObj.origin + urlObj.pathname;
      return cleanUrl;
    } catch {
      return url;
    }
  }

  /**
   * Search for a specific watch model
   */
  async searchWatch(brand, model, options = {}) {
    const query = `${brand} ${model} watch`.trim();
    return this.scrape(query, options);
  }
}

module.exports = EbayScraper;
