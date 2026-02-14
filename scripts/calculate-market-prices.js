#!/usr/bin/env node
/**
 * Calculate Market Prices
 * 
 * Aggregates existing watch_listings data into a market_prices reference table.
 * Groups by brand + model, computes avg/min/max/count, stores in Supabase.
 * 
 * Usage:
 *   node scripts/calculate-market-prices.js          # full recalculation
 *   node scripts/calculate-market-prices.js --dry-run # preview only
 *   node scripts/calculate-market-prices.js --days 60 # only last 60 days of data
 */

require('dotenv').config();
const supabase = require('../src/db/supabase');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const daysIdx = args.indexOf('--days');
const LOOKBACK_DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1]) || 90 : 90;

async function ensureMarketPricesTable() {
  // Try to select from the table — if it errors, we need to create it
  const { error } = await supabase.client.from('market_prices').select('id').limit(1);
  
  if (error && error.message.includes('market_prices')) {
    console.log('📊 Creating market_prices table via Supabase RPC...');
    console.log('');
    console.log('⚠️  The market_prices table does not exist yet.');
    console.log('   Please create it in your Supabase SQL editor:');
    console.log('');
    console.log(`
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(200) NOT NULL,
  avg_price DECIMAL(12,2) NOT NULL,
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  median_price DECIMAL(12,2),
  sample_count INTEGER NOT NULL DEFAULT 0,
  source_breakdown JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand, model)
);

CREATE INDEX IF NOT EXISTS idx_market_prices_brand ON market_prices(brand);
CREATE INDEX IF NOT EXISTS idx_market_prices_brand_model ON market_prices(brand, model);
    `);
    console.log('');
    console.log('Then re-run this script.');
    process.exit(1);
  }
}

function trimmedMean(prices, trimPct = 0.10) {
  if (prices.length === 0) return 0;
  if (prices.length < 5) {
    // Too few for trimming — use median
    prices.sort((a, b) => a - b);
    return prices[Math.floor(prices.length / 2)];
  }
  prices.sort((a, b) => a - b);
  const trim = Math.max(1, Math.floor(prices.length * trimPct));
  const trimmed = prices.slice(trim, prices.length - trim);
  return trimmed.reduce((s, p) => s + p, 0) / trimmed.length;
}

