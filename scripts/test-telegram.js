#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const bot = new TelegramBot(token, { polling: false });

async function test() {
  console.log(`🤖 Testing Telegram Bot...`);
  console.log(`📢 Posting to channel: ${channelId}\n`);
  
  const message = `🔥 THE EMPIRE IS AWAKE! 🔥

Your agent army just came online:
✅ Instagram Bot - Posting deals
✅ Telegram Bot - Online now  
✅ Deal Finder - Scanning
✅ Health Monitor - Watching

First automated post from The Hub! 🚀`;

  try {
    const result = await bot.sendMessage(channelId, message);
    console.log(`✅ Message posted successfully!`);
    console.log(`   Message ID: ${result.message_id}`);
    console.log(`\n📱 Check your channel now!`);
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

test().then(() => process.exit(0));
