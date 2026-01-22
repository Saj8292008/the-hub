const logger = require('../utils/logger');

class Notifier {
  constructor(telegramBot, adminChatId) {
    this.telegramBot = telegramBot;
    this.adminChatId = adminChatId || process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!this.telegramBot) {
      logger.warn('Telegram bot not provided to Notifier');
    }

    if (!this.adminChatId) {
      logger.warn('TELEGRAM_ADMIN_CHAT_ID not configured. Alerts will not be sent.');
    }
  }

  /**
   * Send alert via Telegram
   */
  async sendAlert(alert) {
    if (!this.telegramBot || !this.adminChatId) {
      logger.warn('Cannot send alert: Telegram bot or chat ID not configured');
      return false;
    }

    try {
      await this.telegramBot.sendMessage(this.adminChatId, alert.message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      logger.info(`Alert sent to Telegram chat ${this.adminChatId}: ${alert.itemType} ${alert.item.id}`);
      return true;

    } catch (error) {
      logger.error(`Failed to send Telegram alert: ${error.message}`);
      return false;
    }
  }

  /**
   * Send multiple alerts (batch)
   */
  async sendBatchAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const alert of alerts) {
      const success = await this.sendAlert(alert);
      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay between messages to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    logger.info(`Batch alerts sent: ${sent} successful, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Send custom message to admin
   */
  async sendMessage(message, options = {}) {
    if (!this.telegramBot || !this.adminChatId) {
      logger.warn('Cannot send message: Telegram bot or chat ID not configured');
      return false;
    }

    try {
      await this.telegramBot.sendMessage(this.adminChatId, message, {
        disable_web_page_preview: true,
        ...options
      });

      logger.info(`Message sent to Telegram chat ${this.adminChatId}`);
      return true;

    } catch (error) {
      logger.error(`Failed to send Telegram message: ${error.message}`);
      return false;
    }
  }

  /**
   * Send notification about price update completion
   */
  async sendUpdateSummary(summary) {
    const message = `📊 *Price Update Summary*

⏰ Completed: ${new Date().toLocaleString()}

✅ Watches updated: ${summary.watches || 0}
✅ Cars updated: ${summary.cars || 0}
✅ Sneakers updated: ${summary.sneakers || 0}

${summary.errors > 0 ? `⚠️ Errors: ${summary.errors}` : ''}
${summary.alerts > 0 ? `🎯 Alerts triggered: ${summary.alerts}` : ''}`;

    return await this.sendMessage(message, { parse_mode: 'Markdown' });
  }

  /**
   * Send error notification
   */
  async sendErrorNotification(error, context) {
    const message = `❌ *Error Occurred*

Context: ${context}
Error: ${error.message}

Time: ${new Date().toLocaleString()}`;

    return await this.sendMessage(message, { parse_mode: 'Markdown' });
  }
}

module.exports = Notifier;
