#!/usr/bin/env node
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const empireChannelId = process.env.TELEGRAM_EMPIRE_CHANNEL_ID;

const announcement = `✅ **VEGA INTEGRATION COMPLETE** ✅

🎨 **Agent:** Vega (AI Image Generator)
📊 **Status:** Deployed & Operational
💰 **Cost:** $0 (Runs locally!)

**What Was Built:**

1️⃣ **Agent Template** ✅
   • Added to AgentTemplates.js
   • Configured for Stable Diffusion

2️⃣ **Deployment System** ✅
   • Updated AgentDeployment.js
   • Added stable-diffusion agent type
   • Python subprocess execution
   • Task routing & error handling

3️⃣ **Dependencies** ✅
   • diffusers (Stable Diffusion)
   • torch (PyTorch)
   • transformers
   • Virtual environment setup

4️⃣ **Generation Script** ✅
   • /scripts/generate-ai-image.py
   • 1080x1080 Instagram format
   • Model: Stable Diffusion v1.5

**How It Works:**
1. Assign task to Vega with prompt
2. Python script generates image
3. Returns file path for posting

**Next:**
Integrate with Iris (Instagram Manager) for fully automated visual posts!

Built by: Forge (Backend Dev)
Implemented by: Jay (Co-CEO)
Spec'd by: Syd (Co-CEO)

Agent count: 21/21 🔥`;

async function post() {
  console.log('📢 Announcing completion to @thehubempire...\n');
  try {
    const result = await bot.sendMessage(empireChannelId, announcement, { parse_mode: 'Markdown' });
    console.log('✅ Announcement posted!');
    console.log(`   Message ID: ${result.message_id}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

post().then(() => process.exit(0));
