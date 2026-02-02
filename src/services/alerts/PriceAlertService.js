/**
 * Price Alert Service
 * Allows users to set target prices and get notified
 * Premium feature candidate
 */

const { createClient } = require('@supabase/supabase-js');

class PriceAlertService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Create a price alert
   * @param {Object} alert - Alert configuration
   * @param {string} alert.userId - User ID or telegram chat ID
   * @param {string} alert.brand - Brand to watch (optional)
   * @param {string} alert.model - Model keywords (optional)
   * @param {number} alert.targetPrice - Price to alert under
   * @param {string} alert.channel - Notification channel (telegram, email)
   */
  async createAlert(alert) {
    const { data, error } = await this.supabase
      .from('price_alerts')
      .insert({
        user_id: alert.userId,
        brand: alert.brand,
        model_keywords: alert.model,
        target_price: alert.targetPrice,
        notification_channel: alert.channel || 'telegram',
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's active alerts
   */
  async getUserAlerts(userId) {
    const { data, error } = await this.supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check new deals against all active alerts
   * Returns list of triggered alerts
   */
  async checkDealsAgainstAlerts(deals) {
    // Get all active alerts
    const { data: alerts, error } = await this.supabase
      .from('price_alerts')
      .select('*')
      .eq('active', true);

    if (error || !alerts?.length) return [];

    const triggered = [];

    for (const deal of deals) {
      for (const alert of alerts) {
        if (this.dealMatchesAlert(deal, alert)) {
          triggered.push({
            alert,
            deal,
            matchReason: this.getMatchReason(deal, alert)
          });
        }
      }
    }

    return triggered;
  }

  /**
   * Check if a deal matches an alert's criteria
   */
  dealMatchesAlert(deal, alert) {
    // Must be under target price
    if (deal.price > alert.target_price) return false;

    // Check brand if specified
    if (alert.brand && alert.brand !== 'any') {
      if (!deal.brand?.toLowerCase().includes(alert.brand.toLowerCase())) {
        return false;
      }
    }

    // Check model keywords if specified
    if (alert.model_keywords) {
      const keywords = alert.model_keywords.toLowerCase().split(' ');
      const title = (deal.title || '').toLowerCase();
      const model = (deal.model || '').toLowerCase();
      
      const hasKeyword = keywords.some(kw => 
        title.includes(kw) || model.includes(kw)
      );
      
      if (!hasKeyword) return false;
    }

    return true;
  }

  /**
   * Generate match reason text
   */
  getMatchReason(deal, alert) {
    const reasons = [];
    
    const savings = alert.target_price - deal.price;
    if (savings > 0) {
      reasons.push(`$${savings} under your target of $${alert.target_price}`);
    }
    
    if (alert.brand) {
      reasons.push(`Matches brand: ${alert.brand}`);
    }
    
    if (alert.model_keywords) {
      reasons.push(`Contains keywords: ${alert.model_keywords}`);
    }
    
    return reasons.join(', ');
  }

  /**
   * Deactivate an alert
   */
  async deactivateAlert(alertId, userId) {
    const { error } = await this.supabase
      .from('price_alerts')
      .update({ active: false })
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  /**
   * Mark alert as triggered (for rate limiting)
   */
  async markTriggered(alertId) {
    const { error } = await this.supabase
      .from('price_alerts')
      .update({ 
        last_triggered: new Date().toISOString(),
        trigger_count: this.supabase.sql`trigger_count + 1`
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  /**
   * Get alert statistics
   */
  async getStats() {
    const { data, error } = await this.supabase
      .from('price_alerts')
      .select('active, notification_channel')
      .eq('active', true);

    if (error) return { total: 0 };

    const byChannel = {};
    data.forEach(a => {
      byChannel[a.notification_channel] = (byChannel[a.notification_channel] || 0) + 1;
    });

    return {
      total: data.length,
      byChannel
    };
  }
}

module.exports = PriceAlertService;
