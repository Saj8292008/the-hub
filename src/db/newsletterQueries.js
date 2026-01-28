/**
 * Newsletter Database Queries
 * All database operations for newsletter system
 */

const supabase = require('./supabase');
const crypto = require('crypto');

class NewsletterQueries {
  constructor() {
    this.supabase = supabase;
  }

  // ============================================================================
  // SUBSCRIBER OPERATIONS
  // ============================================================================

  /**
   * Create new subscriber
   */
  async createSubscriber(data) {
    const {
      email,
      name,
      source,
      category_preferences = [],
      utm_source,
      utm_campaign
    } = data;

    // Generate tokens
    const confirmation_token = crypto.randomBytes(32).toString('hex');
    const unsubscribe_token = crypto.randomBytes(32).toString('hex');

    return await this.supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .insert([{
          email,
          name,
          confirmed: false,
          confirmation_token,
          unsubscribe_token,
          category_preferences,
          subscribed_at: new Date().toISOString(),
          // Store source in categories array for backwards compatibility
          categories: [source]
        }])
        .select()
        .single();
    });
  }

  /**
   * Get subscriber by email
   */
  async getSubscriberByEmail(email) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .select('*')
        .eq('email', email)
        .single();
    });
  }

  /**
   * Get subscriber by confirmation token
   */
  async getSubscriberByConfirmToken(token) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .select('*')
        .eq('confirmation_token', token)
        .single();
    });
  }

  /**
   * Get subscriber by ID
   */
  async getSubscriberById(id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  /**
   * Confirm subscriber email
   */
  async confirmSubscriber(token) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString()
        })
        .eq('confirmation_token', token)
        .select()
        .single();
    });
  }

  /**
   * Unsubscribe user
   */
  async unsubscribeByToken(email, token) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .update({
          unsubscribed: true,
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', email)
        .eq('unsubscribe_token', token)
        .select()
        .single();
    });
  }

  /**
   * Unsubscribe with reason
   */
  async unsubscribeWithReason(email, token, reason) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .update({
          unsubscribed: true,
          unsubscribed_at: new Date().toISOString(),
          unsubscribe_reason: reason
        })
        .eq('email', email)
        .eq('unsubscribe_token', token)
        .select()
        .single();
    });
  }

  /**
   * Get all subscribers with filters
   */
  async getSubscribers(filters = {}) {
    const {
      confirmed,
      unsubscribed,
      limit = 100,
      offset = 0
    } = filters;

    return await this.supabase.query(async (client) => {
      let query = client
        .from('blog_subscribers')
        .select('*', { count: 'exact' })
        .order('subscribed_at', { ascending: false });

      if (confirmed !== undefined) {
        query = query.eq('confirmed', confirmed);
      }

      if (unsubscribed !== undefined) {
        query = query.eq('unsubscribed', unsubscribed);
      }

      query = query.range(offset, offset + limit - 1);

      return await query;
    });
  }

  /**
   * Get active subscribers (confirmed and not unsubscribed)
   */
  async getActiveSubscribers() {
    return await this.supabase.query(async (client) => {
      const result = await client
        .from('blog_subscribers')
        .select('*')
        .eq('confirmed', true)
        .eq('unsubscribed', false)
        .order('subscribed_at', { ascending: false });

      return result;
    });
  }

  /**
   * Update subscriber
   */
  async updateSubscriber(id, updates) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  // ============================================================================
  // CAMPAIGN OPERATIONS
  // ============================================================================

  /**
   * Create campaign
   */
  async createCampaign(data) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_campaigns')
        .insert([data])
        .select()
        .single();
    });
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_campaigns')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(filters = {}) {
    const {
      status,
      campaign_type,
      limit = 50,
      offset = 0
    } = filters;

    return await this.supabase.query(async (client) => {
      let query = client
        .from('newsletter_campaigns')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (campaign_type) {
        query = query.eq('campaign_type', campaign_type);
      }

      query = query.range(offset, offset + limit - 1);

      return await query;
    });
  }

  /**
   * Update campaign
   */
  async updateCampaign(id, updates) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_campaigns')
        .delete()
        .eq('id', id);
    });
  }

  // ============================================================================
  // SEND OPERATIONS
  // ============================================================================

  /**
   * Log email send
   */
  async logSend(data) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_sends')
        .insert([data])
        .select()
        .single();
    });
  }

  /**
   * Get send by campaign and subscriber
   */
  async getSend(campaignId, subscriberId) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_sends')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('subscriber_id', subscriberId)
        .maybeSingle();
    });
  }

  /**
   * Get all sends for campaign
   */
  async getSendsByCampaign(campaignId) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_sends')
        .select('*')
        .eq('campaign_id', campaignId);
    });
  }

  /**
   * Get pending sends (for retry)
   */
  async getPendingSends(limit = 100) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_sends')
        .select('*')
        .eq('status', 'pending')
        .lt('retry_count', 3)
        .limit(limit);
    });
  }

  /**
   * Update send status
   */
  async updateSend(id, updates) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_sends')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  // ============================================================================
  // EVENT TRACKING
  // ============================================================================

  /**
   * Log tracking event
   */
  async logEvent(data) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_events')
        .insert([data])
        .select()
        .single();
    });
  }

  /**
   * Get events for campaign
   */
  async getEventsByCampaign(campaignId, eventType = null) {
    return await this.supabase.query(async (client) => {
      let query = client
        .from('newsletter_events')
        .select('*')
        .eq('campaign_id', campaignId);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      return await query;
    });
  }

  /**
   * Get events for subscriber
   */
  async getEventsBySubscriber(subscriberId) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_events')
        .select('*')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false });
    });
  }

  // ============================================================================
  // ANALYTICS QUERIES
  // ============================================================================

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId) {
    try {
      // Get send counts
      const { data: sends } = await this.supabase.query(async (client) => {
        return await client
          .from('newsletter_sends')
          .select('status')
          .eq('campaign_id', campaignId);
      });

      const totalSent = sends?.filter(s => s.status === 'sent').length || 0;
      const totalFailed = sends?.filter(s => s.status === 'failed').length || 0;

      // Get event counts
      const { data: events } = await this.supabase.query(async (client) => {
        return await client
          .from('newsletter_events')
          .select('event_type, subscriber_id')
          .eq('campaign_id', campaignId);
      });

      // Calculate unique opens and clicks
      const uniqueOpens = new Set(
        events?.filter(e => e.event_type === 'open').map(e => e.subscriber_id) || []
      ).size;

      const uniqueClicks = new Set(
        events?.filter(e => e.event_type === 'click').map(e => e.subscriber_id) || []
      ).size;

      const totalOpens = events?.filter(e => e.event_type === 'open').length || 0;
      const totalClicks = events?.filter(e => e.event_type === 'click').length || 0;
      const totalUnsubscribes = events?.filter(e => e.event_type === 'unsubscribe').length || 0;

      // Calculate rates
      const openRate = totalSent > 0 ? (uniqueOpens / totalSent * 100).toFixed(2) : 0;
      const clickRate = totalSent > 0 ? (uniqueClicks / totalSent * 100).toFixed(2) : 0;

      return {
        total_sent: totalSent,
        total_failed: totalFailed,
        total_opens: totalOpens,
        total_clicks: totalClicks,
        total_unsubscribes: totalUnsubscribes,
        unique_opens: uniqueOpens,
        unique_clicks: uniqueClicks,
        open_rate: parseFloat(openRate),
        click_rate: parseFloat(clickRate)
      };
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      return {
        total_sent: 0,
        total_failed: 0,
        total_opens: 0,
        total_clicks: 0,
        total_unsubscribes: 0,
        unique_opens: 0,
        unique_clicks: 0,
        open_rate: 0,
        click_rate: 0
      };
    }
  }

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview() {
    try {
      // Get subscriber counts
      const { data: subscribers } = await this.getSubscribers({ limit: 10000 });
      const totalSubscribers = subscribers?.length || 0;
      const confirmedSubscribers = subscribers?.filter(s => s.confirmed && !s.unsubscribed).length || 0;

      // Get campaign count
      const { data: campaigns } = await this.getCampaigns({ limit: 1000 });
      const totalCampaigns = campaigns?.length || 0;
      const sentCampaigns = campaigns?.filter(c => c.status === 'sent') || [];

      // Calculate average rates across all campaigns
      let totalOpenRate = 0;
      let totalClickRate = 0;

      for (const campaign of sentCampaigns) {
        const analytics = await this.getCampaignAnalytics(campaign.id);
        totalOpenRate += analytics.open_rate;
        totalClickRate += analytics.click_rate;
      }

      const avgOpenRate = sentCampaigns.length > 0
        ? (totalOpenRate / sentCampaigns.length).toFixed(2)
        : 0;

      const avgClickRate = sentCampaigns.length > 0
        ? (totalClickRate / sentCampaigns.length).toFixed(2)
        : 0;

      return {
        total_subscribers: totalSubscribers,
        active_subscribers: confirmedSubscribers,
        total_campaigns: totalCampaigns,
        sent_campaigns: sentCampaigns.length,
        avg_open_rate: parseFloat(avgOpenRate),
        avg_click_rate: parseFloat(avgClickRate),
        recent_campaigns: sentCampaigns.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting analytics overview:', error);
      return {
        total_subscribers: 0,
        active_subscribers: 0,
        total_campaigns: 0,
        sent_campaigns: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
        recent_campaigns: []
      };
    }
  }

  /**
   * Get subscriber growth analytics
   */
  async getGrowthAnalytics(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: allSubscribers } = await this.supabase.query(async (client) => {
        return await client
          .from('blog_subscribers')
          .select('subscribed_at, unsubscribed_at')
          .gte('subscribed_at', startDate.toISOString());
      });

      // Group by date
      const growthByDate = {};

      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const newSubs = allSubscribers?.filter(s => {
          const subDate = s.subscribed_at?.split('T')[0];
          return subDate === dateStr;
        }).length || 0;

        const unsubs = allSubscribers?.filter(s => {
          const unsubDate = s.unsubscribed_at?.split('T')[0];
          return unsubDate === dateStr;
        }).length || 0;

        growthByDate[dateStr] = {
          date: dateStr,
          new: newSubs,
          unsubscribed: unsubs,
          net: newSubs - unsubs
        };
      }

      return Object.values(growthByDate);
    } catch (error) {
      console.error('Error getting growth analytics:', error);
      return [];
    }
  }

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  /**
   * Get newsletter settings
   */
  async getSettings() {
    return await this.supabase.query(async (client) => {
      const result = await client
        .from('newsletter_settings')
        .select('*')
        .single();

      // If no settings exist, return defaults
      if (result.error) {
        return {
          data: {
            schedule_enabled: true,
            schedule_cron: '0 9 * * 5',
            batch_size: 100,
            batch_delay_seconds: 2,
            ai_generation_enabled: true,
            min_deal_score: 8.5,
            top_deals_count: 5,
            ab_test_enabled: true,
            ab_split_percentage: 50,
            from_email: 'newsletter@thehub.com',
            from_name: 'The Hub'
          },
          error: null
        };
      }

      return result;
    });
  }

  /**
   * Update newsletter settings
   */
  async updateSettings(updates) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('newsletter_settings')
        .update(updates)
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .select()
        .single();
    });
  }
}

// Export singleton instance
module.exports = new NewsletterQueries();
