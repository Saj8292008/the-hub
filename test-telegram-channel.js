/**
 * Test Telegram Channel Posting
 * Run this to verify bot can post to @TheHubDeals channel
 */

require('dotenv').config();
const telegram = require('./src/bot/telegram');

// Test deal
const testDeal = {
  id: 'test-123',
  title: 'Rolex Submariner Date',
  brand: 'Rolex',
  model: 'Submariner',
  price: 8500,
  original_price: 12000,
  deal_score: 9.2,
  url: 'https://example.com/deal',
  source: 'Test',
  category: 'watches',
  image_url: null
};

console.log('🧪 Testing Telegram channel posting...');
console.log(`📺 Channel: ${process.env.TELEGRAM_CHANNEL_ID}`);
console.log(`🤖 Bot: @${process.env.TELEGRAM_BOT_USERNAME}`);
console.log('');

telegram.postDealToChannel(testDeal)
  .then(result => {
    if (result && result.success) {
      console.log('✅ SUCCESS! Deal posted to channel!');
      console.log(`🔗 Check your channel: https://t.me/TheHubDeals`);
    } else {
      console.log('❌ FAILED to post to channel');
      console.log('Error:', result ? result.error : 'Unknown error');
      console.log('');
      console.log('⚠️  Make sure:');
      console.log('1. Channel @TheHubDeals exists');
      console.log('2. Bot @TheHubDealBot is added as administrator');
      console.log('3. Bot has "Post Messages" permission');
    }
    process.exit(result && result.success ? 0 : 1);
  })
  .catch(error => {
    console.log('❌ ERROR:', error.message);
    process.exit(1);
  });
