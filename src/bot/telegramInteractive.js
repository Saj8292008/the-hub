/**
 * Telegram Interactive Features
 * Inline buttons, callbacks, and engagement features
 */

require('dotenv').config();

class TelegramInteractive {
  constructor(bot) {
    this.bot = bot;
    this.setupCallbackHandlers();
  }

  setupCallbackHandlers() {
    this.bot.on('callback_query', async (query) => {
      const data = query.data;
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const userId = query.from.id;

      try {
        // Parse callback data
        const [action, ...params] = data.split(':');

        switch (action) {
          case 'save':
            await this.handleSaveDeal(chatId, userId, params[0]);
            break;
          case 'alert':
            await this.handleSetAlert(chatId, userId, params[0]);
            break;
          case 'similar':
            await this.handleFindSimilar(chatId, params[0]);
            break;
          case 'share':
            await this.handleShare(chatId, params[0]);
            break;
          case 'vote':
            await this.handleVote(chatId, userId, params[0], params[1]);
            break;
          default:
            console.log('Unknown callback action:', action);
        }

        // Acknowledge the callback
        await this.bot.answerCallbackQuery(query.id);
      } catch (error) {
        console.error('Callback error:', error);
        await this.bot.answerCallbackQuery(query.id, {
          text: '❌ Something went wrong',
          show_alert: true
        });
      }
    });

    console.log('✅ Interactive callback handlers initialized');
  }

  /**
   * Create deal message with action buttons
   */
  createDealButtons(dealId) {
    return {
      inline_keyboard: [
        [
          { text: '💾 Save', callback_data: `save:${dealId}` },
          { text: '🔔 Alert Me', callback_data: `alert:${dealId}` }
        ],
        [
          { text: '🔍 Similar Deals', callback_data: `similar:${dealId}` },
          { text: '📤 Share', callback_data: `share:${dealId}` }
        ]
      ]
    };
  }

  /**
   * Create voting buttons for community engagement
   */
  createVoteButtons(dealId) {
    return {
      inline_keyboard: [
        [
          { text: '🔥 Hot Deal!', callback_data: `vote:${dealId}:hot` },
          { text: '😐 Meh', callback_data: `vote:${dealId}:meh` },
          { text: '👎 Pass', callback_data: `vote:${dealId}:pass` }
        ]
      ]
    };
  }

  /**
   * Create quick action buttons
   */
  createQuickActions() {
    return {
      inline_keyboard: [
        [
          { text: '🔥 Hot Deals', callback_data: 'browse:hot' },
          { text: '📉 Price Drops', callback_data: 'browse:drops' }
        ],
        [
          { text: '⌚ Watches', callback_data: 'cat:watches' },
          { text: '👟 Sneakers', callback_data: 'cat:sneakers' },
          { text: '🚗 Cars', callback_data: 'cat:cars' }
        ]
      ]
    };
  }

  /**
   * Handle save deal callback
   */
  async handleSaveDeal(chatId, userId, dealId) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if user has account linked
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (!user) {
      await this.bot.sendMessage(chatId, 
        '❌ Connect your account first!\n\nUse /connect <email> to link your account.',
        { reply_to_message_id: null }
      );
      return;
    }

    // Save to user's watchlist
    await supabase
      .from('saved_deals')
      .upsert({
        user_id: user.id,
        listing_id: dealId,
        saved_at: new Date().toISOString()
      });

