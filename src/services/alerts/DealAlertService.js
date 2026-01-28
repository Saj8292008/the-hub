/**
 * Deal Alert Service
 * 
 * Monitors listings and sends alerts when deals match user watchlist targets.
 * Works across all verticals: watches, sneakers, cars.
 */

const logger = require('../../utils/logger');

class DealAlertService {
  constructor(supabase, telegramBot = null) {
    this.supabase = supabase;
    this.bot = telegramBot;
    this.alertCooldownMinutes = 60; // Don't re-alert same listing within this window
  }

  /**
   * Check all watch listings against user watchlist and find deals
   */
  async findWatchDeals() {
    const deals = [];

    try {
      // Get user's watch targets
      const { data: watchlist, error: watchlistError } = await this.supabase
        .from('watches')
        .select('*')
        .eq('alert_enabled', true);

      if (watchlistError) {
        logger.error('Error fetching watchlist:', watchlistError);
        return deals;
      }

      if (!watchlist || watchlist.length === 0) {
        logger.info('No watches in watchlist with alerts enabled');
        return deals;
      }

      // Get recent listings (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: listings, error: listingsError } = await this.supabase
        .from('watch_listings')
        .select('*')
        .gte('created_at', oneDayAgo)
        .not('price', 'is', null)
        .order('created_at', { ascending: false });

      if (listingsError) {
        logger.error('Error fetching listings:', listingsError);
        return deals;
      }

      logger.info(`Checking ${listings?.length || 0} listings against ${watchlist.length} watchlist items`);

      // Match listings to watchlist
      for (const listing of listings || []) {
        for (const watch of watchlist) {
          if (this.isMatch(listing, watch) && this.isBelowTarget(listing, watch)) {
            const savings = watch.target_price - listing.price;
            const savingsPercent = Math.round((savings / watch.target_price) * 100);
            
            deals.push({
              type: 'watch',
              listing,
              watchlistItem: watch,
              savings,
              savingsPercent,
              score: this.calculateDealScore(listing, watch, savingsPercent)
            });
          }
        }
      }

      // Sort by score (best deals first)
      deals.sort((a, b) => b.score - a.score);
      
      logger.info(`Found ${deals.length} potential watch deals`);
      return deals;

    } catch (error) {
      logger.error('Error finding watch deals:', error);
      return deals;
    }
  }

  /**
   * Check if a listing matches a watchlist item
   */
  isMatch(listing, watchlistItem) {
    const listingText = `${listing.brand || ''} ${listing.model || ''} ${listing.title || ''}`.toLowerCase();
    const brandMatch = watchlistItem.brand && listingText.includes(watchlistItem.brand.toLowerCase());
    const modelMatch = watchlistItem.model && listingText.includes(watchlistItem.model.toLowerCase());
    
    // Require both brand and model to match
    return brandMatch && modelMatch;
  }

  /**
   * Check if listing price is below target
   */
  isBelowTarget(listing, watchlistItem) {
    if (!listing.price || !watchlistItem.target_price) return false;
    return listing.price <= watchlistItem.target_price;
  }

  /**
   * Calculate a deal score (higher = better deal)
   */
  calculateDealScore(listing, watchlistItem, savingsPercent) {
    let score = savingsPercent; // Base score from savings
    
    // Bonus for trusted sources
    if (listing.source === 'reddit') score += 10;
    if (listing.source === 'watchuseek') score += 5;
    
    // Bonus for recent listings
    const ageHours = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) score += 15;
    else if (ageHours < 6) score += 10;
    else if (ageHours < 12) score += 5;
    
    return Math.round(score);
  }

  /**
   * Check if we've already alerted for this listing recently
   */
  async hasRecentAlert(listingId, userId = null) {
    try {
      const cooldownTime = new Date(Date.now() - this.alertCooldownMinutes * 60 * 1000).toISOString();
      
      let query = this.supabase
        .from('deal_alerts')
        .select('id')
        .eq('listing_id', listingId)
        .gte('sent_at', cooldownTime);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data } = await query;
      return data && data.length > 0;
    } catch (error) {
      // If table doesn't exist yet, assume no recent alerts
      return false;
    }
  }

  /**
   * Record that we sent an alert
   */
  async recordAlert(listingId, userId = null, channel = 'telegram') {
    try {
      await this.supabase
        .from('deal_alerts')
        .insert({
          listing_id: listingId,
          user_id: userId,
          channel,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Error recording alert:', error);
    }
  }

  /**
   * Format a deal for Telegram
   */
  formatDealMessage(deal) {
    const { listing, watchlistItem, savings, savingsPercent, score } = deal;
    
    const emoji = score >= 30 ? '🔥🔥🔥' : score >= 20 ? '🔥🔥' : '🔥';
    const sourceEmoji = {
      reddit: '🤖',
      watchuseek: '⌚',
      ebay: '🛒',
      chrono24: '🌐'
    }[listing.source] || '📦';
    
    let msg = `${emoji} **DEAL ALERT** ${emoji}\n\n`;
    msg += `${sourceEmoji} **${listing.title || `${listing.brand} ${listing.model}`}**\n\n`;
    msg += `💰 Price: **$${listing.price.toLocaleString()}**\n`;
    msg += `🎯 Your target: $${watchlistItem.target_price.toLocaleString()}\n`;
    msg += `💵 Savings: **$${savings.toLocaleString()} (${savingsPercent}% off)**\n\n`;
    msg += `📊 Deal Score: ${score}/100\n`;
    msg += `📍 Source: ${listing.source}\n\n`;
    msg += `🔗 ${listing.url}`;
    
    return msg;
  }

  /**
   * Send deal alerts via Telegram
   */
  async sendAlerts(chatId, deals, maxAlerts = 5) {
    if (!this.bot) {
      logger.warn('No Telegram bot configured for deal alerts');
      return { sent: 0, skipped: 0 };
    }

    let sent = 0;
    let skipped = 0;

    for (const deal of deals.slice(0, maxAlerts)) {
      const listingId = deal.listing.id;
      
      // Check if we already alerted for this
      if (await this.hasRecentAlert(listingId)) {
        skipped++;
        continue;
      }

      try {
        const message = this.formatDealMessage(deal);
        await this.bot.sendMessage(chatId, message, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: false 
        });
        
        await this.recordAlert(listingId);
        sent++;
        
        // Rate limit: wait 1 second between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error sending deal alert: ${error.message}`);
      }
    }

    logger.info(`Deal alerts: sent ${sent}, skipped ${skipped} (already alerted)`);
    return { sent, skipped };
  }

  /**
   * Run full deal check and alert cycle
   */
  async checkAndAlert(chatId) {
    logger.info('Starting deal check...');
    
    const watchDeals = await this.findWatchDeals();
    
    if (watchDeals.length === 0) {
      logger.info('No deals found this cycle');
      return { watchDeals: 0, sent: 0 };
    }

    const result = await this.sendAlerts(chatId, watchDeals);
    
    return {
      watchDeals: watchDeals.length,
      ...result
    };
  }
}

module.exports = DealAlertService;
