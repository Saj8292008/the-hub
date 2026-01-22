# 🚂 Railway Deployment Guide

## 🎯 What You'll Get

After deploying to Railway:
- ✅ **24/7 uptime** - Runs even when your computer is off
- ✅ **Auto-restart** - Crashes are automatically recovered
- ✅ **Free $5 credit** - About 1 month of free hosting
- ✅ **Custom domain** - Get a .railway.app URL
- ✅ **Easy updates** - Deploy changes with one command
- ✅ **Logs & monitoring** - Built-in dashboards

---

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Railway account (we'll create this)
- ✅ Your code working locally (already done!)

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git Repository

```bash
cd /Users/sydneyjackson/the-hub

# Check if git is already initialized
git status

# If not initialized, run:
git init
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `the-hub`
3. Description: "Personal tracking hub for watches, cars, sneakers & more"
4. **Keep it PRIVATE** (contains API keys)
5. **DON'T** initialize with README (we already have files)
6. Click "Create repository"

### 1.3 Push to GitHub

```bash
# Add all files (respects .gitignore)
git add .

# Create first commit
git commit -m "Initial commit - The Hub tracking system"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/the-hub.git

# Push to GitHub
git push -u origin main

# If it asks for branch name, use:
git branch -M main
git push -u origin main
```

**Important:** Your `.env` file is excluded by `.gitignore` - this is good! We'll add environment variables in Railway.

---

## Step 2: Sign Up for Railway

### 2.1 Create Account

1. Go to https://railway.app
2. Click **"Start a New Project"** or **"Login"**
3. Sign in with **GitHub**
4. Authorize Railway to access your repositories

### 2.2 Verify Free Credit

- You get **$5 free credit** (no credit card required)
- Equivalent to ~500 hours of runtime
- Enough for 1 month of 24/7 operation

---

## Step 3: Create New Project

### 3.1 Deploy from GitHub

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Search for **"the-hub"**
4. Click on your repository
5. Railway will auto-detect it's a Node.js project

### 3.2 Wait for Initial Build

- Railway will install dependencies
- Should take 1-2 minutes
- You'll see build logs in real-time

---

## Step 4: Configure Environment Variables

**CRITICAL:** Add all your environment variables from `.env`

### 4.1 Open Variables Tab

1. Click on your deployed service
2. Click **"Variables"** tab
3. Click **"+ New Variable"**

### 4.2 Add Required Variables

**Copy these from your local `.env` file:**

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=8310191561:AAExxS9nt4a2VsUz0W75CG1H_4C0iDG-9UM
TELEGRAM_ADMIN_CHAT_ID=8427035818

# Scraping Services
SCRAPERAPI_KEY=c53a3b6bced75cf230ef7574feea5858
APIFY_TOKEN=apify_api_G1UEBZ6UT7XXhLxPRN8f7oMcnS8ZuD1vGz0C
CRAWLBASE_TOKEN=
USE_REAL_SCRAPERS=false

# Polling Configuration
POLL_SCHEDULE=0 * * * *
RUN_ON_START=false
SEND_UPDATE_SUMMARY=false

# Rate Limiting
SCRAPER_MIN_TIME_CHRONO24=3000
SCRAPER_MIN_TIME_AUTOTRADER=2000
SCRAPER_MIN_TIME_STOCKX=4000

# Logging
LOG_LEVEL=info
NODE_ENV=production
DEBUG_SCREENSHOTS=false
DEBUG_HTML=false

# Port (Railway auto-assigns, but we can default)
PORT=3000
```

**Quick Add Method:**
- Click **"RAW Editor"** in Variables tab
- Paste all variables in `KEY=VALUE` format
- Click **"Update Variables"**

### 4.3 Trigger Redeploy

After adding variables:
1. Click **"Deploy"** → **"Redeploy"**
2. Or just wait - Railway auto-deploys when variables change

---

## Step 5: Get Your Railway URL

### 5.1 Generate Public URL

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. You'll get a URL like: `the-hub-production-XXXX.up.railway.app`

**Copy this URL** - you'll need it for the frontend!

### 5.2 Test the API

```bash
# Test health endpoint
curl https://your-railway-url.railway.app/health

# Expected response:
# {"status":"OK","timestamp":"2026-01-22T..."}
```

---

## Step 6: Verify Deployment

### 6.1 Check Logs

1. Go to **"Deployments"** tab
2. Click latest deployment
3. View **"Deploy Logs"** and **"Runtime Logs"**

**Look for:**
```
✅ API Server is running on port 3000
📊 Dashboard API: http://...
🔌 WebSocket server ready
📱 Telegram bot: Active
✅ The Hub is running
```

### 6.2 Test Telegram Bot

Send a message to your bot:
```
/help
/watches
/addwatch Omega Seamaster
```

**If bot doesn't respond:**
- Check logs for errors
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Make sure bot is not running locally (stop PM2)

---

## Step 7: Update Frontend for Railway

### 7.1 Update WebSocket URL

**Edit:** `/Users/sydneyjackson/the-hub/the-hub/src/context/WebSocketContext.tsx`

Change:
```typescript
const socketInstance = io('http://localhost:3000', {
```

To:
```typescript
const socketInstance = io('https://your-railway-url.railway.app', {
```

### 7.2 Update API Base URL

**Create:** `/Users/sydneyjackson/the-hub/the-hub/src/config.ts`

```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'https://your-railway-url.railway.app';
export const WS_URL = import.meta.env.VITE_WS_URL || 'https://your-railway-url.railway.app';
```

### 7.3 Deploy Frontend (Optional)

**Option A: Vercel (Recommended)**
1. Go to https://vercel.com
2. Import `the-hub/the-hub` folder
3. Auto-deploys from GitHub
4. Free forever for personal projects

**Option B: Netlify**
1. Go to https://netlify.com
2. Drag & drop `the-hub/dist` folder
3. Free tier available

---

## Step 8: Stop Local PM2 (Important!)

Since Railway is now running your bot, stop the local instance:

```bash
npx pm2 stop the-hub
npx pm2 delete the-hub
```

**Why?** You can't have two bot instances running (Telegram conflict)

---

## 🔧 Railway Management

### View Logs
1. Go to your Railway project
2. Click on service
3. Click **"Deployments"** → View logs

### Restart Service
1. Click **"Deploy"** → **"Redeploy"**
2. Or use Railway CLI (see below)

### Update Code
```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push

# Railway auto-deploys on push! 🎉
```

### View Metrics
- CPU usage
- Memory usage
- Network traffic
- All in Railway dashboard

---

## 💰 Cost Breakdown

**Free Tier:**
- $5 credit (no card required)
- ~500 hours of runtime
- Enough for 20+ days of 24/7 operation

**After Free Credit:**
- ~$5/month for 24/7 operation
- Usage-based pricing
- Only pay for what you use

**Worth it?**
- Local computer: Electricity + wear
- Railway: $5/mo + peace of mind
- **One affiliate sale pays for months!**

---

## 🐛 Troubleshooting

### Bot Not Responding

**Check:**
1. Logs show "Telegram bot: Active"
2. `TELEGRAM_BOT_TOKEN` is correct
3. Local PM2 is stopped
4. No 409 errors (conflict)

**Fix:**
```bash
# Stop local instance
npx pm2 stop the-hub

# Check Railway logs
# Redeploy if needed
```

### Port Errors

Railway sets `PORT` automatically. Your code should use:
```javascript
const PORT = process.env.PORT || 3000;
```

Already done in `src/api/server.js`!

### WebSocket Not Connecting

**Check:**
1. Frontend using `https://` (not `http://`)
2. Railway URL is correct
3. CORS is configured
4. Check browser console

**Fix in `src/api/server.js`:**
```javascript
const io = new Server(server, {
  cors: {
    origin: '*', // Or specific domain
    methods: ['GET', 'POST']
  }
});
```

### Build Failures

**Common issues:**
- Missing dependencies in `package.json`
- Node version mismatch
- Build command errors

**Fix:**
Check Railway build logs for specific errors

---

## 🚀 Advanced: Railway CLI

Install Railway CLI for terminal deployment:

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Deploy
railway up

# Open in browser
railway open
```

---

## 📊 What's Deployed?

**Backend Services:**
- ✅ Telegram Bot (responds to commands)
- ✅ REST API (http://your-url/api)
- ✅ WebSocket Server (real-time updates)
- ✅ Price Poller (runs every hour)
- ✅ Alert Manager (price notifications)

**Runs 24/7 on Railway!**

---

## 🎉 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables configured
- [ ] Deployment successful (check logs)
- [ ] API health check works
- [ ] Telegram bot responds to commands
- [ ] Local PM2 stopped
- [ ] Frontend updated with Railway URL
- [ ] WebSocket connecting
- [ ] Alerts working

---

## 🔄 Regular Maintenance

**Weekly:**
- Check Railway logs for errors
- Monitor free credit usage
- Test Telegram bot

**Monthly:**
- Review usage costs
- Update dependencies: `npm update`
- Check for Railway updates

**As Needed:**
- Add new features
- Update environment variables
- Scale if traffic increases

---

## 💡 Pro Tips

1. **Auto-deploy on push:** Railway watches your GitHub repo
2. **Environment per branch:** Create staging/production environments
3. **Rollback:** Railway keeps deployment history
4. **Metrics:** Monitor CPU/memory in dashboard
5. **Logs:** Use Railway logs instead of PM2 logs
6. **Scaling:** Upgrade plan if you get lots of users

---

## 🎯 Next Steps After Deployment

1. **Test everything** thoroughly
2. **Monitor first 24 hours** for errors
3. **Share Telegram bot** with friends
4. **Build more features** (we have lots planned!)
5. **Consider Supabase** for real database
6. **Enable real scraping** (when profitable)

---

## ✨ You're Live!

Your tracking system is now running in the cloud! 🚀

**Share your bot:**
- Friends can use your Telegram bot
- They'll get real-time updates
- All running 24/7 from Railway

**Questions?**
- Railway docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

Enjoy your fully deployed tracking system! 🎉
