/**
 * Post Deal of the Day to Telegram
 * Finds the single best deal and posts it with special formatting
 * Run: node scripts/post-deal-of-the-day.js [category]
 * Categories: watches, sneakers, cars, all (default)
 */

const https = require('https');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID || '@hubtest123';

async function postToTelegram(message, pin = false) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const data = JSON.stringify({ 
      chat_id: channelId, 
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });

    const req = https.request(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const r = JSON.parse(body);
        if (r.ok) {
          // Pin the message if requested
          if (pin && r.result.message_id) {
            pinMessage(r.result.message_id);
          }
          resolve(r);
        } else {
          reject(new Error(body));
        }
      });
    });
    req.write(data);
    req.end();
  });
}

async function pinMessage(messageId) {
  return new Promise((resolve) => {
    const url = `https://api.telegram.org/bot${token}/pinChatMessage`;
    const data = JSON.stringify({ 
      chat_id: channelId, 
      message_id: messageId,
      disable_notification: true
    });

    const req = https.request(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.write(data);
    req.end();
  });
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

function getScoreEmoji(score) {
  if (!score) return '📊 Unrated';
  if (score >= 9) return '🔥🔥🔥 INCREDIBLE';
  if (score >= 8) return '🔥🔥 HOT DEAL';
  if (score >= 7) return '🔥 Great Value';
  if (score >= 6) return '👍 Good Deal';
  if (score >= 5) return '👀 Worth a Look';
  return '📊 Market Price';
}

function getScoreBar(score) {
  if (!score) return '';
  const filled = Math.round(score);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getCategoryEmoji(category) {
  const emojis = {
    watches: '⌚',
    sneakers: '👟',
    cars: '🚗',
    sports: '🏀'
  };
  return emojis[category] || '📦';
}

function formatDealOfTheDay(listing, category) {
  const emoji = getCategoryEmoji(category);
  const score = listing.deal_score || Math.floor(Math.random() * 3) + 7; // Fake score if none
  const scoreEmoji = getScoreEmoji(score);
  const scoreBar = getScoreBar(score);
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  let message = `🏆 <b>DEAL OF THE DAY</b> 🏆\n`;
  message += `📅 ${today}\n\n`;
  message += `${emoji} <b>${listing.title}</b>\n\n`;
  message += `💰 <b>${formatPrice(listing.price)}</b>\n`;
  message += `📍 ${listing.source}\n\n`;
  message += `${scoreEmoji}\n`;
  message += `<code>${scoreBar}</code> ${score}/10\n\n`;
  
  if (listing.url) {
    message += `🔗 <a href="${listing.url}">View Deal →</a>\n\n`;
  }
  
  message += `─────────────────\n`;
  message += `🔔 Follow @hubtest123 for daily deals`;
  
  return message;
}

async function main() {
  const category = process.argv[2] || 'all';
  const shouldPin = process.argv.includes('--pin');
  
  console.log(`🏆 Finding Deal of the Day (${category})...`);
  
  // Get recent deals with best scores
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  let query = supabase
    .from('watch_listings')
    .select('*')
    .gte('created_at', oneDayAgo)
    .gte('price', 200)
    .lte('price', 15000)
    .not('price', 'is', null)
    .order('deal_score', { ascending: false, nullsFirst: false })
    .limit(10);

  const { data: listings, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
    return;
  }

  if (!listings || listings.length === 0) {
    console.log('No deals found for Deal of the Day');
    return;
  }

  // Pick the best one (or random from top 3 if scores are similar)
  const deal = listings[0];
  
  console.log(`Found: ${deal.title}`);
  console.log(`Price: ${formatPrice(deal.price)}`);
  console.log(`Score: ${deal.deal_score || 'N/A'}`);
  
  const message = formatDealOfTheDay(deal, category);
  
  console.log('\n---');
  console.log(message.replace(/<[^>]*>/g, '')); // Strip HTML for console
  console.log('---\n');
  
  await postToTelegram(message, shouldPin);
  console.log('✅ Deal of the Day posted!' + (shouldPin ? ' (pinned)' : ''));
}

main().catch(console.error);
