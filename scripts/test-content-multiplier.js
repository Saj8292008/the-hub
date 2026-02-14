#!/usr/bin/env node

/**
 * Test script to demonstrate content multiplier output
 */

const { multiplyContent } = require('./content-multiplier');

console.log('🧪 CONTENT MULTIPLIER TEST\n');
console.log('=' .repeat(70));

// Test 1: Watch deal
console.log('\n📍 TEST 1: WATCH DEAL');
console.log('=' .repeat(70));

const watchDeal = {
  title: 'Rolex Submariner Date 116610LN',
  price: 8500,
  original_price: 12000,
  category: 'watches',
  source: 'chrono24',
  score: 18,
  url: 'https://chrono24.com/example'
};

console.log('\nInput Deal:');
console.log(JSON.stringify(watchDeal, null, 2));

const watchVariations = multiplyContent(watchDeal);

console.log(`\n✓ Generated ${watchVariations.length} variations`);
console.log('\nFormat breakdown:');
const watchFormats = watchVariations.reduce((acc, v) => {
  acc[v.format] = (acc[v.format] || 0) + 1;
  return acc;
}, {});
Object.entries(watchFormats).forEach(([format, count]) => {
  console.log(`  ${format}: ${count} posts`);
});

console.log('\n📝 SAMPLE POSTS:');
console.log('-'.repeat(70));

// Show one of each format type
const sampleFormats = ['instagram_caption', 'story_short', 'engagement', 'educational'];
sampleFormats.forEach(format => {
  const sample = watchVariations.find(v => v.format === format);
  if (sample) {
    console.log(`\n[${sample.format.toUpperCase()}] - ${sample.angle}`);
    console.log(`Character count: ${sample.charCount}`);
    console.log('-'.repeat(70));
    console.log(sample.text);
    console.log('-'.repeat(70));
  }
});

// Test 2: Sneaker deal
console.log('\n\n📍 TEST 2: SNEAKER DEAL');
console.log('=' .repeat(70));

const sneakerDeal = {
  title: 'Nike Dunk Low "Panda" Black White',
  price: 140,
  original_price: 220,
  category: 'sneakers',
  source: 'stockx',
  score: 16,
  url: 'https://stockx.com/example'
};

console.log('\nInput Deal:');
console.log(JSON.stringify(sneakerDeal, null, 2));

const sneakerVariations = multiplyContent(sneakerDeal);

console.log(`\n✓ Generated ${sneakerVariations.length} variations`);
console.log('\nFormat breakdown:');
const sneakerFormats = sneakerVariations.reduce((acc, v) => {
  acc[v.format] = (acc[v.format] || 0) + 1;
  return acc;
}, {});
Object.entries(sneakerFormats).forEach(([format, count]) => {
  console.log(`  ${format}: ${count} posts`);
});

console.log('\n📝 SAMPLE POSTS:');
console.log('-'.repeat(70));

// Show different samples for sneakers
sampleFormats.forEach(format => {
  const sample = sneakerVariations.find(v => v.format === format);
  if (sample) {
    console.log(`\n[${sample.format.toUpperCase()}] - ${sample.angle}`);
    console.log(`Character count: ${sample.charCount}`);
    console.log('-'.repeat(70));
    console.log(sample.text);
    console.log('-'.repeat(70));
  }
});

// Summary
console.log('\n\n' + '=' .repeat(70));
console.log('📊 SUMMARY');
console.log('=' .repeat(70));
console.log(`Total variations per deal: ${watchVariations.length}`);
console.log(`\nPost types:`);
console.log(`  - Instagram Captions: 5 (with hashtags, full-length)`);
console.log(`  - Story Short-form: 5 (under 100 chars)`);
console.log(`  - Engagement Posts: 5 (questions, polls, CTAs)`);
console.log(`  - Educational Posts: 5 (market context, insights)`);
console.log(`\nAngles covered:`);
console.log(`  ✓ Price drop alerts`);
console.log(`  ✓ FOMO/urgency`);
console.log(`  ✓ Educational/market context`);
console.log(`  ✓ Comparisons`);
console.log(`  ✓ Deal score analysis`);
console.log(`  ✓ Engagement questions`);
console.log(`  ✓ Price history insights`);
console.log('=' .repeat(70));
console.log('\n✨ Test complete!\n');
