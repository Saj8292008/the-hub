const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Proxy Manager - Rotates between free tier services
 * ScraperAPI + Apify + Crawlbase = 7,000 free requests/month
 */
class ProxyManager {
  constructor() {
    // API keys from environment
    this.scraperApiKey = process.env.SCRAPERAPI_KEY;
    this.apifyToken = process.env.APIFY_TOKEN;
    this.crawlbaseToken = process.env.CRAWLBASE_TOKEN;

    // Track usage and failures
    this.usage = {
      scraperapi: 0,
      apify: 0,
      crawlbase: 0
    };

    this.failures = {
      scraperapi: 0,
      apify: 0,
      crawlbase: 0
    };

    // Service configs
    this.services = {
      scraperapi: {
        name: 'ScraperAPI',
        limit: 1000,
        available: !!this.scraperApiKey,
        priority: 1
      },
      apify: {
        name: 'Apify',
        limit: 5000,
        available: !!this.apifyToken,
        priority: 2
      },
      crawlbase: {
        name: 'Crawlbase',
        limit: 1000,
        available: !!this.crawlbaseToken,
        priority: 3
      }
    };
  }

  /**
   * Scrape URL using best available service
   */
  async scrape(url, options = {}) {
    const services = this.getAvailableServices();

    if (services.length === 0) {
      throw new Error('No scraping services configured. Please add API keys to .env');
    }

    let lastError;

    // Try each service in priority order
    for (const service of services) {
      try {
        logger.info(`Scraping with ${this.services[service].name}: ${url}`);

        const result = await this.scrapeWithService(service, url, options);

        // Success!
        this.usage[service]++;
        this.failures[service] = 0; // Reset failure count

        logger.info(`✅ ${this.services[service].name} success (${this.usage[service]}/${this.services[service].limit} used)`);

        return result;

      } catch (error) {
        lastError = error;
        this.failures[service]++;

        logger.warn(`❌ ${this.services[service].name} failed: ${error.message}`);

        // If service has failed 3+ times, skip it temporarily
        if (this.failures[service] >= 3) {
          logger.warn(`⏭️  Skipping ${this.services[service].name} (too many failures)`);
          continue;
        }
      }
    }

    // All services failed
    throw new Error(`All scraping services failed. Last error: ${lastError?.message}`);
  }

  /**
   * Scrape with specific service
   */
  async scrapeWithService(service, url, options) {
    switch (service) {
      case 'scraperapi':
        return await this.scrapeWithScraperAPI(url, options);
      case 'apify':
        return await this.scrapeWithApify(url, options);
      case 'crawlbase':
        return await this.scrapeWithCrawlbase(url, options);
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }

  /**
   * ScraperAPI implementation
   */
  async scrapeWithScraperAPI(url, options = {}) {
    const apiUrl = 'http://api.scraperapi.com';

    const params = {
      api_key: this.scraperApiKey,
      url: url,
      render: options.javascript !== false, // Enable JS rendering by default
      country_code: options.country || 'us'
    };

    const response = await axios.get(apiUrl, {
      params,
      timeout: 30000
    });

    return {
      html: response.data,
      url: url,
      service: 'scraperapi',
      statusCode: response.status
    };
  }

  /**
   * Apify implementation - Using Cheerio Scraper actor
   * This is much simpler and faster than Web Scraper
   */
  async scrapeWithApify(url, options = {}) {
    // Use Apify's Cheerio Scraper - simple and fast
    const actorId = 'apify/cheerio-scraper';

    const input = {
      startUrls: [{ url }],
      globs: [],
      pseudoUrls: [],
      pageFunction: `async function pageFunction(context) {
        const $ = context.$;
        return {
          url: context.request.url,
          html: $.html()
        };
      }`
    };

    // Run actor synchronously
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${this.apifyToken}`;

    const response = await axios.post(runUrl, input, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No data returned from Apify');
    }

    const result = response.data[0];

    return {
      html: result.html,
      url: url,
      service: 'apify',
      statusCode: 200
    };
  }

  /**
   * Crawlbase implementation
   */
  async scrapeWithCrawlbase(url, options = {}) {
    const apiUrl = 'https://api.crawlbase.com/';

    const params = {
      token: this.crawlbaseToken,
      url: url,
      ajax_wait: options.javascript !== false,
      page_wait: 2000
    };

    const response = await axios.get(apiUrl, {
      params,
      timeout: 30000
    });

    return {
      html: response.data,
      url: url,
      service: 'crawlbase',
      statusCode: response.status
    };
  }

  /**
   * Get available services sorted by priority
   */
  getAvailableServices() {
    return Object.keys(this.services)
      .filter(key => this.services[key].available)
      .filter(key => this.usage[key] < this.services[key].limit)
      .sort((a, b) => this.services[a].priority - this.services[b].priority);
  }

  /**
   * Check if any service is available
   */
  isAvailable() {
    return this.getAvailableServices().length > 0;
  }

  /**
   * Get usage statistics
   */
  getStats() {
    const stats = {};

    for (const [key, service] of Object.entries(this.services)) {
      if (service.available) {
        stats[key] = {
          name: service.name,
          used: this.usage[key],
          limit: service.limit,
          remaining: service.limit - this.usage[key],
          failures: this.failures[key]
        };
      }
    }

    return stats;
  }

  /**
   * Reset monthly usage counters
   */
  resetUsage() {
    logger.info('Resetting monthly scraping usage counters');
    this.usage = {
      scraperapi: 0,
      apify: 0,
      crawlbase: 0
    };
    this.failures = {
      scraperapi: 0,
      apify: 0,
      crawlbase: 0
    };
  }
}

// Singleton instance
const proxyManager = new ProxyManager();

module.exports = proxyManager;
