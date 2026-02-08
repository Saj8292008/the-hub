#!/usr/bin/env node
/**
 * DEAL HUNTER AGENT
 * Continuously monitors for hot deals and auto-posts them
 * Learns from engagement to improve scoring
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('node-telegram-bot-api');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

class DealHunter {
  constructor(threshold = 12) {
    this.threshold = threshold;
    this.postedDeals = this.loadPostedDeals();
  }

  loadPostedDeals() {
    const fs = require('fs');
    const path = require('path');
    const cacheFile = path.join(__dirname, 'posted-deals.json');
    
    try {
      if (fs.existsSync(cacheFile)) {
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        return new Set(data);
      }
    } catch (err) {
      console.warn('Could not load posted deals cache:', err.message);
    }
    return new Set();
  }

  savePostedDeals() {
    const fs = require('fs');
    const path = require('path');
    const cacheFile = path.join(__dirname, 'posted-deals.json');
    
    try {
      fs.writeFileSync(cacheFile, JSON.stringify([...this.postedDeals]));
    } catch (err) {
      console.warn('Could not save posted deals cache:', err.message);
    }
  }

  async hunt() {
    console.log(`🔍 Hunting for deals (score >= ${this.threshold})...`);

    try {
      // Check watch deals
      const watchDeals = await this.findHotDeals('watch_listings');
      
      // Check sneaker deals
      const sneakerDeals = await this.findHotDeals('sneaker_listings', 'price');
      
      const allDeals = [...watchDeals, ...sneakerDeals];
      const newDeals = allDeals.filter(d => !this.postedDeals.has(d.id));

      if (newDeals.length > 0) {
        console.log(`🔥 Found ${newDeals.length} new hot deals!`);
        
        for (const deal of newDeals) {
          await this.postDeal(deal);
          this.postedDeals.add(deal.id);
          await this.sleep(2000); // Rate limit
        }
      } else {
        console.log('📭 No new hot deals this run');
      }

      this.savePostedDeals();
      return newDeals.length;

    } catch (error) {
      console.error('❌ Hunt error:', error.message);
      return 0;
    }
  }

  async findHotDeals(table, scoreColumn = 'deal_score') {
    const query = supabase
      .from(table)
      .select('*')
      .order(scoreColumn, { ascending: false })
      .limit(10);

    if (scoreColumn === 'deal_score') {
      query.gte(scoreColumn, this.threshold);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching from ${table}:`, error.message);
      return [];
    }

    return data || [];
  }

  escapeMarkdown(text) {
    if (!text) return '';
    return text.toString().replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }

  async postDeal(deal) {
    const isWatch = deal.deal_score !== undefined;
    const category = isWatch ? '⌚ WATCH' : '👟 SNEAKER';
    
    const brand = deal.brand || (isWatch ? 'Watch' : 'Sneaker');
    const model = deal.model || '';
    const title = `${brand} ${model}`.trim();
    
    let message = `${category} ALERT 🔥\n\n`;
    message += `${title}\n`;
    message += `💰 $${deal.price}\n`;
    
    if (isWatch) {
      message += `📊 Score: ${deal.deal_score}/100\n`;
      message += `📍 ${deal.source}\n`;
    } else {
      message += `👟 Size: ${deal.size || 'N/A'}\n`;
    }
    
    message += `\n🔗 ${deal.url}\n`;
    message += `\nJoin @thehubdeals`;

    try {
      await bot.sendMessage(
        process.env.TELEGRAM_CHANNEL_ID,
        message,
        { disable_web_page_preview: false }
      );
      console.log(`✅ Posted: ${brand} ${model} - $${deal.price}`);
    } catch (error) {
      console.error('❌ Post error:', error.message);
      // Try again without preview if failed
      try {
        await bot.sendMessage(
          process.env.TELEGRAM_CHANNEL_ID,
          message,
          { disable_web_page_preview: true }
        );
        console.log(`✅ Posted (retry): ${brand} ${model}`);
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError.message);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const hunter = new DealHunter(process.env.HOT_DEAL_THRESHOLD || 12);
  hunter.hunt()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = DealHunter;
