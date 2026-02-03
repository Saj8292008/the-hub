require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const supabaseWrapper = require('../db/supabase');
const supabase = supabaseWrapper.client;
const { convertToAffiliateLink } = require('../utils/affiliateLinks');

const WatchTracker = require('../trackers/watches');
const CarTracker = require('../trackers/cars');
const SneakerTracker = require('../trackers/sneakers');
const SportsTracker = require('../trackers/sports');
const AiTracker = require('../trackers/ai');

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID; // e.g., @TheHubDeals

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const watchTracker = new WatchTracker();
const carTracker = new CarTracker();
const sneakerTracker = new SneakerTracker();
const sportsTracker = new SportsTracker();
const aiTracker = new AiTracker();

const commandRegex = (command) => new RegExp(`^/${command}(?:@\\w+)?(?:\\s+(.*))?$`);

const getWatchName = (watch) => {
  return (
    watch.name ||
    [watch.brand, watch.model, watch.specificModel || watch.specific_model]
      .filter(Boolean)
      .join(' ')
      .trim()
  );
};

const getWatchPrice = (watch) => {
  const price = watch.currentPrice ?? watch.current_price;
  return price ? `$${price}` : 'Unknown';
};

const getCarName = (car) => {
  return (
    car.name ||
    [car.make, car.model, car.year].filter(Boolean).join(' ').trim() ||
    'Unknown car'
  );
};

const getSneakerName = (sneaker) => {
  return (
    sneaker.name ||
    [sneaker.brand, sneaker.model, sneaker.colorway].filter(Boolean).join(' ').trim()
  );
};

const sendMessage = (chatId, text) => {
  return bot.sendMessage(chatId, text, { disable_web_page_preview: true });
};

bot.onText(commandRegex('watches'), async (msg) => {
  try {
    const watches = await watchTracker.listWatches();
    if (!watches.length) {
      return sendMessage(msg.chat.id, 'No watches tracked yet.');
    }
    const lines = watches.map((watch, index) => {
      const name = getWatchName(watch) || 'Unknown watch';
      const target = watch.targetPrice ?? watch.target_price;
      const targetText = target ? ` (target $${target})` : '';
      return `${index + 1}. ${name}${targetText}`;
    });
    return sendMessage(msg.chat.id, lines.join('\n'));
  } catch (error) {
    return sendMessage(msg.chat.id, `Error listing watches: ${error.message}`);
  }
});

bot.onText(commandRegex('addwatch'), async (msg, match) => {
  const raw = (match?.[1] || '').trim();
  if (!raw) {
    return sendMessage(msg.chat.id, 'Usage: /addwatch <model>');
  }

  const parts = raw.split(/\s+/);
  let brand = 'Unknown';
  let model = raw;
  if (parts.length >= 2) {
    brand = parts[0];
    model = parts.slice(1).join(' ');
  }

  try {
    await watchTracker.addWatch({ brand, model, name: raw });
    return sendMessage(msg.chat.id, `Added watch: ${raw}`);
  } catch (error) {
    return sendMessage(msg.chat.id, `Error adding watch: ${error.message}`);
  }
});

bot.onText(commandRegex('prices'), async (msg) => {
  try {
    const watches = await watchTracker.listWatches();
    if (!watches.length) {
      return sendMessage(msg.chat.id, 'No watches tracked yet.');
    }
    const lines = watches.map((watch, index) => {
      const name = getWatchName(watch) || 'Unknown watch';
      const price = getWatchPrice(watch);
      return `${index + 1}. ${name} - ${price}`;
    });
    return sendMessage(msg.chat.id, lines.join('\n'));
  } catch (error) {
    return sendMessage(msg.chat.id, `Error fetching prices: ${error.message}`);
  }
});

