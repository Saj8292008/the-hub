/**
 * Premium Alert Service
 * 
 * Real-time, multi-channel alert delivery system with tier-based delays.
 * - Email: via Resend
 * - Telegram: via Bot API
 * - Discord: via Webhooks
 * - Custom Webhooks: any URL
 * 
 * Premium users: instant alerts (0 delay)
 * Free users: 15-minute delay
 */

const logger = require('../../utils/logger');
const { Resend } = require('resend');
const { getTierConfig } = require('../tiers/tierConfig');

class PremiumAlertService {
  constructor(supabase) {
    this.supabase = supabase;
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    this.defaultTelegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.fromEmail = process.env.FROM_EMAIL || 'deals@thehub.app';
    
    // Start queue processor
    this.processingInterval = null;
  }

  // ============================================================================
  // ALERT PREFERENCES MANAGEMENT
  // ============================================================================

  /**
   * Get user's alert preferences
   */
  async getPreferences(userId) {
    const { data, error } = await this.supabase
      .from('user_alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }
    
    return data;
  }

  /**
   * Create or update user's alert preferences
   */
  async upsertPreferences(userId, preferences) {
    const existing = await this.getPreferences(userId);
    
    const data = {
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      const { data: updated, error } = await this.supabase
        .from('user_alert_preferences')
        .update(data)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    } else {
      const { data: created, error } = await this.supabase
        .from('user_alert_preferences')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return created;
    }
  }

  /**
   * Update user's tier and alert delay
   */
  async updateTier(userId, tier) {
    const tierConfig = getTierConfig(tier);
    const alertDelay = tierConfig.limits.alertDelay || 15;
    
    return this.upsertPreferences(userId, {
      tier,
      alert_delay_minutes: alertDelay
    });
  }

  // ============================================================================
  // BRAND WATCHLIST
  // ============================================================================

  async getBrandWatchlist(userId) {
    const { data, error } = await this.supabase
      .from('user_brand_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async addBrandToWatchlist(userId, brand, category, options = {}) {
    const { data, error } = await this.supabase
      .from('user_brand_watchlist')
      .upsert({
        user_id: userId,
        brand: brand.toLowerCase(),
        category,
        min_deal_score: options.minDealScore || 70,
        max_price: options.maxPrice || null,
        notify_all_deals: options.notifyAllDeals || false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async removeBrandFromWatchlist(userId, brand, category) {
    const { error } = await this.supabase
      .from('user_brand_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('brand', brand.toLowerCase())
      .eq('category', category);
    
    if (error) throw error;
    return { success: true };
  }

  // ============================================================================
  // DEAL MATCHING & QUEUEING
  // ============================================================================

  /**
   * Check if a deal matches user's preferences
   */
  matchesCriteria(deal, preferences, brandWatchlist = []) {
    // Check categories
    if (preferences.categories?.length > 0) {
      if (!preferences.categories.includes(deal.category)) {
        return false;
      }
    }

    // Check brands
    const dealBrand = (deal.brand || '').toLowerCase();
    if (preferences.brands?.length > 0) {
      if (!preferences.brands.some(b => dealBrand.includes(b.toLowerCase()))) {
        return false;
      }
    }

    // Check price range
    if (preferences.min_price && deal.price < preferences.min_price) {
      return false;
    }
    if (preferences.max_price && deal.price > preferences.max_price) {
      return false;
    }

    // Check deal score
    if (preferences.min_deal_score && (deal.deal_score || 0) < preferences.min_deal_score) {
      return false;
    }

    // Check discount percentage
    if (preferences.min_discount_percent && (deal.discount_percent || 0) < preferences.min_discount_percent) {
      return false;
    }

    // Check brand watchlist
    if (brandWatchlist.length > 0) {
      const watchedBrand = brandWatchlist.find(
        w => w.brand === dealBrand && w.category === deal.category
      );
      if (watchedBrand) {
        // If watching this brand, check its specific criteria
        if (watchedBrand.max_price && deal.price > watchedBrand.max_price) {
          return false;
        }
        if (!watchedBrand.notify_all_deals && (deal.deal_score || 0) < watchedBrand.min_deal_score) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if we're in quiet hours
   */
  isQuietHours(preferences) {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = preferences.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Same day range (e.g., 09:00 - 17:00)
      return currentTime >= startMinutes && currentTime < endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 08:00)
      return currentTime >= startMinutes || currentTime < endMinutes;
    }
  }

  /**
   * Queue an alert for delivery (handles tier-based delays)
   */
  async queueAlert(userId, deal) {
    const preferences = await this.getPreferences(userId);
    if (!preferences) {
      logger.debug(`No alert preferences for user ${userId}`);
      return null;
    }

    // Get brand watchlist
    const brandWatchlist = await this.getBrandWatchlist(userId);

    // Check if deal matches criteria
    if (!this.matchesCriteria(deal, preferences, brandWatchlist)) {
      logger.debug(`Deal ${deal.id} doesn't match criteria for user ${userId}`);
      return null;
    }

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      logger.debug(`Skipping alert for user ${userId} - quiet hours`);
      return null;
    }

    // Calculate delivery time based on tier
    const delayMinutes = preferences.alert_delay_minutes || 15;
    const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    // Determine which channels to use
    const channels = [];
    if (preferences.email_enabled && preferences.email_address) channels.push('email');
    if (preferences.telegram_enabled && preferences.telegram_chat_id) channels.push('telegram');
    if (preferences.discord_enabled && preferences.discord_webhook_url) channels.push('discord');
    if (preferences.custom_webhook_enabled && preferences.custom_webhook_url) channels.push('webhook');

    if (channels.length === 0) {
      logger.debug(`No enabled channels for user ${userId}`);
      return null;
    }

    // Queue for each channel
    const queued = [];
    for (const channel of channels) {
      const { data, error } = await this.supabase
        .from('alert_queue')
        .insert({
          user_id: userId,
          preference_id: preferences.id,
          deal_id: deal.id,
          deal_data: deal,
          scheduled_at: scheduledAt.toISOString(),
          delivery_channel: channel,
          delivery_status: delayMinutes === 0 ? 'ready' : 'pending'
        })
        .select()
        .single();

      if (error) {
        logger.error(`Failed to queue alert: ${error.message}`);
      } else {
        queued.push(data);
        logger.info(`Queued ${channel} alert for user ${userId}, scheduled: ${scheduledAt.toISOString()}`);
      }
    }

    // If premium (0 delay), deliver immediately
    if (delayMinutes === 0) {
      for (const item of queued) {
        this.deliverAlert(item).catch(err => 
          logger.error(`Immediate delivery failed: ${err.message}`)
        );
      }
    }

    return queued;
  }

  /**
   * Process a new deal - notify all matching users
   */
  async processDeal(deal) {
    logger.info(`Processing deal ${deal.id} for alerts...`);

    // Get all users with alerts enabled
    const { data: preferences, error } = await this.supabase
      .from('user_alert_preferences')
      .select('user_id')
      .or('email_enabled.eq.true,telegram_enabled.eq.true,discord_enabled.eq.true,custom_webhook_enabled.eq.true');

    if (error) {
      logger.error(`Failed to fetch preferences: ${error.message}`);
      return { queued: 0, errors: 1 };
    }

    let queued = 0;
    let errors = 0;

    for (const pref of preferences || []) {
      try {
        const result = await this.queueAlert(pref.user_id, deal);
        if (result) queued += result.length;
      } catch (err) {
        logger.error(`Failed to queue for user ${pref.user_id}: ${err.message}`);
        errors++;
      }
    }

    logger.info(`Deal ${deal.id}: queued ${queued} alerts, ${errors} errors`);
    return { queued, errors };
  }

  // ============================================================================
  // DELIVERY METHODS
  // ============================================================================

  /**
   * Deliver a queued alert
   */
  async deliverAlert(queueItem) {
    const { id, deal_data: deal, delivery_channel: channel, preference_id } = queueItem;
    const startTime = Date.now();

    try {
      // Get full preferences
      const { data: prefs } = await this.supabase
        .from('user_alert_preferences')
        .select('*')
        .eq('id', preference_id)
        .single();

      if (!prefs) {
        throw new Error('Preferences not found');
      }

      let result;
      switch (channel) {
        case 'email':
          result = await this.sendEmail(prefs.email_address, deal);
          break;
        case 'telegram':
          result = await this.sendTelegram(prefs.telegram_chat_id, deal, prefs.telegram_bot_token);
          break;
        case 'discord':
          result = await this.sendDiscord(prefs.discord_webhook_url, deal);
          break;
        case 'webhook':
          result = await this.sendWebhook(prefs.custom_webhook_url, deal, prefs.custom_webhook_headers);
          break;
        default:
          throw new Error(`Unknown channel: ${channel}`);
      }

      // Update queue item
      await this.supabase
        .from('alert_queue')
        .update({
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', id);

      // Log delivery
      await this.logDelivery(queueItem, 200, result, Date.now() - startTime);

      logger.info(`Delivered ${channel} alert ${id}`);
      return { success: true, result };

    } catch (error) {
      // Update queue with error
      await this.supabase
        .from('alert_queue')
        .update({
          delivery_status: 'failed',
          delivery_error: error.message,
          retry_count: (queueItem.retry_count || 0) + 1
        })
        .eq('id', id);

      // Log failure
      await this.logDelivery(queueItem, 500, error.message, Date.now() - startTime);

      logger.error(`Failed to deliver ${channel} alert ${id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email alert via Resend
   */
  async sendEmail(email, deal) {
    if (!this.resend) {
      throw new Error('Email not configured (RESEND_API_KEY missing)');
    }

    const discountText = deal.discount_percent ? ` (${deal.discount_percent}% off)` : '';
    const scoreEmoji = deal.deal_score >= 80 ? '🔥🔥🔥' : deal.deal_score >= 60 ? '🔥🔥' : '🔥';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${scoreEmoji} Deal Alert!</h1>
        </div>
        
        <div style="background: #1a1a2e; padding: 24px; border-radius: 0 0 12px 12px; color: #e0e0e0;">
          <h2 style="color: #fff; margin: 0 0 16px 0;">${deal.title || `${deal.brand} ${deal.model}`}</h2>
          
          <div style="background: #252542; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 28px; font-weight: bold; color: #4ade80;">
              $${deal.price?.toLocaleString()}${discountText}
            </p>
            ${deal.original_price ? `<p style="margin: 0; color: #888; text-decoration: line-through;">Was $${deal.original_price.toLocaleString()}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 16px;">
            <p style="margin: 4px 0; color: #888;">📊 Deal Score: <span style="color: #4ade80; font-weight: bold;">${deal.deal_score || 'N/A'}/100</span></p>
            <p style="margin: 4px 0; color: #888;">🏷️ Brand: ${deal.brand || 'Unknown'}</p>
            <p style="margin: 4px 0; color: #888;">📦 Source: ${deal.source || 'Unknown'}</p>
          </div>
          
          <a href="${deal.url}" style="display: inline-block; background: #4ade80; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            View Deal →
          </a>
          
          <p style="margin-top: 24px; color: #666; font-size: 12px;">
            You're receiving this because you enabled deal alerts on The Hub.
            <a href="${process.env.FRONTEND_URL || 'https://thehub.app'}/settings/alerts" style="color: #888;">Manage preferences</a>
          </p>
        </div>
      </div>
    `;

    const { data, error } = await this.resend.emails.send({
      from: `The Hub Deals <${this.fromEmail}>`,
      to: email,
      subject: `${scoreEmoji} ${deal.brand || 'Deal'}: $${deal.price?.toLocaleString()}${discountText}`,
      html
    });

    if (error) throw error;
    return data;
  }

  /**
   * Send Telegram alert
   */
  async sendTelegram(chatId, deal, customToken = null) {
    const token = customToken || this.defaultTelegramToken;
    if (!token) {
      throw new Error('Telegram not configured');
    }

    const discountText = deal.discount_percent ? ` (${deal.discount_percent}% off)` : '';
    const scoreEmoji = deal.deal_score >= 80 ? '🔥🔥🔥' : deal.deal_score >= 60 ? '🔥🔥' : '🔥';

    const message = `
${scoreEmoji} *DEAL ALERT* ${scoreEmoji}

*${deal.title || `${deal.brand} ${deal.model}`}*

💰 Price: *$${deal.price?.toLocaleString()}*${discountText}
${deal.original_price ? `~~$${deal.original_price.toLocaleString()}~~` : ''}

📊 Deal Score: *${deal.deal_score || 'N/A'}/100*
🏷️ Brand: ${deal.brand || 'Unknown'}
📦 Source: ${deal.source || 'Unknown'}

🔗 ${deal.url}
    `.trim();

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error');
    }
    return data;
  }

  /**
   * Send Discord webhook alert
   */
  async sendDiscord(webhookUrl, deal) {
    const discountText = deal.discount_percent ? ` (${deal.discount_percent}% off)` : '';
    const scoreColor = deal.deal_score >= 80 ? 0x22c55e : deal.deal_score >= 60 ? 0xeab308 : 0x3b82f6;

    const embed = {
      title: `🔥 ${deal.title || `${deal.brand} ${deal.model}`}`,
      url: deal.url,
      color: scoreColor,
      fields: [
        {
          name: '💰 Price',
          value: `**$${deal.price?.toLocaleString()}**${discountText}`,
          inline: true
        },
        {
          name: '📊 Deal Score',
          value: `${deal.deal_score || 'N/A'}/100`,
          inline: true
        },
        {
          name: '🏷️ Brand',
          value: deal.brand || 'Unknown',
          inline: true
        },
        {
          name: '📦 Source',
          value: deal.source || 'Unknown',
          inline: true
        }
      ],
      footer: {
        text: 'The Hub Deal Alerts'
      },
      timestamp: new Date().toISOString()
    };

    if (deal.image_url || (deal.images && deal.images[0])) {
      embed.thumbnail = { url: deal.image_url || deal.images[0] };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'The Hub Deals',
        avatar_url: 'https://thehub.app/logo.png',
        embeds: [embed]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} - ${text}`);
    }

    return { status: response.status };
  }

  /**
   * Send custom webhook alert
   */
  async sendWebhook(url, deal, customHeaders = {}) {
    const payload = {
      event: 'deal_alert',
      timestamp: new Date().toISOString(),
      deal: {
        id: deal.id,
        title: deal.title,
        brand: deal.brand,
        model: deal.model,
        price: deal.price,
        original_price: deal.original_price,
        discount_percent: deal.discount_percent,
        deal_score: deal.deal_score,
        source: deal.source,
        url: deal.url,
        category: deal.category,
        image_url: deal.image_url || (deal.images && deal.images[0])
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'TheHub-AlertService/1.0',
      ...customHeaders
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Webhook failed: ${response.status} - ${text}`);
    }

    return { status: response.status };
  }

  /**
   * Log delivery for analytics
   */
  async logDelivery(queueItem, responseCode, responseBody, latencyMs) {
    const deal = queueItem.deal_data;
    
    await this.supabase
      .from('alert_delivery_log')
      .insert({
        queue_id: queueItem.id,
        user_id: queueItem.user_id,
        deal_id: queueItem.deal_id,
        channel: queueItem.delivery_channel,
        response_code: responseCode,
        response_body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
        latency_ms: latencyMs,
        deal_brand: deal.brand,
        deal_category: deal.category,
        deal_price: deal.price,
        deal_score: deal.deal_score,
        deal_discount_percent: deal.discount_percent
      });
  }

  // ============================================================================
  // QUEUE PROCESSING
  // ============================================================================

  /**
   * Process pending alerts that are ready for delivery
   */
  async processQueue() {
    const now = new Date().toISOString();

    // Get pending alerts that are scheduled for now or earlier
    const { data: pendingAlerts, error } = await this.supabase
      .from('alert_queue')
      .select('*')
      .eq('delivery_status', 'pending')
      .lte('scheduled_at', now)
      .lt('retry_count', 3)
      .order('scheduled_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error(`Failed to fetch pending alerts: ${error.message}`);
      return { processed: 0, errors: 1 };
    }

    if (!pendingAlerts || pendingAlerts.length === 0) {
      return { processed: 0, errors: 0 };
    }

    logger.info(`Processing ${pendingAlerts.length} pending alerts...`);

    let processed = 0;
    let errors = 0;

    for (const alert of pendingAlerts) {
      const result = await this.deliverAlert(alert);
      if (result.success) {
        processed++;
      } else {
        errors++;
      }

      // Small delay between deliveries to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info(`Queue processing complete: ${processed} delivered, ${errors} failed`);
    return { processed, errors };
  }

  /**
   * Start the queue processor
   */
  startQueueProcessor(intervalMs = 30000) {
    if (this.processingInterval) {
      return;
    }

    logger.info(`Starting alert queue processor (interval: ${intervalMs}ms)`);
    
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(err => 
        logger.error(`Queue processor error: ${err.message}`)
      );
    }, intervalMs);

    // Also run immediately
    this.processQueue();
  }

  /**
   * Stop the queue processor
   */
  stopQueueProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Alert queue processor stopped');
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get alert statistics for a user
   */
  async getUserStats(userId) {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();

    // Get delivery counts
    const { data: deliveries } = await this.supabase
      .from('alert_delivery_log')
      .select('channel, delivered_at')
      .eq('user_id', userId)
      .gte('delivered_at', weekStart);

    const todayCount = deliveries?.filter(d => d.delivered_at >= todayStart).length || 0;
    const weekCount = deliveries?.length || 0;

    // Get channel breakdown
    const channelCounts = {};
    for (const d of deliveries || []) {
      channelCounts[d.channel] = (channelCounts[d.channel] || 0) + 1;
    }

    // Get pending alerts
    const { count: pendingCount } = await this.supabase
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

  /**
   * Test alert channel
   */
  async testChannel(userId, channel, testData = {}) {
    const prefs = await this.getPreferences(userId);
    if (!prefs) {
      throw new Error('No alert preferences configured');
    }

    const sampleDeal = {
      id: 'test-deal',
      title: 'Test Deal Alert',
      brand: 'TestBrand',
      model: 'TestModel',
      price: 999,
      original_price: 1499,
      discount_percent: 33,
      deal_score: 85,
      source: 'The Hub',
      url: process.env.FRONTEND_URL || 'https://thehub.app',
      category: 'watches',
      ...testData
    };

    switch (channel) {
      case 'email':
        if (!prefs.email_address) throw new Error('Email not configured');
        return this.sendEmail(prefs.email_address, sampleDeal);
      case 'telegram':
        if (!prefs.telegram_chat_id) throw new Error('Telegram not configured');
        return this.sendTelegram(prefs.telegram_chat_id, sampleDeal, prefs.telegram_bot_token);
      case 'discord':
        if (!prefs.discord_webhook_url) throw new Error('Discord not configured');
        return this.sendDiscord(prefs.discord_webhook_url, sampleDeal);
      case 'webhook':
        if (!prefs.custom_webhook_url) throw new Error('Webhook not configured');
        return this.sendWebhook(prefs.custom_webhook_url, sampleDeal, prefs.custom_webhook_headers);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }
}

module.exports = PremiumAlertService;
