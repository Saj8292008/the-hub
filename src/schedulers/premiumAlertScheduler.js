/**
 * Premium Alert Scheduler
 * 
 * Integrates with deal scoring and scraping to automatically
 * send alerts when hot deals are discovered.
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const PremiumAlertService = require('../services/alerts/PremiumAlertService');
const supabase = require('../db/supabase');

class PremiumAlertScheduler {
  constructor(io = null) {
    this.io = io;
    this.alertService = new PremiumAlertService(supabase.client);
    this.cronJob = null;
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      runsCompleted: 0,
      totalAlertsQueued: 0,
      errors: 0
    };
    
    // Track recently processed deals to avoid duplicates
    this.processedDeals = new Set();
    this.maxProcessedCache = 10000;
  }

  /**
   * Start the scheduler
   * Default: every 5 minutes
   */
  start(schedule = '*/5 * * * *') {
    if (this.cronJob) {
      logger.warn('Premium alert scheduler already running');
      return;
    }

    logger.info(`Starting premium alert scheduler with schedule: ${schedule}`);

    this.cronJob = cron.schedule(schedule, () => {
      this.run().catch(err => {
        logger.error(`Premium alert scheduler error: ${err.message}`);
        this.stats.errors++;
      });
    });

    // Also start the queue processor
    this.alertService.startQueueProcessor(30000);

    logger.info('✅ Premium alert scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.alertService.stopQueueProcessor();
      logger.info('Premium alert scheduler stopped');
    }
  }

  /**
   * Main run - check for new hot deals and queue alerts
   */
  async run() {
    if (this.isRunning) {
      logger.debug('Previous run still in progress, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    let alertsQueued = 0;

    try {
      // Find recent hot deals that haven't been processed
      const deals = await this.findNewHotDeals();
      
      logger.info(`Found ${deals.length} new hot deals to process`);

      for (const deal of deals) {
        // Skip if already processed
        if (this.processedDeals.has(deal.id)) {
          continue;
        }

        // Process deal for alerts
        const result = await this.alertService.processDeal(deal);
        alertsQueued += result.queued;

        // Mark as processed
        this.processedDeals.add(deal.id);

        // Emit via socket.io if available
        if (this.io) {
          this.io.emit('premium-alert:processed', {
            dealId: deal.id,
            alertsQueued: result.queued,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Cleanup old processed deals to prevent memory leak
      if (this.processedDeals.size > this.maxProcessedCache) {
        const toRemove = this.processedDeals.size - this.maxProcessedCache;
        const iterator = this.processedDeals.values();
        for (let i = 0; i < toRemove; i++) {
          this.processedDeals.delete(iterator.next().value);
        }
      }

      this.lastRun = new Date().toISOString();
      this.stats.runsCompleted++;
      this.stats.totalAlertsQueued += alertsQueued;

      const duration = Date.now() - startTime;
      logger.info(`Premium alert run complete: ${deals.length} deals, ${alertsQueued} alerts queued (${duration}ms)`);

      return {
        deals: deals.length,
        alertsQueued,
        duration
      };

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Find hot deals from the last check window
   */
  async findNewHotDeals() {
    const deals = [];

    // Get watch listings with high deal scores from last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    try {
      // Watch listings
      const { data: watchDeals, error: watchError } = await supabase.client
        .from('watch_listings')
        .select('*')
        .gte('deal_score', 60) // Only alert for good deals
        .gte('created_at', tenMinutesAgo)
        .order('deal_score', { ascending: false })
        .limit(50);

      if (!watchError && watchDeals) {
        deals.push(...watchDeals.map(d => ({
          ...d,
          category: 'watches'
        })));
      }

      // Sneaker listings (if table exists)
      try {
        const { data: sneakerDeals } = await supabase.client
          .from('sneaker_listings')
          .select('*')
          .gte('deal_score', 60)
          .gte('created_at', tenMinutesAgo)
          .order('deal_score', { ascending: false })
          .limit(50);

        if (sneakerDeals) {
          deals.push(...sneakerDeals.map(d => ({
            ...d,
            category: 'sneakers'
          })));
        }
      } catch (e) {
        // Table might not exist
      }

      // Car listings (if table exists)
      try {
        const { data: carDeals } = await supabase.client
          .from('car_listings')
          .select('*')
          .gte('deal_score', 60)
          .gte('created_at', tenMinutesAgo)
          .order('deal_score', { ascending: false })
          .limit(50);

        if (carDeals) {
          deals.push(...carDeals.map(d => ({
            ...d,
            category: 'cars'
          })));
        }
      } catch (e) {
        // Table might not exist
      }

    } catch (error) {
      logger.error(`Error finding hot deals: ${error.message}`);
    }

    return deals;
  }

  /**
   * Manually process a specific deal
   */
  async processDeal(deal) {
    return this.alertService.processDeal(deal);
  }

  /**
   * Force run immediately
   */
  async forceRun() {
    logger.info('Force running premium alert scheduler...');
    return this.run();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: !!this.cronJob,
      isProcessing: this.isRunning,
      lastRun: this.lastRun,
      stats: this.stats,
      processedDealsCache: this.processedDeals.size,
      queueProcessorActive: !!this.alertService.processingInterval
    };
  }
}

module.exports = PremiumAlertScheduler;
