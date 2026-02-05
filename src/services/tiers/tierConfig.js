/**
 * Tier Configuration
 * Defines limits and features for each subscription tier
 * 
 * Pricing aligned with freemium research (2026-02-05):
 * - Pro: $9/mo - Time savings, early access, exclusivity
 * - Premium: $19/mo - Automation, data, competitive edge
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
      '3 tracked searches',
      '5 daily alerts',
      'Basic deal scoring',
      'Email digest (weekly)',
      'Community access'
    ],
    description: 'Perfect for casual deal hunters'
  },
  
  pro: {
    name: 'Pro',
    displayName: 'Pro',
    priceMonthly: 9,
    priceYearly: 89,  // ~$7.42/mo - 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    limits: {
      tracks: 25,
      alertsPerDay: 100,
      priceHistory: true,
      aiFeatures: 'advanced',
      exportData: true,
      prioritySupport: false,
      realTimeAlerts: true,
      earlyAccess: true,
      alertDelay: 0  // Real-time (vs 15 min for free)
    },
    features: [
      '25 tracked searches',
      '100 daily alerts',
      'Real-time alerts (no delay)',
      'Price history charts',
      'Advanced AI deal scoring',
      'Export data (CSV)',
      'Ad-free experience',
      'Early deal access'
    ],
    description: 'For serious deal hunters who want speed',
    badge: 'Popular'
  },
  
  premium: {
    name: 'Premium',
    displayName: 'Premium',
    priceMonthly: 19,
    priceYearly: 189,  // ~$15.75/mo - 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    limits: {
      tracks: Infinity,
      alertsPerDay: Infinity,
      priceHistory: true,
      aiFeatures: 'full',
      exportData: true,
      prioritySupport: true,
      realTimeAlerts: true,
      earlyAccess: true,
      alertDelay: 0,
      apiAccess: true
    },
    features: [
      'Unlimited tracked searches',
      'Unlimited daily alerts',
      'Real-time alerts (no delay)',
      'Price history charts',
      'Full AI suite ("Should I Buy?")',
      'Export data (CSV/JSON)',
      'Priority support (24h response)',
      'Early access to features',
      'API access',
      'Custom alert filters'
    ],
    description: 'For resellers and power users',
    badge: 'Best Value'
  },
  
  // Enterprise tier (contact sales)
  enterprise: {
    name: 'Enterprise',
    displayName: 'Enterprise',
    price: null, // Contact sales
    priceMonthly: null,
    priceYearly: null,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    limits: {
      tracks: Infinity,
      alertsPerDay: Infinity,
      priceHistory: true,
      aiFeatures: 'full',
      exportData: true,
      prioritySupport: true,
      realTimeAlerts: true,
      apiAccess: true,
      whiteLabel: true,
      customIntegrations: true
    },
    features: [
      'Everything in Premium',
      'Dedicated account manager',
      'Custom integrations',
      'Volume API access',
      'White-label option',
      'SLA guarantees',
      'Team accounts'
    ],
    description: 'For teams and businesses'
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
  const order = ['free', 'pro', 'premium', 'enterprise'];
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
