const BaseScraper = require('./BaseScraper');
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../../utils/logger');

/**
 * WatchUSeek Forum Scraper
 * Scrapes the Sales Corner for watch listings
 * Rate limit: Conservative (forum sites are sensitive)
 */
class WatchUSeekScraper extends BaseScraper {
  constructor() {
    super({
      name: 'WatchUSeek Sales Scraper',
      source: 'watchuseek',
      minTime: 4000, // 4 seconds between requests (forums are sensitive)
      maxConcurrent: 1,
      reservoir: 15, // 15 requests per minute
      reservoirRefreshInterval: 60 * 1000
    });

    this.baseUrl = 'https://www.watchuseek.com';
    this.salesForumUrl = 'https://www.watchuseek.com/forums/watches-private-sellers-and-sponsors.29/';
  }

  /**
   * Scrape watch listings from WatchUSeek Sales Corner
   * @param {Object} options - Search options
   * @param {number} options.page - Page number (default 1)
   * @param {string} options.order - Sort order: post_date, reply_count, view_count
   * @returns {Array} Normalized watch listings
   */
  async scrape(query, options = {}) {
    // query parameter is ignored for general scraping
    // but kept for consistent API with other scrapers

    const { page = 1, order = 'post_date' } = options || {};

    logger.info(`Scraping WatchUSeek Sales Corner (page ${page})`);

    return this.executeWithRetry(async () => {
      // Build URL
      let url = this.salesForumUrl;
      if (page > 1) {
        url += `page-${page}`;
      }

      // Fetch page with realistic headers
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': this.baseUrl
        },
        timeout: 15000
      });

      // Parse HTML
      const $ = cheerio.load(response.data);

      // Extract listings (forum threads)
      const listings = [];
      const threads = $('.structItem--thread');

      logger.info(`Found ${threads.length} threads on WatchUSeek page ${page}`);

      threads.each((index, element) => {
        try {
          const listing = this.parseThread($, $(element));
          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          logger.warn(`Failed to parse WatchUSeek thread ${index}: ${error.message}`);
        }
      });

      logger.info(`Parsed ${listings.length} valid listings from WatchUSeek`);

