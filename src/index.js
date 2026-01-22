require('dotenv').config();
const logger = require('./utils/logger');
const PricePoller = require('./schedulers/pricePoller');

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

  logger.info('========================================');
  logger.info('✅ The Hub is running');
  logger.info(`📊 Price polling: ${schedule}`);
  logger.info(`💬 Admin chat ID: ${process.env.TELEGRAM_ADMIN_CHAT_ID || 'Not configured'}`);
  logger.info(`🔌 Real-time updates: Enabled`);
  logger.info('========================================');

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down...');
    poller.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down...');
    poller.stop();
    process.exit(0);
  });
}

main().catch(error => {
  logger.error('Failed to start The Hub:', error);
  process.exit(1);
});
