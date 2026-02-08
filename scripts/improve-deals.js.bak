#!/usr/bin/env node
/**
 * Improve Deals
 * Re-processes deals with better brand detection
 * Run: node scripts/improve-deals.js [--fix]
 * 
 * Without --fix: Shows what would change
 * With --fix: Updates the database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const BrandDetector = require('../src/services/content/BrandDetector');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const detector = new BrandDetector();

async function main() {
  const shouldFix = process.argv.includes('--fix');
  
  console.log('🔍 Analyzing deals with Unknown brands...\n');
  
  // Get deals with Unknown brand from last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: deals, error } = await supabase
    .from('watch_listings')
    .select('id, title, brand')
    .or('brand.is.null,brand.eq.Unknown')
    .gte('created_at', since)
    .limit(500);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${deals.length} deals with Unknown/null brand\n`);

  const improvements = [];
  const stillUnknown = [];

  for (const deal of deals) {
    const detected = detector.detect(deal.title);
    
    if (detected !== 'Unknown') {
      improvements.push({ id: deal.id, title: deal.title, oldBrand: deal.brand, newBrand: detected });
    } else {
      stillUnknown.push(deal.title?.substring(0, 60));
    }
  }

  console.log(`✅ Can improve: ${improvements.length}`);
  console.log(`❓ Still unknown: ${stillUnknown.length}\n`);

  // Show sample improvements
  console.log('Sample improvements:');
  improvements.slice(0, 10).forEach(imp => {
    console.log(`  ${imp.oldBrand || 'null'} → ${imp.newBrand}`);
    console.log(`    "${imp.title?.substring(0, 50)}..."`);
  });

  if (stillUnknown.length > 0) {
    console.log('\nSample still unknown:');
    stillUnknown.slice(0, 5).forEach(title => {
      console.log(`  • ${title}...`);
    });
  }

  if (shouldFix && improvements.length > 0) {
    console.log('\n📝 Updating database...');
    
    let updated = 0;
    for (const imp of improvements) {
      const { error: updateError } = await supabase
        .from('watch_listings')
        .update({ brand: imp.newBrand })
        .eq('id', imp.id);
      
      if (!updateError) updated++;
    }
    
    console.log(`✅ Updated ${updated} deals`);
  } else if (!shouldFix && improvements.length > 0) {
    console.log('\n💡 Run with --fix to update the database');
  }

  // Stats
  const rate = Math.round((improvements.length / deals.length) * 100);
  console.log(`\n📊 Detection rate: ${rate}% of unknowns can be fixed`);
}

main().catch(console.error);
