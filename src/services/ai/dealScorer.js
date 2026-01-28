/**
 * Deal Scoring Service
 * Scores listings (watches, cars, sneakers) from 0-100 based on deal quality
 */

const openaiClient = require('../openai/client');
const supabase = require('../../db/supabase');

class DealScorer {
  constructor() {
    this.useAIForRarity = false; // Toggle AI-powered rarity scoring (costs more)
  }

  /**
   * Score a watch listing
   * @param {Object} listing - Watch listing data
   * @returns {Promise<Object>} - Score and breakdown
   */
  async scoreWatchListing(listing) {
    if (!listing) {
      throw new Error('Listing data is required');
    }

    // 1. Price Score (40 points max)
    const priceScore = await this.calculatePriceScore(listing, 'watch');

    // 2. Condition Score (20 points max)
    const conditionScore = this.calculateConditionScore(listing.condition);

    // 3. Seller Score (15 points max)
    const sellerScore = this.calculateSellerScore(listing.source, listing.seller);

    // 4. Listing Quality Score (15 points max)
    const qualityScore = this.calculateQualityScore(listing);

    // 5. Rarity/Demand Score (10 points max)
    let rarityScore = 5; // Default neutral score

    if (this.useAIForRarity && openaiClient.isAvailable()) {
      try {
        rarityScore = await this.calculateRarityScoreAI(listing.brand, listing.model);
      } catch (error) {
        console.error('AI rarity scoring failed, using default:', error);
      }
    } else {
      // Simple heuristic-based rarity
      rarityScore = this.calculateRarityScoreHeuristic(listing.brand, listing.model);
    }

    // Calculate total
    const totalScore = Math.min(100, Math.max(0, Math.round(
      priceScore + conditionScore + sellerScore + qualityScore + rarityScore
    )));

    return {
      score: totalScore,
      breakdown: {
        price: priceScore,
        condition: conditionScore,
        seller: sellerScore,
        quality: qualityScore,
        rarity: rarityScore
      },
      grade: this.getGrade(totalScore)
    };
  }

  /**
   * Calculate price score based on market value
   * @param {Object} listing - Listing data
   * @param {string} type - Item type (watch, car, sneaker)
   * @returns {Promise<number>} - Price score (0-40)
   */
  async calculatePriceScore(listing, type = 'watch') {
    try {
      // Get historical prices for this brand/model
      const avgPrice = await this.getAverageMarketPrice(
        listing.brand,
        listing.model,
        type
      );

      if (!avgPrice || avgPrice === 0) {
        // No market data, give neutral score
        return 20;
      }

      const listingPrice = parseFloat(listing.price);
      const ratio = listingPrice / avgPrice;

      // Score based on discount percentage
      if (ratio <= 0.70) return 40; // 30%+ below market - AMAZING
      if (ratio <= 0.80) return 37; // 20-30% below market - EXCELLENT
      if (ratio <= 0.85) return 34; // 15-20% below market - GREAT
      if (ratio <= 0.90) return 31; // 10-15% below market - VERY GOOD
      if (ratio <= 0.95) return 27; // 5-10% below market - GOOD
      if (ratio <= 1.00) return 23; // At market - FAIR
      if (ratio <= 1.05) return 18; // Slightly above - MEH
      if (ratio <= 1.10) return 12; // 5-10% above - NOT GREAT
      if (ratio <= 1.20) return 6;  // 10-20% above - BAD
      return 2; // 20%+ above - TERRIBLE DEAL

    } catch (error) {
      console.error('Price score calculation error:', error);
      return 20; // Neutral score on error
    }
  }

  /**
   * Get average market price for a brand/model
   * @param {string} brand - Brand name
   * @param {string} model - Model name
   * @param {string} type - Item type
   * @returns {Promise<number>} - Average price
   */
  async getAverageMarketPrice(brand, model, type) {
    try {
      if (!supabase.isAvailable()) {
        return null;
      }

      // Query price history for this brand/model
      const { data, error } = await supabase.client
        .from(`${type}_listings`)
        .select('price')
        .ilike('brand', brand)
        .ilike('model', `%${model}%`)
        .gte('timestamp', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        return null;
      }

      // Calculate average, excluding outliers
      const prices = data.map(item => parseFloat(item.price)).filter(p => p > 0);
      if (prices.length === 0) return null;

      // Remove top and bottom 10% to filter outliers
      prices.sort((a, b) => a - b);
      const trimCount = Math.floor(prices.length * 0.1);
      const trimmedPrices = prices.slice(trimCount, prices.length - trimCount);

      const average = trimmedPrices.reduce((sum, p) => sum + p, 0) / trimmedPrices.length;

      return average;
    } catch (error) {
      console.error('Error fetching market price:', error);
      return null;
    }
  }

