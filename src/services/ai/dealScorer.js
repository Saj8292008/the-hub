/**
 * Deal Scoring Service v2.0
 * Improved scoring algorithm with:
 * - Price vs market average (with profit potential)
 * - Seller reputation scoring
 * - Deal velocity/urgency tracking
 * - Brand demand scoring
 * - Category-specific configurations
 * - Deal of the Day selection
 */

const openaiClient = require('../openai/client');
const supabase = require('../../db/supabase');

/**
 * Category-specific scoring configurations
 * Weights must sum to 100
 */
const CATEGORY_CONFIGS = {
  watch: {
    name: 'Watches',
    weights: {
      price: 30,        // Price vs market average
      condition: 15,    // Item condition
      seller: 15,       // Seller reputation
      velocity: 15,     // Deal urgency/velocity
      demand: 15,       // Brand/model demand
      quality: 10       // Listing quality
    },
    thresholds: {
      hotDeal: 82,
      greatDeal: 72,
      goodDeal: 62,
      fair: 50
    },
    // Hot brands with demand multipliers
    brandDemand: {
      'rolex': 1.5,
      'patek philippe': 1.6,
      'audemars piguet': 1.5,
      'omega': 1.2,
      'tudor': 1.2,
      'grand seiko': 1.15,
      'cartier': 1.1,
      'iwc': 1.1,
      'jaeger-lecoultre': 1.1,
      'vacheron constantin': 1.4,
      'a. lange & söhne': 1.4
    },
    // Hot models with extra demand
    modelDemand: {
      'submariner': 1.4,
      'daytona': 1.5,
      'gmt-master': 1.3,
      'nautilus': 1.6,
      'royal oak': 1.4,
      'speedmaster': 1.2,
      'aquanaut': 1.4,
      'datejust': 1.1,
      'explorer': 1.2,
      'black bay': 1.1
    },
    // Average profit margins for resale (%)
    avgProfitMargin: 8,
    // Trusted platforms
    trustedSources: {
      'chrono24': { score: 95, label: 'Verified Dealer Platform' },
      'watchbox': { score: 90, label: 'Certified Pre-Owned' },
      'hodinkee': { score: 88, label: 'Editorial Verified' },
      'watchuseek': { score: 80, label: 'Community Verified' },
      'reddit': { score: 65, label: 'Community' },
      'ebay': { score: 60, label: 'Marketplace' },
      'facebook': { score: 55, label: 'Social Marketplace' }
    }
  },
  sneaker: {
    name: 'Sneakers',
    weights: {
      price: 35,        // Price more important (resale market)
      condition: 15,    
      seller: 10,       
      velocity: 20,     // Velocity very important (hype drops)
      demand: 15,       
      quality: 5        
    },
    thresholds: {
      hotDeal: 80,
      greatDeal: 70,
      goodDeal: 60,
      fair: 45
    },
    brandDemand: {
      'nike': 1.2,
      'jordan': 1.4,
      'yeezy': 1.3,
      'new balance': 1.15,
      'adidas': 1.0,
      'asics': 1.1
    },
    modelDemand: {
      'dunk': 1.3,
      'jordan 1': 1.4,
      'jordan 4': 1.3,
      'yeezy 350': 1.2,
      'air max': 1.1,
      'travis scott': 1.5,
      'off-white': 1.4
    },
    avgProfitMargin: 15,
    trustedSources: {
      'stockx': { score: 90, label: 'Verified Marketplace' },
      'goat': { score: 88, label: 'Authenticated' },
      'ebay': { score: 65, label: 'Marketplace' },
      'reddit': { score: 60, label: 'Community' }
    }
  },
  car: {
    name: 'Cars',
    weights: {
      price: 35,        // Price critical
      condition: 20,    // Condition very important
      seller: 15,       
      velocity: 10,     // Cars sell slower
      demand: 10,       
      quality: 10       
    },
    thresholds: {
      hotDeal: 78,
      greatDeal: 68,
      goodDeal: 58,
      fair: 45
    },
    brandDemand: {
      'porsche': 1.4,
      'ferrari': 1.5,
      'lamborghini': 1.4,
      'mercedes': 1.15,
      'bmw': 1.1,
      'audi': 1.1,
      'toyota': 1.05,
      'lexus': 1.1
    },
    modelDemand: {
      '911': 1.4,
      'gt3': 1.5,
      'cayman': 1.2,
      'm3': 1.2,
      'm5': 1.2,
      'supra': 1.3,
      'g-wagon': 1.3,
      'gtr': 1.25
    },
    avgProfitMargin: 5,
    trustedSources: {
      'cargurus': { score: 85, label: 'Dealer Network' },
      'autotrader': { score: 80, label: 'Dealer Network' },
      'carvana': { score: 75, label: 'Online Dealer' },
      'bring a trailer': { score: 90, label: 'Auction Verified' },
      'cars & bids': { score: 88, label: 'Auction Verified' },
      'facebook': { score: 50, label: 'Private Sales' },
      'craigslist': { score: 45, label: 'Unverified' }
    }
  }
};

