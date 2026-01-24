# 🎨 Render.com Deployment Guide

## 🎯 Why Render?

- ✅ **Free Tier** - No credit card required
- ✅ **750 hours/month** - Perfect for 24/7 operation
- ✅ **Auto-deploy** from GitHub
- ✅ **Built-in SSL** - Automatic HTTPS
- ✅ **Easy setup** - 5 minutes

**Note:** Free tier apps sleep after 15 min of inactivity, but wake up quickly on new requests. For 24/7 uptime, upgrade to $7/month (optional).

---

## 📋 Quick Deployment (5 Steps)

### Step 1: Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started"**
3. **Sign up with GitHub**
4. Authorize Render to access your repositories

---

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Find and select **`Saj8292008/the-hub`**
3. Click **"Connect"**

---

### Step 3: Configure Service

**Fill in these settings:**

| Field | Value |
|-------|-------|
| **Name** | `the-hub` |
| **Region** | `Oregon (US West)` (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | (leave blank) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node src/index.js` |
| **Instance Type** | `Free` |

Click **"Advanced"** to add environment variables (next step)

---

### Step 4: Add Environment Variables

Click **"Add Environment Variable"** and add each of these:

```
TELEGRAM_BOT_TOKEN=8310191561:AAExxS9nt4a2VsUz0W75CG1H_4C0iDG-9UM
TELEGRAM_ADMIN_CHAT_ID=8427035818
SCRAPERAPI_KEY=c53a3b6bced75cf230ef7574feea5858
APIFY_TOKEN=apify_api_G1UEBZ6UT7XXhLxPRN8f7oMcnS8ZuD1vGz0C
USE_REAL_SCRAPERS=false
POLL_SCHEDULE=0 * * * *
RUN_ON_START=false
SEND_UPDATE_SUMMARY=false
SCRAPER_MIN_TIME_CHRONO24=3000
SCRAPER_MIN_TIME_AUTOTRADER=2000
SCRAPER_MIN_TIME_STOCKX=4000
LOG_LEVEL=info
NODE_ENV=production
DEBUG_SCREENSHOTS=false
DEBUG_HTML=false
PORT=3000
```

**Tip:** Click **"Add from .env"** and paste all at once!

---

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. Watch the logs - look for:
   ```
   ✅ API Server is running on port 3000
   📱 Telegram bot: Active
   ✅ The Hub is running
   ```

---

## 🌐 Get Your URL

Once deployed:
1. Copy your service URL from the top:
   ```
   https://the-hub-XXXX.onrender.com
   ```
2. This is your public API URL!

---

## 🧪 Test Your Deployment

### Test API
```bash
curl https://the-hub-XXXX.onrender.com/health
```

Expected response:
```json
{"status":"OK","timestamp":"2026-01-22T..."}
```

### Test Telegram Bot
Send to your bot:
```
/help
/watches
/addwatch Omega Seamaster
```

---

## 📊 Monitor Your App

### View Logs
1. Go to your service dashboard
2. Click **"Logs"** tab
3. See real-time output

### Check Metrics
1. Click **"Metrics"** tab
2. View CPU, memory, response times

### Manual Deploy
1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Or push to GitHub (auto-deploys!)

---

## 🔄 Auto-Deploy on Git Push

Every time you push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```

Render automatically deploys! 🎉

---

## ⚠️ Important: Free Tier Limitations

**Sleep After Inactivity:**
- Free apps sleep after **15 minutes** of no requests
- Wakes up automatically when accessed (takes 30 seconds)
- Your Telegram bot will work, but with slight delays

**How to Keep Awake (Free Methods):**

1. **Cron Job Ping** (Recommended)
   - Use cron-job.org to ping your URL every 14 minutes
   - Setup: https://cron-job.org/en/
   - URL to ping: `https://your-app.onrender.com/health`
   - Schedule: `*/14 * * * *`

2. **UptimeRobot**
   - Free monitoring service
   - Setup: https://uptimerobot.com
   - Pings every 5 minutes
   - Also alerts you if down

**For True 24/7:** Upgrade to $7/month (totally worth it when profitable!)

---

## 💰 Cost Comparison

| Plan | Cost | Features |
|------|------|----------|
| **Free** | $0 | 750 hrs/mo, sleeps after 15min |
| **Starter** | $7/mo | Always on, no sleep, faster |

**Worth upgrading when:**
- You have active users
- Need instant bot responses
- Making affiliate revenue

---

## 🐛 Troubleshooting

### Bot Not Responding

**Check:**
1. Logs show "Telegram bot: Active"
2. Environment variables are correct
3. Local PM2 is stopped

**Fix:**
```bash
# Stop local bot
npx pm2 stop the-hub
npx pm2 delete the-hub

# Check Render logs
# Redeploy if needed
```

### Port Errors

Render sets `PORT` automatically. Your code already handles this:
```javascript
const PORT = process.env.PORT || 3000;
```

✅ Already configured!

### App Sleeping Too Much

**Solutions:**
1. Set up cron-job.org pinging
2. Use UptimeRobot
3. Upgrade to Starter plan ($7/mo)

### Deployment Fails

**Common issues:**
- Missing dependencies → Check `package.json`
- Wrong start command → Should be `node src/index.js`
- Build errors → Check Render logs

---

## 🔒 Security Notes

**Environment Variables:**
- ✅ Stored securely by Render
- ✅ Not visible in logs
- ✅ Encrypted at rest

**HTTPS:**
- ✅ Automatic SSL certificate
- ✅ All traffic encrypted
- ✅ Custom domain support

---

## 📱 Stop Local PM2

Since Render is now running your bot:

```bash
npx pm2 stop the-hub
npx pm2 delete the-hub
npx pm2 kill
```

**Important:** Only one bot instance can run!

---

## 🚀 Deployment Checklist

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Service configured (Node, start command)
- [ ] All environment variables added
- [ ] Deployment successful (check logs)
- [ ] Public URL generated
- [ ] API health check passes
- [ ] Telegram bot responds
- [ ] Local PM2 stopped
- [ ] (Optional) Cron ping setup for keep-alive

---

## 🎯 Next Steps

1. **Test thoroughly** - Try all Telegram commands
2. **Set up keep-alive** - Use cron-job.org
3. **Update frontend** - Use Render URL for WebSocket
4. **Monitor logs** - Check for errors first 24 hours
5. **Upgrade when ready** - $7/mo for always-on

---

## 🆘 Need Help?

**Render Docs:** https://render.com/docs
**Render Support:** https://render.com/support
**Status Page:** https://status.render.com

---

## ✨ You're Live!

Your bot is now running in the cloud! 🎉

**Free tier is perfect for:**
- Testing and development
- Personal use
- Low-traffic apps
- Learning deployment

**Upgrade when:**
- You have active users
- Need instant responses
- Making revenue from affiliate links

Enjoy your cloud-hosted tracking system! 🚀
