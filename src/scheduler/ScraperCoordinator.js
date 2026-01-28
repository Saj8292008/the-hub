const EnhancedScheduler = require('./EnhancedScheduler');
const ScraperManager = require('../services/scraping/ScraperManager');
const supabase = require('../db/supabase');
const localWatchListings = require('../db/localWatchListings');
const logger = require('../utils/logger');
const AlertManager = require('../notifications/alertManager');
const Notifier = require('../notifications/notifier');

/**
 * Scraper Coordinator
 * Manages all scraping jobs with smart scheduling, rate limiting, and monitoring
 */
class ScraperCoordinator {
  constructor(io = null, telegramBot = null) {
    this.scheduler = new EnhancedScheduler({
      maxRetries: 3,
      retryDelay: 5000,
      maxConcurrent: 2 // Don't hammer sources
    });

    this.scraperManager = new ScraperManager();
    this.io = io; // WebSocket for real-time updates

    // Initialize alert system
    this.alertManager = new AlertManager();
    this.notifier = new Notifier(telegramBot, process.env.TELEGRAM_ADMIN_CHAT_ID);

    // Source configurations with rate limits
    this.sourceConfig = {
      reddit: {
        schedule: '*/15 * * * *', // Every 15 minutes
        rateLimit: { max: 4, window: 3600000 }, // 4 per hour
        minInterval: 900000, // 15 minutes minimum
        priority: 8, // High priority (fast-moving content)
        enabled: true
      },
      ebay: {
        schedule: '*/30 * * * *', // Every 30 minutes
        rateLimit: { max: 2, window: 3600000 }, // 2 per hour
        minInterval: 1800000, // 30 minutes minimum
        priority: 6,
        enabled: true
      },
      watchuseek: {
        schedule: '0 * * * *', // Every hour
        rateLimit: { max: 1, window: 3600000 }, // 1 per hour
        minInterval: 3600000, // 1 hour minimum
        priority: 4,
        enabled: true
      }
    };

    // Track last scrape times
    this.lastScrapeTimes = new Map();

    // Track source health
    this.sourceHealth = new Map();

    // Initialize source health
    Object.keys(this.sourceConfig).forEach(source => {
      this.sourceHealth.set(source, {
        enabled: true,
        consecutiveFailures: 0,
        lastSuccess: null,
        lastFailure: null,
        avgResponseTime: 0,
        totalRequests: 0
      });
    });

    // Setup event listeners
    this.setupEventListeners();

    // Register jobs
    this.registerJobs();
  }

  /**
   * Setup event listeners for monitoring
   */
  setupEventListeners() {
    this.scheduler.on('job:success', ({ jobName, duration, result }) => {
      logger.info(`📊 Job success: ${jobName} completed in ${duration}ms`);

      // Update source health
      const source = jobName.replace('scrape:', '');
      const health = this.sourceHealth.get(source);
      if (health) {
        health.consecutiveFailures = 0;
        health.lastSuccess = new Date();
        health.totalRequests++;
        health.avgResponseTime = (health.avgResponseTime * (health.totalRequests - 1) + duration) / health.totalRequests;
      }

      // Broadcast via WebSocket
      if (this.io) {
        this.io.emit('scraper:success', {
          source,
          duration,
          timestamp: new Date()
        });
      }
    });

    this.scheduler.on('job:failure', ({ jobName, error }) => {
      logger.error(`📊 Job failure: ${jobName} - ${error.message}`);

      // Update source health
      const source = jobName.replace('scrape:', '');
      const health = this.sourceHealth.get(source);
      if (health) {
        health.consecutiveFailures++;
        health.lastFailure = new Date();
        health.totalRequests++;

        // Disable source if too many failures
        if (health.consecutiveFailures >= 5) {
          logger.error(`🚫 Disabling source ${source} due to ${health.consecutiveFailures} consecutive failures`);
          health.enabled = false;
          this.sourceConfig[source].enabled = false;

          // TODO: Send admin alert
          this.sendAdminAlert(`Source ${source} has been disabled due to consecutive failures`);
        }
      }

      // Broadcast via WebSocket
      if (this.io) {
        this.io.emit('scraper:failure', {
          source,
          error: error.message,
          timestamp: new Date()
        });
      }
    });

    this.scheduler.on('job:disabled', ({ jobName }) => {
      logger.error(`🚫 Job disabled: ${jobName}`);
      this.sendAdminAlert(`Scraping job ${jobName} has been disabled due to excessive failures`);
    });
  }

  /**
   * Register all scraping jobs
   */
  registerJobs() {
    for (const [source, config] of Object.entries(this.sourceConfig)) {
      if (!config.enabled) continue;

      const jobName = `scrape:${source}`;

      this.scheduler.registerJob(
        jobName,
        config.schedule,
        () => this.scrapeSource(source),
        {
          retries: 3,
          timeout: 120000, // 2 minutes
          rateLimit: config.rateLimit,
          minInterval: config.minInterval,
          priority: config.priority
        }
      );

      logger.info(`✅ Registered scraper: ${source} (${config.schedule})`);
    }

    logger.info(`✅ Registered ${Object.keys(this.sourceConfig).length} scraping jobs`);
  }

