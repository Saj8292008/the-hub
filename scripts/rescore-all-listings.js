#!/usr/bin/env node
/**
 * Rescore ALL watch listings using deal-scorer v3
 * Also fixes price parsing (truncated prices from DB)
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const dealScorer = require('../src/services/deal-scorer');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fixPriceAndScore() {
  console.log('🔧 Fetching all listings...');
  
  // Get all listings
  const { data: listings, error } = await sb
    .from('watch_listings')
    .select('id, title, price, brand, model, condition, source, seller, url, created_at, timestamp, description')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    console.error('❌ Failed to fetch listings:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${listings.length} listings to process`);

  let fixedPrices = 0;
  let scored = 0;
  let failed = 0;
  const batchSize = 50;
  const updates = [];

  for (const listing of listings) {
    try {
      // Fix price from title if it looks truncated
      let correctedPrice = listing.price;
      if (listing.title) {
        const matches = listing.title.match(/\$\s?([\d,]+(?:\.\d{2})?)/g);
        if (matches) {
          const prices = matches.map(m => parseFloat(m.replace(/[$,\s]/g, ''))).filter(p => p > 0);
          if (prices.length > 0) {
            // Pick the most likely price (last one in title, or the one that's a reasonable watch price)
            const titlePrice = prices[prices.length - 1];
            if (titlePrice > 0 && (!correctedPrice || titlePrice > correctedPrice * 3)) {
              correctedPrice = titlePrice;
              fixedPrices++;
            }
          }
        }
      }

      // Score the listing
      const listingForScoring = { ...listing, price: correctedPrice };
      const result = await dealScorer.scoreDeal(listingForScoring);

      updates.push({
        id: listing.id,
        price: correctedPrice,
        deal_score: result.score,
        score_breakdown: result.breakdown
      });

      scored++;

      if (scored % 100 === 0) {
        console.log(`  Scored ${scored}/${listings.length}...`);
      }
    } catch (err) {
      failed++;
      if (failed <= 5) console.error(`  ⚠️ Failed to score ${listing.id}: ${err.message}`);
    }
  }

  // Batch update to Supabase
  console.log(`\n📤 Updating ${updates.length} listings in database...`);
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    for (const update of batch) {
      const { error: updateError } = await sb
        .from('watch_listings')
        .update({
          price: update.price,
          deal_score: update.deal_score,
          score_breakdown: update.score_breakdown
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`  ❌ Failed to update ${update.id}: ${updateError.message}`);
      }
    }
    
    if (i % 200 === 0 && i > 0) {
      console.log(`  Updated ${i}/${updates.length}...`);
    }
  }

  // Stats
  const scores = updates.map(u => u.deal_score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const hotDeals = scores.filter(s => s >= 70).length;
  const goodDeals = scores.filter(s => s >= 50 && s < 70).length;

  console.log(`\n✅ DONE!`);
  console.log(`   Scored: ${scored} | Failed: ${failed} | Prices fixed: ${fixedPrices}`);
  console.log(`   Average score: ${avgScore}/100`);
  console.log(`   🔥 Hot deals (70+): ${hotDeals}`);
  console.log(`   👍 Good deals (50-69): ${goodDeals}`);
  
  // Show top 10
  updates.sort((a, b) => b.deal_score - a.deal_score);
  console.log(`\n🏆 Top 10 deals:`);
  for (const deal of updates.slice(0, 10)) {
    const listing = listings.find(l => l.id === deal.id);
    console.log(`   ${deal.deal_score}/100 | $${deal.price} | ${(listing?.title || '').substring(0, 60)}`);
  }

  process.exit(0);
}

fixPriceAndScore().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
