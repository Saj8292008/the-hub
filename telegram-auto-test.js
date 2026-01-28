/**
 * Auto-retry Telegram posting test
 * Keeps trying every 2 minutes until bot permissions propagate
 */

require('dotenv').config();
const telegram = require('./src/bot/telegram');

let attemptCount = 0;
const maxAttempts = 30; // Try for 1 hour

const testDeal = {
  id: 'launch-test-001',
  title: '✅ THE HUB IS LIVE!',
  brand: 'Launch',
  model: 'Announcement',
  price: 0,
  original_price: 0,
  deal_score: 10.0,
  url: 'https://thehub.com',
  source: 'The Hub Team',
  category: 'watches',
  image_url: null
};

console.log('🤖 Telegram Auto-Test Started');
console.log('Will retry every 2 minutes until successful');
console.log('Press Ctrl+C to stop\n');

async function testPost() {
  attemptCount++;
  console.log(`[${new Date().toLocaleTimeString()}] Attempt ${attemptCount}/${maxAttempts}...`);

  try {
    const result = await telegram.postDealToChannel(testDeal);

    if (result && result.success) {
      console.log('\n🎉🎉🎉 SUCCESS! 🎉🎉🎉');
      console.log('✅ Bot can now post to @TheHubDeals!');
      console.log('🔗 Check your channel: https://t.me/TheHubDeals\n');
      console.log('Telegram permissions have propagated successfully.');
      console.log('You can now launch with full Telegram support!');
      process.exit(0);
    } else {
      console.log(`   ❌ Still blocked: ${result ? result.error : 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  if (attemptCount >= maxAttempts) {
    console.log('\n⚠️  Max attempts reached (1 hour)');
    console.log('Telegram permissions are taking longer than expected.');
    console.log('Options:');
    console.log('1. Launch without Telegram (comment out TELEGRAM_BOT_TOKEN in .env)');
    console.log('2. Create new test channel and add bot there');
    console.log('3. Contact Telegram support');
    process.exit(1);
  }

  console.log(`   ⏳ Will retry in 2 minutes...\n`);
}

// Test immediately, then every 2 minutes
testPost();
setInterval(testPost, 2 * 60 * 1000);