class DealScorer {
  constructor() {
    this.useAIForRarity = false;
    this.categoryConfigs = CATEGORY_CONFIGS;
    this.dealOfTheDay = {};  // Cache by category
  }

  /**
   * Get category configuration
   */
  getConfig(category) {
    return this.categoryConfigs[category] || this.categoryConfigs.watch;
  }

  /**
   * Update category configuration (for admin customization)
   */
  updateCategoryConfig(category, updates) {
    if (this.categoryConfigs[category]) {
      this.categoryConfigs[category] = {
        ...this.categoryConfigs[category],
        ...updates
      };
      return true;
    }
    return false;
  }

  /**
   * Main scoring function - works for any category
   * @param {Object} listing - Listing data
   * @param {string} category - Category (watch, sneaker, car)
   * @returns {Promise<Object>} - Score, breakdown, profit potential, grade
   */
  async scoreListing(listing, category = 'watch') {
    if (!listing) {
      throw new Error('Listing data is required');
    }

    const config = this.getConfig(category);

    // Calculate all component scores (0-100 scale)
    const [priceData, conditionScore, sellerScore, velocityScore, demandScore, qualityScore] = 
      await Promise.all([
        this.calculatePriceScore(listing, category),
        this.calculateConditionScore(listing.condition),
        this.calculateSellerScore(listing.source, listing.seller, category),
        this.calculateVelocityScore(listing, category),
        this.calculateDemandScore(listing.brand, listing.model, category),
        this.calculateQualityScore(listing)
      ]);

    // Apply category weights to get final score
    const weights = config.weights;
    const weightedScore = (
      (priceData.score * weights.price / 100) +
      (conditionScore * weights.condition / 100) +
      (sellerScore * weights.seller / 100) +
      (velocityScore * weights.velocity / 100) +
      (demandScore * weights.demand / 100) +
      (qualityScore * weights.quality / 100)
    );

    const totalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    // Calculate profit potential
    const profitPotential = this.calculateProfitPotential(listing, priceData, demandScore, category);

    return {
      score: totalScore,
      breakdown: {
        price: { score: priceData.score, weight: weights.price, details: priceData.details },
        condition: { score: conditionScore, weight: weights.condition },
        seller: { score: sellerScore, weight: weights.seller },
        velocity: { score: velocityScore, weight: weights.velocity },
        demand: { score: demandScore, weight: weights.demand },
        quality: { score: qualityScore, weight: weights.quality }
      },
      grade: this.getGrade(totalScore, category),
      profitPotential,
      category
    };
  }

  /**
   * Legacy method - maintains backward compatibility
   */
  async scoreWatchListing(listing) {
    return this.scoreListing(listing, 'watch');
  }