bot.onText(commandRegex('cars'), async (msg) => {
  try {
    const cars = await carTracker.listCars();
    if (!cars.length) {
      return sendMessage(msg.chat.id, 'No cars tracked yet.');
    }
    const lines = cars.map((car, index) => {
      return `${index + 1}. ${getCarName(car)}`;
    });
    return sendMessage(msg.chat.id, lines.join('\n'));
  } catch (error) {
    return sendMessage(msg.chat.id, `Error listing cars: ${error.message}`);
  }
});

bot.onText(commandRegex('addcar'), async (msg, match) => {
  const raw = (match?.[1] || '').trim();
  if (!raw) {
    return sendMessage(msg.chat.id, 'Usage: /addcar <make> <model> <year>');
  }

  const parts = raw.split(/\s+/);
  if (parts.length < 3) {
    return sendMessage(msg.chat.id, 'Usage: /addcar <make> <model> <year>');
  }

  const make = parts[0];
  const year = parts[parts.length - 1];
  const model = parts.slice(1, -1).join(' ');

  if (!/^\d{4}$/.test(year)) {
    return sendMessage(msg.chat.id, 'Year must be a 4-digit number.');
  }

  try {
    await carTracker.addCar({ make, model, year: Number(year) });
    return sendMessage(msg.chat.id, `Added car: ${make} ${model} ${year}`);
  } catch (error) {
    return sendMessage(msg.chat.id, `Error adding car: ${error.message}`);
  }
});

bot.onText(commandRegex('sneakers'), async (msg) => {
  try {
    const sneakers = await sneakerTracker.listSneakers();
    if (!sneakers.length) {
      return sendMessage(msg.chat.id, 'No sneakers tracked yet.');
    }
    const lines = sneakers.map((sneaker, index) => {
      const name = getSneakerName(sneaker) || 'Unknown sneaker';
      const size = sneaker.size ? ` (size ${sneaker.size})` : '';
      return `${index + 1}. ${name}${size}`;
    });
    return sendMessage(msg.chat.id, lines.join('\n'));
  } catch (error) {
    return sendMessage(msg.chat.id, `Error listing sneakers: ${error.message}`);
  }
});

bot.onText(commandRegex('addsneaker'), async (msg, match) => {
  const raw = (match?.[1] || '').trim();
  if (!raw) {
    return sendMessage(msg.chat.id, 'Usage: /addsneaker <name>');
  }

  const parts = raw.split(/\s+/);
  const brand = parts[0] || 'Unknown';
  const model = parts.slice(1).join(' ') || parts[0];

  try {
    await sneakerTracker.addSneaker({ name: raw, brand, model });
    return sendMessage(msg.chat.id, `Added sneaker: ${raw}`);
  } catch (error) {
    return sendMessage(msg.chat.id, `Error adding sneaker: ${error.message}`);
  }
});

bot.onText(commandRegex('scores'), async (msg) => {
  try {
    const scores = await sportsTracker.getScores();
    const teams = scores.teams?.length ? scores.teams.join(', ') : 'None';
    if (!scores.scores?.length) {
      return sendMessage(
        msg.chat.id,
        `No live scores available.\nFollowed teams: ${teams}`
      );
    }

    const lines = scores.scores.map((score) => score.summary || JSON.stringify(score));
    return sendMessage(msg.chat.id, lines.join('\n'));
  } catch (error) {
    return sendMessage(msg.chat.id, `Error fetching scores: ${error.message}`);
  }
});

bot.onText(commandRegex('addteam'), async (msg, match) => {
  const raw = (match?.[1] || '').trim();
  if (!raw) {
    return sendMessage(msg.chat.id, 'Usage: /addteam <league> <team>');
  }

  const parts = raw.split(/\s+/);
  if (parts.length < 2) {
    return sendMessage(msg.chat.id, 'Usage: /addteam <league> <team>');
  }

  const league = parts[0];
  const name = parts.slice(1).join(' ');

  try {
    await sportsTracker.addTeam({ league, name });
    return sendMessage(msg.chat.id, `Following ${name} (${league}).`);
  } catch (error) {
    return sendMessage(msg.chat.id, `Error adding team: ${error.message}`);
  }
});

