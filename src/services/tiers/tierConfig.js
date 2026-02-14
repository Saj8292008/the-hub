/**
 * Tier Configuration
 * Defines limits and features for each subscription tier
 * 
 * Pricing (updated 2026-02-12):
 * - Free: Basic deal feed, limited alerts
 * - Pro: $9/mo or $99/yr — real-time Telegram alerts, price history,
 *   advanced deal scores, early access to deals (save ~8% with yearly)
 */

const TIERS = {
  free: {
    name: 'Free',
    displayName: 'Free Tier',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    limits: {
      tracks: 3,
      alertsPerDay: 5,
      priceHistory: false,
      aiFeatures: 'basic',
      exportData: false,
      prioritySupport: false,
      realTimeAlerts: false,
      earlyAccess: false
    },
    features: [
      'Basic deal feed',
      '3 tracked searches',
      '5 daily email alerts',
      'Basic deal scoring',
      'Community access'
    ],
    description: 'Perfect for casual deal hunters'
  },
  
  pro: {
    name: 'Pro',
    displayName: 'Pro',
    priceMonthly: 9,
    priceYearly: 99,  // $8.25/mo — save ~8% vs monthly
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY,
    limits: {
      tracks: 25,
      alertsPerDay: 100,
      priceHistory: true,
      aiFeatures: 'advanced',
      exportData: true,
      prioritySupport: true,
      realTimeAlerts: true,
      earlyAccess: true,
      alertDelay: 0  // Real-time (vs 15 min for free)
    },
    features: [
      'Real-time Telegram alerts',
      'Price history charts',
      'Advanced AI deal scoring',
      'Early access to deals',
      '25 tracked searches',
      '100 daily alerts',
      'Export data (CSV)',
      'Ad-free experience',
      'Priority support'
    ],
    description: 'For serious deal hunters who want speed',
    badge: 'Popular'
  }
};

// Default tier for new users
const DEFAULT_TIER = 'free';

// Get tier config
function getTierConfig(tier) {
  return TIERS[tier] || TIERS[DEFAULT_TIER];
}

// Get limit for a specific feature
function getTierLimit(tier, feature) {
  const config = getTierConfig(tier);
  return config.limits[feature];
}

// Check if tier has feature
function tierHasFeature(tier, feature) {
  const limit = getTierLimit(tier, feature);
  return limit === true || limit === Infinity || (typeof limit === 'number' && limit > 0);
}

// Get all tier names
function getTierNames() {
  return Object.keys(TIERS);
}

// Compare tiers (returns -1, 0, or 1)
function compareTiers(tier1, tier2) {
  const order = ['free', 'pro'];
  return order.indexOf(tier1) - order.indexOf(tier2);
}

// Check if tier1 is higher than tier2
function isHigherTier(tier1, tier2) {
  return compareTiers(tier1, tier2) > 0;
}

// Get tier name from Stripe price ID
function getTierFromPriceId(priceId) {
  if (!priceId) return null;
  
  for (const [tierName, config] of Object.entries(TIERS)) {
    if (config.stripePriceIdMonthly === priceId || config.stripePriceIdYearly === priceId) {
      return tierName;
    }
  }
  return null;
}

// Get all available Stripe prices for checkout
function getStripePrices() {
  const prices = [];
  
  for (const [tierName, config] of Object.entries(TIERS)) {
    if (tierName === 'free' || tierName === 'enterprise') continue;
    
    if (config.stripePriceIdMonthly) {
      prices.push({
        id: config.stripePriceIdMonthly,
        tier: tierName,
        name: `${config.displayName} Monthly`,
        amount: config.priceMonthly * 100, // cents
        currency: 'usd',
        interval: 'month'
      });
    }
    
    if (config.stripePriceIdYearly) {
      prices.push({
        id: config.stripePriceIdYearly,
        tier: tierName,
        name: `${config.displayName} Yearly`,
        amount: config.priceYearly * 100, // cents
        currency: 'usd',
        interval: 'year'
      });
    }
  }
  
  return prices;
}

// Validate a price ID belongs to a valid tier
function validatePriceId(priceId) {
  const tier = getTierFromPriceId(priceId);
  if (!tier) return { valid: false, error: 'Invalid price ID' };
  if (tier === 'free') return { valid: false, error: 'Cannot subscribe to free tier' };
  return { valid: true, tier };
}

module.exports = {
  TIERS,
  DEFAULT_TIER,
  getTierConfig,
  getTierLimit,
  tierHasFeature,
  getTierNames,
  compareTiers,
  isHigherTier,
  getTierFromPriceId,
  getStripePrices,
  validatePriceId
};
