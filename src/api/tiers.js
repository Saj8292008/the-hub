/**
 * Tiers API
 * Endpoints for tier information and limit checking
 */

const tierService = require('../services/tiers/tierService');
const { TIERS, getTierConfig } = require('../services/tiers/tierConfig');

class TiersAPI {
  /**
   * Get current user's tier info
   * GET /api/tiers/me
   */
  async getCurrentTier(req) {
    const userId = req.user?.id;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    try {
      const tierInfo = await tierService.getUserTierInfo(userId);
      return {
        success: true,
        ...tierInfo
      };
    } catch (error) {
      console.error('Error getting tier info:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Get all available tiers (for pricing page)
   * GET /api/tiers
   */
  async getAllTiers(req) {
    // Return public tier info (without internal details)
    const publicTiers = Object.entries(TIERS).map(([key, tier]) => ({
      id: key,
      name: tier.name,
      displayName: tier.displayName,
      priceMonthly: tier.priceMonthly || 0,
      priceYearly: tier.priceYearly || 0,
      features: tier.features,
      limits: {
        tracks: tier.limits.tracks === Infinity ? 'Unlimited' : tier.limits.tracks,
        alertsPerDay: tier.limits.alertsPerDay === Infinity ? 'Unlimited' : tier.limits.alertsPerDay,
        priceHistory: tier.limits.priceHistory,
        realTimeAlerts: tier.limits.realTimeAlerts,
        prioritySupport: tier.limits.prioritySupport
      }
    }));

    return {
      success: true,
      tiers: publicTiers
    };
  }

  /**
   * Check a specific limit for current user
   * GET /api/tiers/check/:action
   */
  async checkLimit(req) {
    const userId = req.user?.id;
    const { action } = req.params;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    if (!action) {
      return { error: 'Action is required', status: 400 };
    }

    try {
      const check = await tierService.checkLimit(userId, action);
      return {
        success: true,
        action,
        ...check
      };
    } catch (error) {
      console.error('Error checking limit:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Get usage stats for current user
   * GET /api/tiers/usage
   */
  async getUsage(req) {
    const userId = req.user?.id;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    try {
      const tier = await tierService.getUserTier(userId);
      const config = getTierConfig(tier);
      
      const tracksCheck = await tierService.checkLimit(userId, 'tracks');
      const alertsCheck = await tierService.checkLimit(userId, 'alertsPerDay');

      return {
        success: true,
        tier,
        usage: {
          tracks: {
            used: tracksCheck.used,
            limit: tracksCheck.limit,
            remaining: tracksCheck.remaining,
            percentage: tracksCheck.limit === 'Unlimited' ? 0 : Math.round((tracksCheck.used / tracksCheck.limit) * 100)
          },
          alertsToday: {
            used: alertsCheck.used,
            limit: alertsCheck.limit,
            remaining: alertsCheck.remaining,
            percentage: alertsCheck.limit === 'Unlimited' ? 0 : Math.round((alertsCheck.used / alertsCheck.limit) * 100)
          }
        },
        features: {
          priceHistory: config.limits.priceHistory,
          realTimeAlerts: config.limits.realTimeAlerts,
          aiFeatures: config.limits.aiFeatures,
          exportData: config.limits.exportData,
          prioritySupport: config.limits.prioritySupport
        }
      };
    } catch (error) {
      console.error('Error getting usage:', error);
      return { error: error.message, status: 500 };
    }
  }
}

module.exports = new TiersAPI();
