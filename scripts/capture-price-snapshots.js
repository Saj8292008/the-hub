#!/usr/bin/env node

/**
 * Capture Price Snapshots
 * 
 * Queries all active watch_listings from Supabase and inserts a snapshot row
 * for each one. Deduplicates by skipping listings whose price hasn't changed
 * since the last snapshot.
 * 
 * Usage:
 *   node scripts/capture-price-snapshots.js
 *   node scripts/capture-price-snapshots.js --dry-run   # preview without writing
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');

async function fetchActiveListings() {
  // Fetch all watch_listings that have a price
  // Paginate in batches of 1000 (Supabase default limit)
  const allListings = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('watch_listings')
      .select('id, brand, model, price, source, title')
      .not('price', 'is', null)
      .gt('price', 0)
      .order('id', { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) {
      throw new Error(`Error fetching listings: ${error.message}`);
    }

    if (!data || data.length === 0) break;
    allListings.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  return allListings;
}

async function fetchLatestSnapshots(listingIds) {
  // For each listing, get the most recent snapshot to compare prices.
  // Batch the queries to avoid hitting Supabase URL length / payload limits.
  if (listingIds.length === 0) return {};

  const latest = {};
  const batchSize = 200; // safe batch size for .in() filter

  for (let i = 0; i < listingIds.length; i += batchSize) {
    const batch = listingIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('price_snapshots')
      .select('listing_id, price')
      .in('listing_id', batch)
      .order('snapshot_date', { ascending: false });

    if (error) {
      console.warn(`⚠️  Warning fetching latest snapshots (batch ${Math.floor(i / batchSize) + 1}): ${error.message}`);
      continue;
    }

    // Keep only the first (most recent) per listing_id
    for (const row of (data || [])) {
      if (!latest[row.listing_id]) {
        latest[row.listing_id] = row.price;
      }
    }
  }

  return latest;
}

function extractReferenceNumber(title) {
  if (!title) return null;
  // Common watch reference number patterns: alphanumeric with hyphens/dots
  // e.g., 116610LN, 326934, PAM01312, IW500714, 5711/1A-010
  const patterns = [
    /\b(\d{3,6}[A-Z]{0,4}[-/]?\d{0,4}[A-Z]{0,3})\b/,  // 116610LN, 5711/1A
    /\b(ref\.?\s*#?\s*[\w\-/.]+)/i,                        // ref. 116610
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return match[1].replace(/^ref\.?\s*#?\s*/i, '').trim();
  }
  return null;
}

async function run() {
  const startTime = Date.now();
  console.log('📸 Price Snapshot Capture');
  console.log('========================');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '💾 LIVE'}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // 1. Fetch all active listings
  console.log('Fetching active watch listings...');
  const listings = await fetchActiveListings();
  console.log(`Found ${listings.length} listings with prices.\n`);

  if (listings.length === 0) {
    console.log('No listings to snapshot. Done.');
    return;
  }

  // 2. Fetch latest snapshots for deduplication
  console.log('Checking for existing snapshots (dedup)...');
  const listingIds = listings.map(l => l.id);
  const latestPrices = await fetchLatestSnapshots(listingIds);
  const existingCount = Object.keys(latestPrices).length;
  console.log(`Found ${existingCount} listings with prior snapshots.\n`);

  // 3. Build snapshot rows, skipping unchanged prices
  const toInsert = [];
  let skipped = 0;

  for (const listing of listings) {
    const lastPrice = latestPrices[listing.id];

    // Skip if price hasn't changed since last snapshot
    if (lastPrice !== undefined && Number(lastPrice) === Number(listing.price)) {
      skipped++;
      continue;
    }

    toInsert.push({
      listing_id: listing.id,
      brand: listing.brand || null,
      model: listing.model || null,
      reference_number: extractReferenceNumber(listing.title),
      price: listing.price,
      source: listing.source || null,
      // snapshot_date defaults to NOW() in the DB
    });
  }

  console.log(`📊 Snapshot Summary:`);
  console.log(`   Total listings:     ${listings.length}`);
  console.log(`   New/changed prices: ${toInsert.length}`);
  console.log(`   Unchanged (skip):   ${skipped}\n`);

  if (toInsert.length === 0) {
    console.log('✅ No new snapshots needed. All prices unchanged.');
    return;
  }

  if (DRY_RUN) {
    console.log('🔍 Dry run — showing first 5 snapshots that would be inserted:');
    toInsert.slice(0, 5).forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.brand || '?'} ${s.model || '?'} — $${s.price} (${s.source})`);
    });
    console.log('\nNo data written. Run without --dry-run to insert.');
    return;
  }

  // 4. Insert in batches of 500
  const batchSize = 500;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('price_snapshots')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ Batch insert error (rows ${i}-${i + batch.length}): ${error.message}`);
      errors += batch.length;
    } else {
      inserted += (data || []).length;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s`);
  console.log(`   Snapshots captured: ${inserted}`);
  console.log(`   Unchanged/skipped:  ${skipped}`);
  if (errors > 0) {
    console.log(`   Errors:             ${errors}`);
  }
}

run().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
