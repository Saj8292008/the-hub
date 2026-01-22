const { readConfig, writeConfig } = require('../trackers/utils/config');
const logger = require('../utils/logger');

/**
 * Local price history tracker using config.json
 * Alternative to Supabase for MVP
 */
class LocalPriceHistory {
  constructor() {
    this.maxHistoryPerItem = 100; // Keep last 100 price checks per item
  }

  /**
   * Add a price history entry
   */
  async addPriceHistory({ itemType, itemId, price, source, additionalData }) {
    try {
      const config = readConfig();

      // Initialize price history structure
      if (!config.priceHistory) {
        config.priceHistory = {};
      }

      const key = `${itemType}:${itemId}`;

      if (!config.priceHistory[key]) {
        config.priceHistory[key] = [];
      }

      // Add new entry
      const entry = {
        checked_at: new Date().toISOString(),
        price,
        source,
        ...additionalData
      };

      config.priceHistory[key].push(entry);

      // Keep only the most recent entries
      if (config.priceHistory[key].length > this.maxHistoryPerItem) {
        config.priceHistory[key] = config.priceHistory[key].slice(-this.maxHistoryPerItem);
      }

      writeConfig(config);

      logger.debug(`Added price history for ${key}: $${price}`);

      return { success: true };
    } catch (error) {
      logger.error(`Failed to add price history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get price history for an item
   */
  async getPriceHistory(itemType, itemId, limit = 30) {
    try {
      const config = readConfig();

      const key = `${itemType}:${itemId}`;
      const history = config.priceHistory?.[key] || [];

      // Return most recent entries
      const data = history.slice(-limit);

      return {
        data,
        error: null
      };
    } catch (error) {
      logger.error(`Failed to get price history: ${error.message}`);
      return {
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Get all price history
   */
  async getAllPriceHistory() {
    try {
      const config = readConfig();
      return config.priceHistory || {};
    } catch (error) {
      logger.error(`Failed to get all price history: ${error.message}`);
      return {};
    }
  }

  /**
   * Clear price history for an item
   */
  async clearPriceHistory(itemType, itemId) {
    try {
      const config = readConfig();

      const key = `${itemType}:${itemId}`;

      if (config.priceHistory && config.priceHistory[key]) {
        delete config.priceHistory[key];
        writeConfig(config);
        logger.info(`Cleared price history for ${key}`);
      }

      return { success: true };
    } catch (error) {
      logger.error(`Failed to clear price history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if price history is available
   */
  isAvailable() {
    return true; // Always available for local storage
  }
}

module.exports = new LocalPriceHistory();
