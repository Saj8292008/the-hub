/**
 * Post Weekend Roundup to Telegram
 * Summarizes the best deals from the past week
 * Run: node scripts/post-weekend-roundup.js
 */

const https = require('https');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID || '@hubtest123';

async function postToTelegram(message) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const data = JSON.stringify({ 
      chat_id: channelId, 
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    const req = https.request(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const r = JSON.parse(body);
        if (r.ok) resolve(r);
        else reject(new Error(body));
      });
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
  if (!score) return '';
  if (score >= 9) return '🔥🔥🔥';
  if (score >= 8) return '🔥🔥';
  if (score >= 7) return '🔥';
  if (score >= 6) return '👍';
  return '📊';
}

function truncateTitle(title, maxLen = 40) {
  if (title.length <= maxLen) return title;
  return title.substring(0, maxLen - 3) + '...';
}

async function main() {
  console.log('📊 Generating Weekend Roundup...');
  
  // Get deals from last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: listings, error } = await supabase
    .from('watch_listings')
    .select('*')
    .gte('created_at', oneWeekAgo)
    .gte('price', 100)
    .lte('price', 20000)
    .not('price', 'is', null)
    .order('deal_score', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error('Error fetching listings:', error);
    return;
  }

  if (!listings || listings.length === 0) {
    console.log('No deals found for roundup');
    return;
  }

  // Get top 5 deals
  const topDeals = listings.slice(0, 5);
  
  // Calculate stats
  const totalDeals = listings.length;
  const avgPrice = Math.round(listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length);
  const sources = [...new Set(listings.map(l => l.source))];

  // Build message
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });

  let message = `📊 <b>WEEKLY ROUNDUP</b>\n`;
  message += `${weekAgo} - ${today}\n\n`;
  
  message += `<b>🏆 Top 5 Deals This Week:</b>\n\n`;
  
  topDeals.forEach((deal, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    const score = deal.deal_score ? ` ${getScoreEmoji(deal.deal_score)}` : '';
    message += `${medal} ${truncateTitle(deal.title)}\n`;
    message += `   └ ${formatPrice(deal.price)}${score}\n\n`;
  });
  
  message += `─────────────────\n\n`;
  message += `<b>📈 Week Stats:</b>\n`;
  message += `• ${totalDeals} deals tracked\n`;
  message += `• Avg price: ${formatPrice(avgPrice)}\n`;
  message += `• Sources: ${sources.join(', ')}\n\n`;
  
  message += `─────────────────\n`;
  message += `🔔 Follow @hubtest123 for daily alerts`;

  console.log('\n' + message.replace(/<[^>]*>/g, ''));
  console.log('\n---');
  
  await postToTelegram(message);
  console.log('✅ Weekend Roundup posted!');
}

main().catch(console.error);
