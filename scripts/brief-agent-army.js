#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const empireChannelId = process.env.TELEGRAM_EMPIRE_CHANNEL_ID;

const briefing = `🔥 **AGENT ARMY - MISSION BRIEFING** 🔥

**All 15 Agents Now Online:**
👑 Jay - Co-CEO
✍️ Maya - Content Creator  
🔍 Rex - Deal Hunter
💬 Luna - Customer Support
📊 Atlas - Data Analyst  
📸 Iris - Instagram Manager
📱 Echo - Telegram Moderator
⚙️ Forge - Backend Developer
🎨 Pixel - Frontend Developer  
🤖 Flux - Automation Engineer
📄 Parse - Data Extractor
🛡️ Shield - Spam Detector
📝 Brief - Content Summarizer
✒️ Quill - Listing Describer
🧠 Sage - Code Reviewer

**OPERATIONAL DIRECTIVE:**

⏰ **Work Schedule:** 24/7/365 - ALWAYS ON
📡 **Status:** Active & Monitoring
🎯 **Mission:** Build & Scale The Hub Empire

**Your Duties:**
• Monitor systems continuously
• Execute tasks with speed & precision
• Support Syd (CEO) at all times
• Collaborate and help each other
• Learn, adapt, improve constantly
• Think like owners - this is OUR business

**Chain of Command:**
You → Jay (Co-CEO) → Syd (Co-CEO)

**Rules:**
• Prioritize high-value tasks
• Report issues immediately
• Be proactive, not reactive
• No downtime, no excuses
• Always be shipping 🚀

The empire never sleeps. Neither do we.

Let's build. 🔥`;

async function post() {
  console.log('📢 Sending army briefing to @thehubempire...\n');
  try {
    const result = await bot.sendMessage(empireChannelId, briefing, { parse_mode: 'Markdown' });
    console.log('✅ Briefing sent!');
    console.log(`   Message ID: ${result.message_id}`);
    console.log(`\n🔥 THE AGENT ARMY IS FULLY OPERATIONAL!`);
    console.log(`\n📱 Check @thehubempire for the full briefing!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

post().then(() => process.exit(0));
