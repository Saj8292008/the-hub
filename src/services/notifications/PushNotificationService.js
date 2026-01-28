/**
 * Push Notification Service
 * 
 * Handles push notifications for hot deals across multiple channels:
 * - Telegram (direct messages)
 * - Web Push (browser notifications)
 * - Email (instant alerts)
 */

const logger = require('../../utils/logger');

class PushNotificationService {
  constructor(supabase, telegramBot = null) {
    this.supabase = supabase;
    this.bot = telegramBot;
    this.webPushVapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
    
    this.stats = {
      sent: 0,
      failed: 0,
      byChannel: {
        telegram: 0,
        webpush: 0,
        email: 0
      }
    };
  }

  /**
   * Send notification through all enabled channels for a user
   */
  async notifyUser(userId, notification) {
    const { title, body, url, data } = notification;
    const results = [];

    try {
      // Get user notification preferences
      const { data: user } = await this.supabase
        .from('users')
        .select('notification_preferences, telegram_chat_id, email, push_subscription')
        .eq('id', userId)
        .single();

      if (!user) {
        logger.warn(`User not found for notification: ${userId}`);
        return { success: false, error: 'User not found' };
      }

      const prefs = user.notification_preferences || {};

      // Telegram notification
      if (prefs.telegram !== false && user.telegram_chat_id) {
        const telegramResult = await this.sendTelegram(user.telegram_chat_id, { title, body, url });
        results.push({ channel: 'telegram', ...telegramResult });
      }

      // Web Push notification
      if (prefs.webpush !== false && user.push_subscription) {
        const webPushResult = await this.sendWebPush(user.push_subscription, { title, body, url, data });
        results.push({ channel: 'webpush', ...webPushResult });
      }

      // Email notification (for important alerts only)
      if (prefs.email === true && user.email && data?.priority === 'high') {
        const emailResult = await this.sendEmail(user.email, { title, body, url });
        results.push({ channel: 'email', ...emailResult });
      }

      this.stats.sent++;
      return { success: true, results };

    } catch (error) {
      this.stats.failed++;
      logger.error('Error notifying user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Telegram notification
   */
  async sendTelegram(chatId, notification) {
    if (!this.bot) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    try {
      const { title, body, url } = notification;
      
      let message = `🔔 *${title}*\n\n${body}`;
      if (url) {
        message += `\n\n🔗 [View Deal](${url})`;
      }

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });

      this.stats.byChannel.telegram++;
      return { success: true };

    } catch (error) {
      logger.error('Telegram notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Web Push notification
   */
  async sendWebPush(subscription, notification) {
    try {
      const webpush = require('web-push');
      
      if (!this.webPushVapidKeys.publicKey || !this.webPushVapidKeys.privateKey) {
        return { success: false, error: 'VAPID keys not configured' };
      }

      webpush.setVapidDetails(
        'mailto:alerts@thehub.deals',
        this.webPushVapidKeys.publicKey,
        this.webPushVapidKeys.privateKey
      );

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        url: notification.url,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: notification.data
      });

      await webpush.sendNotification(JSON.parse(subscription), payload);

      this.stats.byChannel.webpush++;
      return { success: true };

    } catch (error) {
      logger.error('Web Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(email, notification) {
    try {
      const resendClient = require('../email/resendClient');
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">🔔 ${notification.title}</h2>
          <p style="color: #4b5563; font-size: 16px;">${notification.body}</p>
          ${notification.url ? `
            <a href="${notification.url}" style="display: inline-block; margin-top: 16px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
              View Deal →
            </a>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            The Hub - Deal Alerts | <a href="https://thehub.deals/settings">Manage preferences</a>
          </p>
        </div>
      `;

      await resendClient.sendEmail({
        to: email,
        subject: `🔔 ${notification.title}`,
        html
      });

      this.stats.byChannel.email++;
      return { success: true };

    } catch (error) {
      logger.error('Email notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Broadcast notification to all users with matching preferences
   */
  async broadcast(notification, filter = {}) {
    try {
      let query = this.supabase
        .from('users')
        .select('id, notification_preferences, telegram_chat_id');

      // Apply filters
      if (filter.category) {
        query = query.contains('notification_preferences', { categories: [filter.category] });
      }

      const { data: users, error } = await query;

      if (error || !users) {
        return { success: false, error: 'Failed to fetch users' };
      }

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        const result = await this.notifyUser(user.id, notification);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        // Rate limit: 1 notification per 100ms
        await new Promise(r => setTimeout(r, 100));
      }

      return { success: true, sent, failed, total: users.length };

    } catch (error) {
      logger.error('Broadcast error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify about a hot deal
   */
  async notifyHotDeal(deal) {
    const notification = {
      title: `🔥 Hot Deal: ${deal.brand || ''} ${deal.model || ''}`.trim(),
      body: `$${deal.price?.toLocaleString()} - ${deal.title?.substring(0, 100)}`,
      url: deal.url,
      data: {
        type: 'deal',
        dealId: deal.id,
        priority: deal.deal_score >= 80 ? 'high' : 'normal'
      }
    };

    // For now, notify admin
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      await this.sendTelegram(adminChatId, notification);
    }

    return notification;
  }

  /**
   * Get notification stats
   */
  getStats() {
    return this.stats;
  }
}

module.exports = PushNotificationService;
