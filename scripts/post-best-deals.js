/**
 * Post Best Deals to Telegram
 * Finds top deals from the database and posts them to the channel
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

async function postToTelegram(message) {
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

function formatDeal(listing) {
  const emoji = listing.source === 'reddit' ? '🔴' : 
                listing.source === 'chrono24' ? '⌚' :
                listing.source === 'watchuseek' ? '📰' : '📦';
  
  const timeAgo = getTimeAgo(new Date(listing.created_at));
  
  let message = `${emoji} <b>DEAL FOUND</b>\n\n`;
  message += `<b>${listing.title}</b>\n\n`;
  message += `💰 <b>${formatPrice(listing.price)}</b>\n`;
  message += `📍 Source: ${listing.source}\n`;
  message += `⏰ Posted: ${timeAgo}\n`;
  
  if (listing.deal_score) {
    const scoreEmoji = listing.deal_score >= 8 ? '🔥' : 
                       listing.deal_score >= 6 ? '👍' : '📊';
    message += `${scoreEmoji} Score: ${listing.deal_score}/10\n`;
  }
  
  if (listing.url) {
    message += `\n🔗 <a href="${listing.url}">View Listing</a>`;
  }
  
  return message;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function getPostedIds() {
  try {
    const fs = require('fs');
    const file = '/Users/sydneyjackson/the-hub/logs/posted-deals.json';
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return { posted: [] };
  }
}

function savePostedIds(data) {
  const fs = require('fs');
  const file = '/Users/sydneyjackson/the-hub/logs/posted-deals.json';
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function main() {
  const limit = parseInt(process.argv[2]) || 3;
  const minPrice = parseInt(process.argv[3]) || 100;
  const maxPrice = parseInt(process.argv[4]) || 10000;
  
  console.log(`Finding top ${limit} deals between ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}...`);
  
  // Get posted IDs to avoid duplicates
  const { posted } = await getPostedIds();
  
  // Get recent deals
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  
  const { data: listings, error } = await supabase
    .from('watch_listings')
    .select('*')
    .gte('created_at', sixHoursAgo)
    .gte('price', minPrice)
    .lte('price', maxPrice)
    .not('price', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching listings:', error);
    return;
  }

  // Filter out already posted
  const newDeals = listings.filter(l => !posted.includes(l.id));
  
  if (newDeals.length === 0) {
    console.log('No new deals to post');
    return;
  }

  console.log(`Found ${newDeals.length} new deals`);

  // Post top deals
  const toPost = newDeals.slice(0, limit);
  
  for (const deal of toPost) {
    const message = formatDeal(deal);
    console.log('---');
    console.log(`Posting: ${deal.title.substring(0, 50)}...`);
    
    try {
      await postToTelegram(message);
      posted.push(deal.id);
      console.log('✅ Posted!');
      
      // Rate limit
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error('❌ Failed:', err.message);
    }
  }

  // Save posted IDs (keep last 500)
  savePostedIds({ posted: posted.slice(-500) });
  
  console.log('---');
  console.log(`Done! Posted ${toPost.length} deals.`);
}

main().catch(console.error);
