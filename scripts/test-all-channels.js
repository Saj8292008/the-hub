#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

const channels = [
  { name: '@TheHubDeals', id: '-1001846110501' },
  { name: '@thehubempire', id: '-1003884685341' },
  { name: '@hubtest123', id: '-1003850293697' }
];

async function testAll() {
  console.log('🔍 Testing all channels...\n');
  
  for (const channel of channels) {
    try {
      const result = await bot.sendMessage(channel.id, '🔥 Test post from The Hub Bot!');
      console.log(`✅ ${channel.name} - SUCCESS!`);
      console.log(`   Message ID: ${result.message_id}\n`);
    } catch (error) {
      console.log(`❌ ${channel.name} - FAILED`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

testAll().then(() => process.exit(0));