  /**
   * Calculate condition score
   * @param {string} condition - Condition string
   * @returns {number} - Condition score (0-20)
   */
  calculateConditionScore(condition) {
    if (!condition) return 10; // Neutral if unknown

    const conditionLower = condition.toLowerCase();

    // Map conditions to scores
    if (conditionLower.includes('new') || conditionLower.includes('unworn')) return 20;
    if (conditionLower.includes('mint') || conditionLower.includes('excellent')) return 18;
    if (conditionLower.includes('very good')) return 16;
    if (conditionLower.includes('good')) return 14;
    if (conditionLower.includes('fair') || conditionLower.includes('average')) return 10;
    if (conditionLower.includes('worn') || conditionLower.includes('used')) return 8;
    if (conditionLower.includes('poor') || conditionLower.includes('damaged')) return 4;

    return 10; // Default neutral
  }

  /**
   * Calculate seller reputation score
   * @param {string} source - Source (reddit, ebay, chrono24, etc.)
   * @param {string} seller - Seller info
   * @returns {number} - Seller score (0-15)
   */
  calculateSellerScore(source, seller) {
    if (!source) return 7; // Neutral if unknown

    const sourceLower = source.toLowerCase();

    // Trusted sources get higher scores
    if (sourceLower.includes('chrono24')) return 15; // Verified dealer platform
    if (sourceLower.includes('watchuseek')) return 13; // Reputable community
    if (sourceLower.includes('reddit')) {
      // Reddit score depends on seller info
      if (seller && (seller.includes('verified') || seller.includes('mod'))) return 12;
      if (seller && seller.includes('karma')) return 10;
      return 8; // Unknown reddit seller
    }
    if (sourceLower.includes('ebay')) {
      // eBay score depends on seller rating
      if (seller && seller.includes('top') || seller && seller.includes('100%')) return 12;
      return 9; // Average eBay seller
    }

    return 7; // Unknown source
  }

  /**
   * Calculate listing quality score
   * @param {Object} listing - Listing data
   * @returns {number} - Quality score (0-15)
   */
  calculateQualityScore(listing) {
    let score = 0;

    // Images (0-10 points)
    const imageCount = listing.images ? listing.images.length : 0;
    if (imageCount >= 5) score += 10;
    else if (imageCount >= 3) score += 7;
    else if (imageCount >= 1) score += 4;
    else score += 0;

    // Description length (0-5 points)
    const description = listing.description || listing.title || '';
    const descLength = description.length;
    if (descLength >= 300) score += 5;
    else if (descLength >= 150) score += 3;
    else if (descLength >= 50) score += 1;

    return Math.min(15, score);
  }

  /**
   * Calculate rarity score using heuristics
   * @param {string} brand - Brand name
   * @param {string} model - Model name
   * @returns {number} - Rarity score (0-10)
   */
  calculateRarityScoreHeuristic(brand, model) {
    const brandLower = (brand || '').toLowerCase();
    const modelLower = (model || '').toLowerCase();

    // High-demand luxury brands
    const luxuryBrands = ['rolex', 'patek', 'audemars', 'vacheron', 'lange'];
    const isLuxury = luxuryBrands.some(b => brandLower.includes(b));

    // Popular models
    const popularModels = [
      'submariner', 'daytona', 'nautilus', 'royal oak',
      'speedmaster', 'datejust', 'gmt', 'explorer'
    ];
    const isPopular = popularModels.some(m => modelLower.includes(m));

    if (isLuxury && isPopular) return 10; // High demand luxury + popular model
    if (isLuxury) return 8; // Luxury brand
    if (isPopular) return 7; // Popular model
    return 5; // Neutral
  }

  /**
   * Calculate rarity score using AI
   * @param {string} brand - Brand name
   * @param {string} model - Model name
   * @returns {Promise<number>} - Rarity score (0-10)
   */
  async calculateRarityScoreAI(brand, model) {
    try {
      const prompt = `Rate the current market demand and collectibility for a ${brand} ${model} watch on a scale of 0-10, where:
- 0-2: Low demand, common, not collectible
- 3-4: Below average demand
- 5-6: Average market demand
- 7-8: Above average demand, sought after
- 9-10: Extremely high demand, iconic, highly collectible

Consider factors like brand prestige, model popularity, rarity, and collector interest.

Return ONLY a single number from 0-10. No explanation.`;

      const response = await openaiClient.chat({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a luxury watch market expert. Respond with only a number.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 10
      });

      const score = parseInt(response.choices[0].message.content.trim());
      return Math.min(10, Math.max(0, score || 5)); // Clamp to 0-10, default 5

    } catch (error) {
      console.error('AI rarity scoring error:', error);
      return 5; // Fallback to neutral
    }
  }

  /**
   * Get deal grade from score
   * @param {number} score - Total score (0-100)
   * @returns {string} - Grade (HOT DEAL, GOOD DEAL, FAIR, or empty)
   */
  getGrade(score) {
    if (score >= 90) return 'HOT DEAL';
    if (score >= 75) return 'GOOD DEAL';
    if (score >= 60) return 'FAIR';
    return '';
  }

  /**
   * Enable or disable AI-powered rarity scoring
   * @param {boolean} enabled - Whether to use AI
   */
  setAIRarityScoring(enabled) {
    this.useAIForRarity = enabled;
    console.log(`AI rarity scoring: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
}

module.exports = new DealScorer();
