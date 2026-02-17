# WTB Auto-Outreach Setup Guide

## Overview
The WTB (Want To Buy) auto-outreach system automatically scans r/Watchexchange's weekly WTB thread, matches buyer requests with your inventory in Supabase, and posts personalized comments via the Reddit API.

**No more browser automation failures!** This uses Reddit's official OAuth2 API for reliable posting.

## Architecture

### Components
1. **WTBMonitor** (`src/services/reddit/WTBMonitor.js`) - Scrapes WTB threads
2. **RedditAPIClient** (`src/services/reddit/RedditAPIClient.js`) - Reddit OAuth2 API wrapper
3. **WTBOutreach** (`src/services/reddit/WTBOutreach.js`) - Matching + posting logic
4. **CLI Script** (`scripts/wtb-outreach.js`) - Command line interface
5. **API Endpoint** (`/api/wtb/outreach`) - Dashboard trigger

### Features
- ✅ Uses Reddit's official API (no browser automation)
- ✅ Matches WTB requests against Supabase inventory
- ✅ Generates multiple comment templates for variety
- ✅ Tracks posted comments to avoid duplicates
- ✅ Respects Reddit's rate limits (2 min between posts)
- ✅ Filters by user transaction count (target reliable buyers)
- ✅ Dry run mode for testing
- ✅ Dashboard API integration

## Reddit OAuth Setup

### Step 1: Create a Reddit App

1. Go to: https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in:
   - **Name**: The Hub WTB Outreach
   - **App type**: Select "script"
   - **Description**: Auto-outreach for WTB requests
   - **About URL**: https://thehubdeals.com
   - **Redirect URI**: http://localhost:8080 (required but not used for script apps)
4. Click "Create app"
5. Note the following:
   - **Client ID**: The string under "personal use script"
   - **Client Secret**: The string next to "secret"

### Step 2: Get a Refresh Token

For script-type apps, you'll use your Reddit username and password to get an initial access token, then exchange it for a refresh token. Here's a simple script:

```javascript
// Quick script to get refresh token (run once)
const axios = require('axios');

const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const username = 'Clear-Band8471'; // Your Reddit username
const password = 'YOUR_PASSWORD';

async function getRefreshToken() {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await axios.post(
    'https://www.reddit.com/api/v1/access_token',
    new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password
    }),
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'TheHub/1.0'
      }
    }
  );
  
  console.log('Access Token:', response.data.access_token);
  console.log('Refresh Token:', response.data.refresh_token);
}

getRefreshToken();
```

**Note**: For script-type apps, Reddit may not return a refresh token on the first call. In that case, you can just use the `password` grant type in the RedditAPIClient and it will authenticate each time. The current implementation supports refresh tokens, but you can modify it to use password grant if needed.

### Step 3: Update .env

Add the credentials to your `.env` file:

```bash
# Reddit API OAuth2 (for posting comments)
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_REFRESH_TOKEN=your_refresh_token_here  # Or leave blank to use password grant
REDDIT_USERNAME=Clear-Band8471
```

## Usage

### CLI Script

**Dry run (see what would be posted):**
```bash
node scripts/wtb-outreach.js --dry-run
```

**Live posting (actually posts comments):**
```bash
node scripts/wtb-outreach.js
```

**Custom options:**
```bash
# Post max 5 comments, wait 3 minutes between each
node scripts/wtb-outreach.js --limit 5 --delay 180

# Only target users with 10+ transactions
node scripts/wtb-outreach.js --min-transactions 10

# Only include deals with score >= 60
node scripts/wtb-outreach.js --min-score 60

# Combine options
node scripts/wtb-outreach.js --dry-run --limit 3 --min-transactions 5
```

### API Endpoint

**Trigger outreach from dashboard:**

```bash
POST /api/wtb/outreach
Content-Type: application/json

{
  "dryRun": true,        // Default: true (safe)
  "limit": 10,           // Max comments to post
  "delay": 120000,       // Delay between posts (ms)
  "minTransactions": 5,  // Min user transaction count
  "minScore": 50         // Min deal score to include
}
```

