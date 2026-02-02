/**
 * Telegram Content Manager
 * Handles all automated content posting to Telegram channel
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class TelegramContentManager {
  constructor(bot) {
    this.bot = bot || new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;
    this.jobs = [];
  }

  /**
   * Initialize all scheduled content jobs
   */
  initSchedules() {
    console.log('📅 Initializing Telegram content schedules...');

    // Morning Market Brief - 7:30 AM
    this.scheduleJob('30 7 * * *', () => this.postMorningBrief(), 'Morning Brief');

    // Deal of the Day - 9:00 AM
    this.scheduleJob('0 9 * * *', () => this.postDealOfTheDay(), 'Deal of the Day');

    // Midday Hot Deals - 12:00 PM
    this.scheduleJob('0 12 * * *', () => this.postHotDeals(), 'Midday Deals');

    // Afternoon Price Drops - 3:00 PM
    this.scheduleJob('0 15 * * *', () => this.postPriceDrops(), 'Price Drops');

    // Evening Roundup - 6:00 PM
    this.scheduleJob('0 18 * * *', () => this.postEveningRoundup(), 'Evening Roundup');

    // Weekend Special - Saturday 10:00 AM
    this.scheduleJob('0 10 * * 6', () => this.postWeekendRoundup(), 'Weekend Roundup');

    // Weekly Stats - Sunday 8:00 PM
    this.scheduleJob('0 20 * * 0', () => this.postWeeklyStats(), 'Weekly Stats');

    // Market Monday - Monday 8:00 AM
    this.scheduleJob('0 8 * * 1', () => this.postMarketMonday(), 'Market Monday');

    console.log(`✅ ${this.jobs.length} content jobs scheduled`);
    return this;
  }

  scheduleJob(schedule, handler, name) {
    const job = cron.schedule(schedule, async () => {
      try {
        console.log(`📤 Running: ${name}`);
        await handler();
      } catch (error) {
        console.error(`❌ ${name} failed:`, error.message);
      }
    }, { timezone: 'America/Chicago' });
    
    this.jobs.push({ name, schedule, job });
  }

  /**
   * Morning Market Brief - Daily market overview
   */
  async postMorningBrief() {
    const { data: deals } = await supabase
      .from('watch_listings')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('deal_score', { ascending: false });

    const totalDeals = deals?.length || 0;
    const avgScore = deals?.length 
      ? (deals.reduce((sum, d) => sum + (d.deal_score || 0), 0) / deals.length).toFixed(1)
      : 0;
    const topDeal = deals?.[0];

    let message = `☀️ <b>Good Morning!</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `📊 <b>Last 24 Hours:</b>\n`;
    message += `• ${totalDeals} new deals tracked\n`;
    message += `• Average score: ${avgScore}/10\n\n`;

    if (topDeal) {
      message += `🏆 <b>Top Deal:</b>\n`;
      message += `${topDeal.title || topDeal.brand}\n`;
      message += `💰 $${topDeal.price?.toLocaleString()}\n\n`;
    }

    message += `🔔 Stay tuned for today's picks!\n\n`;
    message += `#TheHub #MorningBrief #Deals`;

    await this.sendToChannel(message);
  }

  /**
   * Deal of the Day - Best single deal
   */
  async postDealOfTheDay() {
    const { data: deals } = await supabase
      .from('watch_listings')
      .select('*')
      .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('deal_score', { ascending: false })
      .limit(1);

    if (!deals?.length) return;

    const deal = deals[0];
    const score = deal.deal_score || 8;
    const scoreBar = this.getScoreBar(score);

    let message = `🏆 <b>DEAL OF THE DAY</b> 🏆\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `<b>${deal.title || `${deal.brand} ${deal.model}`}</b>\n\n`;
    message += `💰 <b>Price:</b> $${deal.price?.toLocaleString()}\n`;
    
    if (deal.original_price && deal.original_price > deal.price) {
      const savings = deal.original_price - deal.price;
      const pct = Math.round((savings / deal.original_price) * 100);
      message += `💸 <s>$${deal.original_price.toLocaleString()}</s> (${pct}% OFF)\n`;
    }
    
    message += `\n📊 <b>Score:</b> ${scoreBar} ${score}/10\n`;
    message += `📍 ${deal.source}\n\n`;
    message += `<a href="${deal.url}">🔗 View Deal</a>\n\n`;
    message += `#DealOfTheDay #TheHub`;

    const messageId = await this.sendToChannel(message);
    
    // Pin the message
    if (messageId) {
      try {
        await this.bot.pinChatMessage(this.channelId, messageId);
      } catch (e) {
        console.log('Could not pin message:', e.message);
      }
    }
  }

  /**
   * Hot Deals - Top 3 deals right now
   */
  async postHotDeals() {
    const { data: deals } = await supabase
      .from('watch_listings')
      .select('*')
      .gte('deal_score', 8)
      .order('deal_score', { ascending: false })
      .limit(3);

    if (!deals?.length) return;

    let message = `🔥 <b>HOT DEALS RIGHT NOW</b> 🔥\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;

    deals.forEach((deal, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      message += `${medal} <b>${deal.title || deal.brand}</b>\n`;
      message += `   💰 $${deal.price?.toLocaleString()} • Score: ${deal.deal_score}/10\n`;
      message += `   <a href="${deal.url}">View →</a>\n\n`;
    });

    message += `#HotDeals #TheHub`;

    await this.sendToChannel(message);
  }

  /**
   * Price Drops - Items that dropped in price
   */
  async postPriceDrops() {
    // Query for price history to find drops
    const { data: drops } = await supabase
      .from('price_history')
      .select(`
        *,
        watch_listings (*)
      `)
      .order('checked_at', { ascending: false })
      .limit(50);

    // Find actual price drops (current < previous)
    const priceDrops = [];
    const seen = new Set();

    for (const record of drops || []) {
      if (!record.watch_listings || seen.has(record.listing_id)) continue;
      
      const { data: history } = await supabase
        .from('price_history')
        .select('price')
        .eq('listing_id', record.listing_id)
        .order('checked_at', { ascending: false })
        .limit(2);

      if (history?.length >= 2 && history[0].price < history[1].price) {
        priceDrops.push({
          ...record.watch_listings,
          oldPrice: history[1].price,
          newPrice: history[0].price,
          drop: history[1].price - history[0].price
        });
        seen.add(record.listing_id);
      }

      if (priceDrops.length >= 3) break;
    }

    if (!priceDrops.length) return;

    let message = `📉 <b>PRICE DROP ALERTS</b> 📉\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;

    priceDrops.forEach(deal => {
      const pct = Math.round((deal.drop / deal.oldPrice) * 100);
      message += `<b>${deal.title || deal.brand}</b>\n`;
      message += `💰 $${deal.newPrice.toLocaleString()} `;
      message += `<s>$${deal.oldPrice.toLocaleString()}</s>\n`;
      message += `✅ Save $${deal.drop.toLocaleString()} (${pct}% off)\n`;
      message += `<a href="${deal.url}">View →</a>\n\n`;
    });

    message += `#PriceDrop #TheHub`;

    await this.sendToChannel(message);
  }

  /**
   * Evening Roundup - Day's summary
   */
  async postEveningRoundup() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: deals } = await supabase
      .from('watch_listings')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('deal_score', { ascending: false });

    const total = deals?.length || 0;
    const hotDeals = deals?.filter(d => d.deal_score >= 8)?.length || 0;
    const avgPrice = deals?.length
      ? Math.round(deals.reduce((sum, d) => sum + (d.price || 0), 0) / deals.length)
      : 0;

    let message = `🌙 <b>Today's Roundup</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `📊 <b>Stats:</b>\n`;
    message += `• ${total} deals tracked\n`;
    message += `• ${hotDeals} hot deals (8+ score)\n`;
    message += `• Avg price: $${avgPrice.toLocaleString()}\n\n`;

    if (deals?.length > 0) {
      message += `🔥 <b>Best Deal Today:</b>\n`;
      message += `${deals[0].title || deals[0].brand}\n`;
      message += `$${deals[0].price?.toLocaleString()} • ${deals[0].deal_score}/10\n\n`;
    }

    message += `See you tomorrow! 👋\n\n`;
    message += `#DailyRoundup #TheHub`;

    await this.sendToChannel(message);
  }

  /**
   * Weekend Roundup - Week's best deals
   */
  async postWeekendRoundup() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: deals } = await supabase
      .from('watch_listings')
      .select('*')
      .gte('created_at', weekAgo.toISOString())
      .order('deal_score', { ascending: false })
      .limit(5);

    if (!deals?.length) return;

    let message = `🗓️ <b>WEEKEND ROUNDUP</b> 🗓️\n`;
    message += `<i>This Week's Top 5 Deals</i>\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;

    deals.forEach((deal, i) => {
      const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
      message += `${emoji} <b>${deal.title || deal.brand}</b>\n`;
      message += `   💰 $${deal.price?.toLocaleString()} • Score: ${deal.deal_score}/10\n`;
      message += `   <a href="${deal.url}">View Deal</a>\n\n`;
    });

    message += `#WeekendRoundup #TopDeals #TheHub`;

    await this.sendToChannel(message);
  }

  /**
   * Weekly Stats - Performance metrics
   */
  async postWeeklyStats() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: deals } = await supabase
      .from('watch_listings')
      .select('*')
      .gte('created_at', weekAgo.toISOString());

    const { count: subscribers } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });

    const total = deals?.length || 0;
    const hotDeals = deals?.filter(d => d.deal_score >= 8)?.length || 0;
    const sources = [...new Set(deals?.map(d => d.source))].length;
    const avgScore = deals?.length
      ? (deals.reduce((sum, d) => sum + (d.deal_score || 0), 0) / deals.length).toFixed(1)
      : 0;

    let message = `📈 <b>WEEKLY STATS</b> 📈\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `📊 <b>This Week:</b>\n`;
    message += `• ${total} deals tracked\n`;
    message += `• ${hotDeals} hot deals found\n`;
    message += `• ${sources} sources monitored\n`;
    message += `• Avg deal score: ${avgScore}/10\n\n`;
    message += `👥 <b>Community:</b>\n`;
    message += `• ${subscribers || 0} newsletter subscribers\n\n`;
    message += `Thanks for being part of The Hub! 🙏\n\n`;
    message += `#WeeklyStats #TheHub`;

    await this.sendToChannel(message);
  }

  /**
   * Market Monday - Start of week market insights
   */
  async postMarketMonday() {
    let message = `📊 <b>MARKET MONDAY</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `Happy Monday! Here's what we're watching this week:\n\n`;
    message += `⌚ <b>Watches:</b> Vintage sports models staying hot\n`;
    message += `👟 <b>Sneakers:</b> New releases dropping Friday\n`;
    message += `🚗 <b>Cars:</b> Spring buying season ramping up\n\n`;
    message += `🎯 <b>Pro Tip:</b> Set price alerts on items you're watching!\n\n`;
    message += `What are YOU hunting this week? 👇\n\n`;
    message += `#MarketMonday #TheHub`;

    await this.sendToChannel(message);
  }

  /**
   * Post a poll to engage the community
   */
  async postPoll(question, options) {
    try {
      await this.bot.sendPoll(this.channelId, question, options, {
        is_anonymous: true,
        allows_multiple_answers: false
      });
      console.log('✅ Poll posted');
    } catch (error) {
      console.error('Failed to post poll:', error.message);
    }
  }

  /**
   * Post message with inline keyboard
   */
  async postWithButtons(text, buttons) {
    try {
      await this.bot.sendMessage(this.channelId, text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    } catch (error) {
      console.error('Failed to post with buttons:', error.message);
    }
  }

  /**
   * Send message to channel
   */
  async sendToChannel(message, options = {}) {
    if (!this.channelId) {
      console.warn('No TELEGRAM_CHANNEL_ID configured');
      return null;
    }

    try {
      const result = await this.bot.sendMessage(this.channelId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        ...options
      });
      console.log('✅ Posted to channel');
      return result.message_id;
    } catch (error) {
      console.error('Failed to send to channel:', error.message);
      return null;
    }
  }

  getScoreBar(score) {
    const filled = Math.round(score);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Manual trigger methods for testing
   */
  async triggerContent(type) {
    const handlers = {
      morning: () => this.postMorningBrief(),
      dotd: () => this.postDealOfTheDay(),
      hot: () => this.postHotDeals(),
      drops: () => this.postPriceDrops(),
      evening: () => this.postEveningRoundup(),
      weekend: () => this.postWeekendRoundup(),
      stats: () => this.postWeeklyStats(),
      monday: () => this.postMarketMonday()
    };

    if (handlers[type]) {
      await handlers[type]();
      return { success: true, type };
    }
    return { success: false, error: 'Unknown content type' };
  }

  getStatus() {
    return {
      channelId: this.channelId,
      scheduledJobs: this.jobs.map(j => ({ name: j.name, schedule: j.schedule })),
      isConfigured: !!this.channelId
    };
  }
}

module.exports = TelegramContentManager;

// Run standalone
if (require.main === module) {
  const manager = new TelegramContentManager();
  manager.initSchedules();
  console.log('Telegram Content Manager running...');
}
