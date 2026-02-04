# Twitter/X Launch Plan

## Account Setup

**Handle:** @thehubdeals (or @hubdeals if taken)
**Name:** The Hub | Watch & Sneaker Deals
**Bio:** 
```
Finding watch, sneaker & car deals so you don't have to.
🔔 Real-time alerts
📊 AI-scored deals
🆓 Free Telegram: t.me/thehubdeals
```

**Link:** the-hub-psi.vercel.app
**Header:** Deal collage or The Hub branding
**Profile pic:** Logo or icon

---

## Content Strategy

### Post Types (Daily Mix)

**1. Deal Posts (3-5/day)**
```
🔥 DEAL: Tudor Black Bay 58 - $2,850

📉 15% below market ($3,350)
📍 eBay seller (98% rating)
⚡ These sell fast

[affiliate link]

#watches #tudor #deals
```

**2. Market Takes (1/day)**
```
Grey market Speedmasters are sitting right now.

If you've been waiting to buy one, this is the window.

Price data from the last 30 days 📊
```

**3. Engagement (2-3/day)**
- Quote tweet interesting listings
- Reply to watch/sneaker posts
- Ask questions to followers

**4. Thread (1/week)**
```
Everything I know about finding watch deals 🧵

1/ Most people check StockX and call it a day. Here's why that's leaving money on the table...
```

---

## Auto-Post Setup

### Option 1: IFTTT/Zapier
- Trigger: New deal posted to Telegram
- Action: Tweet with template

### Option 2: Custom Script
Add to `/scripts/post-to-twitter.js`:
- Use Twitter API v2
- Post when deal score >= 12
- Include affiliate link
- Add relevant hashtags

### Tweet Template
```javascript
const tweetTemplate = (deal) => `
🔥 ${deal.category.toUpperCase()} DEAL

${deal.brand} ${deal.model}
💰 $${deal.price} (${deal.discount}% off)
📍 ${deal.source}

${deal.affiliateUrl}

#${deal.category} #deals
`;
```

---

## Growth Tactics

### Week 1: Foundation
- [ ] Create account
- [ ] Follow 50 relevant accounts (watch collectors, sneaker accounts)
- [ ] Post 3-5 deals daily
- [ ] Reply to 10 posts daily

### Week 2-4: Engagement
- [ ] Quote tweet interesting listings with takes
- [ ] Run a poll ("What's your grail watch?")
- [ ] First thread on deal hunting
- [ ] DM micro-influencers about collaboration

### Month 2+: Scale
- [ ] Automate deal posting
- [ ] Weekly threads
- [ ] Collaborate with collectors
- [ ] Consider Twitter Ads test

---

## Accounts to Follow/Engage

### Watches
- @teddy_baldassare
- @hodinkee
- @watchesbysjx
- @fratellowatches
- @wornandwound

### Sneakers
- @snaborhood
- @sneakernews
- @nicekicks
- @solecollector

### Deals/Resale
- @stockx
- @goloaded
- Deal alert accounts

---

## Hashtags to Use

**Watches:**
#watches #watchdeals #horology #rolex #omega #tudor #seiko #watchcollector #wristwatch #greymarket

**Sneakers:**
#sneakers #sneakerdeals #kicks #jordans #nike #sneakerhead #kicksoftheday

**General:**
#deals #steals #resale #flipping

---

## Do's and Don'ts

**Do:**
- Post consistently (3-5x/day)
- Engage genuinely
- Share actual value (price data, trends)
- Use visuals when possible
- Cross-promote Telegram

**Don't:**
- Spam pure affiliate links
- Auto-DM followers
- Be salesy
- Ignore replies
- Post without context

---

## Metrics to Track

- Followers (goal: 500 in month 1)
- Engagement rate (likes/retweets per post)
- Link clicks to Telegram
- Affiliate clicks from Twitter