  /**
   * Scrape a specific source with smart logic
   */
  async scrapeSource(source) {
    logger.info(`🔍 Starting scrape: ${source}`);

    // Check source health
    const health = this.sourceHealth.get(source);
    if (health && !health.enabled) {
      throw new Error(`Source ${source} is disabled`);
    }

    // Check if we scraped too recently (database check)
    const shouldSkip = await this.shouldSkipScrape(source);
    if (shouldSkip) {
      logger.info(`⏭️  Skipping ${source} - scraped recently`);
      return { skipped: true, reason: 'scraped recently' };
    }

    // Check if during low-traffic hours
    if (this.isLowTrafficHours() && source !== 'reddit') {
      logger.info(`⏭️  Skipping ${source} - low traffic hours`);
      return { skipped: true, reason: 'low traffic hours' };
    }

    try {
      // Add random delay (anti-ban)
      await this.randomDelay();

      let result;

      if (source === 'reddit') {
        result = await this.scraperManager.scrapeSource(source, null, {
          sort: 'new',
          limit: 50
        });
      } else if (source === 'ebay') {
        result = await this.scraperManager.scrapeSource(source, 'luxury watch', {
          condition: 'all',
          minPrice: 1000
        });
      } else if (source === 'watchuseek') {
        result = await this.scraperManager.scrapeSource(source, null, {
          page: 1
        });
      }

      const listings = result.listings || result || [];
      logger.info(`✅ Scraped ${listings.length} listings from ${source}`);

      // Save to database (batch insert)
      if (listings.length > 0) {
        const savedCount = await this.saveListings(listings);
        logger.info(`💾 Saved ${savedCount} new/updated listings`);

        // Check for alert triggers
        await this.checkAlertTriggers(listings);

        // Broadcast via WebSocket
        if (this.io) {
          this.io.emit('scraper:newListings', {
            source,
            count: listings.length,
            savedCount,
            timestamp: new Date()
          });
        }
      }

      // Update last scrape time
      this.lastScrapeTimes.set(source, Date.now());

      return {
        source,
        count: listings.length,
        saved: listings.length,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error(`❌ Failed to scrape ${source}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if we should skip scraping (database check)
   */
  async shouldSkipScrape(source) {
    try {
      // Check last scrape time from database
      if (supabase.isAvailable()) {
        const { data, error } = await supabase.client
          .from('scraper_runs')
          .select('created_at')
          .eq('source', source)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const lastRun = new Date(data[0].created_at);
          const timeSinceLastRun = Date.now() - lastRun.getTime();
          const minInterval = this.sourceConfig[source]?.minInterval || 900000;

          if (timeSinceLastRun < minInterval) {
            return true;
          }
        }
      }

      // Check memory cache
      const lastRun = this.lastScrapeTimes.get(source);
      if (lastRun) {
        const timeSinceLastRun = Date.now() - lastRun;
        const minInterval = this.sourceConfig[source]?.minInterval || 900000;

        if (timeSinceLastRun < minInterval) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error(`Error checking last scrape time: ${error.message}`);
      return false; // Don't skip on error
    }
  }

  /**
   * Check if during low-traffic hours (2am-6am local time)
   */
  isLowTrafficHours() {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
  }

  /**
   * Random delay for anti-ban (2-5 seconds)
   */
  async randomDelay() {
    const delay = 2000 + Math.random() * 3000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Save listings to database with upsert logic
   */
  async saveListings(listings) {
    try {
      // Truncate strings to fit DB column limits
      const truncate = (str, maxLen) => str ? String(str).substring(0, maxLen) : str;
      
      // Only include fields that exist in the watch_listings table
      // Note: DB schema has model/location as VARCHAR(100)
      const sanitizedListings = listings.map(l => ({
        source: truncate(l.source, 50),
        title: l.title,
        price: l.price,
        currency: truncate(l.currency || 'USD', 10),
        brand: truncate(l.brand, 100),
        model: truncate(l.model, 100),
        condition: truncate(l.condition, 50),
        location: truncate(l.location, 100),
        url: l.url,
        images: l.images,
        timestamp: l.timestamp
      }));

      let savedCount = 0;

      if (supabase.isAvailable()) {
        // Batch upsert to Supabase
        const result = await supabase.upsertWatchListingsBatch(sanitizedListings);
        savedCount = result.data?.length || 0;
      } else {
        // Use local storage
        const result = await localWatchListings.addWatchListingsBatch(sanitizedListings);
        savedCount = result.data?.length || 0;
      }

      return savedCount;
    } catch (error) {
      logger.error(`Error saving listings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for alert triggers
   */
  async checkAlertTriggers(listings) {
    try {
      if (!listings || listings.length === 0) {
        return;
      }

      logger.info(`🔔 Checking ${listings.length} listings for alerts...`);

      const alerts = [];

      // Check each listing for price alerts
      for (const listing of listings) {
        // Skip if no price data
        if (!listing.price || !listing.id) {
          continue;
        }

        // Determine item type from listing data
        let itemType = 'watch'; // Default
        if (listing.source) {
          const source = listing.source.toLowerCase();
          if (source.includes('autotrader') || source.includes('car')) {
            itemType = 'car';
          } else if (source.includes('stockx') || source.includes('sneaker')) {
            itemType = 'sneaker';
          }
        }

        // Create a simplified item object for alert checking
        const item = {
          id: listing.id,
          brand: listing.brand,
          model: listing.model,
          name: listing.title || listing.name,
          targetPrice: listing.targetPrice || listing.target_price
        };

        // Skip if no target price set
        if (!item.targetPrice) {
          continue;
        }

        // Check if alert should be triggered
        const alert = await this.alertManager.checkPriceAlert(
          itemType,
          item,
          listing.price
        );

        if (alert) {
          alerts.push(alert);
          logger.info(`🎯 Alert triggered: ${item.brand || ''} ${item.model || item.name} - $${listing.price} (target: $${item.targetPrice})`);
        }
      }

      // Send batch alerts if any triggered
      if (alerts.length > 0) {
        logger.info(`📧 Sending ${alerts.length} alerts...`);
        const result = await this.notifier.sendBatchAlerts(alerts);
        logger.info(`✅ Alerts sent: ${result.sent} successful, ${result.failed} failed`);

        // Broadcast via WebSocket
        if (this.io) {
          this.io.emit('alerts:triggered', {
            count: alerts.length,
            alerts: alerts.map(a => ({
              itemType: a.itemType,
              itemId: a.item.id,
              currentPrice: a.currentPrice,
              targetPrice: a.targetPrice
            })),
            timestamp: new Date()
          });
        }
      } else {
        logger.info('No alerts triggered');
      }

    } catch (error) {
      logger.error(`Error checking alerts: ${error.message}`, { stack: error.stack });
    }
  }

  /**
   * Send alert to admin
   */
  async sendAdminAlert(message) {
    logger.warn(`🚨 Admin alert: ${message}`);

    try {
      if (this.notifier) {
        await this.notifier.sendMessage(`🚨 *Admin Alert*\n\n${message}`, {
          parse_mode: 'Markdown'
        });
      } else {
        logger.warn('Notifier not available - alert not sent via Telegram');
      }
    } catch (error) {
      logger.error(`Failed to send admin alert: ${error.message}`);
    }
  }

  /**
   * Start the coordinator
   */
  start() {
    logger.info('🚀 Starting Scraper Coordinator...');
    this.scheduler.start();

    // Run initial scrape if configured
    if (process.env.SCRAPER_RUN_ON_START === 'true') {
      logger.info('Running initial scrape in 10 seconds...');
      setTimeout(() => this.runAll(), 10000);
    }
  }

  /**
   * Stop the coordinator
   */
  stop() {
    logger.info('⏹️  Stopping Scraper Coordinator...');
    this.scheduler.stop();
  }

  /**
   * Pause all scraping
   */
  pause() {
    logger.info('⏸️  Pausing all scraping...');
    this.scheduler.pause();
  }

  /**
   * Resume scraping
   */
  resume() {
    logger.info('▶️  Resuming scraping...');
    this.scheduler.resume();
  }

  /**
   * Manually trigger a source
   */
  async triggerSource(source) {
    const jobName = `scrape:${source}`;
    return await this.scheduler.trigger(jobName);
  }

  /**
   * Run all scrapers immediately
   */
  async runAll() {
    logger.info('🔄 Running all scrapers...');

    const results = [];
    for (const source of Object.keys(this.sourceConfig)) {
      if (this.sourceConfig[source].enabled) {
        const result = await this.triggerSource(source);
        results.push({ source, ...result });
      }
    }

    return results;
  }

  /**
   * Re-enable a disabled source
   */
  enableSource(source) {
    const health = this.sourceHealth.get(source);
    if (health) {
      health.enabled = true;
      health.consecutiveFailures = 0;
      this.sourceConfig[source].enabled = true;
      this.scheduler.enableJob(`scrape:${source}`);
      logger.info(`✅ Re-enabled source: ${source}`);
      return true;
    }
    return false;
  }

  /**
   * Get coordinator status
   */
  getStatus() {
    const schedulerStats = this.scheduler.getStats();

    // Add source health
    const sources = {};
    for (const [source, health] of this.sourceHealth.entries()) {
      sources[source] = {
        ...health,
        schedule: this.sourceConfig[source]?.schedule,
        lastScrape: this.lastScrapeTimes.get(source) || null
      };
    }

    return {
      scheduler: schedulerStats,
      sources,
      totalSources: Object.keys(this.sourceConfig).length,
      enabledSources: Object.values(this.sourceConfig).filter(c => c.enabled).length,
      timestamp: new Date()
    };
  }

  /**
   * Get detailed stats
   */
  getStats() {
    return this.scheduler.getStats();
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('🛑 Shutting down Scraper Coordinator...');
    await this.scheduler.shutdown();
    logger.info('✅ Scraper Coordinator shutdown complete');
  }
}

module.exports = ScraperCoordinator;
