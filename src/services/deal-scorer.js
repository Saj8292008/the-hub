/**
 * Deal Scorer v3.0 — Comprehensive 0-100 Scoring System
 * 
 * Scoring breakdown (100 points total):
 *   Price vs Market Average:  40 pts — how much below average for brand/model
 *   Seller Reputation:        20 pts — Reddit account age, karma, flair, sales history
 *   Condition:                15 pts — parsed from title/description (BNIB > mint > excellent > good > fair)
 *   Completeness:             10 pts — box, papers, warranty, cards mentioned
 *   Listing Freshness:        10 pts — newer = higher, decays over time
 *   Price Sweet Spot:          5 pts — deals in $500-$5000 range score slightly higher
 * 
 * Returns { score, breakdown } where breakdown explains points per category.
 */

const supabase = require('../db/supabase');

// ─── Weight Configuration ──────────────────────────────────────────────────────
const WEIGHTS = {
  priceVsMarket: 40,
  sellerReputation: 20,
  condition: 15,
  completeness: 10,
  freshness: 10,
  priceSweetSpot: 5
};

// ─── Condition Keywords (ordered best → worst) ─────────────────────────────────
const CONDITION_TIERS = [
  { keywords: ['bnib', 'brand new in box', 'brand new', 'sealed', 'unworn', 'stickered', 'new with tags', 'nwt', 'deadstock'], score: 1.0, label: 'Brand New / BNIB' },
  { keywords: ['mint', 'like new', 'pristine', 'flawless', 'near mint', 'nm'], score: 0.85, label: 'Mint' },
  { keywords: ['excellent', 'exc', 'exc+', 'near excellent'], score: 0.70, label: 'Excellent' },
  { keywords: ['very good', 'great', 'vg', 'lightly used', 'minimal wear', 'light wear'], score: 0.55, label: 'Very Good' },
  { keywords: ['good', 'gd', 'normal wear', 'some wear'], score: 0.40, label: 'Good' },
  { keywords: ['fair', 'average', 'moderate wear', 'visible wear', 'worn'], score: 0.25, label: 'Fair' },
  { keywords: ['poor', 'rough', 'damaged', 'for parts', 'project', 'needs work', 'well worn', 'beater'], score: 0.10, label: 'Poor' }
];

// ─── Completeness Keywords ──────────────────────────────────────────────────────
const COMPLETENESS_ITEMS = [
  { keywords: ['box', 'inner box', 'outer box', 'original box'], points: 2.5, label: 'Box' },
  { keywords: ['papers', 'card', 'warranty card', 'guarantee card', 'cert', 'certificate'], points: 2.5, label: 'Papers/Card' },
  { keywords: ['warranty', 'guarantee', 'under warranty', 'ad warranty'], points: 2.5, label: 'Warranty' },
  { keywords: ['full set', 'full kit', 'complete set', 'complete kit', 'all original'], points: 10, label: 'Full Set' },  // full override
  { keywords: ['hang tag', 'tags', 'booklet', 'manual', 'extra links', 'extra strap', 'nato', 'bracelet'], points: 1.25, label: 'Extras' },
  { keywords: ['receipt', 'invoice', 'proof of purchase'], points: 1.25, label: 'Receipt' }
];

// ─── Market Price Cache ─────────────────────────────────────────────────────────
let _marketPriceCache = null;
let _marketPriceCacheTime = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Load market prices from Supabase (cached)
 * @returns {Map<string, {avg_price, min_price, max_price, sample_count}>}
 */
async function loadMarketPrices() {
  const now = Date.now();
  if (_marketPriceCache && (now - _marketPriceCacheTime) < CACHE_TTL_MS) {
    return _marketPriceCache;
  }

  const map = new Map();

  if (!supabase.isAvailable()) {
    return map;
  }

  try {
    const { data, error } = await supabase.client
      .from('market_prices')
      .select('brand, model, avg_price, min_price, max_price, sample_count');

    if (error) {
      console.warn('[deal-scorer] Failed to load market_prices:', error.message);
      return map;
    }

    for (const row of (data || [])) {
      const key = `${(row.brand || '').toLowerCase()}::${(row.model || '').toLowerCase()}`;
      map.set(key, row);
    }

    _marketPriceCache = map;
    _marketPriceCacheTime = now;
  } catch (err) {
    console.warn('[deal-scorer] Error loading market prices:', err.message);
  }

  return map;
}

