/**
 * Twitter Auto-Poster
 * Automatically posts hot deals (score >15) to @TheHubDeals
 */

const { getBot } = require('../bot/twitter');
const { getSupabaseClient } = require('../utils/supabase');
const logger = require('../utils/logger');

class TwitterPoster {
  constructor() {
    this.enabled = process.env.TWITTER_ENABLED === 'true';
    this.minScoreToPost = parseInt(process.env.TWITTER_MIN_SCORE || '15', 10);
    this.maxPostsPerHour = parseInt(process.env.TWITTER_MAX_POSTS_PER_HOUR || '3', 10);
    this.checkIntervalMinutes = parseInt(process.env.TWITTER_CHECK_INTERVAL || '15', 10);
    
    this.posting = false;
    this.lastCheck = null;
  }

  /**
   * Start the auto-poster (runs on interval)
   */
  start() {
    if (!this.enabled) {
      logger.info('Twitter auto-poster disabled');
      return;
    }

    logger.info(`🐦 Twitter Auto-Poster: Starting (check every ${this.checkIntervalMinutes}m)`);
    
    // Run immediately
    this.checkAndPost();

    // Then run on interval
    this.interval = setInterval(() => {
      this.checkAndPost();
    }, this.checkIntervalMinutes * 60 * 1000);
  }

  /**
   * Stop the auto-poster
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      logger.info('Twitter auto-poster stopped');
    }
  }

  /**
   * Check for hot deals and post them
   */
  async checkAndPost() {
    if (this.posting) {
      logger.info('Twitter post already in progress, skipping');
      return;
    }

    this.posting = true;
    this.lastCheck = new Date();

    try {
      const hotDeals = await this.getHotDealsToPost();
      
      if (hotDeals.length === 0) {
        logger.info('No new hot deals to post');
        this.posting = false;
        return;
      }

      logger.info(`Found ${hotDeals.length} hot deals to post`);

      // Post deals (respecting rate limits)
      const postsThisHour = await this.getPostCountLastHour();
      const remainingSlots = this.maxPostsPerHour - postsThisHour;

      if (remainingSlots <= 0) {
        logger.info(`Rate limit reached: ${postsThisHour}/${this.maxPostsPerHour} posts this hour`);
        this.posting = false;
        return;
      }

      const dealsToPost = hotDeals.slice(0, remainingSlots);
      
      for (const deal of dealsToPost) {
        await this.postDeal(deal);
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3s between posts
      }

      logger.info(`Posted ${dealsToPost.length} deals to Twitter`);
    } catch (error) {
      logger.error('Twitter auto-poster error:', error);
    } finally {
      this.posting = false;
    }
  }

  /**
   * Get hot deals that haven't been posted yet
   */
  async getHotDealsToPost() {
    const supabase = getSupabaseClient();
    
    // Get deals with high scores that haven't been posted
    const { data: deals, error } = await supabase
      .from('deals')
      .select('*')
      .gte('score', this.minScoreToPost)
      .is('twitter_posted_at', null)
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch hot deals:', error);
      return [];
    }

    return deals || [];
  }

  /**
   * Post a single deal to Twitter
   */
  async postDeal(deal) {
    const bot = getBot();
    
    if (!bot.enabled) {
      logger.warn('Twitter bot not enabled, skipping post');
      return;
    }

    // Format the deal as a tweet
    const tweetText = bot.formatDeal(deal);
    
    // Post to Twitter
    const result = await bot.tweet(tweetText);
    
    if (result.success) {
      // Mark deal as posted in database
      await this.markDealAsPosted(deal.id, result.tweet.id);
      
      logger.info(`✅ Posted deal to Twitter: ${deal.brand} ${deal.model}`);
    } else {
      logger.error(`Failed to post deal: ${result.error}`);
    }

    return result;
  }

  /**
   * Post a hot deals thread (manual trigger)
   */
  async postHotDealsThread(dealIds = null) {
    const bot = getBot();
    
    if (!bot.enabled) {
      return { success: false, error: 'Twitter bot not enabled' };
    }

    // Get hot deals
    let deals;
    if (dealIds) {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('deals')
        .select('*')
        .in('id', dealIds);
      deals = data || [];
    } else {
      deals = await this.getHotDealsToPost();
      deals = deals.slice(0, 5); // Top 5 for thread
    }

    if (deals.length === 0) {
      return { success: false, error: 'No deals to post' };
    }

    // Format as thread
    const threadTweets = bot.formatHotDealsThread(deals);
    
    // Post thread
    const result = await bot.thread(threadTweets);
    
    if (result.success) {
      // Mark all deals as posted
      for (const deal of deals) {
        await this.markDealAsPosted(deal.id, result.thread[0].id);
      }
      
      logger.info(`✅ Posted hot deals thread with ${deals.length} deals`);
    }

    return result;
  }

  /**
   * Mark a deal as posted to Twitter
   */
  async markDealAsPosted(dealId, tweetId) {
    const supabase = getSupabaseClient();
    
    await supabase
      .from('deals')
      .update({
        twitter_posted_at: new Date().toISOString(),
        twitter_tweet_id: tweetId
      })
      .eq('id', dealId);
  }

  /**
   * Get post count in the last hour
   */
  async getPostCountLastHour() {
    const supabase = getSupabaseClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .gte('twitter_posted_at', oneHourAgo);

    if (error) {
      logger.error('Failed to get post count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      posting: this.posting,
      lastCheck: this.lastCheck,
      config: {
        minScore: this.minScoreToPost,
        maxPostsPerHour: this.maxPostsPerHour,
        checkInterval: this.checkIntervalMinutes
      }
    };
  }
}

// Singleton
let poster = null;

function getPoster() {
  if (!poster) {
    poster = new TwitterPoster();
  }
  return poster;
}

module.exports = {
  getPoster,
  TwitterPoster
};
