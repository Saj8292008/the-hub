/**
 * Tier Configuration
 * Defines limits and features for each subscription tier
 */

const TIERS = {
  free: {
    name: 'Free',
    displayName: 'Free Tier',
    price: 0,
    limits: {
      tracks: 3,
      alertsPerDay: 5,
      priceHistory: false,
      aiFeatures: 'basic',
      exportData: false,
      prioritySupport: false,
      realTimeAlerts: false
    },
    features: [
      '3 tracked searches',
      '5 daily alerts',
      'Basic deal scoring',
      'Email digest (weekly)',
      'Community access'
    ]
  },
  
  pro: {
    name: 'Pro',
    displayName: 'Pro Tier',
    priceMonthly: 9.99,
    priceYearly: 99,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    limits: {
      tracks: 20,
      alertsPerDay: 50,
      priceHistory: true,
      aiFeatures: 'advanced',
      exportData: true,
      prioritySupport: false,
      realTimeAlerts: true
    },
    features: [
      '20 tracked searches',
      '50 daily alerts',
      'Real-time Telegram alerts',
      'Price history charts',
      'Advanced AI analysis',
      'Export data (CSV)',
      'Ad-free experience',
      'Priority email digest'
    ]
  },
  
  premium: {
    name: 'Premium',
    displayName: 'Premium Tier',
    priceMonthly: 19.99,
    priceYearly: 199,
    stripePriceIdMonthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    limits: {
      tracks: Infinity,
      alertsPerDay: Infinity,
      priceHistory: true,
      aiFeatures: 'full',
      exportData: true,
      prioritySupport: true,
      realTimeAlerts: true
    },
    features: [
      'Unlimited tracked searches',
      'Unlimited daily alerts',
      'Real-time Telegram alerts',
      'Price history charts',
      'Full AI suite ("Should I Buy?")',
      'Export data (CSV/JSON)',
      'Priority support',
      'Early access to features',
      'API access (coming soon)'
    ]
  },
  
  // Enterprise tier (contact sales)
  enterprise: {
    name: 'Enterprise',
    displayName: 'Enterprise',
    price: null, // Contact sales
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
      'API access',
      'White-label option',
      'SLA guarantees',
      'Volume discounts'
    ]
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

module.exports = {
  TIERS,
  DEFAULT_TIER,
  getTierConfig,
  getTierLimit,
  tierHasFeature,
  getTierNames,
  compareTiers,
  isHigherTier
};