**Example with curl:**
```bash
# Dry run
curl -X POST http://localhost:4003/api/wtb/outreach \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "limit": 5}'

# Live posting
curl -X POST http://localhost:4003/api/wtb/outreach \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false, "limit": 10, "minTransactions": 5}'
```

## Comment Templates

The system uses multiple templates to vary the language and avoid looking spammy:

1. **Helpful**: "Hey! I noticed you're looking for..."
2. **Direct**: "I see you're searching for..."
3. **Casual**: "Looking for a...? We've got some on thehubdeals.com..."
4. **Detailed**: Includes price match info and multiple options

Templates are selected randomly for each comment.

## Tracking

The system tracks posted comments in `data/wtb-outreach-tracking.json` to avoid duplicate replies. This file is automatically created and updated.

**Format:**
```json
{
  "postedComments": ["abc123", "def456", ...],
  "lastUpdated": "2026-02-15T12:34:56.789Z"
}
```

## Rate Limiting

Reddit's API rules:
- **Max 60 requests per minute**
- **Recommended: 1 comment per 2 minutes** (safe buffer)

The system automatically rate-limits requests and enforces a 2-minute delay between comment posts.

## Matching Logic

### How matches work:
1. Scans current weekly WTB thread
2. Parses WTB requests (brand, model, price range)
3. Queries Supabase inventory (deals with score >= minScore)
4. Matches based on:
   - Brand match (30 points)
   - Model match (40 points)
   - Price within budget (10-20 points)
   - User transaction history (5-10 points)
5. Filters by minimum transaction count
6. Posts comments to top matches (up to limit)

### Match score thresholds:
- **50+**: Good match (brand or model)
- **70+**: Strong match (brand + model)
- **80+**: Excellent match (brand + model + price + experienced buyer)

## Safety Features

1. **Dry run by default** (API endpoint)
2. **Duplicate detection** (tracking file + Reddit API check)
3. **Rate limiting** (2 min between posts)
4. **Transaction filtering** (target reliable buyers)
5. **Deal score filtering** (only high-quality deals)
6. **Max comments per run** (prevents spam)

## Troubleshooting

### "Missing Reddit credentials" error
- Ensure `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, and `REDDIT_REFRESH_TOKEN` are set in `.env`
- Or run with `--dry-run` to test without posting

### "Reddit auth failed" error
- Check that your client ID and secret are correct
- Verify your refresh token is valid
- Try regenerating credentials from https://www.reddit.com/prefs/apps

### "Already replied" warnings
- This is normal - the system tracks posted comments to avoid duplicates
- Check `data/wtb-outreach-tracking.json` to see posted comment IDs
- Delete entries from this file to allow re-posting (not recommended)

### No matches found
- Check that your Supabase inventory has recent deals
- Lower `minScore` to include more deals
- Check WTB thread has active requests
- Verify brand/model extraction is working (check logs)

## Automation

### Cron Job (Run daily)

Add to crontab:
```bash
# Run WTB outreach every day at 10 AM
0 10 * * * cd /Users/sydneyjackson/the-hub && node scripts/wtb-outreach.js --limit 15 --min-transactions 5 >> logs/wtb-outreach.log 2>&1
```

### PM2 (Process manager)

```bash
pm2 start scripts/wtb-outreach.js --name wtb-outreach --cron "0 10 * * *" -- --limit 15 --min-transactions 5
pm2 save
```

## Next Steps

1. ✅ Set up Reddit OAuth credentials
2. ✅ Test with `--dry-run`
3. ✅ Review generated comments
4. ✅ Run live with small limit (--limit 3)
5. ✅ Monitor Reddit to verify comments posted
6. ✅ Scale up gradually
7. ✅ Set up automation (cron or PM2)

## Support

For issues or questions:
- Check logs: `logs/the-hub.log`
- Review tracking file: `data/wtb-outreach-tracking.json`
- Test with: `node scripts/wtb-outreach.js --dry-run --limit 1`

Happy outreach! 🚀
