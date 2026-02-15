#!/usr/bin/env node

/**
 * Test script to manually run eBay and WatchUSeek scrapers
 */

const ScraperManager = require('./src/services/scraping/ScraperManager');
const logger = require('./src/utils/logger');

async function testScrapers() {
  const manager = new ScraperManager();
  
  console.log('🧪 Testing scrapers...\n');
  
  // Test eBay
  console.log('1️⃣ Testing eBay scraper...');
  try {
    const ebayResult = await manager.scrapeSource('ebay', 'luxury watch', {
      condition: 'all',
      minPrice: 1000
    });
    const ebayListings = ebayResult.listings || ebayResult || [];
    console.log(`✅ eBay: Found ${ebayListings.length} listings`);
    if (ebayListings.length > 0) {
      console.log(`   Sample: ${ebayListings[0].title} - $${ebayListings[0].price}`);
    }
  } catch (error) {
    console.error(`❌ eBay failed: ${error.message}`);
  }
  
  console.log('');
  
  // Test WatchUSeek
  console.log('2️⃣ Testing WatchUSeek scraper...');
  try {
    const wusResult = await manager.scrapeSource('watchuseek', null, {
      page: 1,
      fetchPrices: true,
      maxPriceFetches: 5
    });
    const wusListings = wusResult.listings || wusResult || [];
    console.log(`✅ WatchUSeek: Found ${wusListings.length} listings`);
    if (wusListings.length > 0) {
      console.log(`   Sample: ${wusListings[0].title} - $${wusListings[0].price || 'N/A'}`);
    }
  } catch (error) {
    console.error(`❌ WatchUSeek failed: ${error.message}`);
  }
  
  console.log('\n✅ Test complete!');
}

testScrapers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
