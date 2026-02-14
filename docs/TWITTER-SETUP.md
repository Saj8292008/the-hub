# 🐦 Twitter/X Auto-Poster Setup Guide

Complete guide to setting up automated deal posting to Twitter/X for The Hub.

---

## 1. Create a Twitter Developer Account

1. Go to [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with the Twitter/X account you want to post from
3. Click **"Sign up for Free Account"** or apply for **Basic** ($100/mo) or **Pro** ($5,000/mo)
   - **Free tier**: 1,500 tweets/month (read + write), 1 app
   - **Basic tier**: 3,000 tweets/month, better for automation
4. Complete the use case description:
   > "We run an e-commerce deal aggregation platform (The Hub Deals). We want to automatically share hot deals we discover with our followers, including price alerts, market commentary, and weekly roundups."
5. Accept the developer agreement

## 2. Create a Twitter App & Get API Keys

### Create the App
1. In the [Developer Portal](https://developer.twitter.com/en/portal/dashboard), go to **Projects & Apps**
2. Click **"+ Add App"** under your project
3. Name it something like **"The Hub Deal Bot"**
4. Set permissions to **Read and Write**

### Get Your Keys
1. After creating the app, you'll see your **API Key** and **API Secret** — copy them immediately
2. Go to the **"Keys and tokens"** tab
3. Under **"Authentication Tokens"**, generate **Access Token and Secret**
4. Make sure the access token has **Read and Write** permissions

You need all 4 values:
| Key | Description |
|-----|-------------|
| `TWITTER_API_KEY` | App API Key (Consumer Key) |
| `TWITTER_API_SECRET` | App API Secret (Consumer Secret) |
| `TWITTER_ACCESS_TOKEN` | User Access Token |
| `TWITTER_ACCESS_SECRET` | User Access Token Secret |

### Enable OAuth 1.0a
1. Go to your app settings → **User authentication settings** → **Edit**
2. Enable **OAuth 1.0a**
3. Set App permissions to **Read and write**
4. Set Type to **Web App, Automated App or Bot**
5. Set Callback URL to `https://thehubdeals.com/callback` (or `http://localhost:3000/callback` for dev)
6. Set Website URL to `https://thehubdeals.com`

## 3. Configure Environment Variables

Add these to your `/the-hub/.env` file:

```bash
# Twitter/X API Credentials
TWITTER_API_KEY=your-api-key-here
TWITTER_API_SECRET=your-api-secret-here
TWITTER_ACCESS_TOKEN=your-access-token-here
TWITTER_ACCESS_SECRET=your-access-token-secret-here

# Optional settings
TWITTER_SCORE_THRESHOLD=10    # Min deal score to auto-post (default: 10)
DRY_RUN=true                   # Set to false when ready to go live
```

## 4. Install Dependencies

The script uses `twitter-api-v2` (should already be in package.json):

```bash
cd /Users/sydneyjackson/the-hub
npm install twitter-api-v2
```

## 5. Test with Dry Run

Always test first:

```bash
# Preview deal tweets
node scripts/twitter-auto-poster.js --dry-run

# Preview market commentary
node scripts/twitter-auto-poster.js --commentary --dry-run

# Preview weekly thread
node scripts/twitter-auto-poster.js --thread --dry-run

# Check stats
node scripts/twitter-auto-poster.js --stats
```

## 6. Go Live

Once you're happy with the output:

```bash
# Remove --dry-run flag and set DRY_RUN=false in .env
DRY_RUN=false node scripts/twitter-auto-poster.js

# Or just remove DRY_RUN from .env and run:
node scripts/twitter-auto-poster.js --max=3
```

## 7. Set Up Automated Schedule

### Recommended Posting Schedule (5-8 tweets/day)

| Time (CT) | Type | Command |
|-----------|------|---------|
| 8:00 AM | Deal batch (2-3) | `node scripts/twitter-auto-poster.js --max=3` |
| 12:00 PM | Market commentary | `node scripts/twitter-auto-poster.js --commentary` |
| 3:00 PM | Deal batch (2-3) | `node scripts/twitter-auto-poster.js --max=3` |
| 6:00 PM | Hot deal spotlight | `node scripts/twitter-auto-poster.js --score=50 --max=1` |
| 9:00 PM | Evening deal | `node scripts/twitter-auto-poster.js --max=1` |
| Sunday 10 AM | Weekly roundup thread | `node scripts/twitter-auto-poster.js --thread` |

### Using Cron

```bash
crontab -e
```

Add:

```cron
# The Hub Twitter Auto-Poster
# Morning deals (8 AM CT)
0 8 * * * cd /Users/sydneyjackson/the-hub && node scripts/twitter-auto-poster.js --max=3 >> logs/twitter.log 2>&1

# Midday commentary (12 PM CT)
0 12 * * * cd /Users/sydneyjackson/the-hub && node scripts/twitter-auto-poster.js --commentary >> logs/twitter.log 2>&1

# Afternoon deals (3 PM CT)
0 15 * * * cd /Users/sydneyjackson/the-hub && node scripts/twitter-auto-poster.js --max=3 >> logs/twitter.log 2>&1

# Evening hot deal (6 PM CT)
0 18 * * * cd /Users/sydneyjackson/the-hub && node scripts/twitter-auto-poster.js --score=50 --max=1 >> logs/twitter.log 2>&1

# Night deal (9 PM CT)
0 21 * * * cd /Users/sydneyjackson/the-hub && node scripts/twitter-auto-poster.js --max=1 >> logs/twitter.log 2>&1

# Weekly roundup thread (Sunday 10 AM CT)
0 10 * * 0 cd /Users/sydneyjackson/the-hub && node scripts/twitter-auto-poster.js --thread >> logs/twitter.log 2>&1
```

### Using PM2 (Alternative)

```bash
pm2 start scripts/twitter-auto-poster.js --cron "0 8,15 * * *" --name "twitter-deals"
```

## 8. Monitoring & Troubleshooting

### Check stats
```bash
node scripts/twitter-auto-poster.js --stats
```

### View posted history
```bash
cat data/twitter-posted.json | jq '.stats'
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `403 Forbidden` | Check app permissions are Read+Write, regenerate tokens |
| `429 Too Many Requests` | You've hit rate limits; reduce posting frequency |
| `401 Unauthorized` | API keys are wrong or expired; regenerate them |
| Tweets not appearing | Check if account is suspended or in read-only mode |
| Duplicate tweets | Twitter blocks exact duplicates; the dedup tracker prevents this |

### Rate Limits (Free Tier)
- **1,500 tweets/month** (≈50/day)
- **50 tweets per 24-hour window** (user level)
- Our schedule posts 5-8/day = well within limits

### API Costs
- **Free**: 1,500 tweets/mo, 1 app (good to start)
- **Basic ($100/mo)**: 3,000 tweets/mo, 2 apps
- **Pro ($5,000/mo)**: Full access (overkill for us)

## 9. Content Strategy Tips

### What performs well on Watch/Deal Twitter:
- 🔥 **Price drops** with specific numbers ("$3,200 → $2,400!")
- 📉 **Market trends** ("Submariner prices down 8% this month")
- 🧵 **Threads** for roundups and deep dives
- 📸 **Images** (add later with `twitter-api-v2` media upload)
- ⏰ **Time-sensitive** language ("Just listed", "Won't last")

### Hashtag Strategy:
- Always include: `#TheHubDeals`
- Brand-specific: `#Rolex`, `#Omega`, `#Seiko`
- Category: `#WatchDeals`, `#SneakerDeals`
- Community: `#WatchCollector`, `#WristWatch`
- Trending: Check what's trending and ride the wave

### Engagement Tactics:
- Ask questions: "Would you grab this at $3,200? 🤔"
- Use polls for market predictions
- Retweet user finds
- Reply to watch/sneaker community posts

---

## File Locations

| File | Purpose |
|------|---------|
| `scripts/twitter-auto-poster.js` | Main auto-poster script |
| `data/twitter-posted.json` | Dedup tracking (posted deal IDs + tweet IDs) |
| `docs/TWITTER-SETUP.md` | This guide |
| `logs/twitter.log` | Cron output logs |

---

*Last updated: July 2026*
