/**
 * Deal Scoring API Endpoints v2.0
 * 
 * Endpoints:
 * - POST /api/listings/score/:id - Score a specific listing
 * - POST /api/listings/score-all - Score all listings in a category
 * - GET /api/listings/hot-deals - Get top-scored listings
 * - GET /api/listings/deal-of-the-day - Get the best daily deal
 * - GET /api/listings/score-stats - Get scoring statistics
 * - GET /api/scoring/config - Get scoring configuration
 * - PUT /api/scoring/config/:category - Update category config
 * - POST /api/scoring/ai-rarity - Toggle AI rarity scoring
 */

const dealScorer = require('../services/ai/dealScorer');
const supabase = require('../db/supabase');
const localWatchListings = require('../db/localWatchListings');

class DealScoringAPI {
  /**
   * Score a specific listing
   * POST /api/listings/score/:id
   */
  async scoreListing(req) {
    const { id } = req.params;
    const { category = 'watch' } = req.body;

    try {
      // Fetch listing
      let listing;
      if (supabase.isAvailable()) {
        const { data } = await supabase.client
          .from(`${category}_listings`)
          .select('*')
          .eq('id', id)
          .single();
        listing = data;
      } else {
        const { data } = await localWatchListings.getWatchListingById(id);
        listing = data;
      }

      if (!listing) {
        throw new Error('Listing not found');
      }

      // Score the listing using new multi-category scorer
      const result = await dealScorer.scoreListing(listing, category);

      // Update database with score
      if (supabase.isAvailable()) {
        await supabase.client
          .from(`${category}_listings`)
          .update({
            deal_score: result.score,
            score_breakdown: result.breakdown,
            profit_potential: result.profitPotential,
            scored_at: new Date().toISOString()
          })
          .eq('id', id);
      }

      return {
        listing_id: id,
        category,
        score: result.score,
        grade: result.grade,
        breakdown: result.breakdown,
        profitPotential: result.profitPotential
      };
    } catch (error) {
      console.error('Error scoring listing:', error);
      throw error;
    }
  }

