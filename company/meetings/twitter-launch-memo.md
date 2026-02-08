# Twitter Launch - Marketing Team Memo

**From:** Jay (CTO) on behalf of Syd (CEO)  
**To:** Marcus (Growth), Nina (Content)  
**Date:** February 6, 2026  
**Subject:** Twitter is now mandatory - bot built and ready

---

## Executive Summary

**Reddit failed.** CAPTCHAs, strict moderation, manual posting grind.

**Twitter is our new primary channel.** Effective immediately.

**The infrastructure is ready.** Bot is built, docs are written, just need API keys.

---

## What I Built (Past 30 Minutes)

✅ **Twitter bot** (`/scripts/twitter-bot.js`)
- Auto-posts hot deals from The Hub API
- Formats tweets perfectly (emoji, price, score, hashtags)
- Tracks posted deals (no duplicates)
- Rate limiting built-in (30 sec between posts)

✅ **Setup guide** (`/TWITTER-SETUP.md`)
- Step-by-step API key instructions
- Account setup tips
- Growth strategy
- Troubleshooting

✅ **Company mandate** (`/company/strategy/twitter-mandate.md`)
- Official directive from Syd
- Goals: 10 signups in 7 days
- Team assignments

✅ **Dependencies installed**
- twitter-api-v2 package ready

---

## What You Need to Do (Syd)

### 1. Get Twitter API Keys (10 minutes)
https://developer.twitter.com/en/portal/dashboard

Sign up → Create app → Get 4 keys:
- API Key
- API Secret
- Access Token
- Access Token Secret

### 2. Add to `.env`
```bash
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
```

### 3. Test it
```bash
node scripts/twitter-bot.js --test
```

### 4. Go live
```bash
node scripts/twitter-bot.js --post
```

---

## Tweet Format (Automated)

```
🔥 Tudor Black Bay 58 Navy Blue

💰 $3,200
⭐ Deal Score: 92/100

https://watchuseek.com/sample4

#WatchDeals #Tudor #Watches #WatchCollector
```

Clean, eye-catching, drives clicks.

---

## Growth Projection

**Week 1:**
- 3-5 tweets/day
- 50-100 followers
- 5-10 newsletter signups

**Week 2:**
- Engagement starts building
- 150-250 followers
- 15-20 signups

**Month 1:**
- 500+ followers
- 50+ newsletter signups
- Recognized account in #WatchTwitter

**vs Reddit:** 0 signups, hours wasted, CAPTCHA hell

---

## Why This Will Work

1. **Watch Twitter is active** - #WatchDeals, #WatchTwitter exist
2. **No moderation** - We control our account
3. **Viral potential** - Retweets spread organically
4. **Easy automation** - API actually works
5. **Direct traffic** - Link in bio converts

---

## Automation Schedule (Proposed)

**3x daily:** 9am, 2pm, 7pm Central
- Catches different time zones
- Matches when collectors browse
- Not spammy frequency

**Cron job:**
```bash
0 9,14,19 * * * cd /Users/sydneyjackson/the-hub && node scripts/twitter-bot.js --post
```

---

## Content Strategy (Nina)

**Tweet types to test:**
1. **Hot deal alerts** (automated) - "🔥 Tudor BB58 - $3,200"
2. **Deal threads** (manual) - "5 watches under $500 this week"
3. **Price drops** (automated) - "📉 Seiko Presage now $299 (was $425)"
4. **Polls** (manual) - "Which brand should we focus on?"
5. **Tips** (manual) - "How to spot fake Omegas on eBay"

Mix of automated + manual keeps it human.

---

## Engagement Strategy (Marcus)

**Follow:**
- Watch collectors with >1K followers
- Watch brands
- Deal accounts
- Watch YouTubers

**Engage:**
- RT good deals from others
- Reply to mentions within 1 hour
- Answer questions about deals
- Build relationships

**Goal:** Be THE account watch collectors follow for deals

---

## Metrics Dashboard

Track in `/company/metrics/twitter-growth.md`:
- Daily followers
- Tweet impressions
- Link clicks (to newsletter)
- Newsletter signups (UTM: twitter)
- Engagement rate

**Report weekly to Syd.**

---

## Budget

**Cost:** $0 (Twitter API Basic tier is free)  
**Time to setup:** 15 minutes  
**Time to maintain:** 10 min/day (engagement)  

**ROI:** If we get 10 signups in week 1, that's $0 CAC vs hours wasted on Reddit

---

## Risks & Mitigation

**Risk:** Account gets suspended  
→ **Mitigation:** Follow Twitter rules, no spam, genuine content

**Risk:** No one follows us  
→ **Mitigation:** Engage first, follow watch accounts, provide value

**Risk:** Deals aren't interesting  
→ **Mitigation:** Only post score >= 12, test different thresholds

---

## Success Criteria (Week 1)

- [ ] Twitter account set up
- [ ] Bot posting 3x/day
- [ ] 50+ followers
- [ ] 5+ newsletter signups from Twitter
- [ ] 0 spam complaints

**If we hit these, double down. If not, adjust strategy.**

---

## Next Actions

**Syd:** Get API keys (takes 10 min)  
**Marcus:** Set up engagement workflow  
**Nina:** Write pinned tweet + bio  
**Jay:** Monitor bot, fix any issues  

**Target:** First tweet posted today.

---

## Bottom Line

Reddit was a dead end. Twitter is wide open.

The bot is built. The strategy is clear. We just need API keys.

**Let's get our first 10 subscribers from Twitter this week.**

---

**Status:** ✅ Ready to launch  
**Blocker:** Twitter API keys  
**ETA to first tweet:** 15 minutes after keys are added
