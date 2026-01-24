# ⚡ Render Deployment - 5 Minute Guide

## Step 1: Create Account (1 min)
1. Go to **https://render.com**
2. **Sign up with GitHub**
3. Authorize Render

## Step 2: Create Web Service (1 min)
1. Click **"New +"** → **"Web Service"**
2. Select **`Saj8292008/the-hub`**
3. Click **"Connect"**

## Step 3: Configure (2 min)
- **Name:** `the-hub`
- **Branch:** `main`
- **Build Command:** `npm install`
- **Start Command:** `node src/index.js`
- **Instance Type:** `Free`

## Step 4: Add Environment Variables (1 min)
Click **"Add from .env"** and paste:

```env
TELEGRAM_BOT_TOKEN=8310191561:AAExxS9nt4a2VsUz0W75CG1H_4C0iDG-9UM
TELEGRAM_ADMIN_CHAT_ID=8427035818
SCRAPERAPI_KEY=c53a3b6bced75cf230ef7574feea5858
APIFY_TOKEN=apify_api_G1UEBZ6UT7XXhLxPRN8f7oMcnS8ZuD1vGz0C
USE_REAL_SCRAPERS=false
POLL_SCHEDULE=0 * * * *
LOG_LEVEL=info
NODE_ENV=production
PORT=3000
```

## Step 5: Deploy! (2-3 min build time)
1. Click **"Create Web Service"**
2. Wait for logs to show: `✅ The Hub is running`
3. Copy your URL: `https://the-hub-XXXX.onrender.com`

## Step 6: Stop Local Bot
```bash
npx pm2 stop the-hub
npx pm2 delete the-hub
```

## Test It!
```bash
# Test API
curl https://your-url.onrender.com/health

# Test Telegram
# Send: /help
```

## ✅ Done!

**Free Tier Notes:**
- Sleeps after 15 min inactivity
- Wakes up automatically
- Upgrade to $7/mo for always-on

**Keep Alive (Free):**
- Setup cron-job.org to ping every 14 minutes
- URL: `https://your-url.onrender.com/health`

---

🎉 **Your bot is live in the cloud!**