  /**
   * Get hot deals (top-scored listings)
   * GET /api/listings/hot-deals?category=watch&limit=10&minScore=70
   */
  async getHotDeals(req) {
    const { category = 'watch', limit = 10, minScore = 70 } = req.query;

    try {
      if (!supabase.isAvailable()) {
        throw new Error('Database not available');
      }

      const config = dealScorer.getConfig(category);
      const threshold = parseInt(minScore) || config.thresholds.goodDeal;

      const { data, error } = await supabase.client
        .from(`${category}_listings`)
        .select('*')
        .gte('deal_score', threshold)
        .order('deal_score', { ascending: false })
        .order('timestamp', { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      // Enhance with grades
      const deals = (data || []).map(listing => ({
        ...listing,
        grade: dealScorer.getGrade(listing.deal_score, category)
      }));

      return {
        category,
        threshold,
        count: deals.length,
        deals
      };
    } catch (error) {
      console.error('Error fetching hot deals:', error);
      throw error;
    }
  }

  /**
   * Get Deal of the Day
   * GET /api/listings/deal-of-the-day?category=watch
   */
  async getDealOfTheDay(req) {
    const { category = 'watch' } = req.query;

    try {
      const deal = await dealScorer.getDealOfTheDay(category);

      if (!deal) {
        return {
          category,
          found: false,
          message: 'No qualifying deals found in the last 48 hours'
        };
      }

      return {
        category,
        found: true,
        deal
      };
    } catch (error) {
      console.error('Error fetching Deal of the Day:', error);
      throw error;
    }
  }

  /**
   * Score all listings in a category
   * POST /api/listings/score-all
   */
  async scoreAllListings(req) {
    const { category = 'watch', limit = 100, includeScored = false } = req.body;

    try {
      if (!supabase.isAvailable()) {
        throw new Error('Database not available');
      }

      // Build query
      let query = supabase.client
        .from(`${category}_listings`)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(parseInt(limit));

      // Optionally skip already-scored listings
      if (!includeScored) {
        query = query.or('deal_score.is.null,scored_at.lt.' + 
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      }

      const { data: listings, error } = await query;

      if (error) throw error;

      if (!listings || listings.length === 0) {
        return {
          message: 'No listings to score',
          scored: 0,
          category
        };
      }

      // Score each listing
      const results = [];
      let scored = 0;
      let failed = 0;

      for (const listing of listings) {
        try {
          const result = await dealScorer.scoreListing(listing, category);

          // Update database
          await supabase.client
            .from(`${category}_listings`)
            .update({
              deal_score: result.score,
              score_breakdown: result.breakdown,
              profit_potential: result.profitPotential,
              scored_at: new Date().toISOString()
            })
            .eq('id', listing.id);

          results.push({
            id: listing.id,
            title: listing.title,
            score: result.score,
            grade: result.grade,
            profitPotential: result.profitPotential?.profitPercent
          });

          scored++;
        } catch (error) {
          console.error(`Failed to score listing ${listing.id}:`, error);
          failed++;
        }
      }

      // Sort results by score descending
      results.sort((a, b) => b.score - a.score);

      return {
        message: `Scored ${scored} listings`,
        category,
        scored,
        failed,
        topDeals: results.slice(0, 10),
        scoreDistribution: this.calculateDistribution(results.map(r => r.score), category)
      };
    } catch (error) {
      console.error('Error scoring all listings:', error);
      throw error;
    }
  }

  /**
   * Calculate score distribution
   */
  calculateDistribution(scores, category) {
    const config = dealScorer.getConfig(category);
    const t = config.thresholds;

    return {
      hotDeals: scores.filter(s => s >= t.hotDeal).length,
      greatDeals: scores.filter(s => s >= t.greatDeal && s < t.hotDeal).length,
      goodDeals: scores.filter(s => s >= t.goodDeal && s < t.greatDeal).length,
      fair: scores.filter(s => s >= t.fair && s < t.goodDeal).length,
      belowMarket: scores.filter(s => s < t.fair).length,
      average: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    };
  }

  /**
   * Get scoring statistics
   * GET /api/listings/score-stats?category=watch
   */
  async getScoreStats(req) {
    const { category = 'watch' } = req.query;

    try {
      if (!supabase.isAvailable()) {
        throw new Error('Database not available');
      }

      const config = dealScorer.getConfig(category);
      const t = config.thresholds;

      const { data, error } = await supabase.client
        .from(`${category}_listings`)
        .select('deal_score, score_breakdown, profit_potential, scored_at')
        .not('deal_score', 'is', null);

      if (error) throw error;

      const scores = (data || []).map(item => item.deal_score);
      const profits = (data || [])
        .map(item => item.profit_potential?.profitPercent)
        .filter(p => p !== null && p !== undefined);

      const stats = {
        category,
        categoryName: config.name,
        thresholds: t,
        totalScored: scores.length,
        averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        medianScore: this.median(scores),
        
        distribution: {
          hotDeals: scores.filter(s => s >= t.hotDeal).length,
          greatDeals: scores.filter(s => s >= t.greatDeal && s < t.hotDeal).length,
          goodDeals: scores.filter(s => s >= t.goodDeal && s < t.greatDeal).length,
          fair: scores.filter(s => s >= t.fair && s < t.goodDeal).length,
          belowMarket: scores.filter(s => s < t.fair).length
        },
        
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,

        profitPotential: {
          avgProfitPercent: profits.length > 0 ? Math.round(profits.reduce((a, b) => a + b, 0) / profits.length * 10) / 10 : null,
          profitableDeals: profits.filter(p => p > 10).length,
          totalWithProfit: profits.length
        }
      };

      return stats;
    } catch (error) {
      console.error('Error fetching score stats:', error);
      throw error;
    }
  }

  /**
   * Calculate median
   */
  median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Get scoring configuration
   * GET /api/scoring/config
   */
  async getConfiguration(req) {
    return dealScorer.getConfiguration();
  }

  /**
   * Update category scoring configuration
   * PUT /api/scoring/config/:category
   */
  async updateConfiguration(req) {
    const { category } = req.params;
    const updates = req.body;

    // Validate weights sum to 100 if provided
    if (updates.weights) {
      const sum = Object.values(updates.weights).reduce((a, b) => a + b, 0);
      if (sum !== 100) {
        throw new Error(`Weights must sum to 100 (got ${sum})`);
      }
    }

    const success = dealScorer.updateCategoryConfig(category, updates);

    if (!success) {
      throw new Error(`Unknown category: ${category}`);
    }

    return {
      message: `Configuration updated for ${category}`,
      config: dealScorer.getConfig(category)
    };
  }

  /**
   * Toggle AI rarity scoring
   * POST /api/scoring/ai-rarity
   */
  async toggleAIRarity(req) {
    const { enabled } = req.body;

    dealScorer.setAIRarityScoring(enabled === true);

    return {
      message: `AI rarity scoring ${enabled ? 'enabled' : 'disabled'}`,
      enabled: enabled === true
    };
  }

  /**
   * Estimate profit potential for a listing
   * POST /api/listings/profit-estimate
   */
  async estimateProfitPotential(req) {
    const { listingId, category = 'watch' } = req.body;

    try {
      let listing;
      
      if (listingId) {
        if (supabase.isAvailable()) {
          const { data } = await supabase.client
            .from(`${category}_listings`)
            .select('*')
            .eq('id', listingId)
            .single();
          listing = data;
        }
      } else {
        // Allow passing listing data directly
        listing = req.body.listing;
      }

      if (!listing) {
        throw new Error('Listing not found or not provided');
      }

      const result = await dealScorer.scoreListing(listing, category);

      return {
        listingId: listing.id,
        title: listing.title,
        profitPotential: result.profitPotential,
        score: result.score,
        grade: result.grade
      };
    } catch (error) {
      console.error('Error estimating profit:', error);
      throw error;
    }
  }
}

module.exports = new DealScoringAPI();
