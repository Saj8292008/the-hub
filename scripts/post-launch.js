const https = require('https');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const message = `🚀 The Hub is now LIVE!

Check it out: https://the-hub-psi.vercel.app

Track deals on watches, sneakers, cars & more.

Features:
✅ Real-time price alerts
✅ Deal scoring
✅ Multi-marketplace search
✅ 100% free tier

Let us know what you think! 👇`;

const url = `https://api.telegram.org/bot${token}/sendMessage`;
const data = JSON.stringify({ chat_id: channelId, text: message });

const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(JSON.parse(body).ok ? '✅ Posted launch announcement to Telegram!' : body));
});
req.write(data);
req.end();
