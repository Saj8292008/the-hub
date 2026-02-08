# Twitter Bot Setup Guide

Get The Hub posting deals to Twitter automatically.

---

## Step 1: Create Twitter Developer Account (10 minutes)

### Sign up for Twitter API
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Sign in with your Twitter account (@TheHubDeals or whatever you're using)
3. Click "Sign up for Free Account"
4. Fill out the form:
   - **Use case:** Building a bot to share watch deals
   - **Will you make Twitter content available to government entities:** No
5. Agree to terms and submit

**You'll get approved instantly for Basic tier (free)**

---

## Step 2: Create a Twitter App (5 minutes)

1. In developer portal, click **"Create App"**
2. App name: `TheHubBot` (or whatever)
3. Click **"Keys and tokens"** tab

### Get your credentials:

**API Key & Secret:**
- Click "Generate" under "API Key and Secret"
- Copy both (you'll need these)

**Access Token & Secret:**
- Click "Generate" under "Access Token and Secret"
- Copy both

**You now have 4 keys:**
- API Key (Consumer Key)
- API Secret (Consumer Secret)
- Access Token
- Access Token Secret

---

## Step 3: Configure The Hub (2 minutes)

Add to `/the-hub/.env`:

```bash
# Twitter Bot
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_token_secret_here
```

---

## Step 4: Install Dependencies

```bash
cd /Users/sydneyjackson/the-hub
npm install twitter-api-v2
```

---

## Step 5: Test It

### Test tweet formatting (doesn't actually post):
```bash
node scripts/twitter-bot.js --test
```

### Post one deal (real):
```bash
node scripts/twitter-bot.js --post --max=1
```

### Post all hot deals:
```bash
node scripts/twitter-bot.js --post
```

---

## Step 6: Automate It

### Option A: Cron job (posts 3x per day)

Add to crontab:
```bash
# Post deals at 9am, 2pm, 7pm Central
0 9,14,19 * * * cd /Users/sydneyjackson/the-hub && node scripts/twitter-bot.js --post
```

### Option B: Run manually when you see hot deals

```bash
# Check for hot deals and post
node scripts/twitter-bot.js --post --score=15
```

---

## How It Works

1. **Fetches hot deals** from The Hub API (score >= 12)
2. **Formats as tweets** with price, score, hashtags
3. **Posts to Twitter** via API
4. **Tracks posted deals** to avoid duplicates
5. **Rate limits** - waits 30 seconds between tweets

---

## Tweet Format

```
🔥 Tudor Black Bay 58 Navy Blue

💰 $3,200
⭐ Deal Score: 92/100

https://watchuseek.com/sample4

#WatchDeals #Tudor #Watches #WatchCollector
```

---

## Commands Reference

```bash
# Test (preview without posting)
node scripts/twitter-bot.js --test

# Post up to 3 deals
node scripts/twitter-bot.js --post

# Post deals with score >= 15
node scripts/twitter-bot.js --post --score=15

# Post up to 5 deals
node scripts/twitter-bot.js --post --max=5
```

---

## Twitter Account Setup Tips

### Bio
```
The best watch deals, found for you. 
Daily posts of hot deals on Seiko, Tudor, Omega & more.
Newsletter: [link]
```

### Profile Picture
- Use The Hub logo or watch-related image

### Header Image
- Showcase example deals or watch collection

### Pinned Tweet
```
Welcome to The Hub! 🔥

We scan 10+ sources daily to find the best watch deals.

🎯 Hot deals posted here first
📧 Weekly digest: [newsletter link]
💬 DM us your favorite brands

Recent finds: [thread of 3-4 great deals]
```

---

## Growth Strategy

### Phase 1: Organic (Week 1-2)
- Post 3-5 deals per day
- Use hashtags: #WatchDeals #WatchTwitter #Seiko #Tudor
- Reply to watch collectors
- Follow watch accounts

### Phase 2: Engagement (Week 3-4)
- RT good deals from others
- Reply to mentions
- Run polls ("What brand should we focus on?")
- Build relationships with watch influencers

### Phase 3: Scale (Month 2+)
- Cross-post Reddit finds
- Share price history charts
- "Deal of the week" threads
- Collaborate with watch YouTubers

---

## Expected Results

**Week 1:** 50-100 followers, 5-10 newsletter signups  
**Week 2:** 150-250 followers, 15-20 newsletter signups  
**Month 1:** 500+ followers, 50+ newsletter signups  

---

## Troubleshooting

### "Missing TWITTER_API_KEY"
→ Add all 4 keys to `.env` file

### "403 Forbidden"
→ Your app doesn't have Read and Write permissions
→ Go to app settings → Permissions → Enable "Read and Write"
→ Regenerate access tokens

### "429 Rate Limit"
→ You're posting too fast
→ Twitter limits: 300 tweets per 3 hours
→ We post max 5/day so we're safe

### "Duplicate tweet"
→ Twitter blocks exact duplicates
→ Bot tracks posted deals to avoid this
→ If you see this, it's working correctly

---

## Next: Get Those API Keys!

1. https://developer.twitter.com/en/portal/dashboard
2. Create app
3. Get 4 keys
4. Add to `.env`
5. Run `node scripts/twitter-bot.js --test`

**Let's get The Hub on Twitter! 🚀**
