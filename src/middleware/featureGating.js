/**
 * Feature Gating Middleware
 * Enforces tier limits and premium feature access
 */

const { pool } = require('../db/supabase');
const logger = require('../utils/logger');

// Tier limits configuration
const TIER_LIMITS = {
  free: {
    maxTrackedItems: 5,
    maxPriceAlerts: 3,
    canUseRealtimeAlerts: false,
    canUseAdvancedAI: false,
    canUsePriceHistory: false,
    canExportData: false,
    canUseAPI: false
  },
  premium: {
    maxTrackedItems: Infinity,
    maxPriceAlerts: Infinity,
    canUseRealtimeAlerts: true,
    canUseAdvancedAI: true,
    canUsePriceHistory: true,
    canExportData: true,
    canUseAPI: false
  },
  pro: {
    maxTrackedItems: Infinity,
    maxPriceAlerts: Infinity,
    canUseRealtimeAlerts: true,
    canUseAdvancedAI: true,
    canUsePriceHistory: true,
    canExportData: true,
    canUseAPI: true
  }
};

/**
 * Get user's current tier limits
 */
function getTierLimits(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

/**
 * Check if user has reached tracked items limit
 */
async function checkTrackedItemsLimit(req, res, next) {
  try {
    const userId = req.userId;

    // Get user tier
    const userResult = await pool.query(
      'SELECT tier FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const limits = getTierLimits(user.tier);

    // Premium/Pro users have unlimited items
    if (limits.maxTrackedItems === Infinity) {
      return next();
    }

    // Count current tracked items across all watchlist tables
    const countResult = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM watches WHERE user_id = $1) +
        (SELECT COUNT(*) FROM cars WHERE user_id = $1) +
        (SELECT COUNT(*) FROM sneakers WHERE user_id = $1) +
        (SELECT COUNT(*) FROM sports_teams WHERE user_id = $1) as count`,
      [userId]
    );

    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= limits.maxTrackedItems) {
      return res.status(403).json({
        error: 'Tracked items limit reached',
        limit: limits.maxTrackedItems,
        current: currentCount,
        tier: user.tier,
        upgradeRequired: true,
        message: `You've reached the ${user.tier} tier limit of ${limits.maxTrackedItems} tracked items. Upgrade to Premium for unlimited tracking.`
      });
    }

    // Attach limits to request for later use
    req.tierLimits = limits;
    req.userTier = user.tier;
    req.currentTrackedItems = currentCount;

    next();
  } catch (error) {
    logger.error('Error checking tracked items limit:', error);
    res.status(500).json({ error: 'Failed to check limits' });
  }
}

/**
 * Check if user has reached price alerts limit
 */
async function checkPriceAlertsLimit(req, res, next) {
  try {
    const userId = req.userId;

    // Get user tier
    const userResult = await pool.query(
      'SELECT tier FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const limits = getTierLimits(user.tier);

    // Premium/Pro users have unlimited alerts
    if (limits.maxPriceAlerts === Infinity) {
      return next();
    }

    // Count current active price alerts
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM price_alerts WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= limits.maxPriceAlerts) {
      return res.status(403).json({
        error: 'Price alerts limit reached',
        limit: limits.maxPriceAlerts,
        current: currentCount,
        tier: user.tier,
        upgradeRequired: true,
        message: `You've reached the ${user.tier} tier limit of ${limits.maxPriceAlerts} price alerts. Upgrade to Premium for unlimited alerts.`
      });
    }

    // Attach limits to request for later use
    req.tierLimits = limits;
    req.userTier = user.tier;
    req.currentPriceAlerts = currentCount;

    next();
  } catch (error) {
    logger.error('Error checking price alerts limit:', error);
    res.status(500).json({ error: 'Failed to check limits' });
  }
}

/**
 * Require premium tier for feature access
 */
function requirePremium(req, res, next) {
  const userResult = pool.query(
    'SELECT tier FROM users WHERE id = $1',
    [req.userId]
  );

  userResult.then(result => {
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.tier === 'free') {
      return res.status(403).json({
        error: 'Premium feature',
        tier: user.tier,
        upgradeRequired: true,
        message: 'This feature is only available for Premium subscribers. Upgrade now to unlock.'
      });
    }

    next();
  }).catch(error => {
    logger.error('Error checking premium access:', error);
    res.status(500).json({ error: 'Failed to check access' });
  });
}

/**
 * Require pro tier for API access
 */
function requirePro(req, res, next) {
  const userResult = pool.query(
    'SELECT tier FROM users WHERE id = $1',
    [req.userId]
  );

  userResult.then(result => {
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.tier !== 'pro') {
      return res.status(403).json({
        error: 'Pro feature',
        tier: user.tier,
        upgradeRequired: true,
        message: 'This feature is only available for Pro subscribers. Upgrade to Pro for API access.'
      });
    }

    next();
  }).catch(error => {
    logger.error('Error checking pro access:', error);
    res.status(500).json({ error: 'Failed to check access' });
  });
}

/**
 * Get current usage stats for a user
 */
async function getUserUsageStats(userId) {
  try {
    const [userResult, trackedItemsResult, priceAlertsResult] = await Promise.all([
      pool.query('SELECT tier FROM users WHERE id = $1', [userId]),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM watches WHERE user_id = $1) +
          (SELECT COUNT(*) FROM cars WHERE user_id = $1) +
          (SELECT COUNT(*) FROM sneakers WHERE user_id = $1) +
          (SELECT COUNT(*) FROM sports_teams WHERE user_id = $1) as count
      `, [userId]),
      pool.query('SELECT COUNT(*) as count FROM price_alerts WHERE user_id = $1 AND enabled = true', [userId])
    ]);

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];
    const limits = getTierLimits(user.tier);
    const trackedItems = parseInt(trackedItemsResult.rows[0].count);
    const priceAlerts = parseInt(priceAlertsResult.rows[0].count);

    return {
      tier: user.tier,
      limits: {
        trackedItems: limits.maxTrackedItems === Infinity ? 'unlimited' : limits.maxTrackedItems,
        priceAlerts: limits.maxPriceAlerts === Infinity ? 'unlimited' : limits.maxPriceAlerts
      },
      usage: {
        trackedItems,
        priceAlerts
      },
      available: {
        trackedItems: limits.maxTrackedItems === Infinity ? 'unlimited' : Math.max(0, limits.maxTrackedItems - trackedItems),
        priceAlerts: limits.maxPriceAlerts === Infinity ? 'unlimited' : Math.max(0, limits.maxPriceAlerts - priceAlerts)
      },
      features: {
        realtimeAlerts: limits.canUseRealtimeAlerts,
        advancedAI: limits.canUseAdvancedAI,
        priceHistory: limits.canUsePriceHistory,
        exportData: limits.canExportData,
        apiAccess: limits.canUseAPI
      }
    };
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    return null;
  }
}

module.exports = {
  checkTrackedItemsLimit,
  checkPriceAlertsLimit,
  requirePremium,
  requirePro,
  getTierLimits,
  getUserUsageStats,
  TIER_LIMITS
};
