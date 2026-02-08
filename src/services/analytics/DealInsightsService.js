/**
 * Deal Insights Service
 * Analyzes deal data to generate actionable insights
 * Used for content generation, trend analysis, and decision making
 */

const { createClient } = require('@supabase/supabase-js');

class DealInsightsService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Get trending brands (most deals in last 7 days)
   */
  async getTrendingBrands(days = 7, limit = 10) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('watch_listings')
      .select('brand')
      .gte('created_at', since)
      .not('brand', 'is', null)
      .not('brand', 'eq', 'Unknown');

    if (error) throw error;

    // Count by brand
    const counts = {};
    data.forEach(d => {
      counts[d.brand] = (counts[d.brand] || 0) + 1;
    });

    // Sort and return top
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([brand, count]) => ({ brand, count }));
  }

  /**
   * Get price range distribution
   */
  async getPriceDistribution(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('watch_listings')
      .select('price')
      .gte('created_at', since)
      .not('price', 'is', null)
      .gt('price', 0);

    if (error) throw error;

    const ranges = {
      'Under $250': 0,
      '$250-$500': 0,
      '$500-$1000': 0,
      '$1000-$2500': 0,
      '$2500-$5000': 0,
      '$5000-$10000': 0,
      'Over $10000': 0
    };

    data.forEach(d => {
      const p = d.price;
      if (p < 250) ranges['Under $250']++;
      else if (p < 500) ranges['$250-$500']++;
      else if (p < 1000) ranges['$500-$1000']++;
      else if (p < 2500) ranges['$1000-$2500']++;
      else if (p < 5000) ranges['$2500-$5000']++;
      else if (p < 10000) ranges['$5000-$10000']++;
      else ranges['Over $10000']++;
    });

    return ranges;
  }

  /**
   * Get best deals (highest score in recent period)
   */
  async getBestDeals(days = 7, limit = 10) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('watch_listings')
      .select('*')
      .gte('created_at', since)
      .not('deal_score', 'is', null)
      .order('deal_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get average prices by brand
   */
  async getAveragePricesByBrand(days = 30, minListings = 3) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('watch_listings')
      .select('brand, price')
      .gte('created_at', since)
      .not('brand', 'is', null)
      .not('brand', 'eq', 'Unknown')
      .not('price', 'is', null)
      .gt('price', 0);

    if (error) throw error;

    // Aggregate by brand
    const brands = {};
    data.forEach(d => {
      if (!brands[d.brand]) {
        brands[d.brand] = { total: 0, count: 0 };
      }
      brands[d.brand].total += d.price;
      brands[d.brand].count++;
    });

    // Calculate averages, filter by min listings
    return Object.entries(brands)
      .filter(([_, v]) => v.count >= minListings)
      .map(([brand, v]) => ({
        brand,
        avgPrice: Math.round(v.total / v.count),
        listings: v.count
      }))
      .sort((a, b) => b.listings - a.listings);
  }

  /**
   * Get deal velocity (listings per day)
   */
  async getDealVelocity(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('watch_listings')
      .select('created_at')
      .gte('created_at', since);

    if (error) throw error;

    // Group by day
    const byDay = {};
    data.forEach(d => {
      const day = d.created_at.split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const dailyCounts = Object.values(byDay);
    const avg = dailyCounts.length > 0 
      ? Math.round(dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length)
      : 0;

    return {
      totalListings: data.length,
      daysTracked: days,
      avgPerDay: avg,
      byDay
    };
  }

  /**
   * Get source breakdown
   */
  async getSourceBreakdown(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('watch_listings')
      .select('source')
      .gte('created_at', since);

    if (error) throw error;

    const counts = {};
    data.forEach(d => {
      counts[d.source || 'unknown'] = (counts[d.source || 'unknown'] || 0) + 1;
    });

    return counts;
  }

  /**
   * Generate weekly insights report
   */
  async generateWeeklyInsights() {
    const [
      trending,
      priceRanges,
      bestDeals,
      avgPrices,
      velocity,
      sources
    ] = await Promise.all([
      this.getTrendingBrands(7, 5),
      this.getPriceDistribution(7),
      this.getBestDeals(7, 5),
      this.getAveragePricesByBrand(30, 5),
      this.getDealVelocity(7),
      this.getSourceBreakdown(7)
    ]);

    return {
      generatedAt: new Date().toISOString(),
      period: '7 days',
      summary: {
        totalDeals: velocity.totalListings,
        avgDealsPerDay: velocity.avgPerDay,
        topBrand: trending[0]?.brand || 'N/A',
        mostActivePrice: Object.entries(priceRanges)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      },
      trending,
      priceRanges,
      bestDeals: bestDeals.map(d => ({
        title: d.title?.substring(0, 60),
        brand: d.brand,
        price: d.price,
        score: d.deal_score,
        url: d.url
      })),
      avgPrices: avgPrices.slice(0, 10),
      sources,
      velocity: velocity.byDay
    };
  }

  /**
   * Generate Telegram-ready insights message
   */
  async generateTelegramInsights() {
    const insights = await this.generateWeeklyInsights();
    
    let msg = `📊 *WEEKLY MARKET INSIGHTS*\n`;
    msg += `_${insights.period} ending ${new Date().toLocaleDateString()}_\n\n`;
    
    msg += `📈 *Activity*\n`;
    msg += `• ${insights.summary.totalDeals} deals tracked\n`;
    msg += `• ${insights.summary.avgDealsPerDay} deals/day average\n\n`;
    
    msg += `🔥 *Trending Brands*\n`;
    insights.trending.slice(0, 5).forEach((t, i) => {
      msg += `${i + 1}. ${t.brand} (${t.count} listings)\n`;
    });
    msg += '\n';
    
    msg += `💰 *Hot Price Range*\n`;
    msg += `Most activity: ${insights.summary.mostActivePrice}\n\n`;
    
    if (insights.bestDeals.length > 0) {
      msg += `⭐ *Top Deal This Week*\n`;
      const top = insights.bestDeals[0];
      msg += `${top.brand} - $${top.price?.toLocaleString()}\n`;
      msg += `Score: ${top.score}/10\n`;
    }

    return { message: msg, data: insights };
  }
}

module.exports = DealInsightsService;
