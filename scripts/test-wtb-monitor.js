#!/usr/bin/env node
/**
 * Test script for Reddit WTB Monitor
 * Run: node scripts/test-wtb-monitor.js
 */

require('dotenv').config();
const WTBMonitor = require('../src/services/reddit/WTBMonitor');

async function main() {
  console.log('🔍 Reddit WTB Monitor Test\n');
  
  const monitor = new WTBMonitor();
  
  try {
    // Scan the current WTB thread
    const result = await monitor.scan();
    
    console.log('📋 Thread Info:');
    console.log(`   Title: ${result.thread.title}`);
    console.log(`   URL: ${result.thread.url}`);
    console.log(`   Comments: ${result.thread.numComments}`);
    console.log(`   Age: ${Math.round((Date.now() - result.thread.created) / (1000 * 60 * 60))}h`);
    
    console.log(`\n📊 Stats:`);
    console.log(`   Total parsed: ${result.requests.length} WTB requests`);
    
    // Breakdown by brand
    const brandCounts = {};
    for (const r of result.requests) {
      brandCounts[r.brand] = (brandCounts[r.brand] || 0) + 1;
    }
    console.log(`\n🏷️  Top Brands:`);
    Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([brand, count]) => {
        console.log(`   ${brand}: ${count}`);
      });
    
    // High-value opportunities (users with transaction history)
    const opportunities = result.requests.filter(r => r.transactions >= 10);
    console.log(`\n🎯 High-Value Opportunities (10+ transactions): ${opportunities.length}`);
    opportunities.slice(0, 5).forEach((r, i) => {
      console.log(`\n   ${i + 1}. u/${r.author} (${r.transactions} tx)`);
      console.log(`      Wants: ${r.brand} ${r.models.join(', ')}`);
      if (r.priceRange) console.log(`      Budget: up to $${r.priceRange.max}`);
      console.log(`      URL: ${r.url}`);
    });
    
    // Search terms generated
    console.log(`\n🔎 Sample Search Terms:`);
    result.requests.slice(0, 5).forEach(r => {
      if (r.searchTerms.length > 0) {
        console.log(`   ${r.author}: ${r.searchTerms.join(', ')}`);
      }
    });
    
    console.log('\n✅ WTB Monitor is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
