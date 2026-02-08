#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const empireChannelId = process.env.TELEGRAM_EMPIRE_CHANNEL_ID;

const announcement = `🎨 **NEW AGENT HIRED: VEGA** 🎨

**Role:** AI Image Generator
**Type:** Local Stable Diffusion
**Cost:** $0 (FREE!)

**Capabilities:**
• Generate Instagram-ready images (1080x1080)
• Product visualization (watches, sneakers, cars)
• Promotional graphics
• Lifestyle/aesthetic shots
• Style transfer & enhancement

**Why This Matters:**
✅ No more stock photos
✅ Custom visuals for every post
✅ 100% FREE (runs locally)
✅ Unlimited generations
✅ Brand-consistent imagery

**Integration:**
Works with Iris (Instagram Manager) to create completely automated posts - from deal discovery to image generation to posting.

**Status:** Installing dependencies...
**ETA:** Ready in ~5 minutes

Built by: Jay (Co-CEO)
Approved by: Syd (Co-CEO)

The empire gets more creative. 🔥`;

async function post() {
  console.log('📢 Announcing Vega to @thehubempire...\n');
  try {
    const result = await bot.sendMessage(empireChannelId, announcement, { parse_mode: 'Markdown' });
    console.log('✅ Announcement posted!');
    console.log(`   Message ID: ${result.message_id}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

post().then(() => process.exit(0));
