require('dotenv').config();
const ScraperManager = require('./ScraperManager');
const supabase = require('../../db/supabase');
const localWatchListings = require('../../db/localWatchListings');
const logger = require('../../utils/logger');

/**
 * Test script for the new modular scraping framework
 */
class ScraperTester {
  constructor() {
    this.manager = new ScraperManager();
    this.results = {
      reddit: null,
      ebay: null,
      watchuseek: null
    };
  }

  async testReddit() {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 TEST 1: Reddit r/Watchexchange Scraper');
    console.log('='.repeat(80));

    try {
      console.log('\n📡 Fetching recent [WTS] posts from r/Watchexchange...');

      const result = await this.manager.scrapeSource('reddit', null, {
        sort: 'new',
        limit: 10
      });

      const listings = result.listings || [];
      console.log(`\n✅ SUCCESS! Found ${listings.length} listings\n`);

      if (listings.length > 0) {
        // Show first 3 listings
        console.log('Sample Listings:');
        console.log('-'.repeat(80));

        listings.slice(0, 3).forEach((listing, i) => {
          console.log(`\n${i + 1}. ${listing.title}`);
          console.log(`   Brand: ${listing.brand}`);
          console.log(`   Model: ${listing.model}`);
          console.log(`   Price: ${listing.currency} ${listing.price}`);
          console.log(`   Condition: ${listing.condition}`);
          console.log(`   Seller: ${listing.seller}`);
          console.log(`   URL: ${listing.url}`);
          console.log(`   Images: ${listing.images.length} photos`);
        });

        console.log('\n' + '-'.repeat(80));
      }

      this.results.reddit = { success: true, count: listings.length };
      return listings;
    } catch (error) {
      console.log(`\n❌ FAILED: ${error.message}\n`);
      console.error(error.stack);
      this.results.reddit = { success: false, error: error.message };
      return [];
    }
  }

  async testRedditSearch() {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 TEST 2: Reddit Search for Specific Watch');
    console.log('='.repeat(80));

    try {
      const query = 'Rolex Submariner';
      console.log(`\n🔍 Searching Reddit for: "${query}"`);

      const reddit = this.manager.getScraper('reddit');
      const listings = await reddit.searchWatch(query, { limit: 5 });

      console.log(`\n✅ SUCCESS! Found ${listings.length} matching listings\n`);

      if (listings.length > 0) {
        console.log('Search Results:');
        console.log('-'.repeat(80));

        listings.forEach((listing, i) => {
          console.log(`\n${i + 1}. ${listing.title}`);
          console.log(`   Price: ${listing.currency} ${listing.price || 'N/A'}`);
          console.log(`   Condition: ${listing.condition}`);
          console.log(`   URL: ${listing.url}`);
        });

        console.log('\n' + '-'.repeat(80));
      }

      return listings;
    } catch (error) {
      console.log(`\n❌ FAILED: ${error.message}\n`);
      console.error(error.stack);
      return [];
    }
  }

  async testEbay() {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 TEST 3: eBay Watch Scraper');
    console.log('='.repeat(80));

    try {
      const query = 'Seiko SKX007';
      console.log(`\n📡 Searching eBay for: "${query}"`);

      const result = await this.manager.scrapeSource('ebay', query, {
        condition: 'all',
        sort: 'BestMatch',
        page: 1
      });

      const listings = result.listings || [];
      console.log(`\n✅ SUCCESS! Found ${listings.length} listings\n`);

      if (listings.length > 0) {
        console.log('Sample Listings:');
        console.log('-'.repeat(80));

        listings.slice(0, 3).forEach((listing, i) => {
          console.log(`\n${i + 1}. ${listing.title}`);
          console.log(`   Brand: ${listing.brand}`);
          console.log(`   Price: ${listing.currency} ${listing.price}`);
          console.log(`   Condition: ${listing.condition}`);
          console.log(`   Location: ${listing.location}`);
          console.log(`   URL: ${listing.url}`);
        });

        console.log('\n' + '-'.repeat(80));
      }

      this.results.ebay = { success: true, count: listings.length };
      return listings;
    } catch (error) {
      console.log(`\n❌ FAILED: ${error.message}\n`);
      console.error(error.stack);
      this.results.ebay = { success: false, error: error.message };
      return [];
    }
  }