  /**
   * Calculate price score (0-100)
   * Now includes market comparison details
   */
  async calculatePriceScore(listing, category = 'watch') {
    const details = {
      marketAverage: null,
      listingPrice: null,
      discount: null,
      priceDataSource: 'none'
    };

    try {
      const avgPrice = await this.getAverageMarketPrice(
        listing.brand,
        listing.model,
        category
      );

      const listingPrice = parseFloat(listing.price);
      details.listingPrice = listingPrice;

      if (!avgPrice || avgPrice === 0 || !listingPrice) {
        // No market data - neutral score
        return { score: 50, details: { ...details, note: 'No market data available' } };
      }

      details.marketAverage = Math.round(avgPrice);
      details.priceDataSource = 'historical';
      
      const ratio = listingPrice / avgPrice;
      const discountPercent = (1 - ratio) * 100;
      details.discount = Math.round(discountPercent);

      // Score based on discount/premium percentage
      // More granular scoring curve
      let score;
      if (ratio <= 0.65) score = 100;      // 35%+ below - INSANE DEAL
      else if (ratio <= 0.70) score = 95;  // 30-35% below
      else if (ratio <= 0.75) score = 90;  // 25-30% below
      else if (ratio <= 0.80) score = 85;  // 20-25% below
      else if (ratio <= 0.85) score = 78;  // 15-20% below
      else if (ratio <= 0.90) score = 70;  // 10-15% below
      else if (ratio <= 0.95) score = 62;  // 5-10% below
      else if (ratio <= 1.00) score = 55;  // At market
      else if (ratio <= 1.05) score = 45;  // 0-5% above
      else if (ratio <= 1.10) score = 35;  // 5-10% above
      else if (ratio <= 1.15) score = 25;  // 10-15% above
      else if (ratio <= 1.20) score = 15;  // 15-20% above
      else score = 5;                       // 20%+ above

      return { score, details };

    } catch (error) {
      console.error('Price score calculation error:', error);
      return { score: 50, details: { ...details, error: error.message } };
    }
  }

  /**
   * Get average market price with improved data gathering
   */
  async getAverageMarketPrice(brand, model, category) {
    try {
      if (!supabase.isAvailable()) {
        return null;
      }

      const tableName = `${category}_listings`;

      // Query recent prices for this brand/model
      const { data, error } = await supabase.client
        .from(tableName)
        .select('price, timestamp, condition, source')
        .ilike('brand', brand || '')
        .ilike('model', `%${model || ''}%`)
        .gte('timestamp', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error || !data || data.length < 3) {
        // Try broader search with just brand
        const { data: brandData } = await supabase.client
          .from(tableName)
          .select('price, timestamp')
          .ilike('brand', brand || '')
          .gte('timestamp', new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString())
          .limit(50);

        if (!brandData || brandData.length < 3) return null;
        
        const prices = brandData.map(item => parseFloat(item.price)).filter(p => p > 0);
        return this.calculateTrimmedMean(prices);
      }

      const prices = data.map(item => parseFloat(item.price)).filter(p => p > 0);
      return this.calculateTrimmedMean(prices);

    } catch (error) {
      console.error('Error fetching market price:', error);
      return null;
    }
  }

  /**
   * Calculate trimmed mean (removes outliers)
   */
  calculateTrimmedMean(prices) {
    if (prices.length === 0) return null;
    if (prices.length < 5) {
      // Too few samples for trimming, use median instead
      prices.sort((a, b) => a - b);
      return prices[Math.floor(prices.length / 2)];
    }

    prices.sort((a, b) => a - b);
    const trimCount = Math.floor(prices.length * 0.15); // Remove top/bottom 15%
    const trimmedPrices = prices.slice(trimCount, prices.length - trimCount);
    
    if (trimmedPrices.length === 0) return prices[Math.floor(prices.length / 2)];
    
    return trimmedPrices.reduce((sum, p) => sum + p, 0) / trimmedPrices.length;
  }

