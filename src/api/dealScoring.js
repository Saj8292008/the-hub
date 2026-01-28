/**
 * Deal Scoring API Endpoints
 * Endpoints for scoring listings and retrieving hot deals
 */

const dealScorer = require('../services/ai/dealScorer');
const supabase = require('../db/supabase');
const localWatchListings = require('../db/localWatchListings');

class DealScoringAPI {
  /**
   * Score a specific listing
   * POST /api/listings/score/:id
   * Admin only
   */
  async scoreListing(req) {
    const { id } = req.params;
    const { type = 'watch' } = req.body;

    try {
      // Fetch listing
      let listing;
      if (supabase.isAvailable()) {
        const { data } = await supabase.client
          .from(`${type}_listings`)
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

      // Score the listing
      const result = await dealScorer.scoreWatchListing(listing);

      // Update database with score
      if (supabase.isAvailable()) {
        await supabase.client
          .from(`${type}_listings`)
          .update({
            deal_score: result.score,
            score_breakdown: result.breakdown
          })
          .eq('id', id);
      }

      return {
        listing_id: id,
        score: result.score,
        grade: result.grade,
        breakdown: result.breakdown
      };
    } catch (error) {
      console.error('Error scoring listing:', error);
      throw error;
    }
  }

  /**
   * Get hot deals (top-scored listings)
   * GET /api/listings/hot-deals?category=watches&limit=10
   */
  async getHotDeals(req) {
    const { category = 'watch', limit = 10 } = req.query;

    try {
      if (!supabase.isAvailable()) {
        throw new Error('Database not available');
      }

      const { data, error } = await supabase.client
        .from(`${category}_listings`)
        .select('*')
        .gte('deal_score', 75) // Good deal threshold
        .order('deal_score', { ascending: false })
        .order('timestamp', { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      return {
        category,
        count: data?.length || 0,
        deals: data || []
      };
    } catch (error) {
      console.error('Error fetching hot deals:', error);
      throw error;
    }
  }

  /**
   * Score all listings in a category
   * POST /api/listings/score-all
   * Admin only - use with caution
   */
  async scoreAllListings(req) {
    const { category = 'watch', limit = 100 } = req.body;

    try {
      if (!supabase.isAvailable()) {
        throw new Error('Database not available');
      }

      // Get listings without scores or old scores
      const { data: listings, error } = await supabase.client
        .from(`${category}_listings`)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      if (!listings || listings.length === 0) {
        return {
          message: 'No listings to score',
          scored: 0
        };
      }

      // Score each listing
      const results = [];
      let scored = 0;
      let failed = 0;

      for (const listing of listings) {
        try {
          const result = await dealScorer.scoreWatchListing(listing);

          // Update database
          await supabase.client
            .from(`${category}_listings`)
            .update({
              deal_score: result.score,
              score_breakdown: result.breakdown
            })
            .eq('id', listing.id);

          results.push({
            id: listing.id,
            score: result.score,
            grade: result.grade
          });

          scored++;
        } catch (error) {
          console.error(`Failed to score listing ${listing.id}:`, error);
          failed++;
        }
      }

      return {
        message: `Scored ${scored} listings`,
        scored,
        failed,
        results: results.slice(0, 10) // Return first 10 for preview
      };
    } catch (error) {
      console.error('Error scoring all listings:', error);
      throw error;
    }
  }

  /**
   * Get scoring statistics
   * GET /api/listings/score-stats
   */
  async getScoreStats(req) {
    const { category = 'watch' } = req.query;

    try {
      if (!supabase.isAvailable()) {
        throw new Error('Database not available');
      }

      const { data, error } = await supabase.client
        .from(`${category}_listings`)
        .select('deal_score, score_breakdown')
        .not('deal_score', 'is', null);

      if (error) throw error;

      const scores = data.map(item => item.deal_score);

      const stats = {
        total_scored: scores.length,
        average_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        hot_deals: scores.filter(s => s >= 90).length,
        good_deals: scores.filter(s => s >= 75 && s < 90).length,
        fair_deals: scores.filter(s => s >= 60 && s < 75).length,
        poor_deals: scores.filter(s => s < 60).length,
        highest_score: scores.length > 0 ? Math.max(...scores) : 0,
        lowest_score: scores.length > 0 ? Math.min(...scores) : 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching score stats:', error);
      throw error;
    }
  }

  /**
   * Enable or disable AI rarity scoring
   * POST /api/listings/ai-rarity
   * Admin only
   */
  async toggleAIRarity(req) {
    const { enabled } = req.body;

    dealScorer.setAIRarityScoring(enabled === true);

    return {
      message: `AI rarity scoring ${enabled ? 'enabled' : 'disabled'}`,
      enabled: enabled === true
    };
  }
}

module.exports = new DealScoringAPI();
