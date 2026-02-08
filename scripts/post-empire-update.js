#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const empireChannelId = process.env.TELEGRAM_EMPIRE_CHANNEL_ID;

const message = `🤖 **AGENT ARMY STATUS REPORT**

**Active Agents:**
✅ Instagram Bot - Posting deals with images
✅ Telegram Bot - Online & posting
✅ Deal Finder - Scanning 1,220 listings
✅ Health Monitor - Running checks

**Today's Activity:**
📸 Instagram: 2 posts live (@sydney51952)
📱 Telegram: Deal posting active
🔍 Hot Deals Found: 5 (score ≥70)

**Next Actions:**
• Auto-post every 30 minutes
• Evening engagement (6pm)
• Daily empire report (9pm)

🔥 The empire runs 24/7 now!`;

async function post() {
  console.log('📢 Posting empire update to @thehubempire...\n');
  try {
    const result = await bot.sendMessage(empireChannelId, message, { parse_mode: 'Markdown' });
    console.log('✅ Posted successfully!');
    console.log(`   Message ID: ${result.message_id}`);
    console.log(`\n🎉 Check @thehubempire now!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

post().then(() => process.exit(0));