  /**
   * Calculate condition score (0-100)
   */
  calculateConditionScore(condition) {
    if (!condition) return 50; // Neutral if unknown

    const conditionLower = condition.toLowerCase().trim();

    // Detailed condition mapping
    const conditionMap = {
      // Excellent conditions
      'new': 100, 'brand new': 100, 'bnib': 100, 'unworn': 98,
      'deadstock': 100, 'ds': 100, 'sealed': 100,
      'mint': 95, 'like new': 93, 'excellent': 90,
      'pristine': 92, 'flawless': 90,
      
      // Good conditions  
      'very good': 80, 'great': 78, 'near mint': 85,
      'lightly used': 75, 'minimal wear': 78,
      
      // Average conditions
      'good': 65, 'average': 55, 'fair': 50,
      'used': 55, 'pre-owned': 55, 'preowned': 55,
      
      // Below average
      'worn': 40, 'visible wear': 35, 'well worn': 30,
      'poor': 20, 'damaged': 15, 'for parts': 10,
      'needs work': 25, 'project': 20
    };

    // Check for exact matches first
    if (conditionMap[conditionLower] !== undefined) {
      return conditionMap[conditionLower];
    }

    // Check for partial matches
    for (const [key, score] of Object.entries(conditionMap)) {
      if (conditionLower.includes(key)) {
        return score;
      }
    }

    return 50; // Default neutral
  }

  /**
   * Calculate seller reputation score (0-100)
   */
  calculateSellerScore(source, seller, category) {
    const config = this.getConfig(category);
    const trustedSources = config.trustedSources;

    if (!source) return 50;

    const sourceLower = source.toLowerCase();
    let baseScore = 50;

    // Check trusted sources
    for (const [platform, data] of Object.entries(trustedSources)) {
      if (sourceLower.includes(platform)) {
        baseScore = data.score;
        break;
      }
    }

    // Adjust based on seller-specific info
    if (seller) {
      const sellerLower = seller.toLowerCase();
      
      // Positive indicators
      if (sellerLower.includes('verified') || sellerLower.includes('top rated')) baseScore += 10;
      if (sellerLower.includes('100%') || sellerLower.includes('trusted')) baseScore += 8;
      if (sellerLower.includes('pro') || sellerLower.includes('dealer')) baseScore += 5;
      if (sellerLower.match(/\d+\s*sales/) || sellerLower.match(/\d+\s*transactions/)) {
        const salesMatch = sellerLower.match(/(\d+)\s*(sales|transactions)/);
        if (salesMatch && parseInt(salesMatch[1]) > 100) baseScore += 7;
        else if (salesMatch && parseInt(salesMatch[1]) > 50) baseScore += 4;
      }
      
      // Negative indicators
      if (sellerLower.includes('new seller') || sellerLower.includes('first time')) baseScore -= 10;
      if (sellerLower.includes('no returns') || sellerLower.includes('as is')) baseScore -= 5;
    }

    return Math.min(100, Math.max(0, baseScore));
  }

