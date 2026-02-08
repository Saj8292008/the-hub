#!/usr/bin/env node
/**
 * Generate Deal Insights
 * Run: node scripts/generate-insights.js [--post]
 * 
 * Without --post: Just prints insights
 * With --post: Posts to Telegram channel
 */

require('dotenv').config();
const DealInsightsService = require('../src/services/analytics/DealInsightsService');
const https = require('https');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@hubtest123';

async function postToTelegram(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: CHANNEL_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    const req = https.request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const r = JSON.parse(body);
        if (r.ok) resolve(r);
        else reject(new Error(body));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const shouldPost = process.argv.includes('--post');
  
  console.log('📊 Generating deal insights...\n');
  
  const service = new DealInsightsService();
  
  try {
    const { message, data } = await service.generateTelegramInsights();
    
    console.log('='.repeat(50));
    console.log(message);
    console.log('='.repeat(50));
    
    console.log('\n📈 Full Data:');
    console.log(JSON.stringify(data.summary, null, 2));
    console.log('\nSources:', data.sources);
    console.log('Price ranges:', data.priceRanges);
    
    if (shouldPost) {
      console.log('\n📤 Posting to Telegram...');
      await postToTelegram(message);
      console.log('✅ Posted!');
    } else {
      console.log('\n💡 Run with --post to send to Telegram');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
