/**
 * Channel Poster Scheduler
 * 
 * Automatically posts deals to social channels on a schedule
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const TelegramChannelPoster = require('../services/social/TelegramChannelPoster');

class ChannelPosterScheduler {
  constructor(bot, supabase) {
    this.bot = bot;
    this.supabase = supabase;
    this.poster = new TelegramChannelPoster(bot, supabase);
    this.isRunning = false;
    this.stats = {
      totalRuns: 0,
      totalPosted: 0,
      lastRun: null
    };
  }

  /**
   * Start the scheduler
   * Posts every 2 hours during active hours (8am-10pm)
   */
  start() {
    if (this.isRunning) {
      logger.warn('Channel poster scheduler already running');
      return;
    }

    // Post deals every 2 hours during 8am-10pm
    this.dealJob = cron.schedule('0 8,10,12,14,16,18,20,22 * * *', async () => {
      await this.runPostCycle();
    });

    // Daily summary at 9pm
    this.summaryJob = cron.schedule('0 21 * * *', async () => {
      await this.poster.postDailySummary();
    });

    this.isRunning = true;
    logger.info('📱 Channel poster scheduler started');
    logger.info('   - Deal posts: Every 2h from 8am-10pm');
    logger.info('   - Daily summary: 9pm');

    // Run initial check after 1 minute
    setTimeout(() => this.runPostCycle(), 60000);

    return this;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.dealJob) this.dealJob.stop();
    if (this.summaryJob) this.summaryJob.stop();
    this.isRunning = false;
    logger.info('Channel poster scheduler stopped');
  }

  /**
   * Run a posting cycle
   */
  async runPostCycle() {
    logger.info('Running channel poster cycle...');
    this.stats.totalRuns++;
    this.stats.lastRun = new Date().toISOString();

    try {
      const result = await this.poster.runCycle();
      this.stats.totalPosted += result.posted;
      return result;
    } catch (error) {
      logger.error('Error in channel poster cycle:', error);
      return { posted: 0, error: error.message };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      channel: this.poster.channelId
    };
  }

  /**
   * Manually trigger a post cycle
   */
  async triggerPost() {
    return await this.runPostCycle();
  }
}

// Singleton
let instance = null;

function getScheduler(bot, supabase) {
  if (!instance && bot && supabase) {
    instance = new ChannelPosterScheduler(bot, supabase);
  }
  return instance;
}

function initScheduler(bot, supabase) {
  const scheduler = getScheduler(bot, supabase);
  if (scheduler) {
    scheduler.start();
  }
  return scheduler;
}

module.exports = {
  ChannelPosterScheduler,
  getScheduler,
  initScheduler
};
