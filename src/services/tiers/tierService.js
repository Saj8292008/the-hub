/**
 * Tier Service
 * Handles tier-based access control and usage tracking
 */

const supabase = require('../../db/supabase');
const { getTierConfig, getTierLimit, tierHasFeature, DEFAULT_TIER } = require('./tierConfig');

class TierService {
  /**
   * Get user's current tier
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Tier name
   */
  async getUserTier(userId) {
    if (!userId) return DEFAULT_TIER;

    try {
      const { data, error } = await supabase.client
        .from('users')
        .select('tier, subscription_status, subscription_end')
        .eq('id', userId)
        .single();

      if (error || !data) return DEFAULT_TIER;

      // Check if subscription is active
      if (data.tier !== 'free') {
        if (data.subscription_status !== 'active') {
          return DEFAULT_TIER;
        }
        
        // Check expiration
        if (data.subscription_end && new Date(data.subscription_end) < new Date()) {
          return DEFAULT_TIER;
        }
      }

      return data.tier || DEFAULT_TIER;
    } catch (error) {
      console.error('Error getting user tier:', error);
      return DEFAULT_TIER;
    }
  }

  /**
   * Check if user can perform an action based on limits
   * @param {string} userId - User ID
   * @param {string} action - Action to check (e.g., 'tracks', 'alertsPerDay')
   * @returns {Promise<Object>} - { allowed: boolean, limit: number, used: number, remaining: number }
   */
  async checkLimit(userId, action) {
    const tier = await this.getUserTier(userId);
    const limit = getTierLimit(tier, action);

    // Unlimited
    if (limit === Infinity || limit === true) {
      return {
        allowed: true,
        limit: 'Unlimited',
        used: 0,
        remaining: 'Unlimited',
        tier
      };
    }

    // Feature not available
    if (limit === false || limit === 0) {
      return {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
        tier,
        reason: `This feature requires a higher tier`
      };
    }

    // Get current usage
    const used = await this.getUsage(userId, action);

    return {
      allowed: used < limit,
      limit,
      used,
      remaining: Math.max(0, limit - used),
      tier,
      reason: used >= limit ? `Limit reached (${limit} for ${tier} tier)` : null
    };
  }

  /**
   * Get current usage for an action
   * @param {string} userId - User ID
   * @param {string} action - Action type
   * @returns {Promise<number>} - Current usage count
   */
  async getUsage(userId, action) {
    try {
      switch (action) {
        case 'tracks':
          return await this.getTrackCount(userId);
        case 'alertsPerDay':
          return await this.getAlertsToday(userId);
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error getting usage for ${action}:`, error);
      return 0;
    }
  }

  /**
   * Get active track count for user
   */
  async getTrackCount(userId) {
    const { count, error } = await supabase.client
      .from('telegram_tracks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    return error ? 0 : (count || 0);
  }

  /**
   * Get alerts sent today for user
   */
  async getAlertsToday(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase.client
      .from('telegram_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', today.toISOString());

    return error ? 0 : (count || 0);
  }

  /**
   * Check if user has access to a feature
   * @param {string} userId - User ID
   * @param {string} feature - Feature name
   * @returns {Promise<boolean>}
   */
  async hasFeature(userId, feature) {
    const tier = await this.getUserTier(userId);
    return tierHasFeature(tier, feature);
  }

  /**
   * Get full tier info for user including usage
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Full tier information
   */
  async getUserTierInfo(userId) {
    const tier = await this.getUserTier(userId);
    const config = getTierConfig(tier);

    // Get usage stats
    const trackLimit = await this.checkLimit(userId, 'tracks');
    const alertLimit = await this.checkLimit(userId, 'alertsPerDay');

    return {
      tier,
      name: config.name,
      displayName: config.displayName,
      features: config.features,
      limits: config.limits,
      usage: {
        tracks: trackLimit,
        alertsPerDay: alertLimit
      },
      upgradeAvailable: tier !== 'enterprise'
    };
  }

  /**
   * Increment usage counter (for rate limiting)
   * @param {string} userId - User ID
   * @param {string} action - Action type
   */
  async incrementUsage(userId, action) {
    // Usage is tracked in respective tables (telegram_alerts, etc.)
    // This method is a placeholder for explicit tracking if needed
    console.log(`Usage incremented: ${userId} - ${action}`);
  }

  /**
   * Enforce limit - throws error if limit exceeded
   * @param {string} userId - User ID
   * @param {string} action - Action type
   * @throws {Error} - If limit exceeded
   */
  async enforceLimit(userId, action) {
    const check = await this.checkLimit(userId, action);
    
    if (!check.allowed) {
      const error = new Error(check.reason || `Limit exceeded for ${action}`);
      error.code = 'TIER_LIMIT_EXCEEDED';
      error.tier = check.tier;
      error.limit = check.limit;
      error.used = check.used;
      throw error;
    }

    return check;
  }
}

module.exports = new TierService();
