/**
 * Amazon Scraper for The Hub
 * 
 * Scrapes Amazon deals for watches and sneakers
 * Uses PA-API if configured, falls back to deals page scraping
 */

const logger = require('../../../utils/logger');

// Amazon deal categories we care about
const CATEGORIES = {
  watches: {
    name: 'Watches',
    browseNode: '377110011',
    keywords: ['watch', 'automatic', 'chronograph', 'diver', 'field watch'],
    searchTerms: [
      'Seiko automatic watch',
      'Orient watch',
      'Tissot watch',
      'Hamilton watch',
      'Citizen Eco-Drive',
      'Casio G-Shock',
      'Invicta Pro Diver',
      'Timex Expedition',
      'Fossil watch men',
      'Bulova watch'
    ]
  },
  sneakers: {
    name: 'Sneakers',
    browseNode: '679255011',
    keywords: ['sneakers', 'running shoes', 'basketball shoes'],
    searchTerms: [
      'Nike Air Max',
      'Adidas Ultraboost',
      'New Balance 990',
      'Jordan retro',
      'Nike Dunk',
      'Adidas Stan Smith',
      'Converse Chuck Taylor',
      'Vans Old Skool',
      'Puma RS-X',
      'Reebok Classic'
    ]
  }
};

// Brand recognition
const WATCH_BRANDS = [
  'Seiko', 'Orient', 'Tissot', 'Hamilton', 'Citizen', 'Casio', 'G-Shock',
  'Timex', 'Fossil', 'Bulova', 'Invicta', 'Stuhrling', 'Victorinox',
  'Luminox', 'Marathon', 'Glycine', 'Alpina', 'Frederique Constant'
];

const SNEAKER_BRANDS = [
  'Nike', 'Adidas', 'Jordan', 'New Balance', 'Puma', 'Reebok', 'Converse',
  'Vans', 'ASICS', 'Saucony', 'Brooks', 'Hoka', 'On Running', 'Salomon'
];

class AmazonScraper {
  constructor(options = {}) {
    this.affiliateTag = process.env.AMAZON_AFFILIATE_TAG || options.affiliateTag || null;
    this.accessKey = process.env.AMAZON_ACCESS_KEY || options.accessKey || null;
    this.secretKey = process.env.AMAZON_SECRET_KEY || options.secretKey || null;
    this.partnerTag = process.env.AMAZON_PARTNER_TAG || this.affiliateTag;
    
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.baseUrl = 'https://www.amazon.com';
    
    // Rate limiting
    this.requestDelay = 2000; // 2 seconds between requests
    this.lastRequest = 0;
  }

  /**
   * Check if PA-API is configured
   */
  hasPAAPI() {
    return !!(this.accessKey && this.secretKey && this.partnerTag);
  }

