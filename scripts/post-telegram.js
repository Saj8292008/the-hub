const https = require('https');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID || '@hubtest123';

const message = `🚀 The Hub is LIVE!

Your one-stop dashboard for deals on:
⌚ Watches - Reddit, Chrono24, WatchUSeek
👟 Sneakers - StockX, GOAT price tracking
🚗 Cars - Enthusiast vehicle deals
🏆 Sports - Scores + memorabilia

✅ Real-time price alerts
✅ Deal scoring algorithm
✅ Weekly digest newsletter
✅ 100% Free tier

Never miss a deal again 🔥`;

const url = `https://api.telegram.org/bot${token}/sendMessage`;
const data = JSON.stringify({ chat_id: channelId, text: message });

const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const r = JSON.parse(body);
    console.log(r.ok ? '✅ Posted to Telegram channel!' : 'Error: ' + body);
  });
});
req.write(data);
req.end();
