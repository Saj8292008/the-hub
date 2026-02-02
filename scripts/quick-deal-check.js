#!/usr/bin/env node
/**
 * Quick Deal Check
 * Fast way to see what's hot right now
 * Run: node scripts/quick-deal-check.js [brand]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function main() {
  const brand = process.argv[2];
  const hours = parseInt(process.argv[3]) || 6;
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  console.log(`\n🔍 Deals from last ${hours} hours${brand ? ` for ${brand}` : ''}:\n`);
  
  let query = supabase
    .from('watch_listings')
    .select('brand, title, price, deal_score, source, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (brand) {
    query = query.ilike('brand', `%${brand}%`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data.length === 0) {
    console.log('No deals found.');
    return;
  }
  
  data.forEach((d, i) => {
    const time = new Date(d.created_at).toLocaleTimeString();
    const score = d.deal_score ? `⭐${d.deal_score}` : '';
    const price = d.price ? `$${d.price.toLocaleString()}` : 'N/A';
    console.log(`${i + 1}. [${d.brand || '?'}] ${price} ${score}`);
    console.log(`   ${d.title?.substring(0, 60)}...`);
    console.log(`   📍 ${d.source} @ ${time}\n`);
  });
  
  console.log(`Total: ${data.length} deals\n`);
}

main();
