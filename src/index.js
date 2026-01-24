require('dotenv').config();
const logger = require('./utils/logger');
const PricePoller = require('./schedulers/pricePoller');
const ScraperCoordinator = require('./scheduler/ScraperCoordinator');

async function main() {
  logger.info('========================================');
  logger.info('Starting The Hub...');
  logger.info('========================================');

  // Start API server with WebSocket
  const { io } = require('./api/server');
  logger.info('🌐 API Server: Active');

  // Start Telegram bot (it initializes when required)
  const telegramBot = require('./bot/telegram');
  logger.info('📱 Telegram bot: Active');

  // Start price poller with WebSocket support
  const poller = new PricePoller(telegramBot, io);
  const schedule = process.env.POLL_SCHEDULE || '0 * * * *'; // Default: every hour

  poller.start(schedule);

  // Start scraper coordinator (if enabled)
  let scraperCoordinator = null;
  if (process.env.ENABLE_SCRAPER_SCHEDULER === 'true') {
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
}

main().catch(error => {
  logger.error('Failed to start The Hub:', error);
  process.exit(1);
});
