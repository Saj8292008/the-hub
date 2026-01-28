/**
 * Price History Service
 * 
 * Tracks and analyzes price history for watches and sneakers
 * Provides data for charts and trend analysis
 */

const logger = require('../../utils/logger');

class PriceHistoryService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Record a price point for an item
   */
  async recordPrice(itemType, itemId, price, source = 'manual') {
    try {
      await this.supabase
        .from('price_history')
        .insert({
          item_type: itemType,
          item_id: itemId,
          price,
          source,
          recorded_at: new Date().toISOString()
        });
      
      return true;
    } catch (error) {
      logger.error('Error recording price:', error);
      return false;
    }
  }

  /**
   * Get price history for an item
   */
  async getHistory(itemType, itemId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await this.supabase
        .from('price_history')
        .select('*')
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .gte('recorded_at', startDate)
        .order('recorded_at', { ascending: true });

      if (error) {
        logger.error('Error fetching price history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getHistory:', error);
      return [];
    }
  }

  /**
   * Get price statistics for an item
   */
  async getStats(itemType, itemId, days = 30) {
    const history = await this.getHistory(itemType, itemId, days);
    
    if (history.length === 0) {
      return null;
    }

    const prices = history.map(h => h.price);
    const currentPrice = prices[prices.length - 1];
    const oldestPrice = prices[0];
    
    return {
      current: currentPrice,
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      change: currentPrice - oldestPrice,
      changePercent: oldestPrice > 0 
        ? Math.round(((currentPrice - oldestPrice) / oldestPrice) * 100) 
        : 0,
      dataPoints: history.length,
      period: `${days} days`,
      trend: currentPrice > oldestPrice ? 'up' : currentPrice < oldestPrice ? 'down' : 'stable'
    };
  }

  /**
   * Format history for chart display
   */
  formatForChart(history) {
    return {
      labels: history.map(h => new Date(h.recorded_at).toLocaleDateString()),
      datasets: [{
        label: 'Price',
        data: history.map(h => h.price),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }

  /**
   * Get market trends across all listings
   */
  async getMarketTrends(itemType = 'watch', days = 7) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      // Get recent listings
      const tableName = itemType === 'watch' ? 'watch_listings' : 'sneaker_listings';
      
      const { data, error } = await this.supabase
        .from(tableName)
        .select('price, brand, created_at')
        .gte('created_at', startDate)
        .not('price', 'is', null)
        .order('created_at', { ascending: true });

      if (error || !data) {
        return null;
      }

      // Group by day
      const byDay = {};
      data.forEach(item => {
        const day = new Date(item.created_at).toLocaleDateString();
        if (!byDay[day]) {
          byDay[day] = { prices: [], count: 0 };
        }
        byDay[day].prices.push(item.price);
        byDay[day].count++;
      });

      // Calculate daily averages
      const dailyAverages = Object.entries(byDay).map(([day, data]) => ({
        date: day,
        avgPrice: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length),
        count: data.count
      }));

      // Brand breakdown
      const brandCounts = {};
      data.forEach(item => {
        if (item.brand) {
          brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
        }
      });

      const topBrands = Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([brand, count]) => ({ brand, count }));

      return {
        period: `${days} days`,
        totalListings: data.length,
        dailyAverages,
        topBrands,
        overallAverage: Math.round(data.reduce((sum, d) => sum + d.price, 0) / data.length),
        priceRange: {
          min: Math.min(...data.map(d => d.price)),
          max: Math.max(...data.map(d => d.price))
        }
      };
    } catch (error) {
      logger.error('Error getting market trends:', error);
      return null;
    }
  }

  /**
   * Find price drops (deals)
   */
  async findPriceDrops(itemType = 'watch', threshold = 10) {
    try {
      // Get items with recent price drops
      const { data: history } = await this.supabase
        .from('price_history')
        .select('item_id, price, recorded_at')
        .eq('item_type', itemType)
        .order('recorded_at', { ascending: false })
        .limit(1000);

      if (!history) return [];

      // Group by item
      const byItem = {};
      history.forEach(h => {
        if (!byItem[h.item_id]) {
          byItem[h.item_id] = [];
        }
        byItem[h.item_id].push(h);
      });

      // Find drops
      const drops = [];
      for (const [itemId, prices] of Object.entries(byItem)) {
        if (prices.length < 2) continue;
        
        const current = prices[0].price;
        const previous = prices[1].price;
        const dropPercent = ((previous - current) / previous) * 100;
        
        if (dropPercent >= threshold) {
          drops.push({
            itemId,
            currentPrice: current,
            previousPrice: previous,
            drop: previous - current,
            dropPercent: Math.round(dropPercent)
          });
        }
      }

      return drops.sort((a, b) => b.dropPercent - a.dropPercent);
    } catch (error) {
      logger.error('Error finding price drops:', error);
      return [];
    }
  }
}

module.exports = PriceHistoryService;
