#!/usr/bin/env node
/**
 * Amazon Deals Scraper for The Hub
 * 
 * Scrapes Amazon for watch and sneaker deals, stores to Supabase
 * Run: node scripts/scrape-amazon.js [--mock] [--category=watches|sneakers] [--limit=20]
 * 
 * Options:
 *   --mock         Use mock data (for testing without hitting Amazon)
 *   --category     Filter to specific category (watches, sneakers, or both)
 *   --limit        Max items per category (default: 20)
 *   --dry-run      Don't save to database, just show results
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const AmazonScraper = require('../src/services/scraping/sources/AmazonScraper');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Parse command line args
const args = process.argv.slice(2);
const useMock = args.includes('--mock');
const dryRun = args.includes('--dry-run');

const categoryArg = args.find(a => a.startsWith('--category='));
const categories = categoryArg 
  ? [categoryArg.split('=')[1]]
  : ['watches', 'sneakers'];

const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 20;

/**
 * Store listings to Supabase (watch_listings table)
 */
async function storeListings(listings) {
  if (!listings.length) return { inserted: 0, errors: [] };
  
  const truncate = (str, len) => str ? String(str).substring(0, len) : str;
  
  // Map to watch_listings schema (works for both watches and sneakers)
  const records = listings.map(l => ({
    source: 'amazon',
    title: truncate(l.title, 500),
    price: l.price,
    currency: 'USD',
    brand: truncate(l.brand, 100),
    model: truncate(l.title.substring(0, 100), 100),
    condition: 'new',
    location: l.prime ? 'Amazon Prime' : 'Amazon',
    url: l.affiliate_url || l.url,
    images: l.images,
    deal_score: l.deal_score,
    timestamp: l.timestamp,
    // Store ASIN in seller field for de-duplication
    seller: `amazon:${l.asin}`
  }));

  // Upsert using seller (contains ASIN) for matching
  let inserted = 0;
  const errors = [];
  
  for (const record of records) {
    // Check if exists
    const { data: existing } = await supabase
      .from('watch_listings')
      .select('id')
      .eq('seller', record.seller)
      .single();
    
    if (existing) {
      // Update
      const { error } = await supabase
        .from('watch_listings')
        .update(record)
        .eq('seller', record.seller);
      if (error) errors.push(error);
      else inserted++;
    } else {
      // Insert
      const { error } = await supabase
        .from('watch_listings')
        .insert(record);
      if (error) errors.push(error);
      else inserted++;
    }
  }

  if (errors.length) {
    console.error('Some errors occurred:', errors.length);
  }

  return { inserted, errors };
}

/**
 * Post top deals to Telegram (optional)
 */
async function postToTelegram(deals, count = 3) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  
  if (!botToken || !channelId) {
    console.log('Telegram not configured, skipping post');
    return;
  }

  // Sort by deal score and get top N
  const topDeals = deals
    .sort((a, b) => b.deal_score - a.deal_score)
    .slice(0, count);

  for (const deal of topDeals) {
    const emoji = deal.category === 'watches' ? '⌚' : '👟';
    const primeIcon = deal.prime ? '✓ Prime' : '';
    
    const message = `
${emoji} *Amazon Deal*

*${deal.title}*

💰 *$${deal.price}* ~~$${deal.original_price}~~ (-${deal.discount_percent}%)
⭐ ${deal.rating?.toFixed(1) || 'N/A'} (${deal.review_count || 0} reviews)
${primeIcon}

🔗 [View Deal](${deal.affiliate_url || deal.url})
    `.trim();

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      });
      console.log(`✅ Posted: ${deal.brand} deal`);
      
      // Rate limit
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error('Telegram error:', error.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🛒 Amazon Deals Scraper');
  console.log(`Mode: ${useMock ? 'MOCK' : 'LIVE'}`);
  console.log(`Categories: ${categories.join(', ')}`);
  console.log(`Limit: ${limit} per category`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');

  // Check affiliate tag
  const affiliateTag = process.env.AMAZON_AFFILIATE_TAG;
  if (affiliateTag) {
    console.log(`✅ Affiliate tag: ${affiliateTag}`);
  } else {
    console.log('⚠️  No AMAZON_AFFILIATE_TAG set - links won\'t have affiliate tracking');
  }
  console.log('');

  // Initialize scraper
  const scraper = new AmazonScraper();

  // Scrape deals
  let listings;
  if (useMock) {
    console.log('📦 Generating mock data...');
    listings = await scraper.scrapeMock({ categories, limit });
  } else {
    console.log('🔍 Scraping Amazon...');
    listings = await scraper.scrape({ categories, limit });
  }

  console.log(`\n📊 Found ${listings.length} deals`);

  if (!listings.length) {
    console.log('No deals found. Try --mock for testing.');
    return;
  }

  // Display sample
  console.log('\n📋 Top deals:');
  const sorted = listings.sort((a, b) => b.deal_score - a.deal_score);
  sorted.slice(0, 5).forEach((d, i) => {
    const emoji = d.category === 'watches' ? '⌚' : '👟';
    console.log(`   ${i + 1}. ${emoji} ${d.brand} - $${d.price} (${d.discount_percent}% off) [Score: ${d.deal_score}]`);
  });

  // Store to database
  if (!dryRun) {
    console.log('\n💾 Saving to database...');
    const result = await storeListings(listings);
    console.log(`✅ Stored: ${result.inserted} deals`);
    
    if (result.errors.length) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
    }

    // Optionally post to Telegram
    if (args.includes('--post')) {
      console.log('\n📱 Posting to Telegram...');
      await postToTelegram(sorted, 2);
    }
  } else {
    console.log('\n🔸 Dry run - skipping database save');
  }

  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
