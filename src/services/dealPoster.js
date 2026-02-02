// Unified Deal Poster Service
// Posts deals to both Telegram and Discord

const telegramBot = require('../bot/telegram');
const discordBot = require('../bot/discord');
const logger = require('../utils/logger');

class DealPoster {
  /**
   * Post a deal to all configured channels (Telegram + Discord)
   * @param {Object} deal - Deal object with title, price, url, score, etc.
   * @param {Object} options - Optional settings
   */
  async postDeal(deal, options = {}) {
    const results = {
      telegram: { sent: false, error: null },
      discord: { sent: false, error: null }
    };

    // Post to Telegram
    if (options.telegram !== false) {
      try {
        await this.postToTelegram(deal);
        results.telegram.sent = true;
        logger.info(`Deal posted to Telegram: ${deal.title}`);
      } catch (error) {
        results.telegram.error = error.message;
        logger.error('Failed to post to Telegram:', error);
      }
    }

    // Post to Discord
    if (options.discord !== false) {
      try {
        await this.postToDiscord(deal);
        results.discord.sent = true;
        logger.info(`Deal posted to Discord: ${deal.title}`);
      } catch (error) {
        results.discord.error = error.message;
        logger.error('Failed to post to Discord:', error);
      }
    }

    return results;
  }

  /**
   * Post to Telegram channel
   */
  async postToTelegram(deal) {
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (!channelId) {
      throw new Error('TELEGRAM_CHANNEL_ID not configured');
    }

    const message = this.formatTelegramMessage(deal);
    await telegramBot.bot.sendMessage(channelId, message, { parse_mode: 'HTML' });
  }

  /**
   * Post to Discord channel
   */
  async postToDiscord(deal) {
    if (!discordBot.isReady) {
      throw new Error('Discord bot not ready');
    }
    await discordBot.postDealAlert(deal);
  }

  /**
   * Format deal for Telegram (HTML)
   */
  formatTelegramMessage(deal) {
    const scoreBar = this.getScoreBar(deal.score || 7);
    const flames = deal.score >= 9 ? '🔥🔥🔥' : deal.score >= 8 ? '🔥🔥' : deal.score >= 7 ? '🔥' : '';
    
    return `
<b>${flames} ${deal.title || 'Hot Deal!'}</b>

💰 <b>Price:</b> $${deal.price?.toLocaleString() || 'N/A'}
${deal.originalPrice ? `💸 <s>$${deal.originalPrice.toLocaleString()}</s> (${this.getDiscount(deal.originalPrice, deal.price)}% off)\n` : ''}
📊 <b>Score:</b> ${scoreBar}

🏷️ <b>Source:</b> ${deal.source || 'The Hub'}
${deal.description ? `\n📝 ${deal.description}\n` : ''}
<a href="${deal.url || 'https://the-hub-psi.vercel.app'}">🔗 View Deal</a>

#TheHub #Deals ${deal.category ? `#${deal.category}` : ''}
    `.trim();
  }

  /**
   * Get visual score bar
   * Handles scores 0-10 or 0-100
   */
  getScoreBar(score) {
    // Normalize score to 0-10 range
    const normalizedScore = score > 10 ? Math.round(score / 10) : Math.round(score);
    const filled = Math.min(10, Math.max(0, normalizedScore));
    const empty = 10 - filled;
    const displayScore = score > 10 ? score : score;
    const maxScore = score > 10 ? 100 : 10;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${displayScore}/${maxScore}`;
  }

  /**
   * Calculate discount percentage
   */
  getDiscount(original, current) {
    if (!original || !current) return 0;
    return Math.round((1 - current / original) * 100);
  }

  /**
   * Post Deal of the Day to all channels
   */
  async postDealOfTheDay(deal) {
    deal.title = `🏆 Deal of the Day: ${deal.title || deal.brand || 'Top Deal'}`;
    return this.postDeal(deal, { pin: true });
  }

  /**
   * Post a batch of top deals
   */
  async postTopDeals(deals, limit = 5) {
    const results = [];
    const topDeals = deals.slice(0, limit);

    for (const deal of topDeals) {
      const result = await this.postDeal(deal);
      results.push(result);
      // Small delay between posts
      await new Promise(r => setTimeout(r, 1000));
    }

    return results;
  }
}

module.exports = new DealPoster();