  /**
   * Calculate deal velocity/urgency score (0-100)
   * Factors: time on market, price drops, views, inquiries
   */
  async calculateVelocityScore(listing, category) {
    let score = 50; // Base neutral score

    // Time since listing
    if (listing.timestamp || listing.created_at) {
      const listingDate = new Date(listing.timestamp || listing.created_at);
      const daysSincePosted = (Date.now() - listingDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Fresh listings get bonus (urgency!)
      if (daysSincePosted < 1) score += 25;        // Less than 24h - HOT
      else if (daysSincePosted < 3) score += 20;   // 1-3 days
      else if (daysSincePosted < 7) score += 12;   // 3-7 days
      else if (daysSincePosted < 14) score += 5;   // 1-2 weeks
      else if (daysSincePosted > 30) score -= 10;  // Over a month - stale
      else if (daysSincePosted > 60) score -= 20;  // Over 2 months - very stale
    }

    // Price drops indicate motivated seller
    if (listing.original_price && listing.price) {
      const originalPrice = parseFloat(listing.original_price);
      const currentPrice = parseFloat(listing.price);
      if (originalPrice > currentPrice) {
        const dropPercent = ((originalPrice - currentPrice) / originalPrice) * 100;
        if (dropPercent >= 20) score += 20;
        else if (dropPercent >= 10) score += 15;
        else if (dropPercent >= 5) score += 8;
      }
    }

    // High engagement indicates hot deal
    if (listing.views) {
      if (listing.views > 1000) score += 15;
      else if (listing.views > 500) score += 10;
      else if (listing.views > 100) score += 5;
    }

    if (listing.inquiries || listing.watchers) {
      const interest = (listing.inquiries || 0) + (listing.watchers || 0);
      if (interest > 20) score += 15;
      else if (interest > 10) score += 10;
      else if (interest > 5) score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate brand/model demand score (0-100)
   */
  calculateDemandScore(brand, model, category) {
    const config = this.getConfig(category);
    let score = 50; // Neutral base

    const brandLower = (brand || '').toLowerCase();
    const modelLower = (model || '').toLowerCase();

    // Apply brand demand multiplier
    for (const [brandName, multiplier] of Object.entries(config.brandDemand || {})) {
      if (brandLower.includes(brandName)) {
        score = 50 * multiplier;
        break;
      }
    }

    // Apply model demand multiplier (stacks with brand)
    for (const [modelName, multiplier] of Object.entries(config.modelDemand || {})) {
      if (modelLower.includes(modelName)) {
        score *= multiplier;
        break;
      }
    }

    // AI enhancement if enabled
    if (this.useAIForRarity && openaiClient.isAvailable()) {
      // Can add AI-powered demand scoring here
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate listing quality score (0-100)
   */
  calculateQualityScore(listing) {
    let score = 0;

    // Images (0-50 points)
    const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
    if (imageCount >= 10) score += 50;
    else if (imageCount >= 6) score += 40;
    else if (imageCount >= 4) score += 30;
    else if (imageCount >= 2) score += 20;
    else if (imageCount >= 1) score += 10;

    // Description quality (0-30 points)
    const description = listing.description || listing.title || '';
    const descLength = description.length;
    if (descLength >= 500) score += 30;
    else if (descLength >= 300) score += 24;
    else if (descLength >= 150) score += 18;
    else if (descLength >= 50) score += 10;

    // Has key details (0-20 points)
    const text = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();
    if (text.includes('box') || text.includes('papers') || text.includes('original')) score += 5;
    if (text.includes('warranty') || text.includes('certificate')) score += 5;
    if (text.includes('serial') || text.includes('reference') || text.includes('ref')) score += 5;
    if (listing.year || text.match(/\b(19|20)\d{2}\b/)) score += 5;

    return Math.min(100, score);
  }

  /**
   * Calculate profit potential for resellers
   * Returns estimated profit %, dollar amount, and confidence
   */
  calculateProfitPotential(listing, priceData, demandScore, category) {
    const config = this.getConfig(category);
    const listingPrice = parseFloat(listing.price) || 0;
    
    if (!listingPrice || !priceData.details.marketAverage) {
      return {
        estimatedProfit: null,
        profitPercent: null,
        confidence: 'low',
        recommendation: 'Insufficient market data'
      };
    }

    const marketAvg = priceData.details.marketAverage;
    const discountPercent = priceData.details.discount || 0;

    // Calculate potential sale price (slightly below market)
    const sellPrice = marketAvg * 0.97; // Sell at 3% below market for quick sale
    
    // Calculate costs (platform fees, shipping)
    const platformFee = sellPrice * 0.10; // Assume 10% platform fee
    const shippingCost = category === 'car' ? 500 : (category === 'watch' ? 30 : 15);
    
    // Calculate profit
    const grossProfit = sellPrice - listingPrice;
    const netProfit = grossProfit - platformFee - shippingCost;
    const profitPercent = (netProfit / listingPrice) * 100;

    // Confidence based on demand and price data quality
    let confidence = 'medium';
    if (demandScore >= 70 && priceData.details.priceDataSource === 'historical') {
      confidence = 'high';
    } else if (demandScore < 40 || discountPercent < 5) {
      confidence = 'low';
    }

    // Recommendation
    let recommendation;
    if (profitPercent >= 20 && confidence !== 'low') {
      recommendation = '🔥 Strong flip opportunity';
    } else if (profitPercent >= 10 && confidence !== 'low') {
      recommendation = '✅ Good resale potential';
    } else if (profitPercent >= 5) {
      recommendation = '⚖️ Modest margin after fees';
    } else if (profitPercent > 0) {
      recommendation = '⚠️ Thin margins - only for personal use';
    } else {
      recommendation = '❌ Not recommended for resale';
    }

    return {
      listingPrice: Math.round(listingPrice),
      estimatedSellPrice: Math.round(sellPrice),
      grossProfit: Math.round(grossProfit),
      estimatedFees: Math.round(platformFee + shippingCost),
      netProfit: Math.round(netProfit),
      profitPercent: Math.round(profitPercent * 10) / 10,
      confidence,
      recommendation
    };
  }

  /**
   * Get grade from score using category-specific thresholds
   */
  getGrade(score, category = 'watch') {
    const config = this.getConfig(category);
    const t = config.thresholds;

    if (score >= t.hotDeal) return '🔥 HOT DEAL';
    if (score >= t.greatDeal) return '⭐ GREAT DEAL';
    if (score >= t.goodDeal) return '👍 GOOD DEAL';
    if (score >= t.fair) return 'FAIR';
    return 'BELOW MARKET';
  }

  /**
   * Get Deal of the Day for a category
   * Finds the best deal from recent listings
   */
  async getDealOfTheDay(category = 'watch') {
    try {
      if (!supabase.isAvailable()) {
        return null;
      }

      const tableName = `${category}_listings`;
      const today = new Date().toISOString().split('T')[0];

      // Check cache first
      if (this.dealOfTheDay[category]?.date === today) {
        return this.dealOfTheDay[category].deal;
      }

      // Get top scored listings from last 48 hours
      const { data, error } = await supabase.client
        .from(tableName)
        .select('*')
        .gte('timestamp', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .not('deal_score', 'is', null)
        .order('deal_score', { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        return null;
      }

      // Find the best deal (highest score + still available)
      const bestDeal = data[0];
      
      // Enhance with full scoring details
      const scoringDetails = await this.scoreListing(bestDeal, category);

      const dealOfTheDay = {
        listing: bestDeal,
        score: scoringDetails.score,
        grade: scoringDetails.grade,
        breakdown: scoringDetails.breakdown,
        profitPotential: scoringDetails.profitPotential,
        selectedAt: new Date().toISOString(),
        reason: this.generateDealReason(scoringDetails)
      };

      // Cache it
      this.dealOfTheDay[category] = {
        date: today,
        deal: dealOfTheDay
      };

      return dealOfTheDay;

    } catch (error) {
      console.error('Error getting Deal of the Day:', error);
      return null;
    }
  }

  /**
   * Generate human-readable reason for why this is a good deal
   */
  generateDealReason(scoringDetails) {
    const reasons = [];
    const b = scoringDetails.breakdown;

    if (b.price.score >= 80) {
      const discount = b.price.details.discount;
      if (discount > 0) {
        reasons.push(`${discount}% below market average`);
      }
    }

    if (b.condition.score >= 90) {
      reasons.push('Excellent condition');
    }

    if (b.seller.score >= 85) {
      reasons.push('Highly trusted seller');
    }

    if (b.velocity.score >= 75) {
      reasons.push('Fresh listing - act fast!');
    }

    if (b.demand.score >= 75) {
      reasons.push('High-demand item');
    }

    if (scoringDetails.profitPotential?.profitPercent >= 15) {
      reasons.push(`Strong resale potential (~${scoringDetails.profitPotential.profitPercent}% margin)`);
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Great overall value';
  }

  /**
   * Get scoring configuration for admin UI
   */
  getConfiguration() {
    return {
      categories: Object.keys(this.categoryConfigs),
      configs: this.categoryConfigs,
      aiRarityEnabled: this.useAIForRarity
    };
  }

  /**
   * Enable or disable AI-powered rarity scoring
   */
  setAIRarityScoring(enabled) {
    this.useAIForRarity = enabled;
    console.log(`AI rarity scoring: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
}

module.exports = new DealScorer();
