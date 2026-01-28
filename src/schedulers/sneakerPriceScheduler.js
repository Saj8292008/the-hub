/**
 * Sneaker Price Scheduler
 * 
 * Fetches current prices for tracked sneakers from StockX
 * Updates the sneakers table with latest prices
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const StockXService = require('../services/sneakers/stockx');
const supabase = require('../db/supabase');

class SneakerPriceScheduler {
  constructor(io = null, telegramBot = null) {
    this.io = io;
    this.bot = telegramBot;
    this.stockx = new StockXService();
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      sneakersUpdated: 0,
      errors: 0,
      priceDropsFound: 0
    };
  }

  /**
   * Start the scheduler
   * Runs every 4 hours (StockX has strict rate limits)
   */
  start(cronExpression = '0 */4 * * *') {
    if (this.isRunning) {
      logger.warn('Sneaker price scheduler already running');
      return;
    }

    this.job = cron.schedule(cronExpression, async () => {
      await this.runPriceCheck();
    });

    this.isRunning = true;
    logger.info(`👟 Sneaker price scheduler started: ${cronExpression}`);

    // Run initial check after 2 minutes
    setTimeout(() => this.runPriceCheck(), 120000);

    return this;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      logger.info('Sneaker price scheduler stopped');
    }
  }

  /**
   * Run a price check cycle
   */
  async runPriceCheck() {
    logger.info('Running sneaker price check...');
    this.stats.totalRuns++;
    this.lastRun = new Date().toISOString();

    if (!supabase.isAvailable()) {
      logger.warn('Supabase not available, skipping sneaker price check');
      return;
    }

    try {
      // Get all tracked sneakers
      const { data: sneakers, error } = await supabase.client
        .from('sneakers')
        .select('*')
        .order('last_checked', { ascending: true, nullsFirst: true })
        .limit(10); // Limit to avoid rate limits

      if (error) {
        logger.error('Error fetching sneakers:', error);
        return;
      }

      if (!sneakers || sneakers.length === 0) {
        logger.info('No sneakers to check');
        return;
      }

      logger.info(`Checking prices for ${sneakers.length} sneakers...`);

      for (const sneaker of sneakers) {
        await this.checkSneakerPrice(sneaker);
        // Wait between requests to respect rate limits
        await new Promise(r => setTimeout(r, 5000));
      }

      logger.info(`Sneaker price check complete. Updated: ${this.stats.sneakersUpdated}`);
    } catch (error) {
      logger.error('Error in sneaker price check:', error);
      this.stats.errors++;
    }
  }

  /**
   * Check price for a single sneaker
   */
  async checkSneakerPrice(sneaker) {
    try {
      const result = await this.stockx.fetchPrice(
        sneaker.brand,
        sneaker.model,
        sneaker.size
      );

      if (result && result.lowestAsk) {
        const oldPrice = sneaker.current_price;
        const newPrice = result.lowestAsk;

        // Update the sneaker record
        await supabase.client
          .from('sneakers')
          .update({
            current_price: newPrice,
            last_checked: new Date().toISOString()
          })
          .eq('id', sneaker.id);

        this.stats.sneakersUpdated++;

        // Check for price drop
        if (oldPrice && newPrice < oldPrice) {
          const drop = oldPrice - newPrice;
          const dropPercent = Math.round((drop / oldPrice) * 100);
          
          logger.info(`💰 Price drop: ${sneaker.brand} ${sneaker.model} - $${drop} (${dropPercent}%)`);
          this.stats.priceDropsFound++;

          // Check if below target
          if (sneaker.target_price && newPrice <= sneaker.target_price) {
            await this.sendTargetAlert(sneaker, newPrice);
          }
        }

        // Emit update via WebSocket
        if (this.io) {
          this.io.emit('sneaker-price-update', {
            sneakerId: sneaker.id,
            brand: sneaker.brand,
            model: sneaker.model,
            oldPrice,
            newPrice,
            timestamp: new Date().toISOString()
          });
        }

        logger.info(`Updated ${sneaker.brand} ${sneaker.model}: $${newPrice}`);
      }
    } catch (error) {
      logger.error(`Error checking ${sneaker.brand} ${sneaker.model}:`, error.message);
      this.stats.errors++;
    }
  }

  /**
   * Send alert when sneaker hits target price
   */
  async sendTargetAlert(sneaker, currentPrice) {
    if (!this.bot) return;

    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!adminChatId) return;

    const savings = sneaker.target_price - currentPrice;
    
    const message = `
🔥 **SNEAKER TARGET HIT** 🔥

👟 **${sneaker.brand} ${sneaker.model}**
${sneaker.colorway ? `🎨 ${sneaker.colorway}` : ''}
${sneaker.size ? `📏 Size: ${sneaker.size}` : ''}

💵 Current: **$${currentPrice}**
🎯 Target: $${sneaker.target_price}
💰 Under target by: **$${savings}**

🛒 Check StockX/GOAT now!
    `.trim();

    try {
      await this.bot.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
      logger.info(`Sent target alert for ${sneaker.brand} ${sneaker.model}`);
    } catch (error) {
      logger.error('Error sending target alert:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      stats: this.stats
    };
  }

  /**
   * Manually trigger a price check
   */
  async triggerCheck() {
    return await this.runPriceCheck();
  }
}

// Singleton
let instance = null;

function getScheduler(io, bot) {
  if (!instance && (io || bot)) {
    instance = new SneakerPriceScheduler(io, bot);
  }
  return instance;
}

function initScheduler(io, bot) {
  const scheduler = getScheduler(io, bot);
  if (scheduler) {
    scheduler.start();
  }
  return scheduler;
}

module.exports = {
  SneakerPriceScheduler,
  getScheduler,
  initScheduler
};
