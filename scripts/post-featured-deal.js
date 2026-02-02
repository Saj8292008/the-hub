#!/usr/bin/env node
/**
 * Post Featured Deal
 * Uses the new copywriter to post engaging content
 * Run: node scripts/post-featured-deal.js [--pin]
 */

require('dotenv').config();
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const DealCopywriter = require('../src/services/content/DealCopywriter');
const BrandDetector = require('../src/services/content/BrandDetector');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const copywriter = new DealCopywriter();
const detector = new BrandDetector();
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@hubtest123';

async function postToTelegram(message, pin = false) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: CHANNEL_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });

    const req = https.request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const r = JSON.parse(body);
        if (r.ok) {
          if (pin && r.result?.message_id) {
            pinMessage(r.result.message_id).then(() => resolve(r)).catch(() => resolve(r));
          } else {
            resolve(r);
          }
        } else {
          reject(new Error(body));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function pinMessage(messageId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: CHANNEL_ID,
      message_id: messageId
    });

    const req = https.request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/pinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const shouldPin = process.argv.includes('--pin');
  const mode = process.argv[2] || 'best';
  
  console.log(`🎯 Finding ${mode} deal to feature...\n`);

  // Get best recent deal
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  
  let query = supabase
    .from('watch_listings')
    .select('*')
    .gte('created_at', since)
    .not('price', 'is', null)
    .gt('price', 100)
    .lt('price', 10000);

  if (mode === 'best') {
    query = query.order('deal_score', { ascending: false });
  } else if (mode === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else if (mode === 'luxury') {
    query = query.gte('price', 2000).order('deal_score', { ascending: false });
  }

  const { data: deals, error } = await query.limit(10);

  if (error || !deals?.length) {
    console.error('No deals found:', error);
    return;
  }

  // Pick the best one that hasn't been posted recently
  const deal = deals[0];
  
  // Improve brand if needed
  if (!deal.brand || deal.brand === 'Unknown') {
    deal.brand = detector.detect(deal.title);
  }

  console.log(`Selected: ${deal.brand} - $${deal.price}`);
  console.log(`Score: ${deal.deal_score}/10`);
  console.log(`Title: ${deal.title?.substring(0, 50)}...\n`);

  // Generate post
  const post = copywriter.generateDealOfTheDay(deal);
  
  console.log('='.repeat(50));
  console.log(post.replace(/<[^>]*>/g, '')); // Strip HTML for preview
  console.log('='.repeat(50));

  // Post it
  console.log('\n📤 Posting to Telegram...');
  try {
    await postToTelegram(post, shouldPin);
    console.log('✅ Posted!' + (shouldPin ? ' (pinned)' : ''));
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

main().catch(console.error);
