#!/usr/bin/env node
/**
 * Rescore All Deals — v3.0 Algorithm
 * 
 * Re-scores all existing watch_listings with the new deal-scorer v3.0 algorithm.
 * Outputs a summary of score distribution.
 * 
 * Usage:
 *   node scripts/rescore-deals.js              # rescore all
 *   node scripts/rescore-deals.js --dry-run    # score but don't write to DB
 *   node scripts/rescore-deals.js --limit 100  # only first 100 listings
 *   node scripts/rescore-deals.js --verbose    # show every listing's score
 */

require('dotenv').config();
const supabase = require('../src/db/supabase');
const { scoreDeal, scoreSummary, clearMarketPriceCache } = require('../src/services/deal-scorer');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) || 10000 : 10000;

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Deal Rescorer v3.0');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Mode:  ${DRY_RUN ? 'DRY RUN (scores computed, not saved)' : 'LIVE (writing to DB)'}`);
  console.log(`  Limit: ${LIMIT}`);
  console.log('');

  if (!supabase.isAvailable()) {
    console.error('❌ Supabase is not available.');
    process.exit(1);
  }

  // Clear market price cache to ensure fresh data
  clearMarketPriceCache();

  // Fetch listings
  console.log('📥 Fetching listings...');

  let allListings = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (allListings.length < LIMIT) {
    const remaining = LIMIT - allListings.length;
    const fetchSize = Math.min(PAGE_SIZE, remaining);

    const { data, error } = await supabase.client
      .from('watch_listings')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + fetchSize - 1);

    if (error) {
      console.error('❌ Fetch error:', error.message);
      break;
    }
    if (!data || data.length === 0) break;

    allListings = allListings.concat(data);
    offset += fetchSize;
    if (data.length < fetchSize) break;
  }

  console.log(`✅ Fetched ${allListings.length} listings\n`);

  if (allListings.length === 0) {
    console.log('⚠️  No listings to score.');
    process.exit(0);
  }

  // Score each listing
  const startTime = Date.now();
  const scores = [];
  const errors = [];
  let scored = 0;

  console.log('🔄 Scoring listings...');

  for (let i = 0; i < allListings.length; i++) {
    const listing = allListings[i];

    try {
      const result = await scoreDeal(listing);
      scores.push({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        brand: listing.brand,
        oldScore: listing.deal_score,
        newScore: result.score,
        grade: result.grade,
        breakdown: result.breakdown
      });
      scored++;

      if (VERBOSE) {
        console.log(`  [${scored}] ${result.score}/100 ${result.grade} — ${(listing.title || '').substring(0, 60)}`);
      }

      // Write to DB
      if (!DRY_RUN) {
        await supabase.client
          .from('watch_listings')
          .update({
            deal_score: result.score,
            score_breakdown: result.breakdown,
            scored_at: new Date().toISOString()
          })
          .eq('id', listing.id);
      }

      // Progress
      if ((i + 1) % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (scored / parseFloat(elapsed)).toFixed(1);
        console.log(`  Progress: ${i + 1}/${allListings.length} (${rate} listings/sec)`);
      }
    } catch (err) {
      errors.push({ id: listing.id, title: listing.title, error: err.message });
      if (VERBOSE) {
        console.error(`  ❌ Error scoring ${listing.id}: ${err.message}`);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // ─── Distribution Summary ─────────────────────────────────────────
  const scoreValues = scores.map(s => s.newScore);
  const dist = {
    insane: scores.filter(s => s.newScore >= 90),
    great: scores.filter(s => s.newScore >= 75 && s.newScore < 90),
    good: scores.filter(s => s.newScore >= 50 && s.newScore < 75),
    below: scores.filter(s => s.newScore < 50)
  };

  console.log('\n');
  console.log('═══════════════════════════════════════════════');
  console.log('  SCORING RESULTS');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Total scored:   ${scored}`);
  console.log(`  Errors:         ${errors.length}`);
  console.log(`  Duration:       ${elapsed}s`);
  console.log(`  Rate:           ${(scored / parseFloat(elapsed)).toFixed(1)} listings/sec`);
  console.log('');

  console.log('  Score Distribution:');
  console.log('  ─────────────────────────────────────────');
  console.log(`  🔥 90-100 (INSANE):  ${String(dist.insane.length).padStart(5)}  (${(dist.insane.length / scored * 100).toFixed(1)}%)`);
  console.log(`  ⭐ 75-89  (GREAT):   ${String(dist.great.length).padStart(5)}  (${(dist.great.length / scored * 100).toFixed(1)}%)`);
  console.log(`  👍 50-74  (GOOD):    ${String(dist.good.length).padStart(5)}  (${(dist.good.length / scored * 100).toFixed(1)}%)`);
  console.log(`  👎 0-49   (BELOW):   ${String(dist.below.length).padStart(5)}  (${(dist.below.length / scored * 100).toFixed(1)}%)`);
  console.log('');

  if (scoreValues.length > 0) {
    const avg = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
    const sorted = [...scoreValues].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    console.log(`  Average score:  ${avg.toFixed(1)}`);
    console.log(`  Median score:   ${med}`);
    console.log(`  Highest:        ${Math.max(...scoreValues)}`);
    console.log(`  Lowest:         ${Math.min(...scoreValues)}`);
  }

  // Show top deals
  const topDeals = [...scores].sort((a, b) => b.newScore - a.newScore).slice(0, 10);
  console.log('\n  🏆 Top 10 Deals:');
  console.log('  ─────────────────────────────────────────');
  for (const deal of topDeals) {
    const title = (deal.title || '').substring(0, 55);
    const priceStr = deal.price ? `$${parseFloat(deal.price).toLocaleString()}` : 'N/A';
    console.log(`  ${String(deal.newScore).padStart(3)}/100  ${priceStr.padStart(8)}  ${title}`);
  }

  // Show biggest score changes (if had old scores)
  const withOldScores = scores.filter(s => s.oldScore != null && s.oldScore > 0);
  if (withOldScores.length > 0) {
    const biggest = [...withOldScores]
      .map(s => ({ ...s, delta: s.newScore - s.oldScore }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5);

    console.log('\n  📊 Biggest Score Changes:');
    console.log('  ─────────────────────────────────────────');
    for (const d of biggest) {
      const dir = d.delta > 0 ? '↑' : '↓';
      const title = (d.title || '').substring(0, 50);
      console.log(`  ${d.oldScore} → ${d.newScore} (${dir}${Math.abs(d.delta)})  ${title}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN — no scores were saved. Remove --dry-run to write to DB.');
  } else {
    console.log(`\n✅ ${scored} listings rescored and saved.`);
  }

  console.log('');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
