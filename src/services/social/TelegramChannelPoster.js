/**
 * Telegram Channel Auto-Poster
 * 
 * Automatically posts hot deals to @TheHubDeals channel
 * Builds audience while Syd sleeps
 */

const logger = require('../../utils/logger');
const { getAffiliateService } = require('../affiliate/AffiliateService');

class TelegramChannelPoster {
  constructor(bot, supabase) {
    this.bot = bot;
    this.supabase = supabase;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID || '@TheHubDeals';
    this.minDealScore = 15; // Minimum score to post
    this.maxPostsPerHour = 3; // Don't spam
    this.postedListings = new Set(); // Track what we've posted
    this.affiliateService = getAffiliateService();
  }

  /**
   * Get hot deals from the database
   */
  async getHotDeals(limit = 5) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await this.supabase
        .from('watch_listings')
        .select('*')
        .gte('created_at', oneDayAgo)
        .not('price', 'is', null)
        .gte('deal_score', this.minDealScore)
        .order('deal_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching hot deals:', error);
        return [];
      }

      // Filter out already posted
      return (data || []).filter(d => !this.postedListings.has(d.id));
    } catch (error) {
      logger.error('Error in getHotDeals:', error);
      return [];
    }
  }

  /**
   * Get recent good deals even without deal_score
   */
  async getRecentDeals(limit = 5) {
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await this.supabase
        .from('watch_listings')
        .select('*')
        .gte('created_at', sixHoursAgo)
        .not('price', 'is', null)
        .lt('price', 5000) // Under $5k - more accessible deals
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching recent deals:', error);
        return [];
      }

      return (data || []).filter(d => !this.postedListings.has(d.id));
    } catch (error) {
      logger.error('Error in getRecentDeals:', error);
      return [];
    }
  }

  /**
   * Format a deal for Telegram channel post
   */
  formatDealPost(listing) {
    const sourceEmoji = {
      reddit: '🔴',
      watchuseek: '⌚',
      ebay: '🛒',
      chrono24: '🌐'
    }[listing.source] || '📦';

    const priceStr = listing.price 
      ? `$${listing.price.toLocaleString()}` 
      : 'See listing';

    // Determine deal quality
    let dealTag = '';
    if (listing.deal_score >= 30) dealTag = '🔥 HOT DEAL';
    else if (listing.deal_score >= 20) dealTag = '✨ Good Find';
    else if (listing.price < 1000) dealTag = '💰 Under $1K';
    else if (listing.price < 2500) dealTag = '💎 Mid-Range';

    const title = listing.title || `${listing.brand} ${listing.model}`;
    
    // Clean up title (remove [WTS], prices, etc)
    const cleanTitle = title
      .replace(/\[WTS\]/gi, '')
      .replace(/\[SOLD\]/gi, '')
      .replace(/\$[\d,]+/g, '')
      .trim();

    // Get affiliate link if available
    const dealUrl = this.affiliateService.transformUrl(listing.url, listing.source);

    let post = '';
    
    if (dealTag) {
      post += `${dealTag}\n\n`;
    }
    
    post += `${sourceEmoji} **${cleanTitle}**\n\n`;
    post += `💵 **${priceStr}**\n`;
    
    if (listing.brand) post += `🏷️ ${listing.brand}`;
    if (listing.model) post += ` ${listing.model}`;
    post += '\n';
    
    if (listing.condition) {
      post += `📋 Condition: ${listing.condition}\n`;
    }
    
    post += `\n🔗 ${dealUrl}\n\n`;
    post += `━━━━━━━━━━━━━━━\n`;
    post += `📱 @TheHubDeals | 🌐 thehub.deals`;

    return post;
  }

  /**
   * Post a single deal to the channel
   */
  async postDeal(listing) {
    if (!this.bot) {
      logger.warn('No Telegram bot configured for channel posting');
      return false;
    }

    try {
      const message = this.formatDealPost(listing);
      
      await this.bot.sendMessage(this.channelId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });

      this.postedListings.add(listing.id);
      
      // Record the post
      await this.recordPost(listing.id);
      
      logger.info(`Posted deal to channel: ${listing.title || listing.id}`);
      return true;
    } catch (error) {
      logger.error(`Error posting to channel: ${error.message}`);
      return false;
    }
  }

  /**
   * Record that we posted a listing
   */
  async recordPost(listingId) {
    try {
      await this.supabase
        .from('channel_posts')
        .insert({
          listing_id: listingId,
          channel: 'telegram',
          posted_at: new Date().toISOString()
        });
    } catch (error) {
      // Table might not exist yet, that's ok
      logger.debug('Could not record post:', error.message);
    }
  }

  /**
   * Check if we've posted recently (rate limiting)
   */
  async getRecentPostCount() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await this.supabase
        .from('channel_posts')
        .select('id')
        .eq('channel', 'telegram')
        .gte('posted_at', oneHourAgo);

      if (error) return 0;
      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Run the auto-poster cycle
   */
  async runCycle() {
    logger.info('Running Telegram channel poster cycle...');

    // Check rate limit
    const recentPosts = await this.getRecentPostCount();
    if (recentPosts >= this.maxPostsPerHour) {
      logger.info(`Rate limited: ${recentPosts} posts in last hour`);
      return { posted: 0, reason: 'rate_limited' };
    }

    const availableSlots = this.maxPostsPerHour - recentPosts;

    // Get deals to post
    let deals = await this.getHotDeals(availableSlots);
    
    // If no scored deals, try recent good deals
    if (deals.length === 0) {
      deals = await this.getRecentDeals(availableSlots);
    }

    if (deals.length === 0) {
      logger.info('No new deals to post');
      return { posted: 0, reason: 'no_deals' };
    }

    let posted = 0;
    for (const deal of deals.slice(0, availableSlots)) {
      const success = await this.postDeal(deal);
      if (success) {
        posted++;
        // Wait 2 seconds between posts
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    logger.info(`Posted ${posted} deals to Telegram channel`);
    return { posted, reason: 'success' };
  }

  /**
   * Post a daily summary
   */
  async postDailySummary() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Get stats
      const { data: listings } = await this.supabase
        .from('watch_listings')
        .select('price, source, brand')
        .gte('created_at', oneDayAgo)
        .not('price', 'is', null);

      if (!listings || listings.length === 0) {
        return;
      }

      const totalListings = listings.length;
      const avgPrice = Math.round(listings.reduce((sum, l) => sum + l.price, 0) / totalListings);
      const sources = [...new Set(listings.map(l => l.source))];
      const brands = [...new Set(listings.map(l => l.brand).filter(Boolean))];

      const summary = `
📊 **Daily Watch Market Summary**

📈 **${totalListings}** new listings in the last 24h
💵 Average price: **$${avgPrice.toLocaleString()}**
🔍 Sources: ${sources.join(', ')}
🏷️ Top brands: ${brands.slice(0, 5).join(', ')}

Stay tuned for the best deals!

━━━━━━━━━━━━━━━
📱 @TheHubDeals | 🌐 thehub.deals
      `.trim();

      await this.bot.sendMessage(this.channelId, summary, {
        parse_mode: 'Markdown'
      });

      logger.info('Posted daily summary to channel');
    } catch (error) {
      logger.error('Error posting daily summary:', error);
    }
  }
}

module.exports = TelegramChannelPoster;
