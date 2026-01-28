require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const WatchTracker = require('../trackers/watches');
const CarTracker = require('../trackers/cars');
const SneakerTracker = require('../trackers/sneakers');
const SportsTracker = require('../trackers/sports');
const AiTracker = require('../trackers/ai');

const token = process.env.TELEGRAM_BOT_TOKEN;

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
// HELP COMMAND
// ============================================================================

bot.onText(commandRegex('help'), async (msg) => {
  const helpText = `📋 *The Hub - Command Reference*

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

*Examples*
\`/addwatch Rolex Submariner\`
\`/settarget watch rolex-submariner 8000\`
\`/history watch rolex-submariner\`
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

// Export bot for use in other modules
module.exports = bot;
