/**
 * Tier Limits Middleware
 * Enforces tier-based limits on API routes
 */

const tierService = require('../services/tiers/tierService');

/**
 * Middleware to check if user can perform an action
 * @param {string} action - Action to check (e.g., 'tracks', 'alertsPerDay', 'priceHistory')
 * @returns {Function} - Express middleware
 */
function checkLimit(action) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const check = await tierService.checkLimit(userId, action);

      if (!check.allowed) {
        return res.status(403).json({
          error: check.reason || `Limit exceeded for ${action}`,
          code: 'TIER_LIMIT_EXCEEDED',
          tier: check.tier,
          limit: check.limit,
          used: check.used,
          remaining: check.remaining,
          upgradeUrl: '/premium'
        });
      }

      // Attach limit info to request for downstream use
      req.tierLimit = check;
      next();
    } catch (error) {
      console.error('Tier limit check error:', error);
      next(error);
    }
  };
}

/**
 * Middleware to check if user has access to a feature
 * @param {string} feature - Feature name
 * @returns {Function} - Express middleware
 */
function requireFeature(feature) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const hasFeature = await tierService.hasFeature(userId, feature);

      if (!hasFeature) {
        const tier = await tierService.getUserTier(userId);
        return res.status(403).json({
          error: `The ${feature} feature requires a higher subscription tier`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature,
          currentTier: tier,
          upgradeUrl: '/premium'
        });
      }

      next();
    } catch (error) {
      console.error('Feature check error:', error);
      next(error);
    }
  };
}

/**
 * Middleware to require a specific tier or higher
 * @param {string} requiredTier - Minimum tier required
 * @returns {Function} - Express middleware
 */
function requireTier(requiredTier) {
  const tierOrder = ['free', 'pro', 'premium', 'enterprise'];
  
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userTier = await tierService.getUserTier(userId);
      const userTierIndex = tierOrder.indexOf(userTier);
      const requiredTierIndex = tierOrder.indexOf(requiredTier);

      if (userTierIndex < requiredTierIndex) {
        return res.status(403).json({
          error: `This feature requires ${requiredTier} tier or higher`,
          code: 'TIER_REQUIRED',
          currentTier: userTier,
          requiredTier,
          upgradeUrl: '/premium'
        });
      }

      req.userTier = userTier;
      next();
    } catch (error) {
      console.error('Tier check error:', error);
      next(error);
    }
  };
}

/**
 * Middleware to attach user's tier info to request
 * Useful for routes that need to adjust behavior based on tier
 */
async function attachTierInfo(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      req.tierInfo = await tierService.getUserTierInfo(userId);
    }
    
    next();
  } catch (error) {
    console.error('Attach tier info error:', error);
    next();
  }
}

module.exports = {
  checkLimit,
  requireFeature,
  requireTier,
  attachTierInfo
};
