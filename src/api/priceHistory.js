/**
 * Price History API
 * Endpoint for fetching price history data for charts
 */

const supabase = require('../db/supabase');

class PriceHistoryAPI {
  /**
   * Get price history for a specific brand/model combination
   * GET /api/price-history?brand=Rolex&model=Submariner&category=watches&days=90
   */
  async getHistory(req) {
    const {
      brand,
      model,
      category = 'watch',
      days = 90,
      limit = 500
    } = req.query;

    if (!brand) {
      return { error: 'Brand is required', status: 400 };
    }

    try {
      const tableName = `${category}_listings`;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      let query = supabase.client
        .from(tableName)
        .select('price, timestamp, created_at, source, condition, title, model')
        .ilike('brand', `%${brand}%`)
        .gte('timestamp', startDate.toISOString())
        .not('price', 'is', null)
        .gt('price', 0)
        .order('timestamp', { ascending: true })
        .limit(parseInt(limit));

      if (model) {
        query = query.ilike('model', `%${model}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          success: true,
          brand,
          model,
          category,
          days: parseInt(days),
          history: [],
          stats: null,
          message: 'No price history found for this item'
        };
      }

      // Process data for charting
      const history = data.map(item => ({
        date: item.timestamp || item.created_at,
        price: parseFloat(item.price),
        source: item.source,
        condition: item.condition
      }));

      // Calculate statistics
      const prices = history.map(h => h.price);
      const stats = {
        count: prices.length,
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        median: this.calculateMedian(prices),
        trend: this.calculateTrend(history),
        volatility: this.calculateVolatility(prices)
      };

      // Group by day for chart
      const dailyPrices = this.groupByDay(history);

      return {
        success: true,
        brand,
        model: model || 'All models',
        category,
        days: parseInt(days),
        history: dailyPrices,
        rawHistory: history.slice(-100), // Last 100 individual sales
        stats
      };
    } catch (error) {
      console.error('Error fetching price history:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Get price history for a specific listing ID
   * GET /api/price-history/:id
   */
  async getListingHistory(req) {
    const { id } = req.params;
    const { category = 'watch' } = req.query;

    try {
      const tableName = `${category}_listings`;

      // Get the listing
      const { data: listing, error: listingError } = await supabase.client
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (listingError || !listing) {
        return { error: 'Listing not found', status: 404 };
      }

      // Get comparables
      const result = await this.getHistory({
        query: {
          brand: listing.brand,
          model: listing.model,
          category,
          days: 90
        }
      });

      return {
        ...result,
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          url: listing.url
        }
      };
    } catch (error) {
      console.error('Error fetching listing history:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Get trending items by price change
   * GET /api/price-history/trending?category=watches&period=7
   */
  async getTrending(req) {
    const { category = 'watch', period = 7, limit = 10 } = req.query;

    try {
      const tableName = `${category}_listings`;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Get distinct brand/model combinations with price data
      const { data, error } = await supabase.client
        .from(tableName)
        .select('brand, model, price, timestamp')
        .gte('timestamp', startDate.toISOString())
        .not('price', 'is', null)
        .not('brand', 'is', null)
        .gt('price', 0);

      if (error) throw error;

      // Group by brand/model and calculate trends
      const grouped = {};
      for (const item of data) {
        const key = `${item.brand}|${item.model}`;
        if (!grouped[key]) {
          grouped[key] = { brand: item.brand, model: item.model, prices: [] };
        }
        grouped[key].prices.push({
          price: parseFloat(item.price),
          date: new Date(item.timestamp)
        });
      }

      // Calculate price changes
      const trending = Object.values(grouped)
        .filter(g => g.prices.length >= 3) // Need at least 3 data points
        .map(g => {
          const sorted = g.prices.sort((a, b) => a.date - b.date);
          const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
          const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
          
          const avgFirst = firstHalf.reduce((a, b) => a + b.price, 0) / firstHalf.length;
          const avgSecond = secondHalf.reduce((a, b) => a + b.price, 0) / secondHalf.length;
          
          const change = ((avgSecond - avgFirst) / avgFirst) * 100;
          
          return {
            brand: g.brand,
            model: g.model,
            avgPrice: Math.round(avgSecond),
            priceChange: Math.round(change * 10) / 10,
            dataPoints: sorted.length,
            trend: change > 5 ? 'rising' : change < -5 ? 'falling' : 'stable'
          };
        })
        .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
        .slice(0, parseInt(limit));

      return {
        success: true,
        category,
        period: parseInt(period),
        trending
      };
    } catch (error) {
      console.error('Error fetching trending:', error);
      return { error: error.message, status: 500 };
    }
  }

  // Helper methods

  calculateMedian(prices) {
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  calculateTrend(history) {
    if (history.length < 2) return 'insufficient_data';
    
    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));
    
    const avgFirst = firstHalf.reduce((a, b) => a + b.price, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b.price, 0) / secondHalf.length;
    
    const change = ((avgSecond - avgFirst) / avgFirst) * 100;
    
    if (change > 10) return 'rising_fast';
    if (change > 3) return 'rising';
    if (change < -10) return 'falling_fast';
    if (change < -3) return 'falling';
    return 'stable';
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const squaredDiffs = prices.map(p => Math.pow(p - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    // Return coefficient of variation as percentage
    return Math.round((stdDev / avg) * 100);
  }

  groupByDay(history) {
    const grouped = {};
    
    for (const item of history) {
      const date = new Date(item.date).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { prices: [], count: 0 };
      }
      grouped[date].prices.push(item.price);
      grouped[date].count++;
    }
    
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        avgPrice: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length),
        minPrice: Math.min(...data.prices),
        maxPrice: Math.max(...data.prices),
        count: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

module.exports = new PriceHistoryAPI();
