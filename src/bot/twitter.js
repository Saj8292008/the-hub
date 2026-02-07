/**
 * Twitter Bot - @TheHubDeals automation
 * Handles posting deals, engagement, and analytics
 */

const { TwitterApi } = require('twitter-api-v2');
const logger = require('../utils/logger');

class TwitterBot {
  constructor() {
    this.enabled = false;
    this.client = null;
    this.rateLimits = {
      tweets: { remaining: 50, reset: null },
      lastTweet: null
    };

    this.init();
  }

  init() {
    const {
      TWITTER_API_KEY,
      TWITTER_API_SECRET,
      TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_TOKEN_SECRET,
      TWITTER_ENABLED
    } = process.env;

    if (TWITTER_ENABLED !== 'true') {
      logger.info('Twitter bot disabled (set TWITTER_ENABLED=true to enable)');
      return;
    }

    if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
      logger.warn('Twitter credentials missing. Bot disabled.');
      return;
    }

    try {
      this.client = new TwitterApi({
        appKey: TWITTER_API_KEY,
        appSecret: TWITTER_API_SECRET,
        accessToken: TWITTER_ACCESS_TOKEN,
        accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
      });

      this.enabled = true;
      logger.info('✅ Twitter bot initialized (@TheHubDeals)');
    } catch (error) {
      logger.error('Failed to initialize Twitter bot:', error);
    }
  }

  /**
   * Post a tweet
   */
  async tweet(text, options = {}) {
    if (!this.enabled) {
      logger.warn('Twitter bot not enabled');
      return { success: false, error: 'Bot not enabled' };
    }

    // Rate limit check
    if (this.rateLimits.lastTweet) {
      const timeSinceLastTweet = Date.now() - this.rateLimits.lastTweet;
      if (timeSinceLastTweet < 60000) { // 1 minute minimum between tweets
        return { success: false, error: 'Rate limit: Wait 1 minute between tweets' };
      }
    }

    try {
      const tweet = await this.client.v2.tweet(text, options);
      
      this.rateLimits.lastTweet = Date.now();
      this.rateLimits.tweets.remaining--;

      logger.info('📤 Tweet posted:', {
        id: tweet.data.id,
        text: text.substring(0, 50) + '...'
      });

      return {
        success: true,
        tweet: {
          id: tweet.data.id,
          text: tweet.data.text
        }
      };
    } catch (error) {
      logger.error('Failed to post tweet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post a thread
   */
  async thread(tweets) {
    if (!this.enabled) {
      return { success: false, error: 'Bot not enabled' };
    }

    const results = [];
    let previousTweetId = null;

    for (const text of tweets) {
      const options = previousTweetId ? { reply: { in_reply_to_tweet_id: previousTweetId } } : {};
      const result = await this.tweet(text, options);
      
      if (!result.success) {
        return { success: false, error: result.error, results };
      }

      results.push(result.tweet);
      previousTweetId = result.tweet.id;

      // Wait between thread tweets
      if (previousTweetId) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return { success: true, thread: results };
  }

  /**
   * Format a deal as a tweet
   */
  formatDeal(deal) {
    const { title, brand, model, price, originalPrice, discount, url, category } = deal;
    
    let emoji = '⌚️';
    if (category === 'sneakers') emoji = '👟';
    if (category === 'watches') emoji = '⌚️';

    const savings = originalPrice - price;
    const discountPercent = Math.round((savings / originalPrice) * 100);

    let tweet = `${emoji} ${brand} ${model}\n\n`;
    tweet += `💰 $${price.toLocaleString()}`;
    
    if (originalPrice) {
      tweet += ` (was $${originalPrice.toLocaleString()})`;
    }
    
    if (discountPercent > 0) {
      tweet += `\n📉 Save ${discountPercent}% ($${savings.toLocaleString()})`;
    }

    tweet += `\n\n⚡️ Get deals 2hrs earlier: t.me/thehubdeals`;
    
    return tweet;
  }

  /**
   * Format hot deals as a thread
   */
  formatHotDealsThread(deals) {
    const tweets = [];
    
    // Thread starter
    tweets.push(`🔥 TODAY'S HOT DEALS - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n\nThread 👇`);

    // Individual deals
    deals.forEach((deal, index) => {
      tweets.push(`${index + 1}/ ${this.formatDeal(deal)}`);
    });

    // CTA tweet
    tweets.push(`Want these deals 2 hours before Reddit?\n\n⚡️ Join Telegram: t.me/thehubdeals\n📧 Newsletter: thehub.deals\n\n#WatchDeals #SneakerDeals`);

    return tweets;
  }

  /**
   * Get recent tweets
   */
  async getRecentTweets(count = 10) {
    if (!this.enabled) {
      return { success: false, error: 'Bot not enabled' };
    }

    try {
      const me = await this.client.v2.me();
      const timeline = await this.client.v2.userTimeline(me.data.id, { max_results: count });

      return {
        success: true,
        tweets: timeline.data.data || []
      };
    } catch (error) {
      logger.error('Failed to fetch tweets:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get account stats
   */
  async getStats() {
    if (!this.enabled) {
      return { enabled: false };
    }

    try {
      const me = await this.client.v2.me({
        'user.fields': ['public_metrics', 'created_at']
      });

      return {
        enabled: true,
        account: {
          username: me.data.username,
          name: me.data.name,
          followers: me.data.public_metrics?.followers_count || 0,
          following: me.data.public_metrics?.following_count || 0,
          tweets: me.data.public_metrics?.tweet_count || 0
        },
        rateLimits: this.rateLimits
      };
    } catch (error) {
      logger.error('Failed to get Twitter stats:', error);
      return { enabled: true, error: error.message };
    }
  }
}

// Singleton instance
let bot = null;

function getBot() {
  if (!bot) {
    bot = new TwitterBot();
  }
  return bot;
}

module.exports = {
  getBot,
  TwitterBot
};
