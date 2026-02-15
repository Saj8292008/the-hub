#!/usr/bin/env node

/**
 * Test the new browser-based eBay scraper
 */

const EbayScraper = require('./src/services/scraping/sources/EbayScraper');

async function testEbay() {
  console.log('🧪 Testing browser-based eBay scraper...\n');
  
  const scraper = new EbayScraper();
  
  try {
    console.log('🔍 Scraping eBay for "luxury watch"...');
    const result = await scraper.scrape('luxury watch', {
      condition: 'all',
      minPrice: 1000
    });
    
    const listings = result.listings || result || [];
    console.log(`\n✅ Found ${listings.length} listings from eBay\n`);
    
    if (listings.length > 0) {
      console.log('📋 Sample listings:');
      listings.slice(0, 3).forEach((listing, i) => {
        console.log(`\n${i+1}. ${listing.title}`);
        console.log(`   Price: $${listing.price}`);
        console.log(`   Brand: ${listing.brand}`);
        console.log(`   Condition: ${listing.condition}`);
        console.log(`   Location: ${listing.location}`);
      });
      
      console.log('\n✅ eBay scraper is working with browser automation!');
    } else {
      console.log('⚠️  No listings found - eBay might still be blocking or the search returned no results');
    }
    
  } catch (error) {
    console.error(`\n❌ eBay scraper failed: ${error.message}`);
    console.error(error.stack);
  }
  
  // Give browser time to cleanup
  setTimeout(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  }, 2000);
}

testEbay();
