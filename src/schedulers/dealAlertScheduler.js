/**
 * Deal Alert Scheduler
 * 
 * Runs periodic checks for deals matching user watchlist targets
 * and sends Telegram alerts for matches.
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const DealAlertService = require('../services/alerts/DealAlertService');

class DealAlertScheduler {
  constructor(supabase, telegramBot = null) {
    this.supabase = supabase;
    this.bot = telegramBot;
    this.alertService = new DealAlertService(supabase, telegramBot);
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      totalDealsFound: 0,
      totalAlertsSent: 0
    };
    
    // Default chat ID for alerts (can be overridden)
    this.defaultChatId = process.env.TELEGRAM_ALERT_CHAT_ID || process.env.TELEGRAM_CHANNEL_ID;
  }

  /**
   * Start the scheduler
   * Default: Check every 15 minutes
   */
  start(cronExpression = '*/15 * * * *') {
    if (this.isRunning) {
      logger.warn('Deal alert scheduler already running');
      return;
    }

    logger.info(`Starting deal alert scheduler with cron: ${cronExpression}`);
    
    this.job = cron.schedule(cronExpression, async () => {
      await this.runCheck();
    });

    this.isRunning = true;
    
    // Run an initial check on startup (after 30 second delay)
    setTimeout(() => this.runCheck(), 30000);
    
    return this;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      logger.info('Deal alert scheduler stopped');
    }
  }

  /**
   * Run a single check cycle
   */
  async runCheck(chatId = null) {
    const targetChatId = chatId || this.defaultChatId;
    
    if (!targetChatId) {
      logger.warn('No chat ID configured for deal alerts');
      return { error: 'No chat ID configured' };
    }

    logger.info('Running deal alert check...');
    const startTime = Date.now();

    try {
      const result = await this.alertService.checkAndAlert(targetChatId);
      
      this.lastRun = new Date().toISOString();
      this.stats.totalRuns++;
      this.stats.totalDealsFound += result.watchDeals || 0;
      this.stats.totalAlertsSent += result.sent || 0;

      const duration = Date.now() - startTime;
      logger.info(`Deal alert check completed in ${duration}ms`, result);

      return {
        success: true,
        duration,
        ...result
      };
    } catch (error) {
      logger.error('Error in deal alert check:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      stats: this.stats,
      chatId: this.defaultChatId ? '***configured***' : 'not configured'
    };
  }

  /**
   * Manually trigger a check (for testing or API calls)
   */
  async triggerCheck(chatId = null) {
    return await this.runCheck(chatId);
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create scheduler instance
 */
function getScheduler(supabase, telegramBot) {
  if (!instance && supabase) {
    instance = new DealAlertScheduler(supabase, telegramBot);
  }
  return instance;
}

/**
 * Initialize and start the scheduler
 */
function initScheduler(supabase, telegramBot, cronExpression) {
  const scheduler = getScheduler(supabase, telegramBot);
  scheduler.start(cronExpression);
  return scheduler;
}

module.exports = {
  DealAlertScheduler,
  getScheduler,
  initScheduler
};
