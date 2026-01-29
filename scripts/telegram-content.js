/**
 * Telegram Content Library
 * Run: node scripts/telegram-content.js [content-type]
 * Types: tip, deal, feature, question
 */

const https = require('https');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID || '@hubtest123';

const content = {
  tips: [
    `💡 Watch Buying Tip #1

When buying a used Rolex, always check:
• Serial number matches papers
• Bracelet stretch (indicates wear)
• Lume consistency on dial

Save thousands by knowing what to look for 👀`,

    `💡 Sneaker Tip #1

StockX prices usually dip:
• 2-3 weeks after release hype dies
• End of month (people need cash)
• Right before new colorways drop

Patience = savings 💰`,

    `💡 Deal Hunting Tip

The best Reddit deals go FAST.

Set up alerts for keywords like:
• [WTS] + your grail
• "priced to sell"
• "moving sale"

Or let The Hub do it for you 😉`
  ],
  
  features: [
    `🔔 Feature Spotlight: Price Alerts

Set your target price, we do the rest.

Example:
"Alert me when Jordan 1 Chicago drops below $200 in size 10"

You'll get a Telegram ping the moment it happens.

Never miss a deal again ⚡`,

    `📊 Feature Spotlight: Deal Scoring

Not all deals are equal.

The Hub scores every listing based on:
• Price vs market average
• How fast similar items sell  
• Seller reputation

Higher score = better deal. Simple.`,

    `📈 Feature Spotlight: Price History

See how prices move over time.

• Spot trends before buying
• Know if "reduced" is actually reduced
• Time your purchases perfectly

Data > gut feeling 🧠`
  ],

  questions: [
    `🤔 Quick Poll

What's your grail watch under $5k?

Drop it in the comments 👇`,

    `💬 Question for the community

What marketplace do you check FIRST when hunting deals?

A) Reddit
B) eBay  
C) StockX/GOAT
D) Forums
E) Other (comment!)`,

    `🎯 What should we track next?

Current: Watches, Sneakers, Cars, Sports

Ideas:
• Vintage cameras
• Trading cards
• Designer bags
• Tech/electronics

Vote with emoji! 📸 🃏 👜 💻`
  ],

  value: [
    `🔥 Why prices drop on Sundays

Sellers list Thursday/Friday for weekend traffic.

By Sunday, unsold items get price cuts.

Best time to make offers: Sunday 6-9pm

You're welcome 😎`,

    `💎 The 20% Rule

If a watch is priced 20%+ below market, ask yourself:
• Is it stolen?
• Is it fake?
• Is there hidden damage?
• Is the seller desperate?

Only #4 is a good deal. Do your homework.`,

    `⏰ The Early Bird Strategy

New Reddit posts get the most eyes in the first 30 mins.

After that? Buried.

The Hub sends alerts in <5 minutes.

Speed wins. 🏃‍♂️`
  ]
};

async function postToTelegram(message) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const data = JSON.stringify({ chat_id: channelId, text: message });

    const req = https.request(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const r = JSON.parse(body);
        if (r.ok) {
          console.log('✅ Posted to Telegram!');
          resolve(r);
        } else {
          console.log('❌ Error:', body);
          reject(new Error(body));
        }
      });
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  const type = process.argv[2] || 'tip';
  
  const contentMap = {
    tip: content.tips,
    tips: content.tips,
    feature: content.features,
    features: content.features,
    question: content.questions,
    questions: content.questions,
    poll: content.questions,
    value: content.value
  };

  const posts = contentMap[type];
  if (!posts) {
    console.log('Available types: tip, feature, question, value');
    process.exit(1);
  }

  // Pick random post from category
  const post = posts[Math.floor(Math.random() * posts.length)];
  console.log('Posting:', type);
  console.log('---');
  console.log(post);
  console.log('---');
  
  await postToTelegram(post);
}

main().catch(console.error);