bot.onText(commandRegex('ai'), async (msg) => {
  try {
    const summary = await aiTracker.getSummary();
    const { models, benchmarks, companies } = summary.counts || {};
    const lines = [
      'AI Summary',
      `Models tracked: ${models ?? 0}`,
      `Benchmarks tracked: ${benchmarks ?? 0}`,
      `Companies tracked: ${companies ?? 0}`
    ];
    return sendMessage(msg.chat.id, lines.join('\n'));
  } catch (error) {
    return sendMessage(msg.chat.id, `Error fetching AI summary: ${error.message}`);
  }
});

// ============================================================================
// REMOVE COMMANDS
// ============================================================================

bot.onText(commandRegex('removewatch'), async (msg, match) => {
  const id = (match?.[1] || '').trim();

  if (!id) {
    try {
      const watches = await watchTracker.listWatches();
      if (!watches.length) {
        return sendMessage(msg.chat.id, 'No watches tracked yet.');
      }
      const lines = watches.map((w, i) =>
        `${i + 1}. ${getWatchName(w)} [ID: ${w.id}]`
      );
      return sendMessage(msg.chat.id, 'Usage: /removewatch <id>\n\nYour watches:\n' + lines.join('\n'));
    } catch (error) {
      return sendMessage(msg.chat.id, `Error: ${error.message}`);
    }
  }

  try {
    await watchTracker.deleteWatch(id);
    return sendMessage(msg.chat.id, `✅ Removed watch: ${id}`);
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

bot.onText(commandRegex('removecar'), async (msg, match) => {
  const id = (match?.[1] || '').trim();

  if (!id) {
    try {
      const cars = await carTracker.listCars();
      if (!cars.length) {
        return sendMessage(msg.chat.id, 'No cars tracked yet.');
      }
      const lines = cars.map((c, i) =>
        `${i + 1}. ${getCarName(c)} [ID: ${c.id}]`
      );
      return sendMessage(msg.chat.id, 'Usage: /removecar <id>\n\nYour cars:\n' + lines.join('\n'));
    } catch (error) {
      return sendMessage(msg.chat.id, `Error: ${error.message}`);
    }
  }

  try {
    await carTracker.deleteCar(id);
    return sendMessage(msg.chat.id, `✅ Removed car: ${id}`);
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

bot.onText(commandRegex('removesneaker'), async (msg, match) => {
  const id = (match?.[1] || '').trim();

  if (!id) {
    try {
      const sneakers = await sneakerTracker.listSneakers();
      if (!sneakers.length) {
        return sendMessage(msg.chat.id, 'No sneakers tracked yet.');
      }
      const lines = sneakers.map((s, i) =>
        `${i + 1}. ${getSneakerName(s)} [ID: ${s.id}]`
      );
      return sendMessage(msg.chat.id, 'Usage: /removesneaker <id>\n\nYour sneakers:\n' + lines.join('\n'));
    } catch (error) {
      return sendMessage(msg.chat.id, `Error: ${error.message}`);
    }
  }

  try {
    await sneakerTracker.deleteSneaker(id);
    return sendMessage(msg.chat.id, `✅ Removed sneaker: ${id}`);
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

// ============================================================================
// SET TARGET PRICE COMMAND
// ============================================================================

bot.onText(commandRegex('settarget'), async (msg, match) => {
  const parts = (match?.[1] || '').trim().split(/\s+/);

  if (parts.length < 3) {
    return sendMessage(msg.chat.id, 'Usage: /settarget <type> <id> <price>\n\nExample: /settarget watch rolex-submariner 8000');
  }

  const [type, id, priceStr] = parts;
  const targetPrice = parseFloat(priceStr);

  if (isNaN(targetPrice)) {
    return sendMessage(msg.chat.id, '❌ Invalid price. Must be a number.');
  }

  try {
    if (type === 'watch') {
      await watchTracker.updateWatch(id, { targetPrice });
    } else if (type === 'car') {
      await carTracker.updateCar(id, { targetPrice });
    } else if (type === 'sneaker') {
      await sneakerTracker.updateSneaker(id, { targetPrice });
    } else {
      return sendMessage(msg.chat.id, '❌ Invalid type. Use: watch, car, or sneaker');
    }

    return sendMessage(msg.chat.id, `✅ Updated target price for ${id} to $${targetPrice}`);
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

// ============================================================================
// CONNECT COMMAND - Link Telegram account with user account
// ============================================================================

bot.onText(commandRegex('connect'), async (msg, match) => {
  const email = (match?.[1] || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return sendMessage(msg.chat.id, '❌ Usage: /connect <your-email>\n\nExample: /connect user@example.com\n\nThis will link your Telegram account to receive personalized deal alerts.');
  }

  try {
    // Check if user exists with this email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, tier')
      .eq('email', email)
      .limit(1);

    if (userError) throw userError;

    if (!users || users.length === 0) {
      return sendMessage(msg.chat.id, `❌ No account found with email: ${email}\n\nPlease sign up at ${process.env.FRONTEND_URL || 'https://thehub.com'} first.`);
    }

    const user = users[0];
    const chatId = msg.chat.id;
    const username = msg.from?.username || null;

    // Update user with Telegram info
    const { error: updateError } = await supabase
      .from('users')
      .update({
        telegram_chat_id: chatId,
        telegram_username: username,
        telegram_notifications: true
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Log the connection
    await supabase
      .from('telegram_alerts')
      .insert({
        user_id: user.id,
        chat_id: chatId,
        alert_type: 'account_connected',
        message: `Connected Telegram account @${username || 'user'} to ${email}`,
        sent_at: new Date().toISOString()
      });

    const tierEmoji = user.tier === 'premium' ? '👑' : user.tier === 'pro' ? '⭐' : '✅';
    return sendMessage(
      msg.chat.id,
      `${tierEmoji} *Account Connected!*\n\n` +
      `Email: ${user.email}\n` +
      `Name: ${user.first_name || 'User'}\n` +
      `Tier: ${user.tier || 'free'}\n\n` +
      `You'll now receive personalized deal alerts based on your preferences!\n\n` +
      `📊 Set your preferences at ${process.env.FRONTEND_URL || 'https://thehub.com'}/settings`
    );
  } catch (error) {
    console.error('Connect error:', error);
    return sendMessage(msg.chat.id, `❌ Connection failed: ${error.message}`);
  }
});

// ============================================================================
// START COMMAND - Welcome message
// ============================================================================

bot.onText(commandRegex('start'), async (msg) => {
  const welcomeText = `🎉 *Welcome to The Hub!*

I'll send you personalized deal alerts for watches, cars, sneakers, and sports collectibles.

*Quick Start:*
📧 /connect <email> - Link your account
📋 /help - See all commands
🔥 Join our channel: ${channelId || '@TheHubDeals'}

*Track Items:*
🕐 /addwatch <brand model>
🚗 /addcar <make model year>
👟 /addsneaker <name>

Start tracking your first item now!`;

  return sendMessage(msg.chat.id, welcomeText);
});

// ============================================================================
// HELP COMMAND
// ============================================================================

bot.onText(commandRegex('help'), async (msg) => {
  const helpText = `📋 *The Hub - Command Reference*

*Account* 👤
/start - Welcome message
/connect <email> - Link your account for alerts

*Watches* 🕐
/watches - List tracked watches
/addwatch <brand model> - Add watch
/removewatch <id> - Remove watch
/prices - Show current prices

*Cars* 🚗
/cars - List tracked cars
/addcar <make model year> - Add car
/removecar <id> - Remove car

*Sneakers* 👟
/sneakers - List tracked sneakers
/addsneaker <name> - Add sneaker
/removesneaker <id> - Remove sneaker

*Sports* 🏀
/scores - Live scores
/addteam <league team> - Follow team

*Management* ⚙️
/settarget <type> <id> <price> - Set price target
/history <type> <id> - Show price history
/update - Manual price update
/help - Show this message

*Hot Deals Channel* 🔥
Join ${channelId || '@TheHubDeals'} for instant alerts!

*Examples*
\`/connect user@example.com\`
\`/addwatch Rolex Submariner\`
\`/settarget watch rolex-submariner 8000\`
  `.trim();

  return sendMessage(msg.chat.id, helpText);
});

// ============================================================================
// HISTORY COMMAND
// ============================================================================

bot.onText(commandRegex('history'), async (msg, match) => {
  const parts = (match?.[1] || '').trim().split(/\s+/);

  if (parts.length < 2) {
    return sendMessage(msg.chat.id, 'Usage: /history <type> <id>\n\nExample: /history watch rolex-submariner');
  }

  const [type, id] = parts;
  const supabase = require('../db/supabase');

  if (!supabase.isAvailable()) {
    return sendMessage(msg.chat.id, '❌ Price history requires Supabase database.\n\nConfigure SUPABASE_URL and SUPABASE_ANON_KEY in .env');
  }

  try {
    const history = await supabase.getPriceHistory(type, id, 10);

    if (!history.data?.length) {
      return sendMessage(msg.chat.id, '📊 No price history found for this item');
    }

    const lines = history.data.map(h => {
      const date = new Date(h.checked_at).toLocaleDateString();
      return `${date}: $${h.price} (${h.source})`;
    });

    return sendMessage(msg.chat.id, `📊 *Price History*\n\n${lines.join('\n')}`);
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

// ============================================================================
// UPDATE COMMAND
// ============================================================================

bot.onText(commandRegex('update'), async (msg) => {
  sendMessage(msg.chat.id, '🔄 Triggering manual price update...');

  try {
    const PricePoller = require('../schedulers/pricePoller');
    const poller = new PricePoller(bot);
    await poller.runPoll();

    return sendMessage(msg.chat.id, '✅ Price update completed! Use /prices to see latest prices.');
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Update failed: ${error.message}`);
  }
});

// ============================================================================
// DEALS COMMAND - Check for deals matching watchlist
// ============================================================================

bot.onText(commandRegex('deals'), async (msg) => {
  sendMessage(msg.chat.id, '🔍 Searching for deals...');

  try {
    const DealAlertService = require('../services/alerts/DealAlertService');
    const supabase = require('../db/supabase');
    
    if (!supabase.isAvailable()) {
      return sendMessage(msg.chat.id, '❌ Deal alerts require Supabase database.');
    }

    const alertService = new DealAlertService(supabase.client, bot);
    const deals = await alertService.findWatchDeals();

    if (deals.length === 0) {
      return sendMessage(msg.chat.id, '📭 No deals found matching your watchlist right now.\n\nMake sure you have items with target prices set!');
    }

    // Send top 5 deals
    const topDeals = deals.slice(0, 5);
    await sendMessage(msg.chat.id, `🔥 Found ${deals.length} deals! Showing top ${topDeals.length}:`);

    for (const deal of topDeals) {
      const message = alertService.formatDealMessage(deal);
      await bot.sendMessage(msg.chat.id, message, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: false 
      });
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await alertService.recordAlert(topDeals[0].listing.id); // Record we showed these

  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error checking deals: ${error.message}`);
  }
});

// ============================================================================
// DEALSTATUS COMMAND - Check deal alert scheduler status
// ============================================================================

bot.onText(commandRegex('dealstatus'), async (msg) => {
  try {
    const { getScheduler } = require('../schedulers/dealAlertScheduler');
    const scheduler = getScheduler();

    if (!scheduler) {
      return sendMessage(msg.chat.id, '⚠️ Deal alert scheduler not initialized');
    }

    const status = scheduler.getStatus();
    const statusText = `
🔔 *Deal Alert Status*

Status: ${status.isRunning ? '✅ Running' : '⏸️ Stopped'}
Last run: ${status.lastRun || 'Never'}

📊 *Stats:*
• Total runs: ${status.stats.totalRuns}
• Deals found: ${status.stats.totalDealsFound}
• Alerts sent: ${status.stats.totalAlertsSent}
    `.trim();

    return sendMessage(msg.chat.id, statusText);
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

console.log('Telegram bot is running...');

// ============================================================================
// CHANNEL POSTING FUNCTIONS - For automated deal alerts
// ============================================================================

/**
 * Post a hot deal to the public Telegram channel
 * Called by scrapers when deal_score >= 8.5
 */
async function postDealToChannel(listing) {
  if (!channelId) {
    console.warn('⚠️ TELEGRAM_CHANNEL_ID not configured, skipping channel post');
    return null;
  }

  try {
    const {
      title,
      brand,
      model,
      price,
      original_price,
      deal_score,
      url,
      source,
      category,
      image_url
    } = listing;

    // Calculate savings
    const savings = original_price ? original_price - price : null;
    const savingsPercent = original_price ? Math.round(((original_price - price) / original_price) * 100) : null;

    // Format message
    const scoreEmoji = deal_score >= 9.5 ? '🔥🔥🔥' : deal_score >= 9.0 ? '🔥🔥' : '🔥';
    const categoryEmoji = category === 'watches' ? '🕐' : category === 'cars' ? '🚗' : category === 'sneakers' ? '👟' : '🏆';

    let message = `${scoreEmoji} *HOT DEAL ALERT* ${scoreEmoji}\n\n`;
    message += `${categoryEmoji} ${brand || ''} ${model || title || 'Item'}\n\n`;
    message += `💰 *Price:* $${price.toLocaleString()}`;

    if (savings && savingsPercent) {
      message += ` (${savingsPercent}% off)`;
      message += `\n💸 *You Save:* $${savings.toLocaleString()}`;
    }

    message += `\n📊 *Deal Score:* ${deal_score}/10`;
    message += `\n🏪 *Source:* ${source}`;
    
    // Convert URL to affiliate link for monetization
    const affiliateUrl = convertToAffiliateLink(url) || url;
    message += `\n\n🔗 [View Deal](${affiliateUrl})`;

    // Send with image if available
    if (image_url) {
      await bot.sendPhoto(channelId, image_url, {
        caption: message,
        parse_mode: 'Markdown'
      });
    } else {
      await bot.sendMessage(channelId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });
    }

    // Log to database
    await supabase
      .from('telegram_posts')
      .insert({
        listing_id: listing.id,
        channel_id: channelId,
        message_text: message,
        deal_score,
        posted_at: new Date().toISOString()
      });

    console.log(`✅ Posted deal to channel: ${brand} ${model} ($${price})`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to post to channel:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send personalized alert to a specific user
 * Called when a deal matches user preferences
 */
async function sendPersonalizedAlert(userId, listing) {
  try {
    // Get user's Telegram info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('telegram_chat_id, telegram_notifications, telegram_preferences, tier, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.warn(`User ${userId} not found or has no Telegram linked`);
      return null;
    }

    if (!user.telegram_chat_id || !user.telegram_notifications) {
      return null; // User hasn't connected Telegram or disabled notifications
    }

    // Check rate limiting for free users (3 alerts/day)
    if (user.tier === 'free' || !user.tier) {
      const { data: todayAlerts } = await supabase
        .from('telegram_alerts')
        .select('id')
        .eq('user_id', userId)
        .gte('sent_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .eq('alert_type', 'deal_alert');

      if (todayAlerts && todayAlerts.length >= 3) {
        console.log(`⏭️ Rate limit reached for free user ${user.email}`);
        return null; // Rate limit exceeded
      }
    }

    // Format message
    const {
      title,
      brand,
      model,
      price,
      original_price,
      deal_score,
      url,
      category
    } = listing;

    const categoryEmoji = category === 'watches' ? '🕐' : category === 'cars' ? '🚗' : category === 'sneakers' ? '👟' : '🏆';
    const savings = original_price ? original_price - price : null;

    let message = `🎯 *Personalized Deal Alert*\n\n`;
    message += `${categoryEmoji} ${brand || ''} ${model || title}\n\n`;
    message += `💰 Price: $${price.toLocaleString()}`;

    if (savings) {
      message += ` (save $${savings.toLocaleString()})`;
    }

    message += `\n📊 Score: ${deal_score}/10`;
    
    // Convert URL to affiliate link for monetization
    const affiliateUrl = convertToAffiliateLink(url) || url;
    message += `\n\n🔗 [View Deal](${affiliateUrl})`;

    // Send message
    await bot.sendMessage(user.telegram_chat_id, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });

    // Log alert
    await supabase
      .from('telegram_alerts')
      .insert({
        user_id: userId,
        chat_id: user.telegram_chat_id,
        listing_id: listing.id,
        alert_type: 'deal_alert',
        message: message,
        sent_at: new Date().toISOString()
      });

    console.log(`✅ Sent personalized alert to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send personalized alert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Find users who should receive alerts for a listing
 * Based on telegram_preferences (categories, min_score, max_price)
 */
async function findUsersForAlert(listing) {
  try {
    const { category, deal_score, price } = listing;

    // Query users who:
    // 1. Have Telegram connected
    // 2. Have notifications enabled
    // 3. Have this category in their preferences
    // 4. Deal score >= their min_score preference
    // 5. Price <= their max_price preference (if set)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, telegram_preferences, tier')
      .not('telegram_chat_id', 'is', null)
      .eq('telegram_notifications', true);

    if (error) throw error;

    const matchedUsers = users.filter(user => {
      const prefs = user.telegram_preferences || {
        categories: ['watches', 'cars', 'sneakers', 'sports'],
        min_score: 8.0,
        max_price: null
      };

      // Check category
      if (!prefs.categories.includes(category)) return false;

      // Check score
      if (deal_score < (prefs.min_score || 8.0)) return false;

      // Check price
      if (prefs.max_price && price > prefs.max_price) return false;

      return true;
    });

    return matchedUsers;
  } catch (error) {
    console.error('Error finding users for alert:', error);
    return [];
  }
}

// ============================================================================
// CHANNEL POSTER COMMANDS (Admin)
// ============================================================================

bot.onText(commandRegex('postchannel'), async (msg) => {
  // Only allow admin to trigger
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChatId && msg.chat.id.toString() !== adminChatId) {
    return sendMessage(msg.chat.id, '⛔ Admin only command');
  }

  sendMessage(msg.chat.id, '📢 Triggering channel post...');

  try {
    const { getScheduler } = require('../schedulers/channelPosterScheduler');
    const scheduler = getScheduler();

    if (!scheduler) {
      return sendMessage(msg.chat.id, '⚠️ Channel poster not initialized');
    }

    const result = await scheduler.triggerPost();
    
    if (result.posted > 0) {
      return sendMessage(msg.chat.id, `✅ Posted ${result.posted} deals to @TheHubDeals`);
    } else {
      return sendMessage(msg.chat.id, `📭 No new deals to post (${result.reason || 'unknown'})`);
    }
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

bot.onText(commandRegex('channelstatus'), async (msg) => {
  try {
    const { getScheduler } = require('../schedulers/channelPosterScheduler');
    const scheduler = getScheduler();

    if (!scheduler) {
      return sendMessage(msg.chat.id, '⚠️ Channel poster not initialized');
    }

    const status = scheduler.getStatus();
    const statusText = `
📢 *Channel Poster Status*

Channel: ${status.channel}
Status: ${status.isRunning ? '✅ Running' : '⏸️ Stopped'}
Last run: ${status.stats.lastRun || 'Never'}

📊 *Stats:*
• Total runs: ${status.stats.totalRuns}
• Total posted: ${status.stats.totalPosted}
    `.trim();

    return sendMessage(msg.chat.id, statusText);
  } catch (error) {
    return sendMessage(msg.chat.id, `❌ Error: ${error.message}`);
  }
});

// ============================================================================
// NEWSLETTER SUBSCRIPTION (Telegram → Newsletter Funnel)
// ============================================================================

const pendingSubscriptions = new Map(); // chatId -> { state, email }

bot.onText(commandRegex('subscribe'), async (msg) => {
  const chatId = msg.chat.id;
  
  pendingSubscriptions.set(chatId, { state: 'awaiting_email' });
  
  const message = `
📧 *Subscribe to The Hub Newsletter*

Get a weekly digest of the best deals — watches, sneakers, cars & sports collectibles.

*Reply with your email address* to subscribe.

(Type /cancel to abort)
  `.trim();
  
  return bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

bot.onText(commandRegex('cancel'), async (msg) => {
  const chatId = msg.chat.id;
  
  if (pendingSubscriptions.has(chatId)) {
    pendingSubscriptions.delete(chatId);
    return sendMessage(chatId, '❌ Subscription cancelled.');
  }
});

// Handle email input for subscription flow
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  
  // Skip if it's a command
  if (!text || text.startsWith('/')) return;
  
  // Check if we're waiting for an email from this chat
  const pending = pendingSubscriptions.get(chatId);
  if (!pending || pending.state !== 'awaiting_email') return;
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(text)) {
    return bot.sendMessage(chatId, '⚠️ That doesn\'t look like a valid email. Please try again or /cancel.');
  }
  
  // Try to subscribe
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: text,
        source: 'telegram-bot',
        categories: ['watches', 'sneakers', 'cars', 'sports'],
        frequency: 'weekly'
      })
    });
    
    const result = await response.json();
    
    if (response.ok || result.message?.includes('already subscribed')) {
      pendingSubscriptions.delete(chatId);
      
      const successMsg = `
✅ *You're in!*

Email: ${text}

You'll receive our weekly digest with the top deals.

💡 *Pro tip:* Check your inbox for a confirmation email to verify your subscription.

Keep getting instant alerts here on Telegram too! 🔔
      `.trim();
      
      return bot.sendMessage(chatId, successMsg, { parse_mode: 'Markdown' });
    } else {
      throw new Error(result.error || 'Subscription failed');
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return bot.sendMessage(chatId, `❌ Error: ${error.message}. Please try again or visit the-hub-psi.vercel.app to subscribe.`);
  }
});

// ============================================================================
// HELP COMMAND - Show all available commands
// ============================================================================

bot.onText(commandRegex('help'), async (msg) => {
  const helpText = `
🤖 *The Hub Bot Commands*

*Tracking:*
/watches - List tracked watches
/addwatch <model> - Add a watch
/sneakers - List tracked sneakers  
/addsneaker <model> - Add a sneaker
/cars - List tracked cars
/addcar <make model> - Add a car

*Deals:*
/deals - Get today's top deals
/hotdeals - Show highest scored deals

*Newsletter:*
/subscribe - Sign up for weekly email digest

*Account:*
/link <email> - Link your Hub account
/settings - View your alert preferences
/help - Show this message

📢 Join @thehubdeals for instant deal alerts!
  `.trim();
  
  return bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
});

// Export bot and functions
module.exports = {
  bot,
  postDealToChannel,
  sendPersonalizedAlert,
  findUsersForAlert
};
