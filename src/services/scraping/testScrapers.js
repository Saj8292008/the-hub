require('dotenv').config();
const proxyManager = require('./proxyManager');
const Chrono24ScraperV2 = require('./chrono24ScraperV2');
const logger = require('../../utils/logger');

/**
 * Test script for free tier scraping services
 */
async function testScrapers() {
  console.log('🧪 Testing Free Tier Scraping Services\n');
  console.log('=' .repeat(60));

  // Check configuration
  console.log('\n📋 Configuration Check:');
  console.log('-'.repeat(60));

  const scraperApiConfigured = !!process.env.SCRAPERAPI_KEY;
  const apifyConfigured = !!process.env.APIFY_TOKEN;
  const crawlbaseConfigured = !!process.env.CRAWLBASE_TOKEN;

  console.log(`ScraperAPI: ${scraperApiConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Apify:      ${apifyConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Crawlbase:  ${crawlbaseConfigured ? '✅ Configured' : '❌ Not configured'}`);

  if (!scraperApiConfigured && !apifyConfigured && !crawlbaseConfigured) {
    console.log('\n❌ No services configured!');
    console.log('\nPlease sign up for free tiers and add API keys to .env:');
    console.log('  - SCRAPERAPI_KEY=your_key');
    console.log('  - APIFY_TOKEN=your_token');
    console.log('  - CRAWLBASE_TOKEN=your_token');
    console.log('\nSee FREE-TIER-SETUP.md for instructions.');
    process.exit(1);
  }

  // Test 1: Direct proxy manager test
  console.log('\n\n🔬 Test 1: Proxy Manager');
  console.log('-'.repeat(60));

  try {
    console.log('Testing with simple website...');
    const result = await proxyManager.scrape('https://httpbin.org/html', {
      javascript: false
    });

    console.log(`✅ Success! Service used: ${result.service}`);
    console.log(`   HTML length: ${result.html.length} characters`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }

  // Test 2: Chrono24 scraper
  console.log('\n\n🔬 Test 2: Chrono24 Scraper');
  console.log('-'.repeat(60));

  const scraper = new Chrono24ScraperV2();

  try {
    console.log('Searching for: Rolex Submariner...\n');

    const priceData = await scraper.fetchPrice('Rolex', 'Submariner', '116610LN');

    if (priceData) {
      console.log('\n✅ SUCCESS! Watch data retrieved:');
      console.log(JSON.stringify(priceData, null, 2));
    } else {
      console.log('\n⚠️  No data found (might need better selectors)');
    }
  } catch (error) {
    console.log(`\n❌ Failed: ${error.message}`);
  }

  // Usage stats
  console.log('\n\n📊 Usage Statistics');
  console.log('-'.repeat(60));

  const stats = proxyManager.getStats();

  for (const [service, data] of Object.entries(stats)) {
    const percentage = ((data.used / data.limit) * 100).toFixed(1);
    console.log(`${data.name}:`);
    console.log(`  Used: ${data.used} / ${data.limit} (${percentage}%)`);
    console.log(`  Remaining: ${data.remaining}`);
    console.log(`  Failures: ${data.failures}`);
    console.log('');
  }

  console.log('=' .repeat(60));
  console.log('\n✨ Testing complete!\n');
}

// Run tests
testScrapers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
