const cron = require('node-cron');
const WatchTracker = require('../trackers/watches');
const CarTracker = require('../trackers/cars');
const SneakerTracker = require('../trackers/sneakers');
const Chrono24Service = require('../services/watches/chrono24');
const AutoTraderService = require('../services/cars/autotrader');
const StockXService = require('../services/sneakers/stockx');
const ESPNService = require('../services/sports/espn');
const MockPriceService = require('../services/mockPriceService');
const AlertManager = require('../notifications/alertManager');
const Notifier = require('../notifications/notifier');
const supabase = require('../db/supabase');
const localPriceHistory = require('../db/localPriceHistory');
const logger = require('../utils/logger');

class PricePoller {
  constructor(telegramBot, io) {
    // Trackers
    this.watchTracker = new WatchTracker();
    this.carTracker = new CarTracker();
    this.sneakerTracker = new SneakerTracker();

    // WebSocket
    this.io = io;

    // Use mock service for MVP (set USE_REAL_SCRAPERS=true in .env to use real scrapers)
    this.useMockData = process.env.USE_REAL_SCRAPERS !== 'true';

    if (this.useMockData) {
      logger.info('Using mock price service for testing');
      this.mockService = new MockPriceService();
    } else {
      logger.info('Using real web scrapers');
      // Services
      this.chrono24 = new Chrono24Service();
      this.autotrader = new AutoTraderService();
      this.stockx = new StockXService();
      this.espn = new ESPNService();
    }

    // Notifications
    this.alertManager = new AlertManager();
    this.notifier = new Notifier(telegramBot, process.env.TELEGRAM_ADMIN_CHAT_ID);

    // State
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Broadcast price update via WebSocket
   */
  broadcastPriceUpdate(itemType, item, priceData) {
    if (this.io) {
      this.io.emit('price:update', {
        itemType,
        itemId: item.id,
        item,
        price: priceData.price,
        source: priceData.source,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Broadcast alert via WebSocket
   */
  broadcastAlert(alert) {
    if (this.io) {
      this.io.emit('alert:new', alert);
    }
  }

  /**
   * Poll watch prices
   */
  async pollWatchPrices() {
    logger.info('Polling watch prices...');
    let updated = 0;
    let errors = 0;
    const alerts = [];

    try {
      const watches = await this.watchTracker.listWatches();
      logger.info(`Found ${watches.length} watches to update`);

      for (const watch of watches) {
        try {
          // Fetch price from service (mock or real)
          let priceData;
          if (this.useMockData) {
            priceData = await this.mockService.fetchWatchPrice(watch);
          } else {
            priceData = await this.chrono24.fetchPrice(
              watch.brand,
              watch.model,
              watch.specificModel || watch.specific_model
            );
          }

          if (!priceData || !priceData.price) {
            logger.warn(`No price data returned for watch ${watch.id}`);
            continue;
          }

          // Update tracker with new price
          await this.watchTracker.updatePrice(watch.id, {
            currentPrice: priceData.price,
            lastChecked: new Date().toISOString()
          });

          updated++;

          // Broadcast price update via WebSocket
          this.broadcastPriceUpdate('watch', watch, priceData);

          // Save to price history
          try {
            if (supabase.isAvailable()) {
              await supabase.addPriceHistory({
                itemType: 'watch',
                itemId: watch.id,
                price: priceData.price,
                source: priceData.source,
                additionalData: priceData
              });
            } else {
              await localPriceHistory.addPriceHistory({
                itemType: 'watch',
                itemId: watch.id,
                price: priceData.price,
                source: priceData.source,
                additionalData: priceData
              });
            }
          } catch (historyError) {
            logger.warn(`Failed to save price history for watch ${watch.id}: ${historyError.message}`);
          }

          // Check for alerts
          const alert = await this.alertManager.checkPriceAlert('watch', watch, priceData.price);
          if (alert) {
            alerts.push(alert);
            // Broadcast alert via WebSocket
            this.broadcastAlert(alert);
          }

        } catch (error) {
          logger.error(`Failed to update watch ${watch.id}: ${error.message}`);
          errors++;
        }
      }

    } catch (error) {
      logger.error(`Error polling watch prices: ${error.message}`);
      errors++;
    }

    logger.info(`Watch price poll completed: ${updated} updated, ${errors} errors`);
    return { updated, errors, alerts };
  }

  /**
   * Poll car prices
   */
  async pollCarPrices() {
    logger.info('Polling car prices...');
    let updated = 0;
    let errors = 0;
    const alerts = [];

    try {
      const cars = await this.carTracker.listCars();
      logger.info(`Found ${cars.length} cars to update`);

      for (const car of cars) {
        try {
          // Fetch price from service (mock or real)
          let priceData;
          if (this.useMockData) {
            priceData = await this.mockService.fetchCarPrice(car);
          } else {
            priceData = await this.autotrader.fetchPrice(car.make, car.model, car.year);
          }

          if (!priceData || !priceData.price) {
            logger.warn(`No price data returned for car ${car.id}`);
            continue;
          }

          // Update tracker with new price
          await this.carTracker.updatePrice(car.id, {
            currentPrice: priceData.price,
            lastChecked: new Date().toISOString()
          });

          updated++;

          // Broadcast price update via WebSocket
          this.broadcastPriceUpdate('car', car, priceData);

          // Save to price history
          try {
            if (supabase.isAvailable()) {
              await supabase.addPriceHistory({
                itemType: 'car',
                itemId: car.id,
                price: priceData.price,
                source: priceData.source,
                additionalData: priceData
              });
            } else {
              await localPriceHistory.addPriceHistory({
                itemType: 'car',
                itemId: car.id,
                price: priceData.price,
                source: priceData.source,
                additionalData: priceData
              });
            }
          } catch (historyError) {
            logger.warn(`Failed to save price history for car ${car.id}: ${historyError.message}`);
          }

          // Check for alerts
          const alert = await this.alertManager.checkPriceAlert('car', car, priceData.price);
          if (alert) {
            alerts.push(alert);
            // Broadcast alert via WebSocket
            this.broadcastAlert(alert);
          }

        } catch (error) {
          logger.error(`Failed to update car ${car.id}: ${error.message}`);
          errors++;
        }
      }

    } catch (error) {
      logger.error(`Error polling car prices: ${error.message}`);
      errors++;
    }

    logger.info(`Car price poll completed: ${updated} updated, ${errors} errors`);
    return { updated, errors, alerts };
  }

  /**
   * Poll sneaker prices
   */
  async pollSneakerPrices() {
    logger.info('Polling sneaker prices...');
    let updated = 0;
    let errors = 0;
    const alerts = [];

    try {
      const sneakers = await this.sneakerTracker.listSneakers();
      logger.info(`Found ${sneakers.length} sneakers to update`);

      for (const sneaker of sneakers) {
        try {
          // Fetch price from service (mock or real)
          let priceData;
          if (this.useMockData) {
            priceData = await this.mockService.fetchSneakerPrice(sneaker);
          } else {
            priceData = await this.stockx.fetchPrice(sneaker.brand, sneaker.model, sneaker.size);
          }

          if (!priceData || !priceData.price) {
            logger.warn(`No price data returned for sneaker ${sneaker.id}`);
            continue;
          }

          // Update tracker with new price
          await this.sneakerTracker.updatePrice(sneaker.id, {
            currentPrice: priceData.price,
            lastChecked: new Date().toISOString()
          });

          updated++;

          // Broadcast price update via WebSocket
          this.broadcastPriceUpdate('sneaker', sneaker, priceData);

          // Save to price history
          try {
            if (supabase.isAvailable()) {
              await supabase.addPriceHistory({
                itemType: 'sneaker',
                itemId: sneaker.id,
                price: priceData.price,
                source: priceData.source,
                additionalData: priceData
              });
            } else {
              await localPriceHistory.addPriceHistory({
                itemType: 'sneaker',
                itemId: sneaker.id,
                price: priceData.price,
                source: priceData.source,
                additionalData: priceData
              });
            }
          } catch (historyError) {
            logger.warn(`Failed to save price history for sneaker ${sneaker.id}: ${historyError.message}`);
          }

          // Check for alerts
          const alert = await this.alertManager.checkPriceAlert('sneaker', sneaker, priceData.price);
          if (alert) {
            alerts.push(alert);
            // Broadcast alert via WebSocket
            this.broadcastAlert(alert);
          }

        } catch (error) {
          logger.error(`Failed to update sneaker ${sneaker.id}: ${error.message}`);
          errors++;
        }
      }

    } catch (error) {
      logger.error(`Error polling sneaker prices: ${error.message}`);
      errors++;
    }

    logger.info(`Sneaker price poll completed: ${updated} updated, ${errors} errors`);
    return { updated, errors, alerts };
  }

  /**
   * Run a complete poll cycle
   */
  async runPoll() {
    logger.info('========================================');
    logger.info('Starting scheduled price poll');
    logger.info('========================================');

    const startTime = Date.now();
    let totalAlerts = [];

    try {
      // Poll watches
      const watchResult = await this.pollWatchPrices();
      totalAlerts = totalAlerts.concat(watchResult.alerts);

      // Poll cars
      const carResult = await this.pollCarPrices();
      totalAlerts = totalAlerts.concat(carResult.alerts);

      // Poll sneakers
      const sneakerResult = await this.pollSneakerPrices();
      totalAlerts = totalAlerts.concat(sneakerResult.alerts);

      // Send all alerts
      if (totalAlerts.length > 0) {
        logger.info(`Sending ${totalAlerts.length} price alerts`);
        await this.notifier.sendBatchAlerts(totalAlerts);
      }

      // Send summary
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const summary = {
        watches: watchResult.updated,
        cars: carResult.updated,
        sneakers: sneakerResult.updated,
        errors: watchResult.errors + carResult.errors + sneakerResult.errors,
        alerts: totalAlerts.length,
        duration
      };

      logger.info(`Price poll completed in ${duration}s`);
      logger.info(`Summary: ${summary.watches} watches, ${summary.cars} cars, ${summary.sneakers} sneakers`);
      logger.info(`Errors: ${summary.errors}, Alerts: ${summary.alerts}`);

      // Optionally send summary to Telegram
      if (process.env.SEND_UPDATE_SUMMARY === 'true') {
        await this.notifier.sendUpdateSummary(summary);
      }

    } catch (error) {
      logger.error(`Fatal error during price poll: ${error.message}`);
      await this.notifier.sendErrorNotification(error, 'Price Poll');
    }

    logger.info('========================================');
  }

  /**
   * Start the price poller with cron schedule
   */
  start(cronExpression = '0 * * * *') {
    if (this.isRunning) {
      logger.warn('Price poller is already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.runPoll();
    });

    this.isRunning = true;
    logger.info(`✅ Price poller started (schedule: ${cronExpression})`);

    // Run immediately on start if configured
    if (process.env.RUN_ON_START === 'true') {
      logger.info('Running initial poll on startup...');
      setTimeout(() => this.runPoll(), 5000); // 5 second delay
    }
  }

  /**
   * Stop the price poller
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    logger.info('Price poller stopped');
  }

  /**
   * Get poller status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: this.cronJob ? 'active' : 'inactive'
    };
  }
}

module.exports = PricePoller;
