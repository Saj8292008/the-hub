/**
 * Deal Comparison Service
 * 
 * Compares the same watch/sneaker across different sources
 * Finds the best deal and arbitrage opportunities
 */

const logger = require('../../utils/logger');

class DealComparisonService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Find matching listings across sources for comparison
   */
  async compareWatch(brand, model, options = {}) {
    try {
      // Build search query
      let query = this.supabase
        .from('watch_listings')
        .select('*')
        .not('price', 'is', null);

      if (brand) {
        query = query.ilike('brand', `%${brand}%`);
      }
      if (model) {
        query = query.ilike('model', `%${model}%`);
      }

      // Also search in title
      if (brand || model) {
        const searchTerm = `${brand || ''} ${model || ''}`.trim();
        query = query.or(`title.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query
        .order('price', { ascending: true })
        .limit(50);

      if (error) {
        logger.error('Error comparing watches:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          query: { brand, model },
          found: 0,
          listings: [],
          comparison: null
        };
      }

      // Group by source
      const bySource = {};
      data.forEach(listing => {
        if (!bySource[listing.source]) {
          bySource[listing.source] = [];
        }
        bySource[listing.source].push(listing);
      });

      // Find best deal per source
      const bestBySource = Object.entries(bySource).map(([source, listings]) => {
        const sorted = listings.sort((a, b) => a.price - b.price);
        return {
          source,
          bestPrice: sorted[0].price,
          bestListing: sorted[0],
          count: listings.length,
          avgPrice: Math.round(listings.reduce((sum, l) => sum + l.price, 0) / listings.length)
        };
      });

      // Sort by best price
      bestBySource.sort((a, b) => a.bestPrice - b.bestPrice);

      // Calculate comparison stats
      const allPrices = data.map(l => l.price);
      const comparison = {
        lowestPrice: Math.min(...allPrices),
        highestPrice: Math.max(...allPrices),
        averagePrice: Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length),
        priceSpread: Math.max(...allPrices) - Math.min(...allPrices),
        bestSource: bestBySource[0]?.source,
        bestDeal: bestBySource[0]?.bestListing,
        potentialSavings: bestBySource.length > 1 
          ? bestBySource[1].bestPrice - bestBySource[0].bestPrice
          : 0
      };

      return {
        query: { brand, model },
        found: data.length,
        bySource: bestBySource,
        comparison,
        allListings: data.slice(0, 20) // Return top 20 for display
      };

    } catch (error) {
      logger.error('Error in compareWatch:', error);
      return null;
    }
  }

  /**
   * Find arbitrage opportunities
   * Items priced significantly lower on one source vs another
   */
  async findArbitrageOpportunities(minSpread = 100, minSpreadPercent = 15) {
    try {
      // Get all recent listings
      const { data: listings, error } = await this.supabase
        .from('watch_listings')
        .select('*')
        .not('price', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error || !listings) {
        return [];
      }

      // Group similar items (by brand + rough model match)
      const groups = {};
      listings.forEach(l => {
        const key = this.generateGroupKey(l);
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(l);
      });

      // Find groups with price spread
      const opportunities = [];
      
      for (const [key, items] of Object.entries(groups)) {
        if (items.length < 2) continue;
        
        // Need items from different sources
        const sources = [...new Set(items.map(i => i.source))];
        if (sources.length < 2) continue;
        
        const prices = items.map(i => i.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const spread = maxPrice - minPrice;
        const spreadPercent = (spread / minPrice) * 100;
        
        if (spread >= minSpread && spreadPercent >= minSpreadPercent) {
          const cheapest = items.find(i => i.price === minPrice);
          const mostExpensive = items.find(i => i.price === maxPrice);
          
          opportunities.push({
            item: key,
            brand: cheapest.brand,
            model: cheapest.model,
            cheapest: {
              source: cheapest.source,
              price: cheapest.price,
              url: cheapest.url
            },
            mostExpensive: {
              source: mostExpensive.source,
              price: mostExpensive.price,
              url: mostExpensive.url
            },
            spread,
            spreadPercent: Math.round(spreadPercent),
            potentialProfit: spread,
            listingCount: items.length
          });
        }
      }

      // Sort by potential profit
      return opportunities.sort((a, b) => b.spread - a.spread);

    } catch (error) {
      logger.error('Error finding arbitrage:', error);
      return [];
    }
  }

  /**
   * Generate a grouping key for similar items
   */
  generateGroupKey(listing) {
    const brand = (listing.brand || '').toLowerCase().trim();
    const model = (listing.model || '').toLowerCase().trim();
    
    // Normalize model name
    const normalizedModel = model
      .replace(/\s+/g, ' ')
      .replace(/ref\.?\s*/i, '')
      .substring(0, 30);
    
    return `${brand}:${normalizedModel}`;
  }

  /**
   * Get comparison summary for dashboard
   */
  async getComparisonSummary() {
    try {
      const opportunities = await this.findArbitrageOpportunities(50, 10);
      
      const { data: sourceCounts } = await this.supabase
        .from('watch_listings')
        .select('source')
        .not('price', 'is', null);

      const bySource = {};
      (sourceCounts || []).forEach(l => {
        bySource[l.source] = (bySource[l.source] || 0) + 1;
      });

      return {
        arbitrageOpportunities: opportunities.length,
        topOpportunities: opportunities.slice(0, 5),
        sourceBreakdown: bySource,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error getting comparison summary:', error);
      return null;
    }
  }
}

module.exports = DealComparisonService;
