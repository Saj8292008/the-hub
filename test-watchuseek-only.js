#!/usr/bin/env node

/**
 * Test WatchUSeek scraper only (without fetching prices from threads)
 */

const ScraperManager = require('./src/services/scraping/ScraperManager');

async function testWatchUSeek() {
  const manager = new ScraperManager();
  
  console.log('🧪 Testing WatchUSeek scraper (without price fetching)...\n');
  
  try {
    const result = await manager.scrapeSource('watchuseek', null, {
      page: 1,
      fetchPrices: false  // Don't fetch prices to speed up test
    });
    
    const listings = result.listings || result || [];
    console.log(`✅ WatchUSeek: Found ${listings.length} listings\n`);
    
    if (listings.length > 0) {
      console.log('📋 Sample listings:');
      listings.slice(0, 3).forEach((listing, i) => {
        console.log(`\n${i+1}. ${listing.title}`);
        console.log(`   Price: $${listing.price || 'N/A'}`);
        console.log(`   Brand: ${listing.brand}`);
        console.log(`   URL: ${listing.url}`);
      });
    }
    
    console.log('\n✅ WatchUSeek scraper is working!');
  } catch (error) {
    console.error(`❌ WatchUSeek failed: ${error.message}`);
    console.error(error.stack);
  }
}

testWatchUSeek().catch(console.error);