/**
 * Clear market price cache (call after recalculating market prices)
 */
function clearMarketPriceCache() {
  _marketPriceCache = null;
  _marketPriceCacheTime = 0;
}

// ─── Scoring Functions ──────────────────────────────────────────────────────────

/**
 * Try to extract a price from the title if the DB price looks wrong
 */
function extractPriceFromTitle(title) {
  if (!title) return null;
  // Match patterns like $3,750 / $3750 / $109,000
  const matches = title.match(/\$\s?([\d,]+(?:\.\d{2})?)/g);
  if (!matches) return null;
  const prices = matches.map(m => parseFloat(m.replace(/[$,\s]/g, ''))).filter(p => p > 0);
  // Return the most reasonable-looking price (usually the last one mentioned)
  return prices.length > 0 ? prices[prices.length - 1] : null;
}

/**
 * Score price vs market average (0-40 points)
 * More below average = more points, above average = fewer points
 */
async function scorePriceVsMarket(listing) {
  const maxPoints = WEIGHTS.priceVsMarket;
  const result = { points: 0, max: maxPoints, details: {} };

  let price = parseFloat(listing.price);
  
  // Sanity check: if DB price seems truncated vs title price, use title price
  const titlePrice = extractPriceFromTitle(listing.title);
  if (titlePrice && price > 0 && titlePrice > price * 5 && titlePrice < price * 100) {
    result.details.priceCorrection = { dbPrice: price, titlePrice };
    price = titlePrice;
  }
  
  if (!price || price <= 0) {
    result.details.note = 'No valid price';
    return result;
  }

  const marketPrices = await loadMarketPrices();
  const brand = (listing.brand || '').toLowerCase();
  const model = (listing.model || '').toLowerCase();

  // Try exact brand::model match first
  let marketData = marketPrices.get(`${brand}::${model}`);

  // Try fuzzy: brand with partial model
  if (!marketData) {
    for (const [key, data] of marketPrices) {
      const [mBrand, mModel] = key.split('::');
      if (brand.includes(mBrand) || mBrand.includes(brand)) {
        if (model.includes(mModel) || mModel.includes(model)) {
          marketData = data;
          break;
        }
      }
    }
  }

  // Fall back: try brand-only match from market_prices
  if (!marketData) {
    for (const [key, data] of marketPrices) {
      const [mBrand] = key.split('::');
      if (brand && mBrand && (brand.includes(mBrand) || mBrand.includes(brand)) && mBrand !== 'unknown') {
        // Use brand-level average as rough estimate (less accurate)
        if (!marketData || data.sample_count > (marketData.sample_count || 0)) {
          marketData = { ...data, _brandOnly: true };
        }
      }
    }
  }

  if (!marketData || !marketData.avg_price) {
    // No market reference — give middle-of-the-road score
    result.points = maxPoints * 0.4; // 16/40
    result.details.note = 'No market data available — neutral score';
    return result;
  }

  const avgPrice = parseFloat(marketData.avg_price);
  const discountPct = ((avgPrice - price) / avgPrice) * 100;

  result.details.marketAverage = Math.round(avgPrice);
  result.details.listingPrice = Math.round(price);
  result.details.discountPct = Math.round(discountPct * 10) / 10;
  result.details.sampleCount = marketData.sample_count || 0;

  // Scoring curve: 
  //   ≥30% below → full 40pts
  //   20% below → 34pts
  //   10% below → 26pts
  //   At market → 16pts
  //   10% above → 8pts
  //   ≥20% above → 2pts
  let ratio;
  if (discountPct >= 30) ratio = 1.0;
  else if (discountPct >= 20) ratio = 0.75 + (discountPct - 20) * 0.025;   // 0.75-1.0
  else if (discountPct >= 10) ratio = 0.55 + (discountPct - 10) * 0.020;   // 0.55-0.75
  else if (discountPct >= 0) ratio = 0.35 + (discountPct) * 0.020;          // 0.35-0.55
  else if (discountPct >= -10) ratio = 0.15 + (discountPct + 10) * 0.020;   // 0.15-0.35
  else if (discountPct >= -20) ratio = 0.05 + (discountPct + 20) * 0.010;   // 0.05-0.15
  else ratio = 0.05;

  result.points = Math.round(maxPoints * Math.max(0, Math.min(1, ratio)) * 10) / 10;
  return result;
}

