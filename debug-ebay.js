#!/usr/bin/env node

/**
 * Debug eBay scraper - fetch HTML and inspect selectors
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function debugEbay() {
  console.log('🔍 Debugging eBay scraper...\n');
  
  const query = 'luxury watch';
  const searchUrl = 'https://www.ebay.com/sch/i.html';
  const params = new URLSearchParams({
    '_nkw': query,
    '_sop': '12', // Best Match
    '_pgn': '1'
  });
  
  const url = `${searchUrl}?${params.toString()}`;
  console.log(`📡 Fetching: ${url}\n`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📦 Content length: ${response.data.length} bytes\n`);
    
    const $ = cheerio.load(response.data);
    
    // Check for different possible selectors
    console.log('🔎 Checking selectors:');
    console.log(`  .s-item: ${$('.s-item').length} elements`);
    console.log(`  .s-item--watch-at-corner: ${$('.s-item--watch-at-corner').length} elements`);
    console.log(`  .srp-results: ${$('.srp-results').length} elements`);
    console.log(`  ul.srp-results li: ${$('ul.srp-results li').length} elements`);
    console.log(`  .s-item__info: ${$('.s-item__info').length} elements`);
    console.log(`  [data-view="mi:1686|iid:1"]: ${$('[data-view="mi:1686|iid:1"]').length} elements`);
    
    // Try to find the actual item container
    console.log('\n📋 Looking for common item containers:');
    const possibleContainers = [
      'li.s-item',
      'div.s-item',
      'article',
      '[data-view]',
      '.srp-river-results li',
      'ul li[data-item]'
    ];
    
    possibleContainers.forEach(selector => {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`  ✅ ${selector}: ${count} elements`);
        
        // Sample first item
        const first = $(selector).first();
        console.log(`     Sample classes: ${first.attr('class')}`);
        
        // Look for title
        const title = first.find('h3, .s-item__title, [role="heading"]').first().text().trim();
        if (title) {
          console.log(`     Sample title: ${title.substring(0, 60)}...`);
        }
        
        // Look for price
        const price = first.find('.s-item__price, [class*="price"]').first().text().trim();
        if (price) {
          console.log(`     Sample price: ${price}`);
        }
      }
    });
    
    // Save a snippet of HTML for manual inspection
    console.log('\n💾 Saving HTML snippet...');
    const snippet = $('body').html().substring(0, 5000);
    require('fs').writeFileSync('/Users/sydneyjackson/the-hub/ebay-debug.html', snippet);
    console.log('   Saved to ebay-debug.html');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Headers:`, error.response.headers);
    }
  }
}

debugEbay().catch(console.error);
