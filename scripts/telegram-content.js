/**
 * Telegram Content Library v2
 * Run: node scripts/telegram-content.js [content-type]
 * Types: tip, deal, feature, question, value, market, grail
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

Or let The Hub do it for you 😉`,

    `💡 Watch Tip #2

Gray market vs AD:

Gray market: 15-30% off retail, no warranty
AD: Full warranty, but waitlists for hot models

For sport watches? Gray market wins.
For dress watches? AD relationship matters.`,

    `💡 Sneaker Tip #2

Size matters for resale:

Most profitable sizes: 9-11
Hardest to sell: 7 and below, 14+

Know your exit before you buy 📊`,

    `💡 Negotiation Tip

On Reddit/forums, always ask:
"What's your best price shipped?"

Sellers build in negotiation room. 
You leave money on the table if you don't ask.`
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

Data > gut feeling 🧠`,

    `🔍 Feature Spotlight: Multi-Source Search

One search. Every marketplace.

The Hub checks:
• Reddit (watchexchange, sneakermarket)
• StockX & GOAT
• Chrono24
• Forums

Stop opening 10 tabs. We did it for you.`,

    `📱 Feature Spotlight: Telegram Alerts

Get notified instantly:
• New listings matching your criteria
• Price drops on watched items
• Hot deals (score 8+)

Your phone buzzes. You cop. Simple.`
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

Vote with emoji! 📸 🃏 👜 💻`,

    `🤔 Honest question

What's the most you've saved on a single purchase by being patient?

I'll start: $800 on a Tudor BB58 by waiting 3 weeks.`,

    `📊 Price check

Jordan 4 Black Cat - what are you seeing in your size?

Trying to gauge if StockX prices are accurate rn.`
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

Speed wins. 🏃‍♂️`,

    `💰 The Best Time to Buy Watches

Historically lowest prices:
• January (post-holiday cash crunch)
• August (summer slowdown)
• Right after new model announcements

Worst time: November-December (gift season)`,

    `🧠 Psychology of Pricing

Sellers price at $X,999 for a reason.

$4,999 feels like "4 thousand something"
$5,000 feels like "five thousand dollars"

Always round up mentally. Budget accordingly.`,

    `📉 When to Sell

Best days to list:
• Tuesday-Thursday (people browsing at work)
• 1st and 15th of month (payday)

Worst: Friday night, weekends (people out living life)`
  ],

  market: [
    `📊 Market Watch

Rolex prices are DOWN 15-20% from 2022 peaks.

Good time to buy:
• Submariner
• GMT Master II
• Datejust

Still overpriced:
• Daytona (but cooling)

Buy the dip? 🤔`,

    `👟 Sneaker Market Update

Jordan 1s: Oversaturated, prices soft
Dunks: Dead unless special collab
New Balance: Still hot, 550s everywhere
ASICS: Rising star, Gel-Kayano 14 📈

The hype cycle continues...`,

    `🚗 Car Market Check

Used car prices finally normalizing.

Good deals appearing on:
• 2020-2022 sports cars
• Overproduced luxury SUVs

Still overpriced:
• Manual transmission anything
• JDM imports

Patience paying off for buyers.`,

    `⌚ Watch of the Week

Tudor Black Bay 58

Why it's hot:
• 39mm wears perfect
• In-house movement
• Half the price of Sub

Current market: ~$3,200-3,500
12 months ago: ~$4,000+

Solid entry into luxury.`
  ],

  grail: [
    `✨ Grail Talk

The Omega Speedmaster Professional

Why collectors love it:
• Moon heritage
• Manual wind (purists love this)
• Holds value well

Current market: $5,500-6,500

The "one watch" for many. What's yours?`,

    `✨ Grail Talk

Air Jordan 1 Chicago (1985/2015)

The shoe that started it all.

OG 1985: $15,000+ (museum piece)
2015 Retro: $1,500-2,000
Lost & Found: $300-400

Different vibes, same silhouette. Which would you rock?`,

    `✨ Grail Talk

Porsche 911 (996 generation)

The "unloved" 911:
• Fried egg headlights
• First water-cooled
• Purists hated it

2024: Prices finally rising.
Entry 911 for $30-40k won't last.

Ugly duckling becoming a swan? 🦢`
  ],

  deals: [
    `🔥 DEAL ALERT FORMAT

[Category] Brand Model
💰 Price: $X,XXX (XX% below market)
📍 Source: Reddit/StockX/etc
⏰ Posted: X mins ago
🎯 Score: X/10

[Link]

---
This is a template - real deals posted when found!`,
  ]
};

async function postToTelegram(message) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const data = JSON.stringify({ 
      chat_id: channelId, 
      text: message,
      disable_web_page_preview: true
    });

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

// Track what we've posted to avoid repeats
const fs = require('fs');
const postHistoryFile = '/Users/sydneyjackson/the-hub/logs/telegram-post-history.json';

function getPostHistory() {
  try {
    return JSON.parse(fs.readFileSync(postHistoryFile, 'utf8'));
  } catch {
    return { posted: [] };
  }
}

function savePostHistory(history) {
  fs.writeFileSync(postHistoryFile, JSON.stringify(history, null, 2));
}

function hashContent(content) {
  return require('crypto').createHash('md5').update(content).digest('hex').slice(0, 8);
}

async function main() {
  const type = process.argv[2] || 'value';
  
  const contentMap = {
    tip: content.tips,
    tips: content.tips,
    feature: content.features,
    features: content.features,
    question: content.questions,
    questions: content.questions,
    poll: content.questions,
    value: content.value,
    market: content.market,
    grail: content.grail,
    deal: content.deals,
    deals: content.deals
  };

  const posts = contentMap[type];
  if (!posts) {
    console.log('Available types: tip, feature, question, value, market, grail, deal');
    process.exit(1);
  }

  // Get history and filter out already posted
  const history = getPostHistory();
  const availablePosts = posts.filter(p => !history.posted.includes(hashContent(p)));

  if (availablePosts.length === 0) {
    console.log('All content in this category has been posted. Resetting...');
    // Reset this category
    posts.forEach(p => {
      const idx = history.posted.indexOf(hashContent(p));
      if (idx > -1) history.posted.splice(idx, 1);
    });
    savePostHistory(history);
    availablePosts.push(...posts);
  }

  // Pick random post from available
  const post = availablePosts[Math.floor(Math.random() * availablePosts.length)];
  
  console.log('Posting:', type);
  console.log('---');
  console.log(post);
  console.log('---');
  
  await postToTelegram(post);

  // Save to history
  history.posted.push(hashContent(post));
  savePostHistory(history);
}

main().catch(console.error);