    await this.bot.sendMessage(chatId, '✅ Deal saved to your watchlist!');
  }

  /**
   * Handle set alert callback
   */
  async handleSetAlert(chatId, userId, dealId) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (!user) {
      await this.bot.sendMessage(chatId, 
        '❌ Connect your account first!\n\nUse /connect <email> to link your account.'
      );
      return;
    }

    // Create price alert
    await supabase
      .from('price_alerts')
      .insert({
        user_id: user.id,
        listing_id: dealId,
        alert_type: 'price_drop',
        created_at: new Date().toISOString()
      });

    await this.bot.sendMessage(chatId, '🔔 Alert set! We\'ll notify you of price changes.');
  }

  /**
   * Handle find similar deals
   */
  async handleFindSimilar(chatId, dealId) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the deal
    const { data: deal } = await supabase
      .from('watch_listings')
      .select('*')
      .eq('id', dealId)
      .single();

    if (!deal) {
      await this.bot.sendMessage(chatId, '❌ Deal not found');
      return;
    }

    // Find similar deals (same brand, similar price range)
    const { data: similar } = await supabase
      .from('watch_listings')
      .select('*')
      .eq('brand', deal.brand)
      .gte('price', deal.price * 0.7)
      .lte('price', deal.price * 1.3)
      .neq('id', dealId)
      .order('deal_score', { ascending: false })
      .limit(3);

    if (!similar?.length) {
      await this.bot.sendMessage(chatId, '📭 No similar deals found right now.');
      return;
    }

    let message = `🔍 <b>Similar to your deal:</b>\n\n`;
    similar.forEach((s, i) => {
      message += `${i + 1}. ${s.title || s.brand}\n`;
      message += `   💰 $${s.price.toLocaleString()} • Score: ${s.deal_score}/10\n`;
      message += `   <a href="${s.url}">View →</a>\n\n`;
    });

    await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  }

  /**
   * Handle share callback
   */
  async handleShare(chatId, dealId) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: deal } = await supabase
      .from('watch_listings')
      .select('*')
      .eq('id', dealId)
      .single();

    if (!deal) return;

    const shareText = `Check out this deal on The Hub!\n\n${deal.title || deal.brand} - $${deal.price.toLocaleString()}\n${deal.url}`;
    
    await this.bot.sendMessage(chatId, 
      `📤 <b>Share this deal:</b>\n\n<code>${shareText}</code>\n\nCopy and share with friends!`,
      { parse_mode: 'HTML' }
    );
  }

  /**
   * Handle community vote
   */
  async handleVote(chatId, userId, dealId, vote) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Record vote
    await supabase
      .from('deal_votes')
      .upsert({
        listing_id: dealId,
        telegram_user_id: userId,
        vote: vote,
        voted_at: new Date().toISOString()
      }, {
        onConflict: 'listing_id,telegram_user_id'
      });

    const emoji = vote === 'hot' ? '🔥' : vote === 'meh' ? '😐' : '👎';
    await this.bot.answerCallbackQuery(null, {
      text: `${emoji} Vote recorded!`,
      show_alert: false
    });
  }

  /**
   * Post a deal with interactive buttons
   */
  async postInteractiveDeal(deal, channelId) {
    const score = deal.deal_score || 0;
    const scoreBar = '█'.repeat(Math.round(score)) + '░'.repeat(10 - Math.round(score));
    const fires = score >= 9 ? '🔥🔥🔥' : score >= 8 ? '🔥🔥' : score >= 7 ? '🔥' : '';

    let message = `${fires} <b>${deal.title || deal.brand}</b>\n\n`;
    message += `💰 <b>$${deal.price?.toLocaleString()}</b>\n`;
    message += `📊 Score: ${scoreBar} ${score}/10\n`;
    message += `📍 ${deal.source}\n\n`;
    message += `<a href="${deal.url}">🔗 View Deal</a>`;

    await this.bot.sendMessage(channelId, message, {
      parse_mode: 'HTML',
      reply_markup: this.createDealButtons(deal.id)
    });
  }

  /**
   * Send welcome message to new channel members
   */
  async sendWelcome(chatId, memberName) {
    const message = `👋 <b>Welcome to The Hub, ${memberName}!</b>\n\n` +
      `You'll get the best deals on:\n` +
      `⌚ Watches\n` +
      `👟 Sneakers\n` +
      `🚗 Cars\n\n` +
      `<b>Quick Tips:</b>\n` +
      `• 🔥 = Hot deal (score 8+)\n` +
      `• 🏆 = Deal of the Day\n` +
      `• Click buttons to save deals!\n\n` +
      `DM me /connect <email> to get personalized alerts!`;

    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: this.createQuickActions()
    });
  }
}

module.exports = TelegramInteractive;
