#!/usr/bin/env node
/**
 * Empire Report - Post team updates to @thehubempire
 * Usage: node empire-report.js <team> <message>
 * Example: node empire-report.js "📊 Analytics" "Morning metrics: 150 users, 45 deals, 12 signups"
 */

require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const EMPIRE_CHANNEL = process.env.TELEGRAM_EMPIRE_CHANNEL_ID || '@thehubempire';

async function postToEmpire(team, message, emoji = '') {
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago'
  });
  
  const text = `${team}\n━━━━━━━━━━━━━━━\n${message}\n\n🕐 ${timestamp} CT`;
  
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: EMPIRE_CHANNEL,
      text: text,
      parse_mode: 'HTML'
    })
  });
  
  const result = await response.json();
  
  if (result.ok) {
    console.log(`✅ Posted to ${EMPIRE_CHANNEL}`);
  } else {
    console.error(`❌ Failed: ${result.description}`);
  }
  
  return result;
}

// CLI usage
const args = process.argv.slice(2);
if (args.length >= 2) {
  const team = args[0];
  const message = args.slice(1).join(' ');
  postToEmpire(team, message);
} else if (args.length === 0) {
  // Test post
  postToEmpire('🧪 Test', 'Empire reporting system online!');
} else {
  console.log('Usage: node empire-report.js "<team>" "<message>"');
  console.log('Example: node empire-report.js "📊 Analytics" "150 users active"');
}

module.exports = { postToEmpire };