      return {
        listings,
        pagination: {
          currentPage: page,
          hasNextPage: this.hasNextPage($)
        }
      };
    }, 'WatchUSeek scrape');
  }

  /**
   * Parse a single forum thread
   */
  parseThread($, thread) {
    // Find the title link - look for the <a> with actual text content
    const titleContainer = thread.find('.structItem-title');
    const links = titleContainer.find('a');
    
    let title = '';
    let url = '';
    
    // Find the link that has the actual title text (not just icons)
    links.each((i, el) => {
      const linkText = $(el).text().trim();
      const linkHref = $(el).attr('href');
      if (linkText && linkText.length > 5 && linkHref && linkHref.includes('/threads/')) {
        title = linkText;
        url = linkHref;
      }
    });

    if (!title || title === '') {
      return null;
    }

    // Only process sale threads (look for FS, WTS, SOLD keywords)
    const upperTitle = title.toUpperCase();
    const isSaleThread = upperTitle.includes('FS') ||
                         upperTitle.includes('WTS') ||
                         upperTitle.includes('[SOLD]') ||
                         upperTitle.includes('FOR SALE');

    if (!isSaleThread) {
      return null;
    }

    // URL
    if (!url) {
      return null;
    }

    const fullUrl = url.startsWith('http') ? url : this.baseUrl + url;

    // Extract price from title
    const price = this.extractPrice(title);

    // Seller (author)
    const seller = thread.find('.username').first().text().trim();

    // Date
    const dateText = thread.find('.structItem-startDate time').attr('datetime');
    const timestamp = dateText ? new Date(dateText) : new Date();

    // View count and reply count (for popularity metric)
    const replies = parseInt(thread.find('.structItem-cell--meta dd').first().text().trim()) || 0;
    const views = parseInt(thread.find('.structItem-cell--meta dd').last().text().trim()) || 0;

    // Extract watch info from title
    const watchInfo = this.extractWatchInfo(title);

    // Check if sold
    const isSold = upperTitle.includes('SOLD') || upperTitle.includes('[SOLD]');

    // Build listing
    const rawData = {
      title: title,
      price: price?.amount || null,
      currency: price?.currency || 'USD',
      brand: watchInfo.brand,
      model: watchInfo.model,
      condition: this.extractCondition(title),
      location: '', // Would need to parse thread content for location
      url: fullUrl,
      images: [], // Would need to fetch thread content for images
      seller: seller,
      timestamp: timestamp,
      forum_replies: replies,
      forum_views: views,
      is_sold: isSold
    };

    return this.normalizeListing(rawData);
  }

  /**
   * Extract price from title
   * WatchUSeek format: [FS] Brand Model - $1234
   */
  extractPrice(title) {
    // Common price patterns in forum titles
    const patterns = [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,  // $1,234.56 or $1234
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/i, // 1234 USD
      /price[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, // Price: 1234
      /-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/  // - $1234
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return {
          amount: this.parsePrice(match[1]),
          currency: this.extractCurrency(match[0])
        };
      }
    }

    return null;
  }

  /**
   * Extract watch brand and model from title
   */
  extractWatchInfo(title) {
    // Remove sale tags
    let cleanTitle = title
      .replace(/\[FS\]/gi, '')
      .replace(/\[WTS\]/gi, '')
      .replace(/\[SOLD\]/gi, '')
      .replace(/FOR SALE/gi, '')
      .trim();

    // Extract brand
    const brand = this.extractBrand(cleanTitle);

    // Extract model (everything after brand, before price/condition)
    let model = cleanTitle;
    if (brand !== 'Unknown') {
      const brandIndex = cleanTitle.toUpperCase().indexOf(brand.toUpperCase());
      if (brandIndex !== -1) {
        model = cleanTitle.substring(brandIndex + brand.length).trim();
      }
    }

    // Clean up model
    model = model
      .replace(/\$\d+.*$/, '')
      .replace(/\d+\s*USD.*$/i, '')
      .replace(/-\s*$/, '')
      .replace(/\b(new|used|mint|excellent|bnib)\b.*/gi, '')
      .trim();

    return { brand, model };
  }

  /**
   * Extract condition from title
   */
  extractCondition(title) {
    const text = title.toLowerCase();

    if (text.includes('bnib') || text.includes('brand new')) return 'new';
    if (text.includes('mint')) return 'mint';
    if (text.includes('excellent')) return 'excellent';
    if (text.includes('very good')) return 'very good';
    if (text.includes('good')) return 'good';
    if (text.includes('used')) return 'used';

    return 'unknown';
  }

  /**
   * Check if there's a next page
   */
  hasNextPage($) {
    const nextButton = $('.pageNav-jump--next');
    return nextButton.length > 0;
  }

  /**
   * Get detailed information from a specific thread
   * Fetches the thread page to extract full description and images
   */
  async getThreadDetails(threadUrl) {
    logger.info(`Fetching WatchUSeek thread details: ${threadUrl}`);

    return this.executeWithRetry(async () => {
      const response = await axios.get(threadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': this.salesForumUrl
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      // Get first post (original post)
      const firstPost = $('.message--post').first();

      // Extract content
      const content = firstPost.find('.bbWrapper').text().trim();

      // Extract images
      const images = [];
      firstPost.find('.bbWrapper img').each((i, img) => {
        const src = $(img).attr('src');
        if (src && src.startsWith('http')) {
          images.push(src);
        }
      });

      // Extract location if mentioned
      const location = this.extractLocationFromContent(content);

      return {
        content,
        images,
        location
      };
    }, 'WatchUSeek thread details');
  }

  /**
   * Extract location from content
   */
  extractLocationFromContent(content) {
    const patterns = [
      /location[:\s]+([A-Za-z\s,]+)/i,
      /ship\s+from[:\s]+([A-Za-z\s,]+)/i,
      /located\s+in[:\s]+([A-Za-z\s,]+)/i
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim().split(/[,\n]/)[0]; // Get first part before comma/newline
      }
    }

    return '';
  }

  /**
   * Search for a specific watch model
   */
  async searchWatch(query, options = {}) {
    const { page = 1 } = options;

    logger.info(`Searching WatchUSeek for: "${query}"`);

    return this.executeWithRetry(async () => {
      // WatchUSeek search URL
      const searchUrl = `${this.baseUrl}/search/${encodeURIComponent(query)}`;
      const params = new URLSearchParams({
        'o': 'date', // Order by date
        'c[node]': '29' // Watches - Private Sellers and Sponsors forum ID
      });

      if (page > 1) {
        params.append('page', page);
      }

      const url = `${searchUrl}?${params.toString()}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Referer': this.baseUrl
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);

      // Parse search results
      const listings = [];
      const results = $('.contentRow-main');

      results.each((index, element) => {
        try {
          const titleElement = $(element).find('.contentRow-title a');
          const title = titleElement.text().trim();
          const url = titleElement.attr('href');

          if (title && url) {
            const fullUrl = url.startsWith('http') ? url : this.baseUrl + '/' + url.replace(/^\//, '');
            const watchInfo = this.extractWatchInfo(title);
            const price = this.extractPrice(title);

            const rawData = {
              title,
              price: price?.amount || null,
              currency: price?.currency || 'USD',
              brand: watchInfo.brand,
              model: watchInfo.model,
              condition: this.extractCondition(title),
              location: '',
              url: fullUrl,
              images: [],
              seller: '',
              timestamp: new Date()
            };

            listings.push(this.normalizeListing(rawData));
          }
        } catch (error) {
          logger.warn(`Failed to parse search result ${index}: ${error.message}`);
        }
      });

      logger.info(`Found ${listings.length} search results from WatchUSeek`);
      return listings;
    }, `WatchUSeek search for "${query}"`);
  }
}

module.exports = WatchUSeekScraper;
