# Twitter Integration for The Hub

## 🐦 What's New

Automated Twitter posting system for @TheHubDeals to drive Telegram signups and build brand authority.

## Features

### 1. Twitter Bot (`src/bot/twitter.js`)
- Post individual tweets
- Post threads
- Format deals automatically
- Rate limiting (1/minute, 50/day on free tier)
- Account stats and metrics

### 2. Auto-Poster (`src/automations/twitterPoster.js`)
- Automatically posts hot deals (score >15)
- Runs every 15 minutes (configurable)
- Max 3 posts/hour (configurable)
- Tracks posted deals in database
- Manual trigger available

### 3. API Endpoints (`src/api/twitter.js`)
- `GET /api/twitter/status` - Bot status and stats
- `POST /api/twitter/tweet` - Post single tweet
- `POST /api/twitter/thread` - Post thread
- `POST /api/twitter/hot-deals-thread` - Auto-format hot deals
- `POST /api/twitter/format-deal` - Preview tweet formatting
- `GET /api/twitter/recent` - Recent tweets
- `GET /api/twitter/queue` - Deals queued for posting
- `POST /api/twitter/check-now` - Manual trigger

## Setup Instructions

### 1. Get Twitter API Credentials

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app (or use existing)
3. Get API keys from "Keys and Tokens"
4. Generate Access Token and Secret

### 2. Add to `.env`

```bash
# Twitter Configuration
TWITTER_ENABLED=true
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# Auto-Poster Settings (optional)
TWITTER_MIN_SCORE=15              # Minimum deal score to post
TWITTER_MAX_POSTS_PER_HOUR=3      # Rate limit
TWITTER_CHECK_INTERVAL=15         # Check interval in minutes
```

### 3. Install Dependencies

```bash
npm install twitter-api-v2
```

### 4. Database Migration

Add Twitter tracking columns to deals table:

```sql
ALTER TABLE deals 
ADD COLUMN twitter_posted_at TIMESTAMPTZ,
ADD COLUMN twitter_tweet_id TEXT;

CREATE INDEX idx_deals_twitter_posted ON deals(twitter_posted_at);
```

### 5. Integrate into Server

Add to `src/api/server.js` after Telegram routes:

```javascript
// ============================================================================
// TWITTER BOT API ROUTES
// ============================================================================
const twitterAPI = require('./twitter');
app.use('/api/twitter', twitterAPI);
```

Add to `src/index.js` after sneaker scheduler:

```javascript
// Initialize Twitter auto-poster
if (process.env.TWITTER_ENABLED === 'true') {
  logger.info('Initializing Twitter auto-poster...');
  const { getPoster } = require('./automations/twitterPoster');
  const twitterPoster = getPoster();
  twitterPoster.start();
  logger.info('🐦 Twitter Auto-Poster: Active');
}
```

## Content Strategy

### Automated Posts (Auto-Poster)
- Hot deals with score >15
- Posted as individual tweets
- Includes emoji, price, savings, CTA

### Manual Threads (API)
- Daily "Hot Deals" thread (8am CT)
- Curated top 5 deals
- Engagement posts (polls, questions)
- Educational content (7pm CT)

### Tweet Format

**Single Deal:**
```
⌚️ Rolex Submariner Date

💰 $8,500 (was $10,200)
📉 Save 17% ($1,700)

⚡️ Get deals 2hrs earlier: t.me/thehubdeals
```

**Thread:**
```
🔥 TODAY'S HOT DEALS - Feb 7

Thread 👇

1/ [Deal 1]
2/ [Deal 2]
3/ [Deal 3]

Want these deals 2 hours before Reddit?

⚡️ Join Telegram: t.me/thehubdeals
📧 Newsletter: thehub.deals

#WatchDeals #SneakerDeals
```

## Dashboard Integration

Add Twitter tab to Mission Control (port 4000) showing:
- Account stats (followers, tweets)
- Recent posts
- Queue of deals to post
- Manual post controls
- Auto-poster status

## Testing

```bash
# Test single tweet
curl -X POST http://localhost:3001/api/twitter/tweet \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing @TheHubDeals bot 🔥"}'

# Get status
curl http://localhost:3001/api/twitter/status

# Get queue
curl http://localhost:3001/api/twitter/queue

# Trigger check
curl -X POST http://localhost:3001/api/twitter/check-now
```

## Rate Limits (Twitter Free Tier)

- **Tweets:** 1,500/month (~50/day)
- **Rate:** 1 tweet per minute
- **Strategy:** Auto-poster limited to 3/hour max

## Conversion Funnel

Twitter → Telegram → Newsletter → Premium

**CTA on every tweet:** "Get deals 2hrs earlier: t.me/thehubdeals"

## Next Steps

1. Set up Twitter Developer account
2. Create @TheHubDeals profile
3. Add credentials to `.env`
4. Run database migration
5. Deploy and test
6. Build Mission Control Twitter tab
7. Schedule manual threads (8am, 2pm, 7pm)

---

**Built:** 2026-02-06 23:00 (Night Shift)
**Status:** Ready for review and deployment
**PR:** Create branch `feature/twitter-integration`
