# ⚡ Railway Deploy - Quick Start

## 5-Minute Deployment

### Step 1: Push to GitHub (2 min)

```bash
cd /Users/sydneyjackson/the-hub

# Initialize git (if needed)
git init
git add .
git commit -m "Initial commit"

# Create repo at: https://github.com/new
# Name it: the-hub (PRIVATE repo!)

# Push (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/the-hub.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Railway (2 min)

1. Go to **https://railway.app**
2. Login with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select **"the-hub"**
5. Wait for build to complete ✅

### Step 3: Add Environment Variables (1 min)

1. Click **"Variables"** tab
2. Click **"RAW Editor"**
3. Paste this (copy from your `.env`):

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

4. Click **"Update Variables"**

### Step 4: Get Your URL

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy your URL: `https://the-hub-production-XXXX.up.railway.app`

### Step 5: Stop Local Bot

```bash
npx pm2 stop the-hub
npx pm2 delete the-hub
```

### Step 6: Test!

```bash
# Test API
curl https://your-railway-url.railway.app/health

# Test Telegram bot
# Send: /help
```

---

## ✅ Done!

Your bot is now running 24/7 on Railway!

**What's Next?**
- Update frontend to use Railway URL (see full guide)
- Test all features
- Share your bot with friends!

**Full Guide:** See `RAILWAY-DEPLOYMENT.md`

---

## 🆘 Quick Troubleshooting

**Bot not responding?**
```bash
# Check Railway logs (in dashboard)
# Make sure local PM2 is stopped
# Verify TELEGRAM_BOT_TOKEN is correct
```

**Need to redeploy?**
```bash
git add .
git commit -m "Update"
git push
# Railway auto-deploys! 🎉
```

---

## 💰 Cost

- **Free:** $5 credit (~1 month)
- **After:** ~$5/month for 24/7 operation

Worth it for peace of mind! 😌
