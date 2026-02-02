#!/usr/bin/env node
/**
 * Hot Deal Auto-Poster
 * 
 * Finds deals with score > threshold and posts them to Telegram channel.
 * Run via cron or manually: node scripts/post-hot-deals.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabaseWrapper = require('../src/db/supabase');
const supabase = supabaseWrapper.client;
const dealPoster = require('../src/services/dealPoster');
const logger = require('../src/utils/logger');

const SCORE_THRESHOLD = parseInt(process.env.HOT_DEAL_THRESHOLD) || 8; // Default to 8 (above avg of 7)
const MAX_POSTS_PER_RUN = parseInt(process.env.HOT_DEAL_MAX_POSTS) || 3;
const COOLDOWN_HOURS = parseInt(process.env.HOT_DEAL_COOLDOWN_HOURS) || 168; // 7 days - don't repost
const MAX_LISTING_AGE_HOURS = parseInt(process.env.HOT_DEAL_MAX_AGE_HOURS) || 336; // 14 days - how old to look

// Track posted deals in local file (workaround for DB column)
const POSTED_FILE = path.join(__dirname, '../data/posted-deals.json');

function loadPostedDeals() {
  try {
    if (fs.existsSync(POSTED_FILE)) {
      return JSON.parse(fs.readFileSync(POSTED_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading posted deals:', error);
  }
  return { deals: [], lastCleanup: Date.now() };
}

function savePostedDeals(data) {
  try {
    const dir = path.dirname(POSTED_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(POSTED_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving posted deals:', error);
  }
}

function cleanupOldDeals(posted) {
  const cutoff = Date.now() - (COOLDOWN_HOURS * 60 * 60 * 1000);
  posted.deals = posted.deals.filter(d => d.timestamp > cutoff);
  posted.lastCleanup = Date.now();
  return posted;
}

async function getHotDeals() {
  const posted = cleanupOldDeals(loadPostedDeals());
  const postedIds = new Set(posted.deals.map(d => d.id));
  
  const maxAge = new Date(Date.now() - MAX_LISTING_AGE_HOURS * 60 * 60 * 1000).toISOString();
  
  // Get watch listings with high scores
  const { data: watches, error: watchError } = await supabase
    .from('watch_listings')
    .select('*')
    .gte('deal_score', SCORE_THRESHOLD)
    .gte('created_at', maxAge)
    .order('deal_score', { ascending: false })
    .limit(MAX_POSTS_PER_RUN * 3); // Fetch extra to filter out posted ones

  if (watchError) {
    logger.error('Error fetching watch listings:', watchError);
    return [];
  }

  // Filter out already posted deals
  const unposted = (watches || []).filter(w => !postedIds.has(w.id));

  return unposted.slice(0, MAX_POSTS_PER_RUN).map(w => ({
    id: w.id,
    title: w.title || `${w.brand} ${w.model}`.trim(),
    price: w.price,
    originalPrice: w.original_price || w.market_price,
    score: w.deal_score,
    url: w.url,
    source: w.source || 'Reddit',
    category: 'Watches',
    description: w.condition ? `Condition: ${w.condition}` : null
  }));
}

function markAsPosted(dealId) {
  const posted = loadPostedDeals();
  posted.deals.push({ id: dealId, timestamp: Date.now() });
  savePostedDeals(posted);
}

async function main() {
  console.log('🔥 Hot Deal Auto-Poster');
  console.log(`Looking for deals with score >= ${SCORE_THRESHOLD}...\n`);

  const deals = await getHotDeals();

  if (deals.length === 0) {
    console.log('No hot deals found this run.');
    return;
  }

  console.log(`Found ${deals.length} hot deal(s):\n`);

  for (const deal of deals) {
    console.log(`📌 ${deal.title}`);
    console.log(`   Score: ${deal.score} | Price: $${deal.price}`);
    console.log(`   Source: ${deal.source}`);
    
    try {
      const result = await dealPoster.postDeal(deal, { discord: false }); // Telegram only for now
      
      if (result.telegram.sent) {
        console.log('   ✅ Posted to Telegram!\n');
        await markAsPosted(deal.id);
      } else {
        console.log(`   ❌ Failed: ${result.telegram.error}\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
