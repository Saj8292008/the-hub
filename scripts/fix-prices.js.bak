#!/usr/bin/env node
/**
 * Fix Prices
 * Re-extracts prices from titles for listings with suspicious prices
 * Run: node scripts/fix-prices.js [--fix]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function extractPrice(text) {
  const patterns = [
    /\$\s*(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/,
    /\$\s*(\d{3,6})(?:\.\d{2})?(?!\d)/,
    /\$\s*(\d{1,3})(?:\.\d{2})?(?![,\d])/,
    /(\d{1,3}(?:,\d{3})*|\d{3,6})\s*USD/i,
    /price[:\s]+\$?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price >= 25 && price <= 500000) {
        return price;
      }
    }
  }
  return null;
}

async function main() {
  const shouldFix = process.argv.includes('--fix');
  
  console.log('🔍 Finding suspicious prices...\n');
  
  // Find listings where price seems too low for the brand
  const suspiciousCriteria = [
    { brand: 'Rolex', maxSuspicious: 1000 },
    { brand: 'Omega', maxSuspicious: 500 },
    { brand: 'Tudor', maxSuspicious: 500 },
    { brand: 'Panerai', maxSuspicious: 500 },
    { brand: 'IWC', maxSuspicious: 500 },
    { brand: 'Cartier', maxSuspicious: 500 },
    { brand: 'Grand Seiko', maxSuspicious: 500 }
  ];

  const fixes = [];

  for (const criteria of suspiciousCriteria) {
    const { data, error } = await supabase
      .from('watch_listings')
      .select('id, title, price, brand')
      .eq('brand', criteria.brand)
      .lt('price', criteria.maxSuspicious)
      .not('price', 'is', null);

    if (error) continue;

    for (const listing of data || []) {
      const correctedPrice = extractPrice(listing.title);
      
      if (correctedPrice && correctedPrice > listing.price * 5) {
        fixes.push({
          id: listing.id,
          brand: listing.brand,
          title: listing.title?.substring(0, 50),
          oldPrice: listing.price,
          newPrice: correctedPrice
        });
      }
    }
  }

  console.log(`Found ${fixes.length} prices to fix:\n`);
  
  fixes.forEach(f => {
    console.log(`${f.brand}: $${f.oldPrice} → $${f.newPrice}`);
    console.log(`  "${f.title}..."`);
  });

  if (shouldFix && fixes.length > 0) {
    console.log('\n📝 Updating database...');
    
    let updated = 0;
    for (const fix of fixes) {
      const { error } = await supabase
        .from('watch_listings')
        .update({ price: fix.newPrice })
        .eq('id', fix.id);
      
      if (!error) updated++;
    }
    
    console.log(`✅ Fixed ${updated} prices`);
  } else if (!shouldFix && fixes.length > 0) {
    console.log('\n💡 Run with --fix to update the database');
  }
}

main().catch(console.error);
