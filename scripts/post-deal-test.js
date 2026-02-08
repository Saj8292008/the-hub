#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const deal = {
  title: 'Tudor Black Bay 58 Navy Blue',
  price: 3200,
  deal_score: 92,
  source: 'watchuseek',
  url: 'https://watchuseek.com/sample'
};

const message = `🔥 **HOT DEAL ALERT!**

**${deal.title}**

💰 Price: $${deal.price.toLocaleString()}
⭐ Deal Score: ${deal.deal_score}/100
📍 Source: ${deal.source}

🔗 [View Deal](${deal.url})

#thehubdeals #watches #dealoftheday`;

async function post() {
  console.log('📢 Posting to Telegram...\n');
  try {
    const result = await bot.sendMessage(channelId, message, { parse_mode: 'Markdown' });
    console.log('✅ Posted successfully!');
    console.log(`   Message ID: ${result.message_id}`);
    console.log(`\n🎉 THE AGENT ARMY IS AWAKE! Check @thehubempire now!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

post().then(() => process.exit(0));