  async testWatchUSeek() {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 TEST 4: WatchUSeek Forum Scraper');
    console.log('='.repeat(80));

    try {
      console.log('\n📡 Scraping WatchUSeek Sales Corner...');

      const result = await this.manager.scrapeSource('watchuseek', null, {
        page: 1
      });

      const listings = result.listings || [];
      console.log(`\n✅ SUCCESS! Found ${listings.length} listings\n`);

      if (listings.length > 0) {
        console.log('Sample Listings:');
        console.log('-'.repeat(80));

        listings.slice(0, 3).forEach((listing, i) => {
          console.log(`\n${i + 1}. ${listing.title}`);
          console.log(`   Brand: ${listing.brand}`);
          console.log(`   Price: ${listing.currency} ${listing.price || 'N/A'}`);
          console.log(`   Condition: ${listing.condition}`);
          console.log(`   Seller: ${listing.seller}`);
          console.log(`   URL: ${listing.url}`);
        });

        console.log('\n' + '-'.repeat(80));
      }

      this.results.watchuseek = { success: true, count: listings.length };
      return listings;
    } catch (error) {
      console.log(`\n❌ FAILED: ${error.message}\n`);
      console.error(error.stack);
      this.results.watchuseek = { success: false, error: error.message };
      return [];
    }
  }

  async testSearchAllSources() {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 TEST 5: Search All Sources for Specific Watch');
    console.log('='.repeat(80));

    try {
      const brand = 'Omega';
      const model = 'Speedmaster';
      console.log(`\n🔍 Searching all sources for: ${brand} ${model}`);

      const result = await this.manager.searchWatch(brand, model, {
        reddit: { limit: 5 },
        ebay: { page: 1, condition: 'all' },
        watchuseek: { page: 1 }
      });

      console.log(`\n✅ SUCCESS! Total found: ${result.stats.total} listings\n`);

      console.log('Results by Source:');
      console.log('-'.repeat(80));
      for (const [source, data] of Object.entries(result.sources)) {
        const status = data.success ? '✅' : '❌';
        console.log(`${status} ${source}: ${data.count} listings`);
      }

      if (result.stats.priceRange.average) {
        console.log('\n💰 Price Analysis:');
        console.log(`   Min: $${result.stats.priceRange.min.toFixed(2)}`);
        console.log(`   Max: $${result.stats.priceRange.max.toFixed(2)}`);
        console.log(`   Average: $${result.stats.priceRange.average.toFixed(2)}`);
      }

      console.log('\n' + '-'.repeat(80));

      return result;
    } catch (error) {
      console.log(`\n❌ FAILED: ${error.message}\n`);
      console.error(error.stack);
      return null;
    }
  }

