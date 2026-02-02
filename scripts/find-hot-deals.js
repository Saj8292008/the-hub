#!/usr/bin/env node
/**
 * Find Hot Deals
 * Identifies deals significantly below typical prices
 * Run: node scripts/find-hot-deals.js [hours]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Typical price ranges for popular models (rough estimates)
const MARKET_PRICES = {
  // Rolex
  'submariner': { low: 8500, mid: 12000, high: 16000 },
  'datejust': { low: 5000, mid: 8000, high: 12000 },
  'explorer': { low: 6000, mid: 9000, high: 12000 },
  'gmt-master': { low: 12000, mid: 18000, high: 25000 },
  
  // Omega
  'speedmaster': { low: 3500, mid: 5500, high: 8000 },
  'seamaster': { low: 2500, mid: 4000, high: 6000 },
  'aqua terra': { low: 3000, mid: 4500, high: 6500 },
  
  // Tudor
  'black bay': { low: 2500, mid: 3500, high: 4500 },
  'pelagos': { low: 3000, mid: 4000, high: 5000 },
  
  // Seiko
  'skx': { low: 150, mid: 250, high: 400 },
  'alpinist': { low: 350, mid: 500, high: 700 },
  'presage': { low: 200, mid: 350, high: 500 },
  
  // Grand Seiko
  'snowflake': { low: 4000, mid: 5500, high: 7000 },
  'sbga': { low: 3500, mid: 5000, high: 7000 },
  
  // Others
  'nomos': { low: 1500, mid: 2500, high: 4000 },
  'sinn 556': { low: 900, mid: 1200, high: 1500 },
  'hamilton khaki': { low: 250, mid: 400, high: 600 }
};

function findMatchingMarket(title, model) {
  const text = `${title} ${model}`.toLowerCase();
  
  for (const [key, prices] of Object.entries(MARKET_PRICES)) {
    if (text.includes(key.toLowerCase())) {
      return { key, prices };
    }
  }
  return null;
}

function calculateDealQuality(price, market) {
  const { low, mid } = market.prices;
  
  if (price <= low * 0.7) return { rating: 'STEAL', discount: Math.round((1 - price/mid) * 100) };
  if (price <= low * 0.85) return { rating: 'HOT', discount: Math.round((1 - price/mid) * 100) };
  if (price <= low) return { rating: 'GOOD', discount: Math.round((1 - price/mid) * 100) };
  if (price <= mid) return { rating: 'FAIR', discount: Math.round((1 - price/mid) * 100) };
  return { rating: 'MARKET', discount: 0 };
}

async function main() {
  const hours = parseInt(process.argv[2]) || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  console.log(`🔥 Finding hot deals from last ${hours} hours...\n`);
  
  const { data: deals, error } = await supabase
    .from('watch_listings')
    .select('*')
    .gte('created_at', since)
    .not('price', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Analyzing ${deals.length} deals...\n`);

  const hotDeals = [];

  for (const deal of deals) {
    const market = findMatchingMarket(deal.title || '', deal.model || '');
    
    if (market && deal.price) {
      const quality = calculateDealQuality(deal.price, market);
      
      if (quality.rating === 'STEAL' || quality.rating === 'HOT') {
        hotDeals.push({
          ...deal,
          marketKey: market.key,
          marketMid: market.prices.mid,
          quality: quality.rating,
          discount: quality.discount
        });
      }
    }
  }

  // Sort by discount
  hotDeals.sort((a, b) => b.discount - a.discount);

  console.log(`Found ${hotDeals.length} hot deals:\n`);
  console.log('='.repeat(60));

  hotDeals.slice(0, 10).forEach((deal, i) => {
    const emoji = deal.quality === 'STEAL' ? '🔥🔥🔥' : '🔥🔥';
    console.log(`\n${i + 1}. ${emoji} ${deal.quality} - ${deal.discount}% below market`);
    console.log(`   ${deal.brand || '?'} - ${deal.marketKey}`);
    console.log(`   Price: $${deal.price.toLocaleString()} (market ~$${deal.marketMid.toLocaleString()})`);
    console.log(`   ${deal.title?.substring(0, 50)}...`);
    console.log(`   ${deal.url}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary: ${hotDeals.filter(d => d.quality === 'STEAL').length} STEALs, ${hotDeals.filter(d => d.quality === 'HOT').length} HOT deals`);
}

main().catch(console.error);
