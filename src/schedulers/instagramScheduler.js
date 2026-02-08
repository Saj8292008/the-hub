/**
 * Instagram Scheduler
 * 
 * Automatically posts hot deals to Instagram on a schedule
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const InstagramPoster = require('../services/social/InstagramPoster');

class InstagramScheduler {
  constructor(supabase, config = {}) {
    this.supabase = supabase;
    this.poster = new InstagramPoster(supabase, config);
    this.isRunning = false;
    this.jobs = [];
    this.stats = {
      totalRuns: 0,
      totalPosted: 0,
      lastRun: null
    };
  }

  /**
   * Start the scheduler
   * Posts 2-3x per day during peak hours
   */
  start() {
    if (this.isRunning) {
      logger.warn('Instagram scheduler already running');
      return;
    }

    if (!this.poster.isConfigured()) {
      logger.warn('📸 Instagram scheduler: Skipped (not configured)');
      logger.info('   Add INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID, and IMGBB_API_KEY to enable');
      return;
    }

    // Post hot deals 3x per day (morning, afternoon, evening)
    // 10am, 2pm, 7pm Central Time
    this.dealJob = cron.schedule('0 10,14,19 * * *', async () => {
      await this.runPostCycle();
    });

    this.isRunning = true;
    logger.info('📸 Instagram scheduler started');
    logger.info('   - Posts: 10am, 2pm, 7pm CT');
    logger.info(`   - Score threshold: ${this.poster.scoreThreshold}`);
    logger.info(`   - Max posts per run: ${this.poster.maxPostsPerRun}`);

    // Run initial check after 2 minutes (gives time for images to generate)
    setTimeout(() => {
      logger.info('Running initial Instagram check...');
      this.runPostCycle();
    }, 120000);

    return this;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    logger.info('Instagram scheduler stopped');
  }

  /**
   * Run a posting cycle
   */
  async runPostCycle(dryRun = false) {
    logger.info('📸 Running Instagram posting cycle...');
    this.stats.totalRuns++;
    this.stats.lastRun = new Date().toISOString();

    try {
      const result = await this.poster.runCycle(dryRun);
      this.stats.totalPosted += result.posted;
      
      if (result.posted > 0) {
        logger.info(`✅ Instagram: Posted ${result.posted} deals`);
      }
      
      return result;
    } catch (error) {
      logger.error('Error in Instagram posting cycle:', error);
      return { posted: 0, skipped: 0, errors: 1, message: error.message };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      poster: this.poster.getStatus(),
      stats: this.stats
    };
  }

  /**
   * Manually trigger a post cycle
   */
  async triggerPost(dryRun = false) {
    return await this.runPostCycle(dryRun);
  }
}

// Singleton
let instance = null;

function getScheduler(supabase, config) {
  if (!instance && supabase) {
    instance = new InstagramScheduler(supabase, config);
  }
  return instance;
}

function initScheduler(supabase, config) {
  const scheduler = getScheduler(supabase, config);
  if (scheduler) {
    scheduler.start();
  }
  return scheduler;
}

module.exports = {
  InstagramScheduler,
  getScheduler,
  initScheduler
};