  async testDatabaseSave() {
    console.log('\n' + '='.repeat(80));
    console.log('🔬 TEST 6: Save Listings to Database');
    console.log('='.repeat(80));

    try {
      console.log('\n💾 Testing database save functionality...');

      // Create a test listing
      const testListing = {
        source: 'test',
        title: '[WTS] Test Watch - $500',
        price: 500,
        currency: 'USD',
        brand: 'Test Brand',
        model: 'Test Model',
        condition: 'new',
        location: 'USA',
        url: `https://test.com/listing/${Date.now()}`,
        images: ['https://example.com/image.jpg'],
        seller: 'test_seller',
        timestamp: new Date(),
        raw_data: { test: true }
      };

      let result;
      if (supabase.isAvailable()) {
        console.log('Using Supabase database...');
        result = await supabase.addWatchListing(testListing);
      } else {
        console.log('Using local JSON storage...');
        result = await localWatchListings.addWatchListing(testListing);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log(`\n✅ SUCCESS! Saved test listing with ID: ${result.data[0].id}`);

      // Try to fetch it back
      console.log('\n📖 Fetching listings from database...');

      let fetchResult;
      if (supabase.isAvailable()) {
        fetchResult = await supabase.getWatchListings({ limit: 5 });
      } else {
        fetchResult = await localWatchListings.getWatchListings({ limit: 5 });
      }

      console.log(`Found ${fetchResult.data.length} total listings in database\n`);

      return result.data[0];
    } catch (error) {
      console.log(`\n❌ FAILED: ${error.message}\n`);
      console.error(error.stack);
      return null;
    }
  }

  async showStatistics() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Scraper Statistics');
    console.log('='.repeat(80));

    const stats = this.manager.getStats();

    for (const [source, data] of Object.entries(stats)) {
      console.log(`\n${data.name}:`);
      console.log(`  Requests: ${data.requests}`);
      console.log(`  Successes: ${data.successes}`);
      console.log(`  Failures: ${data.failures}`);
      console.log(`  Success Rate: ${data.successRate}`);
      console.log(`  Last Run: ${data.lastRun || 'Never'}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  async showDatabaseStats() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Database Statistics');
    console.log('='.repeat(80));

    try {
      if (supabase.isAvailable()) {
        console.log('\nUsing: Supabase PostgreSQL');
        const result = await supabase.getWatchListings({ limit: 1000 });
        const listings = result.data || [];

        console.log(`\nTotal Listings: ${listings.length}`);

        // Count by source
        const bySources = {};
        listings.forEach(l => {
          bySources[l.source] = (bySources[l.source] || 0) + 1;
        });

        console.log('\nBy Source:');
        for (const [source, count] of Object.entries(bySources)) {
          console.log(`  ${source}: ${count}`);
        }
      } else {
        console.log('\nUsing: Local JSON Storage');
        const stats = await localWatchListings.getStats();

        console.log(`\nTotal Listings: ${stats.total}`);

        console.log('\nBy Source:');
        for (const [source, count] of Object.entries(stats.bySources)) {
          console.log(`  ${source}: ${count}`);
        }

        if (stats.priceRange.average) {
          console.log('\nPrice Range:');
          console.log(`  Min: $${stats.priceRange.min}`);
          console.log(`  Max: $${stats.priceRange.max}`);
          console.log(`  Avg: $${stats.priceRange.average.toFixed(2)}`);
        }
      }

      console.log('\n' + '='.repeat(80));
    } catch (error) {
      console.log(`\nError: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(80));

    const tests = [
      { name: 'Reddit Scraper', result: this.results.reddit },
      { name: 'eBay Scraper', result: this.results.ebay },
      { name: 'WatchUSeek Scraper', result: this.results.watchuseek }
    ];

    tests.forEach(test => {
      if (!test.result) {
        console.log(`⏭️  ${test.name}: Skipped`);
      } else if (test.result.success) {
        console.log(`✅ ${test.name}: ${test.result.count} listings`);
      } else {
        console.log(`❌ ${test.name}: ${test.result.error}`);
      }
    });

    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function runTests() {
  console.log('\n🧪 MODULAR SCRAPER FRAMEWORK - TEST SUITE');
  console.log('='.repeat(80));
  console.log('Testing all scrapers with live data...\n');

  const tester = new ScraperTester();

  try {
    // Test 1: Reddit (most reliable, API-based)
    await tester.testReddit();
    await sleep(3000);

    // Test 2: Reddit Search
    await tester.testRedditSearch();
    await sleep(3000);

    // Test 3: eBay
    await tester.testEbay();
    await sleep(3000);

    // Test 4: WatchUSeek
    await tester.testWatchUSeek();
    await sleep(3000);

    // Test 5: Search all sources
    await tester.testSearchAllSources();
    await sleep(2000);

    // Test 6: Database save
    await tester.testDatabaseSave();

    // Show statistics
    await tester.showStatistics();
    await tester.showDatabaseStats();

    // Summary
    tester.printSummary();

    console.log('\n✨ All tests completed!\n');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
runTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
