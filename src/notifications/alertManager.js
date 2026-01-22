const { readConfig, writeConfig, ensureTrackedItems } = require('../trackers/utils/config');
const logger = require('../utils/logger');

class AlertManager {
  constructor() {
    this.config = null;
    this.loadConfig();
  }

  /**
   * Load configuration
   */
  loadConfig() {
    this.config = readConfig();
    ensureTrackedItems(this.config);

    // Ensure alertsSent object exists
    if (!this.config.alertsSent) {
      this.config.alertsSent = {};
      writeConfig(this.config);
    }
  }

  /**
   * Reload configuration (useful after external changes)
   */
  reloadConfig() {
    this.loadConfig();
  }

  /**
   * Get item name for display
   */
  getItemName(item) {
    if (item.name) return item.name;

    // Build name from available fields
    if (item.brand && item.model) {
      return `${item.brand} ${item.model}`;
    }

    if (item.make && item.model) {
      return `${item.make} ${item.model} ${item.year || ''}`.trim();
    }

    return item.id || 'Unknown Item';
  }

  /**
   * Get target price from item (handles both camelCase and snake_case)
   */
  getTargetPrice(item) {
    return item.targetPrice || item.target_price || null;
  }

  /**
   * Check if alert has already been sent for this item
   */
  isAlertSent(itemType, itemId) {
    const key = `${itemType}:${itemId}`;
    return this.config.alertsSent[key] != null;
  }

  /**
   * Mark alert as sent
   */
  markAlertSent(itemType, itemId) {
    const key = `${itemType}:${itemId}`;
    this.config.alertsSent[key] = new Date().toISOString();
    writeConfig(this.config);
    logger.info(`Alert marked as sent: ${key}`);
  }

  /**
   * Reset alert (allow sending again)
   */
  resetAlert(itemType, itemId) {
    const key = `${itemType}:${itemId}`;
    if (this.config.alertsSent[key]) {
      delete this.config.alertsSent[key];
      writeConfig(this.config);
      logger.info(`Alert reset: ${key}`);
    }
  }

  /**
   * Check if current price meets alert criteria
   */
  async checkPriceAlert(itemType, item, currentPrice) {
    try {
      // No current price available
      if (!currentPrice || currentPrice === null) {
        return null;
      }

      // No target price set
      const targetPrice = this.getTargetPrice(item);
      if (!targetPrice) {
        return null;
      }

      // Price hasn't hit target yet
      if (currentPrice > targetPrice) {
        // Reset alert if price went back above target
        await this.resetAlert(itemType, item.id);
        return null;
      }

      // Check if alert already sent
      const alreadySent = this.isAlertSent(itemType, item.id);
      if (alreadySent) {
        return null;
      }

      // Mark as sent
      this.markAlertSent(itemType, item.id);

      // Build alert object
      const itemName = this.getItemName(item);
      const percentBelow = (((targetPrice - currentPrice) / targetPrice) * 100).toFixed(1);

      const message = `🎯 *Price Alert!*

${itemName} hit your target price!

💰 Current Price: $${currentPrice.toLocaleString()}
🎯 Target Price: $${targetPrice.toLocaleString()}
📉 Below target by: $${(targetPrice - currentPrice).toLocaleString()} (${percentBelow}%)

Type: ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}
ID: \`${item.id}\``;

      return {
        itemType,
        item,
        currentPrice,
        targetPrice,
        message
      };

    } catch (error) {
      logger.error(`Error checking price alert for ${itemType} ${item.id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Check alerts for multiple items
   */
  async checkMultipleAlerts(itemType, items, priceDataMap) {
    const alerts = [];

    for (const item of items) {
      const priceData = priceDataMap[item.id];
      if (!priceData) continue;

      const alert = await this.checkPriceAlert(
        itemType,
        item,
        priceData.price || priceData.currentPrice
      );

      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Get all sent alerts
   */
  getSentAlerts() {
    this.reloadConfig();
    return this.config.alertsSent || {};
  }

  /**
   * Clear all sent alerts (admin function)
   */
  clearAllAlerts() {
    this.config.alertsSent = {};
    writeConfig(this.config);
    logger.info('All alerts cleared');
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    this.reloadConfig();
    const sentAlerts = this.config.alertsSent || {};

    const stats = {
      totalAlertsSent: Object.keys(sentAlerts).length,
      byType: {},
      recentAlerts: []
    };

    // Group by type
    Object.entries(sentAlerts).forEach(([key, timestamp]) => {
      const [type] = key.split(':');
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      stats.recentAlerts.push({
        key,
        timestamp,
        type
      });
    });

    // Sort recent alerts by timestamp
    stats.recentAlerts.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    return stats;
  }
}

module.exports = AlertManager;
