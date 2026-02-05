/**
 * Content Poster
 * Distributes atomized content to various platforms
 * 
 * Supports: Twitter/X, Telegram, Discord
 */

const TelegramBot = require('node-telegram-bot-api');

class ContentPoster {
  constructor(options = {}) {
    // Telegram
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
      this.telegramChannelId = process.env.TELEGRAM_CHANNEL_ID || '@TheHubDeals';
    }

    // Twitter - using the bird CLI skill if available
    this.twitterEnabled = !!process.env.TWITTER_API_KEY;
    
    // Discord webhook
    this.discordWebhook = process.env.DISCORD_WEBHOOK_URL;

    // Content queue
    this.queue = [];
    this.postHistory = [];
  }

  /**
   * Post to Telegram channel
   */
  async postToTelegram(content, options = {}) {
    if (!this.telegram) {
      console.log('⚠️ Telegram not configured');
      return { success: false, error: 'Telegram not configured' };
    }

    const channelId = options.channelId || this.telegramChannelId;

    try {
      const result = await this.telegram.sendMessage(channelId, content, {
        parse_mode: options.parseMode || 'Markdown',
        disable_web_page_preview: options.disablePreview || false
      });

      console.log(`✅ Posted to Telegram: ${channelId}`);
      
      this.logPost('telegram', content, result);
      
      return { 
        success: true, 
        messageId: result.message_id,
        platform: 'telegram'
      };
    } catch (error) {
      console.error('❌ Telegram post error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post to Discord via webhook
   */
  async postToDiscord(content, options = {}) {
    const webhookUrl = options.webhookUrl || this.discordWebhook;
    
    if (!webhookUrl) {
      console.log('⚠️ Discord webhook not configured');
      return { success: false, error: 'Discord webhook not configured' };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          username: options.username || 'The Hub',
          avatar_url: options.avatarUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      console.log('✅ Posted to Discord');
      this.logPost('discord', content, { status: 'sent' });
      
      return { success: true, platform: 'discord' };
    } catch (error) {
      console.error('❌ Discord post error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post a thread to Twitter (via exec/bird CLI)
   * Requires bird CLI to be set up
   */
  async postTwitterThread(thread) {
    if (!this.twitterEnabled) {
      console.log('⚠️ Twitter not configured');
      return { success: false, error: 'Twitter not configured' };
    }

    // For now, return the formatted thread for manual posting
    // TODO: Integrate with bird CLI when available
    const formatted = this.formatThread(thread);
    
    console.log('📝 Twitter thread ready for posting:');
    console.log(formatted);
    
    return {
      success: true,
      platform: 'twitter',
      formatted,
      manual: true,
      message: 'Thread formatted - use bird CLI or copy to post'
    };
  }

  /**
   * Post a single tweet
   */
  async postTweet(content) {
    if (!this.twitterEnabled) {
      return { success: false, error: 'Twitter not configured' };
    }

    // Return formatted for manual posting
    console.log('📝 Tweet ready:', content);
    
    return {
      success: true,
      platform: 'twitter',
      content,
      manual: true
    };
  }

  /**
   * Distribute atomized content to all platforms
   */
  async distributeContent(atomized, options = {}) {
    const results = {
      telegram: [],
      discord: [],
      twitter: [],
      errors: []
    };

    const { pieces } = atomized;
    const platforms = options.platforms || ['telegram'];

    // Post to Telegram
    if (platforms.includes('telegram') && pieces.telegram) {
      for (const msg of pieces.telegram) {
        const result = await this.postToTelegram(msg);
        results.telegram.push(result);
        
        // Rate limit - wait between posts
        await this.sleep(2000);
      }
    }

    // Post to Discord
    if (platforms.includes('discord') && pieces.telegram) {
      // Use telegram messages for Discord too
      for (const msg of pieces.telegram) {
        const result = await this.postToDiscord(msg);
        results.discord.push(result);
        await this.sleep(1000);
      }
    }

    // Prepare Twitter content (for manual posting or bird CLI)
    if (platforms.includes('twitter')) {
      if (pieces.threads) {
        for (const thread of pieces.threads) {
          const result = await this.postTwitterThread(thread);
          results.twitter.push(result);
        }
      }
      if (pieces.tweets) {
        for (const tweet of pieces.tweets) {
          results.twitter.push({
            success: true,
            platform: 'twitter',
            content: tweet,
            manual: true
          });
        }
      }
    }

    return results;
  }

  /**
   * Post a deal alert to all channels
   */
  async postDealAlert(deal, atomizedContent) {
    const results = [];

    // Telegram alert
    if (this.telegram && atomizedContent.content.telegramAlert) {
      const telegramMsg = this.formatDealForTelegram(deal, atomizedContent.content.telegramAlert);
      const result = await this.postToTelegram(telegramMsg, { parseMode: 'Markdown' });
      results.push({ platform: 'telegram', ...result });
    }

    // Discord alert
    if (this.discordWebhook && atomizedContent.content.urgentTweet) {
      const result = await this.postToDiscord(
        `🚨 **DEAL ALERT**\n\n${atomizedContent.content.urgentTweet}`
      );
      results.push({ platform: 'discord', ...result });
    }

    // Twitter (formatted for manual/CLI posting)
    if (atomizedContent.content.urgentTweet) {
      results.push({
        platform: 'twitter',
        success: true,
        content: atomizedContent.content.urgentTweet,
        hashtags: atomizedContent.content.hashtags,
        manual: true
      });
    }

    return results;
  }

  /**
   * Schedule content for later posting
   */
  schedulePost(content, platform, scheduledTime) {
    const post = {
      id: Date.now().toString(),
      content,
      platform,
      scheduledTime: new Date(scheduledTime),
      status: 'scheduled',
      createdAt: new Date()
    };

    this.queue.push(post);
    console.log(`📅 Scheduled ${platform} post for ${post.scheduledTime.toISOString()}`);
    
    return post;
  }

  /**
   * Get scheduled posts
   */
  getScheduledPosts() {
    return this.queue.filter(p => p.status === 'scheduled');
  }

  /**
   * Process scheduled posts that are due
   */
  async processScheduledPosts() {
    const now = new Date();
    const duePosts = this.queue.filter(
      p => p.status === 'scheduled' && p.scheduledTime <= now
    );

    const results = [];

    for (const post of duePosts) {
      let result;

      switch (post.platform) {
        case 'telegram':
          result = await this.postToTelegram(post.content);
          break;
        case 'discord':
          result = await this.postToDiscord(post.content);
          break;
        case 'twitter':
          result = await this.postTweet(post.content);
          break;
      }

      post.status = result.success ? 'posted' : 'failed';
      post.result = result;
      results.push({ post, result });
    }

    return results;
  }

  /**
   * Format a thread for display/copying
   */
  formatThread(thread) {
    let formatted = `🧵 THREAD\n\n`;
    formatted += `1/ ${thread.hook}\n\n`;
    
    thread.tweets?.forEach((tweet, i) => {
      formatted += `${i + 2}/ ${tweet}\n\n`;
    });

    return formatted;
  }

  /**
   * Format deal for Telegram
   */
  formatDealForTelegram(deal, alertText) {
    return `🔥 *DEAL ALERT*

${alertText}

💵 Price: $${deal.price?.toLocaleString()}
📈 Market: $${deal.marketPrice?.toLocaleString()}
💰 Save: $${deal.savings?.toLocaleString()} (${deal.savingsPercent}% off)

⚡ _These go fast_

👉 [View Deal](${deal.url || 'https://thehub.deals'})`;
  }

  /**
   * Log post for history
   */
  logPost(platform, content, result) {
    this.postHistory.push({
      platform,
      content: content.substring(0, 100),
      result,
      timestamp: new Date()
    });

    // Keep last 100 posts
    if (this.postHistory.length > 100) {
      this.postHistory = this.postHistory.slice(-100);
    }
  }

  /**
   * Get post history
   */
  getPostHistory(limit = 20) {
    return this.postHistory.slice(-limit);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ContentPoster;
