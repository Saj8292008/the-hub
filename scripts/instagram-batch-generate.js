#!/usr/bin/env node
/**
 * Instagram Batch Content Generator
 * Pulls top deals from Supabase and generates Instagram-ready content
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generateDealCard } = require('./generate-deal-card');
const { generateCaption } = require('./instagram-captions');
const fs = require('fs');
const path = require('path');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'instagram-queue');

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Generate slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Calculate deal score for a listing
 * Score = price attractiveness + recency + source reliability
 */
function calculateDealScore(listing) {
  let score = 10; // Base score
  
  // Price attractiveness (if we have original/retail price context)
  if (listing.price < 5000) score += 3;
  else if (listing.price < 10000) score += 2;
  else score += 1;
  
  // Recency bonus (newer = better)
  const hoursSincePosted = (Date.now() - new Date(listing.timestamp).getTime()) / (1000 * 60 * 60);
  if (hoursSincePosted < 24) score += 4;
  else if (hoursSincePosted < 48) score += 2;
  else if (hoursSincePosted < 72) score += 1;
  
  // Source reliability
  const premiumSources = ['chrono24', 'watchuseek', 'reddit'];
  if (premiumSources.includes(listing.source?.toLowerCase())) {
    score += 3;
  }
  
  return Math.min(score, 20); // Cap at 20
}

/**
 * Normalize listing data for card generator
 */
function normalizeListing(listing) {
  const score = calculateDealScore(listing);
  
  // For watches, try to estimate original price (rough heuristic)
  let originalPrice = null;
  if (listing.price && listing.brand) {
    // Assume 30-40% discount for grey market
    originalPrice = Math.round(listing.price * 1.4);
  }
  
  return {
    title: listing.title || 'Luxury Watch Deal',
    price: listing.price,
    original_price: originalPrice,
    score: score,
    category: 'watches', // Default for watch_listings
    source: listing.source || 'Unknown',
    brand: listing.brand,
    model: listing.model,
    condition: listing.condition,
    location: listing.location,
    url: listing.url
  };
}

/**
 * Fetch top deals from Supabase
 * Queries watch_listings, sneaker_listings, car_listings
 */
async function fetchTopDeals(limit = 5) {
  try {
    console.log('🔍 Fetching top deals from Supabase...');
    
    // Fetch recent watch listings
    const { data: watches, error: watchError } = await supabase
      .from('watch_listings')
      .select('*')
      .not('price', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(limit * 2); // Get more to filter down
    
    if (watchError) {
      throw watchError;
    }
    
    if (!watches || watches.length === 0) {
      console.log('⚠️  No watch listings found in database');
      return [];
    }
    
    // Normalize and score listings
    const scoredDeals = watches
      .map(normalizeListing)
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, limit); // Take top N
    
    console.log(`✅ Found ${scoredDeals.length} top deals`);
    scoredDeals.forEach((deal, i) => {
      console.log(`   ${i + 1}. ${deal.title.substring(0, 50)}... (Score: ${deal.score}/20)`);
    });
    
    return scoredDeals;
    
  } catch (error) {
    console.error('❌ Error fetching deals:', error.message);
    throw error;
  }
}

/**
 * Process a single deal: generate card + caption
 */
async function processDeal(deal, index) {
  try {
    const dateStr = getDateString();
    const slug = generateSlug(deal.title);
    const baseFilename = `${dateStr}-${slug}`;
    
    // File paths
    const imagePath = path.join(OUTPUT_DIR, `${baseFilename}.png`);
    const captionPath = path.join(OUTPUT_DIR, `${baseFilename}.txt`);
    
    console.log(`\n📦 Processing deal ${index + 1}: ${deal.title}`);
    console.log(`   Score: ${deal.score}/20 | Category: ${deal.category}`);
    
    // Generate deal card image
    console.log(`   🎨 Generating card...`);
    await generateDealCard(deal, imagePath);
    
    // Generate caption
    console.log(`   ✍️  Generating caption...`);
    const caption = generateCaption(deal);
    fs.writeFileSync(captionPath, caption, 'utf8');
    
    console.log(`   ✅ Saved:`);
    console.log(`      Image: ${path.basename(imagePath)}`);
    console.log(`      Caption: ${path.basename(captionPath)}`);
    
    return {
      deal,
      imagePath,
      captionPath,
      success: true
    };
    
  } catch (error) {
    console.error(`   ❌ Error processing deal: ${error.message}`);
    return {
      deal,
      success: false,
      error: error.message
    };
  }
}

/**
 * Main batch generation function
 */
async function generateBatch(limit = 5) {
  console.log('🚀 Instagram Batch Content Generator\n');
  console.log(`📅 Date: ${getDateString()}`);
  console.log(`🎯 Target: ${limit} posts\n`);
  console.log('═'.repeat(60));
  
  // Ensure output directory exists
  ensureOutputDir();
  
  // Fetch top deals
  const deals = await fetchTopDeals(limit);
  
  if (deals.length === 0) {
    console.log('\n⚠️  No deals to process. Exiting.');
    return;
  }
  
  console.log('═'.repeat(60));
  
  // Process each deal
  const results = [];
  for (let i = 0; i < deals.length; i++) {
    const result = await processDeal(deals[i], i);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 BATCH SUMMARY\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully generated: ${successful}/${deals.length}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }
  
  console.log(`\n📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review generated images and captions`);
  console.log(`   2. Make any manual edits needed`);
  console.log(`   3. Schedule posts using Later.com or Creator Studio`);
  console.log(`   4. Post at optimal times: 10am, 2pm, 7pm CT`);
  
  console.log('\n✨ Done!\n');
  
  return results;
}

/**
 * CLI Usage
 */
async function main() {
  const limit = parseInt(process.argv[2]) || 5;
  
  try {
    await generateBatch(limit);
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { generateBatch, fetchTopDeals };

// Run if called directly
if (require.main === module) {
  main();
}
