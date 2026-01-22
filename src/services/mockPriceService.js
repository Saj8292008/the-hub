const logger = require('../utils/logger');

/**
 * Mock price service for MVP testing
 * Simulates realistic price fluctuations without web scraping
 */
class MockPriceService {
  constructor() {
    this.priceCache = new Map();
  }

  /**
   * Generate a realistic price fluctuation
   * @param {number} basePrice - The current or base price
   * @param {number} volatility - Price volatility (0.01 = 1%, 0.05 = 5%)
   */
  generatePriceChange(basePrice, volatility = 0.02) {
    // Random walk with slight downward bias (more realistic for tracked items)
    const change = (Math.random() - 0.52) * volatility * basePrice;
    const newPrice = Math.round(basePrice + change);
    return Math.max(newPrice, basePrice * 0.5); // Don't drop below 50%
  }

  /**
   * Fetch mock price for a watch
   */
  async fetchWatchPrice(watch) {
    const key = `watch-${watch.id}`;
    const basePrice = watch.currentPrice || watch.current_price || this.getDefaultWatchPrice(watch);

    const newPrice = this.generatePriceChange(basePrice, 0.015); // 1.5% volatility

    logger.info(`Mock price for ${watch.brand} ${watch.model}: $${newPrice} (was $${basePrice})`);

    return {
      price: newPrice,
      currency: 'USD',
      source: 'mock-chrono24',
      timestamp: new Date().toISOString(),
      raw: `$${newPrice.toLocaleString()}`,
      query: `${watch.brand} ${watch.model}`
    };
  }

  /**
   * Fetch mock price for a car
   */
  async fetchCarPrice(car) {
    const key = `car-${car.id}`;
    const basePrice = car.currentPrice || car.current_price || this.getDefaultCarPrice(car);

    const newPrice = this.generatePriceChange(basePrice, 0.025); // 2.5% volatility

    logger.info(`Mock price for ${car.make} ${car.model}: $${newPrice} (was $${basePrice})`);

    return {
      price: newPrice,
      currency: 'USD',
      source: 'mock-autotrader',
      timestamp: new Date().toISOString(),
      raw: `$${newPrice.toLocaleString()}`,
      query: `${car.make} ${car.model} ${car.year}`
    };
  }

  /**
   * Fetch mock price for sneakers
   */
  async fetchSneakerPrice(sneaker) {
    const key = `sneaker-${sneaker.id}`;
    const basePrice = sneaker.currentPrice || sneaker.current_price || this.getDefaultSneakerPrice(sneaker);

    const newPrice = this.generatePriceChange(basePrice, 0.03); // 3% volatility

    logger.info(`Mock price for ${sneaker.brand} ${sneaker.model} (${sneaker.size}): $${newPrice} (was $${basePrice})`);

    return {
      price: newPrice,
      currency: 'USD',
      source: 'mock-stockx',
      timestamp: new Date().toISOString(),
      raw: `$${newPrice.toLocaleString()}`,
      query: `${sneaker.brand} ${sneaker.model}`,
      size: sneaker.size
    };
  }

  /**
   * Get default watch price if none exists
   */
  getDefaultWatchPrice(watch) {
    const model = (watch.model || '').toLowerCase();

    if (model.includes('daytona')) return 30000;
    if (model.includes('submariner')) return 12000;
    if (model.includes('nautilus')) return 75000;
    if (model.includes('royal oak')) return 40000;
    if (model.includes('speedmaster')) return 6000;

    return 5000; // Default
  }

  /**
   * Get default car price if none exists
   */
  getDefaultCarPrice(car) {
    const model = (car.model || '').toLowerCase();

    if (model.includes('911')) return 190000;
    if (model.includes('huracan')) return 230000;
    if (model.includes('488')) return 280000;
    if (model.includes('720s')) return 290000;

    return 100000; // Default
  }

  /**
   * Get default sneaker price if none exists
   */
  getDefaultSneakerPrice(sneaker) {
    const model = (sneaker.model || '').toLowerCase();

    if (model.includes('chicago')) return 1800;
    if (model.includes('yeezy')) return 280;
    if (model.includes('off-white')) return 1600;
    if (model.includes('travis scott')) return 950;
    if (model.includes('dunk') && model.includes('panda')) return 120;

    return 200; // Default
  }

  /**
   * Batch fetch prices for multiple items
   */
  async fetchBatchWatchPrices(watches) {
    const results = [];
    for (const watch of watches) {
      try {
        const priceData = await this.fetchWatchPrice(watch);
        results.push({ watch, priceData, error: null });
      } catch (error) {
        results.push({ watch, priceData: null, error: error.message });
      }
    }
    return results;
  }

  async fetchBatchCarPrices(cars) {
    const results = [];
    for (const car of cars) {
      try {
        const priceData = await this.fetchCarPrice(car);
        results.push({ car, priceData, error: null });
      } catch (error) {
        results.push({ car, priceData: null, error: error.message });
      }
    }
    return results;
  }

  async fetchBatchSneakerPrices(sneakers) {
    const results = [];
    for (const sneaker of sneakers) {
      try {
        const priceData = await this.fetchSneakerPrice(sneaker);
        results.push({ sneaker, priceData, error: null });
      } catch (error) {
        results.push({ sneaker, priceData: null, error: error.message });
      }
    }
    return results;
  }
}

module.exports = MockPriceService;
