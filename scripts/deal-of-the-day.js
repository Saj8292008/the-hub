#!/usr/bin/env node
/**
 * Deal of the Day Auto-Selector
 * 
 * Queries Supabase for the hottest deal in the last 24h (highest score),
 * formats it as a beautiful social post for Telegram + Instagram,
 * and saves to content/deal-of-day/YYYY-MM-DD.json
 * 
 * Usage:
 *   node scripts/deal-of-the-day.js              # Auto-pick and save
 *   node scripts/deal-of-the-day.js --post       # Pick + post to Telegram
 *   node scripts/deal-of-the-day.js --category watches  # Filter by category
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import Supabase client and Telegram poster
const supabase = require('../src/db/supabase');
const { postToChannel, CHANNEL_ID } = require('./telegram-channel-post');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  lookbackHours: 24,
  minScore: 60, // Minimum deal score to consider
  categories: ['watches', 'sneakers', 'cars'],
  outputDir: path.join(__dirname, '../content/deal-of-day'),
};

// ============================================================================
// MAIN LOGIC
// ============================================================================

/**
 * Query Supabase for the hottest deal in the last 24h
 */
async function findHottestDeal(category = null) {
  if (!supabase.isAvailable()) {
    throw new Error('Supabase not available. Check SUPABASE_URL and SUPABASE_KEY in .env');
  }

  const cutoffTime = new Date(Date.now() - CONFIG.lookbackHours * 60 * 60 * 1000).toISOString();
  
  // Determine which tables to query
  // Handle both singular and plural forms (watches -> watch_listings)
  const categoryMap = {
    'watch': 'watch_listings',
    'watches': 'watch_listings',
    'sneaker': 'sneaker_listings',
    'sneakers': 'sneaker_listings',
    'car': 'car_listings',
    'cars': 'car_listings',
  };
  
  const tables = category 
    ? [categoryMap[category.toLowerCase()] || `${category}_listings`]
    : ['watch_listings', 'sneaker_listings', 'car_listings'];
  
  let bestDeal = null;
  let bestCategory = null;

  for (const table of tables) {
    try {
      const { data, error } = await supabase.client
        .from(table)
        .select('*')
        .gte('timestamp', cutoffTime)
        .gte('deal_score', CONFIG.minScore)
        .order('deal_score', { ascending: false })
        .order('price', { ascending: true }) // Tiebreaker: lower price wins
        .limit(1);

      if (error) {
        console.warn(`⚠️  Error querying ${table}:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        const deal = data[0];
        if (!bestDeal || deal.deal_score > bestDeal.deal_score) {
          bestDeal = deal;
          // Extract category: watch_listings -> watches
          bestCategory = table.replace('_listings', '') + 's';
          if (bestCategory === 'watchs') bestCategory = 'watches';
        }
      }
    } catch (e) {
      console.warn(`⚠️  Failed to query ${table}:`, e.message);
    }
  }

  if (!bestDeal) {
    console.log(`❌ No deals found in the last ${CONFIG.lookbackHours}h with score >= ${CONFIG.minScore}`);
    return null;
  }

  return { deal: bestDeal, category: bestCategory };
}

/**
 * Calculate savings percentage (if market value is known)
 * For now, we estimate market value = price / (deal_score / 100)
 */
function calculateSavings(deal) {
  if (!deal.deal_score || deal.deal_score <= 0) return null;
  
  // Estimate market value based on deal score
  // deal_score of 80 = 20% off, so market = price / 0.8
  const discountFactor = Math.max(0.5, 1 - (deal.deal_score / 100));
  const estimatedMarket = Math.round(deal.price / discountFactor);
  const savings = estimatedMarket - deal.price;
  const savingsPercent = Math.round((savings / estimatedMarket) * 100);

  return {
    marketValue: estimatedMarket,
    savings,
    savingsPercent,
  };
}

/**
 * Format deal as Telegram post (HTML markup)
 */
function formatTelegramPost(deal, category) {
  const savings = calculateSavings(deal);
  const emoji = category === 'watches' ? '⌚' : category === 'sneakers' ? '👟' : '🚗';
  
  let post = `${emoji} <b>DEAL OF THE DAY</b>\n\n`;
  post += `<b>${deal.brand || 'Unknown'} ${deal.model || deal.title}</b>\n\n`;
  
  post += `💰 <b>Price:</b> $${deal.price.toLocaleString()}\n`;
  
  if (savings) {
    post += `📊 <b>Est. Market:</b> $${savings.marketValue.toLocaleString()}\n`;
    post += `🔥 <b>Savings:</b> $${savings.savings.toLocaleString()} (${savings.savingsPercent}% off)\n`;
  }
  
  post += `⭐ <b>Deal Score:</b> ${deal.deal_score}/100\n`;
  post += `📍 <b>Source:</b> ${deal.source}\n`;
  
  if (deal.condition) {
    post += `🏷️ <b>Condition:</b> ${deal.condition}\n`;
  }
  
  post += `\n🔗 <a href="${deal.url}">View Deal</a>\n\n`;
  post += `<i>Found by The Hub Deal Scanner 🎯</i>`;

  return post;
}

/**
 * Format deal as Instagram caption (plain text, emoji-heavy)
 */
function formatInstagramCaption(deal, category) {
  const savings = calculateSavings(deal);
  const emoji = category === 'watches' ? '⌚' : category === 'sneakers' ? '👟' : '🚗';
  
  let caption = `${emoji} DEAL OF THE DAY ${emoji}\n\n`;
  caption += `${deal.brand || 'Unknown'} ${deal.model || deal.title}\n\n`;
  
  caption += `💰 Price: $${deal.price.toLocaleString()}\n`;
  
  if (savings) {
    caption += `📊 Est. Market: $${savings.marketValue.toLocaleString()}\n`;
    caption += `🔥 Save: $${savings.savings.toLocaleString()} (${savings.savingsPercent}% OFF!)\n`;
  }
  
  caption += `⭐ Deal Score: ${deal.deal_score}/100\n`;
  caption += `📍 Source: ${deal.source}\n`;
  
  caption += `\nLink in bio to see more deals like this 🔥\n\n`;
  caption += `#TheHubDeals #${category} #deals #shopping`;

  return caption;
}

/**
 * Save deal to JSON file
 */
function saveDealToFile(dealData) {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `${today}.json`;
  const filepath = path.join(CONFIG.outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(dealData, null, 2));
  console.log(`✅ Saved to: ${filepath}`);
  
  return filepath;
}

/**
 * Post to Telegram channel
 */
async function postDealToTelegram(telegramPost) {
  try {
    console.log('\n📤 Posting to Telegram...');
    const result = await postToChannel(telegramPost, { parseMode: 'HTML', disablePreview: false });
    console.log(`✅ Posted to ${CHANNEL_ID} (message_id: ${result.message_id})`);
    return result;
  } catch (e) {
    console.error('❌ Telegram post failed:', e.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldPost = args.includes('--post');
  const categoryArg = args.find(arg => arg.startsWith('--category='));
  const category = categoryArg ? categoryArg.split('=')[1] : null;

  console.log('🎯 THE HUB — Deal of the Day Selector\n');

  // Step 1: Find the hottest deal
  console.log(`🔍 Searching for hottest deal in last ${CONFIG.lookbackHours}h...`);
  const result = await findHottestDeal(category);

  if (!result) {
    console.log('❌ No qualifying deals found. Try lowering the minScore or expanding the lookback window.');
    process.exit(1);
  }

  const { deal, category: dealCategory } = result;

  console.log(`\n🔥 Found it!`);
  console.log(`   Category: ${dealCategory}`);
  console.log(`   Title: ${deal.title || `${deal.brand} ${deal.model}`}`);
  console.log(`   Price: $${deal.price}`);
  console.log(`   Score: ${deal.deal_score}/100`);
  console.log(`   Source: ${deal.source}`);
  console.log(`   URL: ${deal.url}`);

  // Step 2: Format for social media
  console.log('\n📝 Formatting posts...');
  const telegramPost = formatTelegramPost(deal, dealCategory);
  const instagramCaption = formatInstagramCaption(deal, dealCategory);
  const savings = calculateSavings(deal);

  // Step 3: Save to JSON
  const dealData = {
    date: new Date().toISOString().split('T')[0],
    category: dealCategory,
    deal: {
      id: deal.id,
      title: deal.title || `${deal.brand} ${deal.model}`,
      brand: deal.brand,
      model: deal.model,
      price: deal.price,
      currency: deal.currency || 'USD',
      condition: deal.condition,
      source: deal.source,
      url: deal.url,
      images: deal.images || [],
      dealScore: deal.deal_score,
      timestamp: deal.timestamp,
    },
    savings: savings || null,
    content: {
      telegram: telegramPost,
      instagram: instagramCaption,
    },
    posted: false,
  };

  const filepath = saveDealToFile(dealData);

  // Step 4: Post to Telegram if --post flag is set
  if (shouldPost) {
    const telegramResult = await postDealToTelegram(telegramPost);
    if (telegramResult) {
      dealData.posted = true;
      dealData.telegramMessageId = telegramResult.message_id;
      // Update the file with posted status
      fs.writeFileSync(filepath, JSON.stringify(dealData, null, 2));
    }
  }

  console.log('\n✅ Done!');
  console.log('\nGenerated content:');
  console.log('━'.repeat(60));
  console.log('\n📱 TELEGRAM:\n');
  console.log(telegramPost.replace(/<[^>]+>/g, '')); // Strip HTML for preview
  console.log('\n━'.repeat(60));
  console.log('\n📸 INSTAGRAM:\n');
  console.log(instagramCaption);
  console.log('\n━'.repeat(60));
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  findHottestDeal,
  formatTelegramPost,
  formatInstagramCaption,
  calculateSavings,
  saveDealToFile,
};
