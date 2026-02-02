#!/usr/bin/env node
/**
 * CLI Dashboard
 * Quick overview of The Hub status
 * Run: node scripts/dashboard-cli.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkServer() {
  return new Promise(resolve => {
    const req = http.get('http://localhost:3000/health', res => {
      resolve({ up: res.statusCode === 200 });
    });
    req.on('error', () => resolve({ up: false }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ up: false }); });
  });
}

async function getStats() {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [todayDeals, weekDeals, subscribers] = await Promise.all([
    supabase.from('watch_listings').select('id', { count: 'exact' }).gte('created_at', today),
    supabase.from('watch_listings').select('id', { count: 'exact' }).gte('created_at', week),
    supabase.from('users').select('id', { count: 'exact' })
  ]);

  return {
    todayDeals: todayDeals.count || 0,
    weekDeals: weekDeals.count || 0,
    subscribers: subscribers.count || 0
  };
}

async function getRecentActivity() {
  const oneHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('watch_listings')
    .select('brand, price, source')
    .gte('created_at', oneHour)
    .order('created_at', { ascending: false })
    .limit(5);

  return data || [];
}

async function main() {
  console.clear();
  console.log('\n' + '═'.repeat(50));
  console.log('  🎯 THE HUB - COMMAND CENTER');
  console.log('═'.repeat(50) + '\n');

  // Server Status
  const server = await checkServer();
  console.log(`🖥️  Server: ${server.up ? '✅ ONLINE' : '❌ OFFLINE'}`);

  // Stats
  const stats = await getStats();
  console.log(`\n📊 Stats:`);
  console.log(`   Today's deals: ${stats.todayDeals}`);
  console.log(`   This week: ${stats.weekDeals}`);
  console.log(`   Subscribers: ${stats.subscribers}`);

  // Recent Activity
  const recent = await getRecentActivity();
  console.log(`\n🕐 Last Hour (${recent.length} deals):`);
  if (recent.length === 0) {
    console.log('   No new deals');
  } else {
    recent.slice(0, 5).forEach(d => {
      const price = d.price ? `$${d.price.toLocaleString()}` : '?';
      console.log(`   • ${d.brand || 'Unknown'} - ${price} (${d.source})`);
    });
  }

  // Quick Actions
  console.log(`\n⚡ Quick Actions:`);
  console.log('   npm run scrape         - Run scrapers');
  console.log('   node scripts/quick-deal-check.js [brand]');
  console.log('   node scripts/generate-insights.js --post');
  console.log('   node scripts/post-best-deals.js 3');

  console.log('\n' + '═'.repeat(50));
  console.log(`  Last updated: ${new Date().toLocaleTimeString()}`);
  console.log('═'.repeat(50) + '\n');
}

main().catch(console.error);