  /**
   * Add affiliate tag to Amazon URL
   */
  addAffiliateTag(url) {
    if (!this.affiliateTag || !url) return url;
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('tag', this.affiliateTag);
      // Clean up tracking params but keep essential ones
      urlObj.searchParams.delete('ref');
      urlObj.searchParams.delete('ref_');
      return urlObj.toString();
    } catch (e) {
      return url;
    }
  }

  /**
   * Rate-limited fetch
   */
  async throttledFetch(url, options = {}) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.requestDelay) {
      await this.sleep(this.requestDelay - timeSinceLastRequest);
    }
    
    this.lastRequest = Date.now();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        ...options.headers
      }
    });
    
    return response;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract brand from title
   */
  extractBrand(title, category) {
    const brands = category === 'watches' ? WATCH_BRANDS : SNEAKER_BRANDS;
    const titleLower = title.toLowerCase();
    
    for (const brand of brands) {
      if (titleLower.includes(brand.toLowerCase())) {
        return brand;
      }
    }
    return 'Unknown';
  }

  /**
   * Parse deal percentage from text
   */
  parseDealPercent(text) {
    const match = text.match(/(\d+)%\s*off/i);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Calculate deal score for Amazon items
   */
  calculateDealScore(item) {
    let score = 5; // Base score

    // Discount bonus (big discounts = higher score)
    if (item.discount_percent >= 50) score += 3;
    else if (item.discount_percent >= 30) score += 2;
    else if (item.discount_percent >= 20) score += 1;

    // Known brand bonus
    if (item.brand !== 'Unknown') score += 1;

    // Good rating bonus
    if (item.rating >= 4.5) score += 1;
    else if (item.rating >= 4.0) score += 0.5;

    // Review count (popular items)
    if (item.review_count >= 1000) score += 1;
    else if (item.review_count >= 100) score += 0.5;

    // Price sweetspot
    if (item.price >= 50 && item.price <= 500) score += 0.5;

    return Math.min(10, Math.round(score));
  }

  /**
   * Search Amazon via their search page
   * Note: This is for educational purposes - use PA-API for production
   */
  async searchDeals(searchTerm, category = 'watches', limit = 10) {
    const listings = [];
    
    try {
      // Build search URL with deals filter
      const searchUrl = new URL(`${this.baseUrl}/s`);
      searchUrl.searchParams.set('k', searchTerm);
      searchUrl.searchParams.set('deals-widget', 'deals');
      searchUrl.searchParams.set('rh', 'p_n_deal_type:23566065011'); // Today's Deals
      
      logger.info(`Searching Amazon: ${searchTerm}`);
      
      // For now, we'll use a mock approach since direct scraping needs more setup
      // In production, use PA-API or a proper scraping service
      
      // Placeholder - in real implementation, parse the HTML
      // const response = await this.throttledFetch(searchUrl.toString());
      // const html = await response.text();
      // ... parse with cheerio or similar
      
    } catch (error) {
      logger.error(`Amazon search error for "${searchTerm}":`, error.message);
    }
    
    return listings;
  }

  /**
   * Fetch deals using Amazon Product Advertising API
   * Requires: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG
   */
  async fetchWithPAAPI(category = 'watches', limit = 20) {
    if (!this.hasPAAPI()) {
      logger.warn('PA-API not configured. Set AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG');
      return [];
    }

    // PA-API implementation would go here
    // Requires aws4 signing and proper API calls
    // See: https://webservices.amazon.com/paapi5/documentation/
    
    logger.info('PA-API fetch would happen here');
    return [];
  }

  /**
   * Scrape deals from Amazon Deals page
   */
  async scrapeDealsPage(category = 'watches') {
    const listings = [];
    const catConfig = CATEGORIES[category];
    
    if (!catConfig) {
      logger.error(`Unknown category: ${category}`);
      return listings;
    }

    logger.info(`Scraping Amazon deals for: ${catConfig.name}`);

    // For each search term, find deals
    for (const term of catConfig.searchTerms.slice(0, 5)) { // Limit to avoid rate limits
      try {
        const termListings = await this.searchDeals(term, category, 5);
        listings.push(...termListings);
        await this.sleep(this.requestDelay);
      } catch (error) {
        logger.error(`Error searching "${term}":`, error.message);
      }
    }

    return listings;
  }

  /**
   * Main scrape method - tries PA-API first, falls back to scraping
   */
  async scrape(options = {}) {
    const { 
      categories = ['watches', 'sneakers'],
      limit = 50
    } = options;

    let allListings = [];

    for (const category of categories) {
      let listings;

      if (this.hasPAAPI()) {
        listings = await this.fetchWithPAAPI(category, limit);
      } else {
        listings = await this.scrapeDealsPage(category);
      }

      // Add affiliate tags and category
      listings = listings.map(l => ({
        ...l,
        category,
        url: this.addAffiliateTag(l.url),
        affiliate_url: this.addAffiliateTag(l.url),
        has_affiliate: !!this.affiliateTag
      }));

      allListings.push(...listings);
    }

    logger.info(`Amazon scrape complete: ${allListings.length} listings`);
    return allListings;
  }

  /**
   * Create a mock deal for testing (remove in production)
   */
  createMockDeal(category, index) {
    const isWatch = category === 'watches';
    const brands = isWatch ? WATCH_BRANDS : SNEAKER_BRANDS;
    const brand = brands[index % brands.length];
    
    const basePrice = isWatch ? 150 + Math.random() * 300 : 80 + Math.random() * 150;
    const discount = 15 + Math.floor(Math.random() * 35);
    const salePrice = Math.round(basePrice * (1 - discount / 100));
    
    const asin = `B0${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    return {
      source: 'amazon',
      asin,
      title: isWatch 
        ? `${brand} Men's Automatic Watch - Stainless Steel, 42mm`
        : `${brand} Unisex Running Shoes - Breathable Athletic Sneakers`,
      price: salePrice,
      original_price: Math.round(basePrice),
      currency: 'USD',
      discount_percent: discount,
      brand,
      category,
      rating: 4.0 + Math.random() * 0.9,
      review_count: Math.floor(100 + Math.random() * 5000),
      url: `https://www.amazon.com/dp/${asin}`,
      images: [`https://images-na.ssl-images-amazon.com/images/I/${asin}.jpg`],
      prime: Math.random() > 0.3,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate mock deals for development/testing
   */
  async scrapeMock(options = {}) {
    const {
      categories = ['watches', 'sneakers'],
      limit = 20
    } = options;

    const allListings = [];

    for (const category of categories) {
      const count = Math.min(limit, 10);
      
      for (let i = 0; i < count; i++) {
        const deal = this.createMockDeal(category, i);
        deal.deal_score = this.calculateDealScore(deal);
        deal.url = this.addAffiliateTag(deal.url);
        deal.affiliate_url = deal.url;
        deal.has_affiliate = !!this.affiliateTag;
        allListings.push(deal);
      }
    }

    logger.info(`Amazon mock scrape: ${allListings.length} listings`);
    return allListings;
  }
}

module.exports = AmazonScraper;
