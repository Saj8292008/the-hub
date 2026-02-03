#!/usr/bin/env node
/**
 * Post Amazon Deals to Telegram
 * 
 * Fetches best Amazon deals from DB and posts to Telegram channel
 * Run: node scripts/post-amazon-deals.js [count]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

/**
 * Fetch top Amazon deals
 */
async function getTopDeals(limit = 3) {
  const { data, error } = await supabase
    .from('watch_listings')
    .select('*')
    .eq('source', 'amazon')
    .order('deal_score', { ascending: false })
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('DB error:', error);
    return [];
  }

  return data;
}

/**
 * Format deal for Telegram
 */
function formatDeal(deal) {
  // Detect category from title/brand
  const sneakerBrands = ['Nike', 'Adidas', 'Jordan', 'New Balance', 'Puma', 'Reebok', 'Converse', 'Vans'];
  const isSneaker = sneakerBrands.some(b => 
    deal.brand?.toLowerCase().includes(b.toLowerCase()) ||
    deal.title?.toLowerCase().includes(b.toLowerCase())
  );
  
  const emoji = isSneaker ? '👟' : '⌚';
  const primeIcon = deal.location?.includes('Prime') ? ' ✓ Prime' : '';
  
  // Extract discount if available from title
  const discountMatch = deal.title?.match(/(\d+)%\s*off/i);
  const discount = discountMatch ? ` (-${discountMatch[1]}%)` : '';

  return `
${emoji} *Amazon Deal*

*${deal.brand || 'Deal'}*
${deal.title?.substring(0, 150)}${deal.title?.length > 150 ? '...' : ''}

💰 *$${deal.price}*${discount}${primeIcon}
⭐ Score: ${deal.deal_score}/10

🔗 [View on Amazon](${deal.url})
  `.trim();
}

/**
 * Post to Telegram
 */
async function postToTelegram(message, imageUrl = null) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.log('Telegram not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Telegram error:', error.message);
    return false;
  }
}

/**
 * Main
 */
async function main() {
  const count = parseInt(process.argv[2]) || 2;
  
  console.log(`🛒 Posting ${count} Amazon deals to Telegram...\n`);

  const deals = await getTopDeals(count);
  
  if (!deals.length) {
    console.log('No Amazon deals found. Run scrape-amazon.js first.');
    return;
  }

  console.log(`Found ${deals.length} deals\n`);

  for (const deal of deals) {
    const message = formatDeal(deal);
    console.log('---');
    console.log(`Posting: ${deal.brand} - $${deal.price}`);
    
    const success = await postToTelegram(message);
    if (success) {
      console.log('✅ Posted!');
    } else {
      console.log('❌ Failed');
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