/**
 * Score seller reputation (0-20 points)
 * For Reddit: parses account info, karma, flair, transaction history
 */
function scoreSellerReputation(listing) {
  const maxPoints = WEIGHTS.sellerReputation;
  const result = { points: 0, max: maxPoints, details: {} };
  const text = `${listing.title || ''} ${listing.description || ''} ${listing.seller || ''} ${listing.seller_name || ''}`.toLowerCase();
  const source = (listing.source || '').toLowerCase();

  let score = 0;

  // ── Source platform baseline (0-6 pts) ──
  const platformScores = {
    'chrono24': 6, 'watchbox': 5.5, 'hodinkee': 5.5,
    'watchuseek': 4.5, 'reddit': 4, 'ebay': 3.5, 'facebook': 2
  };
  const platformBase = platformScores[source] || 3;
  score += platformBase;
  result.details.platform = source;
  result.details.platformScore = platformBase;

  // ── Reddit flair / transaction count (0-7 pts) ──
  // Reddit r/Watchexchange uses flair like "5+ transactions", "25+ transactions"
  const txnMatch = text.match(/(\d+)\+?\s*transaction/i);
  if (txnMatch) {
    const txnCount = parseInt(txnMatch[1]);
    result.details.transactions = txnCount;
    if (txnCount >= 100) score += 7;
    else if (txnCount >= 50) score += 6;
    else if (txnCount >= 25) score += 5;
    else if (txnCount >= 10) score += 4;
    else if (txnCount >= 5) score += 3;
    else if (txnCount >= 1) score += 1.5;
  }

  // ── Seller type signals (0-4 pts) ──
  const sellerType = (listing.seller_type || '').toLowerCase();
  if (sellerType === 'dealer' || text.includes('dealer') || text.includes('authorized')) {
    score += 4;
    result.details.sellerType = 'Dealer';
  } else if (sellerType === 'professional' || text.includes('professional seller') || text.includes('full-time')) {
    score += 3;
    result.details.sellerType = 'Professional';
  } else if (text.includes('collector') || text.includes('enthusiast')) {
    score += 1.5;
    result.details.sellerType = 'Collector';
  }

  // ── Seller rating if available (0-3 pts) ──
  const rating = parseFloat(listing.seller_rating);
  if (rating > 0) {
    if (rating >= 99) score += 3;
    else if (rating >= 95) score += 2;
    else if (rating >= 90) score += 1;
    result.details.rating = rating;
  }

  // ── Negative signals (deductions) ──
  if (text.includes('first time seller') || text.includes('first sale') || text.includes('new seller')) {
    score -= 3;
    result.details.newSeller = true;
  }
  if (text.includes('no returns') || text.includes('as-is') || text.includes('as is')) {
    score -= 1;
    result.details.noReturns = true;
  }

  result.points = Math.round(Math.max(0, Math.min(maxPoints, score)) * 10) / 10;
  return result;
}

/**
 * Score condition (0-15 points)
 * Parses condition from the condition field, title, and description
 */
