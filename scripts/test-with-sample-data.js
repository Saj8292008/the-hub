#!/usr/bin/env node

/**
 * Test the content multiplier with sample data (no database required)
 */

const { multiplyContent } = require('./content-multiplier');

console.log('🧪 CONTENT MULTIPLIER - SAMPLE DATA TEST\n');
console.log('=' .repeat(70));

// Sample watch deal
const watchDeal = {
  title: 'Omega Speedmaster Professional Moonwatch',
  price: 4200,
  original_price: 6500,
  category: 'watches',
  source: 'jomashop',
  score: 17,
  url: 'https://jomashop.com/example'
};

console.log('\n📍 WATCH DEAL:');
console.log(JSON.stringify(watchDeal, null, 2));

const watchPosts = multiplyContent(watchDeal);

console.log(`\n✓ Generated ${watchPosts.length} post variations`);
console.log('\nFormat breakdown:');
const watchFormats = watchPosts.reduce((acc, v) => {
  acc[v.format] = (acc[v.format] || 0) + 1;
  return acc;
}, {});
Object.entries(watchFormats).forEach(([format, count]) => {
  console.log(`  ${format}: ${count} posts`);
});

// Show 2 sample posts
console.log('\n📝 SAMPLE WATCH POSTS:');
console.log('-'.repeat(70));

watchPosts.slice(0, 2).forEach(post => {
  console.log(`\n[${post.format}] - ${post.angle}`);
  console.log(`Characters: ${post.charCount}`);
  console.log('-'.repeat(70));
  console.log(post.text);
  console.log('-'.repeat(70));
});

// Sample sneaker deal
const sneakerDeal = {
  title: 'Nike Dunk Low "Panda" Black White',
  price: 140,
  original_price: 220,
  category: 'sneakers',
  source: 'stockx',
  score: 16,
  url: 'https://stockx.com/example'
};

console.log('\n\n📍 SNEAKER DEAL:');
console.log(JSON.stringify(sneakerDeal, null, 2));

const sneakerPosts = multiplyContent(sneakerDeal);

console.log(`\n✓ Generated ${sneakerPosts.length} post variations`);
console.log('\nFormat breakdown:');
const sneakerFormats = sneakerPosts.reduce((acc, v) => {
  acc[v.format] = (acc[v.format] || 0) + 1;
  return acc;
}, {});
Object.entries(sneakerFormats).forEach(([format, count]) => {
  console.log(`  ${format}: ${count} posts`);
});

// Show 2 sample posts
console.log('\n📝 SAMPLE SNEAKER POSTS:');
console.log('-'.repeat(70));

sneakerPosts.slice(0, 2).forEach(post => {
  console.log(`\n[${post.format}] - ${post.angle}`);
  console.log(`Characters: ${post.charCount}`);
  console.log('-'.repeat(70));
  console.log(post.text);
  console.log('-'.repeat(70));
});

console.log('\n\n' + '=' .repeat(70));
console.log('📊 SUMMARY');
console.log('=' .repeat(70));
console.log(`Posts per deal: ${watchPosts.length}`);
console.log(`Total formats: 4 (Instagram, Stories, Engagement, Educational)`);
console.log(`Total angles: 20+ unique hooks per deal`);
console.log('=' .repeat(70));
console.log('\n✨ Test complete!\n');

console.log('💡 Next steps:');
console.log('  1. Run: node content-multiplier.js --title "Product" --price 100 --original 150 --category watches');
console.log('  2. For batch: node content-multiplier-batch.js --dry-run (requires Supabase setup)');
console.log('  3. Check output in: /Users/sydneyjackson/the-hub/content/social/\n');
