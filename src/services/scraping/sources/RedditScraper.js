const BaseScraper = require('./BaseScraper');
const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * Reddit r/Watchexchange Scraper
 * Uses Reddit's JSON API (no auth required for public posts)
 * Rate limit: ~60 requests per minute
 */
class RedditScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Reddit Watchexchange Scraper',
      source: 'reddit',
      minTime: 2000, // 2 seconds between requests
      maxConcurrent: 1,
      reservoir: 30, // 30 requests per minute
      reservoirRefreshInterval: 60 * 1000
    });

    this.subreddit = 'Watchexchange';
    this.baseUrl = 'https://www.reddit.com';
  }

  /**
   * Scrape watch listings from Reddit
   * @param {Object} options - Search options
   * @param {string} options.sort - Sort method: hot, new, top
   * @param {string} options.time - Time filter for top: hour, day, week, month, year, all
   * @param {number} options.limit - Number of posts to fetch (max 100)
   * @param {string} options.after - Pagination token
   * @returns {Array} Normalized watch listings
   */
  async scrape(query, options = {}) {
    // query parameter is ignored for Reddit (always scrapes r/Watchexchange)
    // but kept for consistent API with other scrapers

    const {
      sort = 'new',
      time = 'week',
      limit = 25,
      after = null
    } = options || {};

    logger.info(`Scraping Reddit r/${this.subreddit} (${sort}, limit: ${limit})`);

    return this.executeWithRetry(async () => {
      // Build URL
      let url = `${this.baseUrl}/r/${this.subreddit}/${sort}.json`;
      const params = new URLSearchParams({ limit: Math.min(limit, 100) });

      if (sort === 'top' && time) {
        params.append('t', time);
      }

      if (after) {
        params.append('after', after);
      }

      url += '?' + params.toString();

      // Fetch data
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TheHubBot/1.0; +https://github.com/yourusername/the-hub)'
        },
        timeout: 10000
      });

      if (!response.data || !response.data.data || !response.data.data.children) {
        throw new Error('Invalid response format from Reddit API');
      }

      const posts = response.data.data.children;
      logger.info(`Found ${posts.length} posts from Reddit`);

      // Filter and parse [WTS] posts
      const listings = [];
      for (const post of posts) {
        const listing = this.parsePost(post.data);
        if (listing) {
          listings.push(listing);
        }
      }

      logger.info(`Parsed ${listings.length} valid [WTS] listings`);

      return {
        listings,
        pagination: {
          after: response.data.data.after,
          before: response.data.data.before
        }
      };
    }, 'Reddit scrape');
  }

  /**
   * Parse a single Reddit post
   */
  parsePost(post) {
    // Only process [WTS] (Watch for Sale) posts
    const title = post.title || '';
    if (!title.toUpperCase().includes('[WTS]')) {
      return null;
    }

    // Extract price from title or selftext
    const price = this.extractPrice(title, post.selftext);
    if (!price) {
      // Skip posts without clear pricing
      return null;
    }

    // Extract watch info from title
    const watchInfo = this.extractWatchInfo(title);

    // Get images
    const images = this.extractImages(post);

    // Build listing
    const rawData = {
      title: title,
      price: price.amount,
      currency: price.currency,
      brand: watchInfo.brand,
      model: watchInfo.model,
      condition: this.extractCondition(title, post.selftext),
      location: this.extractLocation(title, post.selftext),
      url: `${this.baseUrl}${post.permalink}`,
      images: images,
      seller: post.author,
      timestamp: new Date(post.created_utc * 1000),
      reddit_id: post.id,
      reddit_score: post.score,
      reddit_comments: post.num_comments,
      selftext: post.selftext
    };

    return this.normalizeListing(rawData);
  }

  /**
   * Extract price from title or body
   * Looks for patterns like: $1,234, $1234, 1234 USD, etc.
   */
  extractPrice(title, selftext) {
    const text = title + ' ' + (selftext || '');

    // Common price patterns
    const patterns = [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,  // $1,234.56 or $1234
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/i, // 1234 USD
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$/,  // 1234$
      /price[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i // Price: 1234
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
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
    // Remove [WTS] tag
    let cleanTitle = title.replace(/\[WTS\]/gi, '').trim();

    // Try to identify brand
    const brand = this.extractBrand(cleanTitle);

    // Extract model (everything after brand, before price/condition info)
    let model = cleanTitle;
    if (brand !== 'Unknown') {
      const brandIndex = cleanTitle.toUpperCase().indexOf(brand.toUpperCase());
      if (brandIndex !== -1) {
        model = cleanTitle.substring(brandIndex + brand.length).trim();
      }
    }

    // Clean up model (remove price, condition keywords)
    model = model
      .replace(/\$\d+.*$/, '')
      .replace(/\d+\s*USD.*$/i, '')
      .replace(/\b(new|used|mint|excellent|good|fair)\b.*/gi, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    return { brand, model };
  }

  /**
   * Extract condition from post
   */
  extractCondition(title, selftext) {
    const text = (title + ' ' + (selftext || '')).toLowerCase();

    const conditions = {
      'mint': 'mint',
      'bnib': 'new',
      'brand new': 'new',
      'new': 'new',
      'excellent': 'excellent',
      'very good': 'very good',
      'good': 'good',
      'fair': 'fair',
      'used': 'used',
      'worn': 'used'
    };

    for (const [keyword, condition] of Object.entries(conditions)) {
      if (text.includes(keyword)) {
        return condition;
      }
    }

    return 'unknown';
  }

  /**
   * Extract location from post
   */
  extractLocation(title, selftext) {
    const text = title + ' ' + (selftext || '');

    // Look for location patterns: [US-CA], (NYC), Location: NYC
    const patterns = [
      /\[([A-Z]{2}(?:-[A-Z]{2})?)\]/,  // [US-CA], [US]
      /\(([A-Z]{2,3})\)/,               // (NYC), (CA)
      /location[:\s]+([A-Za-z\s,]+)/i   // Location: New York
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * Extract images from post
   */
  extractImages(post) {
    const images = [];

    // Check preview images
    if (post.preview && post.preview.images) {
      for (const image of post.preview.images) {
        if (image.source && image.source.url) {
          // Decode HTML entities in URL
          const url = image.source.url.replace(/&amp;/g, '&');
          images.push(url);
        }
      }
    }

    // Check media metadata (for gallery posts)
    if (post.media_metadata) {
      for (const [key, media] of Object.entries(post.media_metadata)) {
        if (media.s && media.s.u) {
          const url = media.s.u.replace(/&amp;/g, '&');
          images.push(url);
        }
      }
    }

    // Check direct image URL
    if (post.url && (post.url.includes('.jpg') || post.url.includes('.png'))) {
      images.push(post.url);
    }

    return [...new Set(images)]; // Remove duplicates
  }

  /**
   * Search for specific watch models
   * Uses Reddit search API
   */
  async searchWatch(query, options = {}) {
    const { limit = 25, sort = 'new', time = 'all' } = options;

    logger.info(`Searching Reddit for: "${query}"`);

    return this.executeWithRetry(async () => {
      const url = `${this.baseUrl}/r/${this.subreddit}/search.json`;
      const params = new URLSearchParams({
        q: `[WTS] ${query}`,
        restrict_sr: 'on',
        sort: sort,
        t: time,
        limit: Math.min(limit, 100)
      });

      const response = await axios.get(url + '?' + params.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TheHubBot/1.0)'
        },
        timeout: 10000
      });

      if (!response.data || !response.data.data || !response.data.data.children) {
        throw new Error('Invalid response format from Reddit search API');
      }

      const posts = response.data.data.children;
      logger.info(`Found ${posts.length} search results from Reddit`);

      const listings = [];
      for (const post of posts) {
        const listing = this.parsePost(post.data);
        if (listing) {
          listings.push(listing);
        }
      }

      logger.info(`Parsed ${listings.length} valid [WTS] listings from search`);

      return listings;
    }, 'Reddit search');
  }
}

module.exports = RedditScraper;