function scoreCondition(listing) {
  const maxPoints = WEIGHTS.condition;
  const result = { points: 0, max: maxPoints, details: {} };

  // Combine all text sources
  const conditionField = (listing.condition || '').toLowerCase();
  const title = (listing.title || '').toLowerCase();
  const description = (listing.description || '').toLowerCase();
  const allText = `${conditionField} ${title} ${description}`;

  // Try condition field first (most reliable), then title, then description
  let bestTier = null;
  let bestTierIndex = CONDITION_TIERS.length; // lower = better

  for (let i = 0; i < CONDITION_TIERS.length; i++) {
    const tier = CONDITION_TIERS[i];
    for (const kw of tier.keywords) {
      // Check condition field with exact/loose match
      if (conditionField && conditionField.includes(kw)) {
        if (i < bestTierIndex) {
          bestTier = tier;
          bestTierIndex = i;
        }
        break;
      }
      // Check title (high signal)
      if (title.includes(kw)) {
        if (i < bestTierIndex) {
          bestTier = tier;
          bestTierIndex = i;
        }
        break;
      }
      // Check description  
      if (description && description.includes(kw)) {
        if (i < bestTierIndex) {
          bestTier = tier;
          bestTierIndex = i;
        }
        break;
      }
    }
  }

  if (bestTier) {
    result.points = Math.round(maxPoints * bestTier.score * 10) / 10;
    result.details.detected = bestTier.label;
    result.details.confidence = conditionField !== 'unknown' && conditionField ? 'high' : 'medium';
  } else {
    // Unknown condition — give neutral score (most Reddit listings don't specify)
    result.points = maxPoints * 0.40; // ~6/15
    result.details.detected = 'Unknown';
    result.details.confidence = 'low';
  }

  return result;
}

/**
 * Score completeness (0-10 points)
 * Checks for box, papers, warranty, full set, extras
 */
function scoreCompleteness(listing) {
  const maxPoints = WEIGHTS.completeness;
  const result = { points: 0, max: maxPoints, details: { items: [] } };

  const title = (listing.title || '').toLowerCase();
  const description = (listing.description || '').toLowerCase();
  const boxPapers = (listing.box_and_papers || '').toLowerCase();
  const allText = `${title} ${description} ${boxPapers}`;

  let points = 0;
  let hasFullSet = false;

  for (const item of COMPLETENESS_ITEMS) {
    for (const kw of item.keywords) {
      if (allText.includes(kw)) {
        if (item.label === 'Full Set') {
          hasFullSet = true;
          result.details.items.push('Full Set');
        } else {
          points += item.points;
          result.details.items.push(item.label);
        }
        break; // Only count each item once
      }
    }
  }

  if (hasFullSet) {
    // Full set overrides individual items to max
    result.points = maxPoints;
    result.details.fullSet = true;
  } else {
    // De-duplicate labels
    result.details.items = [...new Set(result.details.items)];
    result.points = Math.round(Math.min(maxPoints, points) * 10) / 10;
  }

  return result;
}

/**
 * Score listing freshness (0-10 points)
 * Newer listings score higher; exponential decay
 */
function scoreFreshness(listing) {
  const maxPoints = WEIGHTS.freshness;
  const result = { points: 0, max: maxPoints, details: {} };

  const timestamp = listing.timestamp || listing.created_at || listing.scraped_at;
  if (!timestamp) {
    result.points = maxPoints * 0.3;
    result.details.note = 'No timestamp';
    return result;
  }

  const listingDate = new Date(timestamp);
  const hoursOld = (Date.now() - listingDate.getTime()) / (1000 * 60 * 60);
  result.details.hoursOld = Math.round(hoursOld);

  // Decay curve:
  //   0-6 hours:    100%  (10pts)
  //   6-24 hours:    80%  (8pts)
  //   1-3 days:      60%  (6pts)
  //   3-7 days:      40%  (4pts)
  //   1-2 weeks:     25%  (2.5pts)
  //   2-4 weeks:     15%  (1.5pts)
  //   > 4 weeks:     5%   (0.5pts)
  let ratio;
  if (hoursOld <= 6) ratio = 1.0;
  else if (hoursOld <= 24) ratio = 0.8;
  else if (hoursOld <= 72) ratio = 0.6;
  else if (hoursOld <= 168) ratio = 0.4;
  else if (hoursOld <= 336) ratio = 0.25;
  else if (hoursOld <= 672) ratio = 0.15;
  else ratio = 0.05;

  result.points = Math.round(maxPoints * ratio * 10) / 10;
  return result;
}

/**
 * Score price sweet spot (0-5 points)
 * Deals in the $500-$5000 range score highest (most buyer demand)
 */
