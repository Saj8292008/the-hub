const BaseScraper = require('./BaseScraper');
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../../utils/logger');

/**
 * eBay Watch Listings Scraper
 * Scrapes eBay search results for watches
 * Rate limit: Conservative to avoid blocks
 */
class EbayScraper extends BaseScraper {
  constructor() {
    super({
      name: 'eBay Watch Scraper',
      source: 'ebay',
      minTime: 3000, // 3 seconds between requests
      maxConcurrent: 1,
      reservoir: 20, // 20 requests per minute
      reservoirRefreshInterval: 60 * 1000
    });

    this.baseUrl = 'https://www.ebay.com';
    this.searchUrl = 'https://www.ebay.com/sch/i.html';
  }

  /**
   * Scrape watch listings from eBay
   * @param {string} query - Search query (e.g., "Rolex Submariner")
   * @param {Object} options - Search options
   * @param {string} options.condition - new, used, or all
   * @param {string} options.sort - Sort order: BestMatch, EndTimeSoonest, PricePlusShippingLowest, PricePlusShippingHighest
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
      page = 1
    } = options;

    logger.info(`Scraping eBay for: "${query}" (page ${page})`);

    return this.executeWithRetry(async () => {
      // Build search URL
      const params = new URLSearchParams({
        '_nkw': query,
        '_sop': this.getSortCode(sort),
        '_pgn': page
      });

      // Add condition filter
      if (condition === 'new') {
        params.append('LH_ItemCondition', '1000'); // New
      } else if (condition === 'used') {
        params.append('LH_ItemCondition', '3000'); // Used
      }

      // Add price filters
      if (minPrice) {
        params.append('_udlo', minPrice);
      }
      if (maxPrice) {
        params.append('_udhi', maxPrice);
      }

      const url = `${this.searchUrl}?${params.toString()}`;

      // Fetch page with realistic headers
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });

      // Parse HTML
      const $ = cheerio.load(response.data);

      // Extract listings
      const listings = [];
      const items = $('.s-item').not('.s-item--watch-at-corner'); // Skip "watch this item" prompts

      logger.info(`Found ${items.length} items on eBay page ${page}`);

      items.each((index, element) => {
        try {
          const listing = this.parseItem($, $(element), query);
          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          logger.warn(`Failed to parse eBay item ${index}: ${error.message}`);
        }
      });

      logger.info(`Parsed ${listings.length} valid listings from eBay`);

      return {
        listings,
        pagination: {
          currentPage: page,
          hasNextPage: this.hasNextPage($)
        }
      };
    }, `eBay scrape for "${query}"`);
  }

  /**
   * Parse a single eBay item
   */
  parseItem($, item, query) {
    // Skip if it's a header or ad
    if (item.hasClass('s-item--top-level-merchant') || item.hasClass('s-item--ad')) {
      return null;
    }

    // Title
    const title = item.find('.s-item__title').text().trim();
    if (!title || title === '' || title === 'Shop on eBay') {
      return null;
    }

    // Price
    const priceText = item.find('.s-item__price').first().text().trim();
    const price = this.parsePrice(priceText);
    if (!price) {
      return null;
    }

    // URL
    const url = item.find('.s-item__link').attr('href');
    if (!url) {
      return null;
    }

    // Image
    const image = item.find('.s-item__image-img').attr('src');
    const images = image ? [image] : [];

    // Condition
    const conditionText = item.find('.SECONDARY_INFO').text().trim();
    const condition = this.normalizeCondition(conditionText);

    // Location
    const location = item.find('.s-item__location').text().trim().replace('From ', '');

    // Seller info
    const seller = item.find('.s-item__seller-info-text').text().trim();

    // Extract watch info from title
    const watchInfo = this.extractWatchInfo(title, query);

    // Build listing
    const rawData = {
      title: title,
      price: price,
      currency: this.extractCurrency(priceText),
      brand: watchInfo.brand,
      model: watchInfo.model,
      condition: condition,
      location: location,
      url: this.cleanEbayUrl(url),
      images: images,
      seller: seller,
      timestamp: new Date(),
      ebay_condition: conditionText
    };

    return this.normalizeListing(rawData);
  }

  /**
   * Extract watch brand and model from title
   */
  extractWatchInfo(title, query) {
    // Try to extract from query first
    const brand = this.extractBrand(query) !== 'Unknown'
      ? this.extractBrand(query)
      : this.extractBrand(title);

    // Model is typically the rest of the query or title
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
   * Check if there's a next page
   */
  hasNextPage($) {
    const nextButton = $('.pagination__next');
    return nextButton.length > 0 && !nextButton.hasClass('disabled');
  }

  /**
   * Clean eBay URL (remove tracking parameters)
   */
  cleanEbayUrl(url) {
    try {
      const urlObj = new URL(url);
      // Keep only essential params
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

  /**
   * Get details for a specific listing
   * (This would require parsing the individual listing page)
   */
  async getListingDetails(listingUrl) {
    logger.info(`Fetching eBay listing details: ${listingUrl}`);

    return this.executeWithRetry(async () => {
      const response = await axios.get(listingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      // Extract detailed information
      const details = {
        title: $('.x-item-title__mainTitle').text().trim(),
        price: this.parsePrice($('.x-price-primary').text().trim()),
        condition: $('.x-item-condition-text').text().trim(),
        description: $('.x-item-description').text().trim(),
        images: []
      };

      // Extract all images
      $('.ux-image-carousel-item img').each((i, img) => {
        const src = $(img).attr('src');
        if (src && !details.images.includes(src)) {
          details.images.push(src);
        }
      });

      return details;
    }, 'eBay listing details');
  }
}

module.exports = EbayScraper;