function median(prices) {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Market Price Calculator');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Mode:     ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`  Lookback: ${LOOKBACK_DAYS} days`);
  console.log('');

  if (!supabase.isAvailable()) {
    console.error('❌ Supabase is not available. Check your .env configuration.');
    process.exit(1);
  }

  await ensureMarketPricesTable();

  // Fetch all watch listings with valid prices
  const cutoffDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  console.log(`📥 Fetching watch listings since ${cutoffDate.split('T')[0]}...`);

  // Fetch in pages (Supabase limit is 1000 per call)
  let allListings = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase.client
      .from('watch_listings')
      .select('brand, model, price, source, timestamp')
      .gt('price', 0)
      .gte('timestamp', cutoffDate)
      .order('timestamp', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('❌ Query error:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allListings = allListings.concat(data);
    offset += PAGE_SIZE;

    if (data.length < PAGE_SIZE) break;
  }

  console.log(`✅ Fetched ${allListings.length} listings with valid prices\n`);

  if (allListings.length === 0) {
    console.log('⚠️  No listings found. Nothing to compute.');
    process.exit(0);
  }

  // Group by brand + model (normalize)
  const groups = new Map();

  for (const listing of allListings) {
    const brand = (listing.brand || 'Unknown').trim();
    const model = (listing.model || 'Unknown').trim();
    
    // Skip if brand is unknown and model is very long (bad parse)
    if (brand === 'Unknown' && model.length > 50) continue;
    
    const price = parseFloat(listing.price);
    if (price <= 0 || isNaN(price)) continue;

    const key = `${brand}|||${model}`;
    if (!groups.has(key)) {
      groups.set(key, { brand, model, prices: [], sources: {} });
    }

    const group = groups.get(key);
    group.prices.push(price);
    const src = listing.source || 'unknown';
    group.sources[src] = (group.sources[src] || 0) + 1;
  }

  console.log(`📊 Found ${groups.size} unique brand/model combinations\n`);

  // Filter: need at least 3 data points for meaningful averages
  const MIN_SAMPLES = 2;
  const validGroups = [...groups.values()].filter(g => g.prices.length >= MIN_SAMPLES);
  const skipped = groups.size - validGroups.length;

  console.log(`✅ ${validGroups.length} groups with ≥${MIN_SAMPLES} samples (skipped ${skipped})\n`);

  // Calculate market prices
  const marketPrices = validGroups.map(group => {
    const avg = trimmedMean(group.prices);
    const med = median(group.prices);
    const sorted = [...group.prices].sort((a, b) => a - b);

    return {
      brand: group.brand,
      model: group.model,
      avg_price: Math.round(avg * 100) / 100,
      min_price: sorted[0],
      max_price: sorted[sorted.length - 1],
      median_price: Math.round(med * 100) / 100,
      sample_count: group.prices.length,
      source_breakdown: group.sources,
      last_updated: new Date().toISOString()
    };
  });

  // Sort by sample count (most data first)
  marketPrices.sort((a, b) => b.sample_count - a.sample_count);

  // Print summary
  console.log('Top 20 market prices:');
  console.log('─'.repeat(85));
  console.log(
    'Brand'.padEnd(18) +
    'Model'.padEnd(25) +
    'Avg $'.padStart(10) +
    'Min $'.padStart(10) +
    'Max $'.padStart(10) +
    'Count'.padStart(7)
  );
  console.log('─'.repeat(85));

  for (const mp of marketPrices.slice(0, 20)) {
    console.log(
      mp.brand.substring(0, 17).padEnd(18) +
      mp.model.substring(0, 24).padEnd(25) +
      `$${mp.avg_price.toLocaleString()}`.padStart(10) +
      `$${mp.min_price.toLocaleString()}`.padStart(10) +
      `$${mp.max_price.toLocaleString()}`.padStart(10) +
      String(mp.sample_count).padStart(7)
    );
  }
  console.log('─'.repeat(85));
  console.log(`Total: ${marketPrices.length} market price entries\n`);

  // Write to Supabase
  if (DRY_RUN) {
    console.log('🔍 DRY RUN — no data written. Remove --dry-run to write.\n');
  } else {
    console.log('📤 Writing market prices to Supabase...');

    // Clear existing and re-insert (full refresh)
    const { error: delError } = await supabase.client
      .from('market_prices')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

    if (delError) {
      console.error('⚠️  Error clearing old prices:', delError.message);
    }

    // Insert in batches of 50
    let inserted = 0;
    const BATCH = 50;
    for (let i = 0; i < marketPrices.length; i += BATCH) {
      const batch = marketPrices.slice(i, i + BATCH);
      const { error } = await supabase.client
        .from('market_prices')
        .insert(batch);

      if (error) {
        console.error(`⚠️  Batch insert error at ${i}:`, error.message);
        // Try one-by-one for this batch
        for (const mp of batch) {
          const { error: singleErr } = await supabase.client
            .from('market_prices')
            .upsert(mp, { onConflict: 'brand,model' });
          if (!singleErr) inserted++;
        }
      } else {
        inserted += batch.length;
      }
    }

    console.log(`✅ Inserted ${inserted}/${marketPrices.length} market price entries\n`);
  }

  // Overall stats
  const allPrices = marketPrices.map(mp => mp.avg_price);
  console.log('📈 Summary Statistics:');
  console.log(`   Total entries:       ${marketPrices.length}`);
  console.log(`   Cheapest avg:        $${Math.min(...allPrices).toLocaleString()}`);
  console.log(`   Most expensive avg:  $${Math.max(...allPrices).toLocaleString()}`);
  console.log(`   Overall median avg:  $${Math.round(median(allPrices)).toLocaleString()}`);
  console.log(`   Max sample count:    ${Math.max(...marketPrices.map(mp => mp.sample_count))}`);
  console.log('');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