function scorePriceSweetSpot(listing) {
  const maxPoints = WEIGHTS.priceSweetSpot;
  const result = { points: 0, max: maxPoints, details: {} };

  let price = parseFloat(listing.price);
  // Use title price if DB price looks truncated
  const titlePrice = extractPriceFromTitle(listing.title);
  if (titlePrice && price > 0 && titlePrice > price * 5 && titlePrice < price * 100) {
    price = titlePrice;
  }
  if (!price || price <= 0) {
    result.details.note = 'No valid price';
    return result;
  }

  result.details.price = price;

  // Sweet spot scoring:
  //   $500-$5000:   100% (5pts)  — peak buyer demand
  //   $200-$500:     70% (3.5pts)
  //   $5000-$10000:  60% (3pts)
  //   $100-$200:     40% (2pts)
  //   $10000-$25000: 40% (2pts)
  //   < $100:        20% (1pt)
  //   > $25000:      20% (1pt)  — niche market
  let ratio;
  if (price >= 500 && price <= 5000) ratio = 1.0;
  else if (price >= 200 && price < 500) ratio = 0.7;
  else if (price > 5000 && price <= 10000) ratio = 0.6;
  else if (price >= 100 && price < 200) ratio = 0.4;
  else if (price > 10000 && price <= 25000) ratio = 0.4;
  else if (price < 100) ratio = 0.2;
  else ratio = 0.2;

  result.points = Math.round(maxPoints * ratio * 10) / 10;
  result.details.sweetSpot = price >= 500 && price <= 5000;
  return result;
}

// ─── Main Scoring Function ──────────────────────────────────────────────────────

/**
 * Score a deal listing on a 0-100 scale with full breakdown.
 * 
 * @param {Object} listing — a watch_listings row (or object with same shape)
 * @returns {Promise<{score: number, breakdown: Object, grade: string}>}
 */
async function scoreDeal(listing) {
  if (!listing) throw new Error('Listing is required');

  const [priceVsMarket, sellerReputation, condition, completeness, freshness, priceSweetSpot] = await Promise.all([
    scorePriceVsMarket(listing),
    Promise.resolve(scoreSellerReputation(listing)),
    Promise.resolve(scoreCondition(listing)),
    Promise.resolve(scoreCompleteness(listing)),
    Promise.resolve(scoreFreshness(listing)),
    Promise.resolve(scorePriceSweetSpot(listing))
  ]);

  const totalScore = Math.round(
    priceVsMarket.points +
    sellerReputation.points +
    condition.points +
    completeness.points +
    freshness.points +
    priceSweetSpot.points
  );

  const score = Math.max(0, Math.min(100, totalScore));

  const breakdown = {
    priceVsMarket,
    sellerReputation,
    condition,
    completeness,
    freshness,
    priceSweetSpot
  };

  return {
    score,
    breakdown,
    grade: getGrade(score)
  };
}

/**
 * Get a human-readable grade from a 0-100 score
 */
function getGrade(score) {
  if (score >= 90) return '🔥 INSANE DEAL';
  if (score >= 75) return '⭐ GREAT DEAL';
  if (score >= 60) return '👍 GOOD DEAL';
  if (score >= 45) return '🤷 FAIR';
  if (score >= 30) return '👎 BELOW AVERAGE';
  return '❌ POOR VALUE';
}

/**
 * Get score summary as a one-liner
 */
function scoreSummary(result) {
  const { score, grade, breakdown } = result;
  const parts = [];
  if (breakdown.priceVsMarket.details.discountPct) {
    const d = breakdown.priceVsMarket.details.discountPct;
    parts.push(d > 0 ? `${d}% below market` : `${Math.abs(d)}% above market`);
  }
  if (breakdown.condition.details.detected && breakdown.condition.details.detected !== 'Unknown') {
    parts.push(breakdown.condition.details.detected);
  }
  if (breakdown.completeness.details.fullSet) {
    parts.push('Full set');
  } else if (breakdown.completeness.details.items.length > 0) {
    parts.push(breakdown.completeness.details.items.join(', '));
  }
  return `${score}/100 ${grade} — ${parts.join(' • ') || 'Standard listing'}`;
}

module.exports = {
  scoreDeal,
  getGrade,
  scoreSummary,
  clearMarketPriceCache,
  WEIGHTS,
  // Export sub-scorers for testing
  _internal: {
    scorePriceVsMarket,
    scoreSellerReputation,
    scoreCondition,
    scoreCompleteness,
    scoreFreshness,
    scorePriceSweetSpot
  }
};
