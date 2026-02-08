#!/usr/bin/env node
/**
 * Get Telegram Channel IDs
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

async function getChannelIds() {
  console.log('🔍 Getting Telegram Channel IDs...\n');
  
  const channels = [
    '@TheHubDeals',
    '@thehubempire', 
    '@hubtest123'
  ];
  
  for (const channel of channels) {
    try {
      const chat = await bot.getChat(channel);
      console.log(`✅ ${channel}`);
      console.log(`   ID: ${chat.id}`);
      console.log(`   Title: ${chat.title || 'N/A'}`);
      console.log(`   Type: ${chat.type}\n`);
    } catch (error) {
      console.log(`❌ ${channel}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Add these IDs to your .env:');
  console.log('   TELEGRAM_CHANNEL_ID=-100XXXXXXXXX  # @TheHubDeals');
  console.log('   TELEGRAM_EMPIRE_CHANNEL_ID=-100XXXXXXXXX  # @thehubempire');
  console.log('   TELEGRAM_TEST_CHANNEL_ID=-100XXXXXXXXX  # @hubtest123');
  console.log('\n2. To get YOUR chat ID for alerts:');
  console.log('   - Message your bot anything');
  console.log('   - Run: node scripts/get-telegram-ids.js --get-user');
}

getChannelIds()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
