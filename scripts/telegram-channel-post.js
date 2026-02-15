#!/usr/bin/env node
/**
 * telegram-channel-post.js — Post to @hubtest123 via The Hub Deal Bot
 * 
 * Usage:
 *   node scripts/telegram-channel-post.js "Your message here"
 *   echo "message" | node scripts/telegram-channel-post.js --stdin
 * 
 * This uses The Hub Deal Bot (8432859549) which is an admin of @hubtest123.
 * The Clawdbot message tool uses a different bot token (Syd's personal bot),
 * which is NOT a member of the channel — hence the 403 errors.
 */

require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8432859549:AAGOHwCl_57vYMsbCqeeZQc7Z6CnbZNh_s0';
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@hubtest123';

async function postToChannel(text, options = {}) {
  const payload = {
    chat_id: CHANNEL_ID,
    text,
    parse_mode: options.parseMode || 'HTML',
    disable_web_page_preview: options.disablePreview || false,
  };

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('❌ Failed to post:', data.description);
    process.exit(1);
  }

  console.log(`✅ Posted to ${CHANNEL_ID} (message_id: ${data.result.message_id})`);
  return data.result;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--stdin')) {
    let input = '';
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => postToChannel(input.trim()));
  } else if (args.length > 0) {
    postToChannel(args.join(' '));
  } else {
    console.log('Usage: node telegram-channel-post.js "message"');
    console.log('       echo "message" | node telegram-channel-post.js --stdin');
    process.exit(1);
  }
}

module.exports = { postToChannel, BOT_TOKEN, CHANNEL_ID };
