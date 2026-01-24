require('dotenv').config();

// Early console logging for debugging
console.log('🚀 Starting The Hub...');
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- ENABLE_SCRAPER_SCHEDULER:', process.env.ENABLE_SCRAPER_SCHEDULER);

let logger;
try {
  logger = require('./utils/logger');
  logger.info('✅ Logger initialized');
} catch (error) {
  console.error('❌ Failed to load logger:', error.message);
  process.exit(1);
}

let PricePoller, ScraperCoordinator;
try {
  PricePoller = require('./schedulers/pricePoller');
  logger.info('✅ PricePoller loaded');

  ScraperCoordinator = require('./scheduler/ScraperCoordinator');
  logger.info('✅ ScraperCoordinator loaded');
} catch (error) {
  logger.error('❌ Failed to load dependencies:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

async function main() {
  try {
    logger.info('========================================');
    logger.info('Starting The Hub...');
    logger.info('========================================');

    // Start API server with WebSocket
    logger.info('Loading API server...');
    const { io } = require('./api/server');
    logger.info('🌐 API Server: Active');

    // Start Telegram bot (it initializes when required)
    logger.info('Loading Telegram bot...');
    const telegramBot = require('./bot/telegram');
    logger.info('📱 Telegram bot: Active');

    // Start price poller with WebSocket support
    logger.info('Initializing price poller...');
    const poller = new PricePoller(telegramBot, io);
    const schedule = process.env.POLL_SCHEDULE || '0 * * * *'; // Default: every hour

    poller.start(schedule);
    logger.info('✅ Price poller started');

    // Start scraper coordinator (if enabled)
    let scraperCoordinator = null;
    if (process.env.ENABLE_SCRAPER_SCHEDULER === 'true') {
      logger.info('Initializing scraper coordinator...');
      scraperCoordinator = new ScraperCoordinator(io, telegramBot);
      scraperCoordinator.start();
      logger.info('🔍 Scraper Coordinator: Active');

      // Inject coordinator into admin API
      const { setCoordinator } = require('./api/scraperAdmin');
      setCoordinator(scraperCoordinator);
    } else {
      logger.info('🔍 Scraper Coordinator: Disabled (set ENABLE_SCRAPER_SCHEDULER=true to enable)');
    }

    logger.info('========================================');
    logger.info('✅ The Hub is running');
    logger.info(`📊 Price polling: ${schedule}`);
    logger.info(`🔍 Scraper scheduler: ${scraperCoordinator ? 'Enabled' : 'Disabled'}`);
    logger.info(`💬 Admin chat ID: ${process.env.TELEGRAM_ADMIN_CHAT_ID || 'Not configured'}`);
    logger.info(`🔌 Real-time updates: Enabled`);
    logger.info('========================================');

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Stop accepting new jobs
      poller.stop();

      // Wait for active scraping jobs to finish
      if (scraperCoordinator) {
        await scraperCoordinator.shutdown();
      }

      logger.info('✅ Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.error('❌ Failed to start The Hub:', error.message);
    logger.error('Stack:', error.stack);
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unhandled error in main():', error.message);
  console.error('Stack:', error.stack);
  if (logger) {
    logger.error('Failed to start The Hub:', error);
  }
  process.exit(1);
});
