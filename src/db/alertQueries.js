/**
 * Alert Database Queries
 * 
 * Helper functions for premium alerts database operations.
 */

const supabase = require('./supabase');
const logger = require('../utils/logger');

class AlertQueries {
  constructor() {
    this.client = supabase.client;
  }

  // ============================================================================
  // USER ALERT PREFERENCES
  // ============================================================================

  /**
   * Get alert preferences for a user
   */
  async getPreferences(userId) {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('user_alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error(`Get preferences error: ${error.message}`);
    }

    return data;
  }

  /**
   * Upsert user preferences
   */
  async upsertPreferences(userId, preferences) {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('user_alert_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      logger.error(`Upsert preferences error: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Get all users with alerts enabled
   */
  async getUsersWithAlertsEnabled() {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from('user_alert_preferences')
      .select('*')
      .or('email_enabled.eq.true,telegram_enabled.eq.true,discord_enabled.eq.true,custom_webhook_enabled.eq.true');

    if (error) {
      logger.error(`Get users error: ${error.message}`);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // BRAND WATCHLIST
  // ============================================================================

  /**
   * Get user's brand watchlist
   */
  async getBrandWatchlist(userId) {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from('user_brand_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Get watchlist error: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Add brand to watchlist
   */
  async addToWatchlist(userId, brand, category, options = {}) {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('user_brand_watchlist')
      .upsert({
        user_id: userId,
        brand: brand.toLowerCase(),
        category,
        min_deal_score: options.minDealScore || 70,
        max_price: options.maxPrice || null,
        notify_all_deals: options.notifyAllDeals || false
      }, {
        onConflict: 'user_id,brand,category'
      })
      .select()
      .single();

    if (error) {
      logger.error(`Add to watchlist error: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Remove from watchlist
   */
  async removeFromWatchlist(userId, brand, category) {
    if (!this.client) return { success: false };

    const { error } = await this.client
      .from('user_brand_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('brand', brand.toLowerCase())
      .eq('category', category);

    if (error) {
      logger.error(`Remove from watchlist error: ${error.message}`);
      throw error;
    }

    return { success: true };
  }

  // ============================================================================
  // ALERT QUEUE
  // ============================================================================

  /**
   * Add alert to queue
   */
  async queueAlert(userId, preferenceId, deal, scheduledAt, channel) {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from('alert_queue')
      .insert({
        user_id: userId,
        preference_id: preferenceId,
        deal_id: deal.id,
        deal_data: deal,
        scheduled_at: scheduledAt,
        delivery_channel: channel,
        delivery_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      logger.error(`Queue alert error: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Get pending alerts ready for delivery
   */
  async getPendingAlerts(limit = 100) {
    if (!this.client) return [];

    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('alert_queue')
      .select('*')
      .eq('delivery_status', 'pending')
      .lte('scheduled_at', now)
      .lt('retry_count', 3)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error(`Get pending alerts error: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(alertId, status, error = null) {
    if (!this.client) return null;

    const update = {
      delivery_status: status
    };

    if (status === 'delivered') {
      update.delivered_at = new Date().toISOString();
    } else if (status === 'failed') {
      update.delivery_error = error;
    }

    const { data, err } = await this.client
      .from('alert_queue')
      .update(update)
      .eq('id', alertId)
      .select()
      .single();

    if (err) {
      logger.error(`Update alert status error: ${err.message}`);
    }

    return data;
  }

  /**
   * Increment retry count
   */
  async incrementRetry(alertId) {
    if (!this.client) return;

    await this.client.rpc('increment_alert_retry', { alert_id: alertId });
  }

  // ============================================================================
  // DELIVERY LOG
  // ============================================================================

  /**
   * Log alert delivery
   */
  async logDelivery(queueItem, responseCode, responseBody, latencyMs) {
    if (!this.client) return null;

    const deal = queueItem.deal_data;

    const { data, error } = await this.client
      .from('alert_delivery_log')
      .insert({
        queue_id: queueItem.id,
        user_id: queueItem.user_id,
        deal_id: queueItem.deal_id,
        channel: queueItem.delivery_channel,
        response_code: responseCode,
        response_body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
        latency_ms: latencyMs,
        deal_brand: deal?.brand,
        deal_category: deal?.category,
        deal_price: deal?.price,
        deal_score: deal?.deal_score,
        deal_discount_percent: deal?.discount_percent
      })
      .select()
      .single();

    if (error) {
      logger.error(`Log delivery error: ${error.message}`);
    }

    return data;
  }

  /**
   * Get delivery history for user
   */
  async getDeliveryHistory(userId, limit = 50) {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from('alert_delivery_log')
      .select('*')
      .eq('user_id', userId)
      .order('delivered_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error(`Get history error: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Get alert statistics for user
   */
  async getUserStats(userId) {
    if (!this.client) {
      return { today: 0, thisWeek: 0, pending: 0, byChannel: {} };
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();

    // Get delivery counts
    const { data: deliveries } = await this.client
      .from('alert_delivery_log')
      .select('channel, delivered_at')
      .eq('user_id', userId)
      .gte('delivered_at', weekStart);

    const todayCount = deliveries?.filter(d => d.delivered_at >= todayStart).length || 0;
    const weekCount = deliveries?.length || 0;

    // Channel breakdown
    const channelCounts = {};
    for (const d of deliveries || []) {
      channelCounts[d.channel] = (channelCounts[d.channel] || 0) + 1;
    }

    // Pending count
    const { count: pendingCount } = await this.client
      .from('alert_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('delivery_status', 'pending');

    return {
      today: todayCount,
      thisWeek: weekCount,
      pending: pendingCount || 0,
      byChannel: channelCounts
    };
  }

  // ============================================================================
  // ADMIN / ANALYTICS
  // ============================================================================

  /**
   * Get global alert statistics
   */
  async getGlobalStats() {
    if (!this.client) {
      return { totalUsers: 0, totalDelivered: 0, pendingQueue: 0 };
    }

    const { count: totalUsers } = await this.client
      .from('user_alert_preferences')
      .select('*', { count: 'exact', head: true });

    const { count: totalDelivered } = await this.client
      .from('alert_delivery_log')
      .select('*', { count: 'exact', head: true });

    const { count: pendingQueue } = await this.client
      .from('alert_queue')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'pending');

    return {
      totalUsers: totalUsers || 0,
      totalDelivered: totalDelivered || 0,
      pendingQueue: pendingQueue || 0
    };
  }

  /**
   * Cleanup old queue entries
   */
  async cleanupOldEntries(daysOld = 30) {
    if (!this.client) return 0;

    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { count } = await this.client
      .from('alert_queue')
      .delete()
      .lt('created_at', cutoff)
      .in('delivery_status', ['delivered', 'failed', 'expired']);

    return count || 0;
  }
}

// Export singleton instance
module.exports = new AlertQueries();
