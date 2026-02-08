# 🚀 Production Deployment - Ready to Deploy!

**Status:** Code committed and pushed to GitHub main branch ✅  
**Frontend Build:** Passing ✅  
**Backend Build:** Passing ✅  

---

## 🎯 Quick Summary

Everything is ready for deployment! Follow the steps below to get The Hub live.

**GitHub Repository:** https://github.com/Saj8292008/the-hub.git  
**Branch:** main

---

## Part 1: Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to https://railway.app and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `Saj8292008/the-hub` repository
5. Select the `main` branch
6. Railway will auto-detect Node.js app

### Step 2: Configure Environment Variables

Click on your service → **Variables** tab → **Raw Editor** and paste this:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app

# Supabase (ALREADY CONFIGURED)
SUPABASE_URL=https://sysvawxchniqelifyenl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODg5NTUsImV4cCI6MjA4NDM2NDk1NX0.kwJXfM8iutl5rBv5TCIlscwMq3_cj0nYfCM_d91jLwY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4ODk1NSwiZXhwIjoyMDg0MzY0OTU1fQ.2vT6lOoCcZPFg_slodGZEpmUrlQVjf2iNKdrF6lHfsA
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4ODk1NSwiZXhwIjoyMDg0MzY0OTU1fQ.2vT6lOoCcZPFg_slodGZEpmUrlQVjf2iNKdrF6lHfsA
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4ODk1NSwiZXhwIjoyMDg0MzY0OTU1fQ.2vT6lOoCcZPFg_slodGZEpmUrlQVjf2iNKdrF6lHfsA

# Stripe (ALREADY CONFIGURED)
STRIPE_SECRET_KEY=[USE YOUR STRIPE SECRET KEY FROM .env FILE]
STRIPE_PUBLISHABLE_KEY=[USE YOUR STRIPE PUBLISHABLE KEY FROM .env FILE]
STRIPE_WEBHOOK_SECRET=[GET THIS AFTER CREATING WEBHOOK ENDPOINT]
STRIPE_PRICE_ID_PRO_MONTHLY=price_1Sy1BjCaz620S5FSO8c5KhF9
STRIPE_PRICE_ID_PRO_YEARLY=price_1Sy1BjCaz620S5FSDGlVkwJ4
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_1Sy1BkCaz620S5FSZceyouEG
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_1Sy1BkCaz620S5FSHiGZvodz

# JWT Authentication (NEWLY GENERATED - SECURE!)
JWT_SECRET=Z66Zxs3x7feoRnP85Y4LSCpT2BVSNCQESO3BT11gSRc=
JWT_REFRESH_SECRET=gM+nkj227Sm4io9ADk3eyyJwKMKAOxZE0f8DfRGxiXk=
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Telegram Bot (ALREADY CONFIGURED)
TELEGRAM_BOT_TOKEN=8432859549:AAGOHwCl_57vYMsbCqeeZQc7Z6CnbZNh_s0
TELEGRAM_CHANNEL_ID=-1003850293697
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_EMPIRE_CHANNEL_ID=-1003884685341
TELEGRAM_TEST_CHANNEL_ID=-1003850293697

# Instagram (ALREADY CONFIGURED)
INSTAGRAM_ACCESS_TOKEN=EAAQpjQAZCtVoBQrNp7tyqPZCLRfZBn2VwHiQGBwJBlmxi0XgT8r2eY6fIvfJ56Iz6y6175oPuyHe9ceNVjRDmwmuIcO8ltr8m0aBZCQgZAaZCORzMQOZC492ZAoDcoBCax8xNx9ECDyB99P5ziiR7BKsRCQ6ttDPiGFDBBHKTiCRsEMrJ5TlkZBcQeQGEJQSBdRORsNJd5ga6eUSWZChe4HNCPGWvZAhwQnfi0ptxBMovkMmvsZD
INSTAGRAM_ACCOUNT_ID=17841475721129222
INSTAGRAM_SCORE_THRESHOLD=12

# Image Hosting (ALREADY CONFIGURED)
IMGBB_API_KEY=5fd7f278a560fc8bfebd338063bae906

# Feature Toggles (Start disabled, enable after testing)
ENABLE_SCRAPER_SCHEDULER=false
ENABLE_SPORTS_SCHEDULER=false
ENABLE_DEAL_ALERTS=false
ENABLE_NEWSLETTER_SCHEDULER=false
ENABLE_INSTAGRAM_POSTER=false
ENABLE_CHANNEL_POSTER=false
```

**Important:** After adding these, Railway will automatically deploy!

### Step 3: Get Your Railway URL

1. Wait for deployment to complete (2-5 minutes)
2. Click on your service → **Settings** → **Domains**
3. Copy your Railway URL (e.g., `https://the-hub-production.up.railway.app`)
4. **Save this URL!** You'll need it for:
   - Frontend VITE_API_URL
   - Stripe webhook endpoint

### Step 4: Test Backend Health Check

Open your Railway URL + `/health`:
```
https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-08T..."
}
```

✅ If you see this, backend is live!

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel

1. Go to https://vercel.com and log in
2. Click **"Add New"** → **"Project"**
3. Import `Saj8292008/the-hub` from GitHub
4. **Important:** Set **Root Directory** to: `the-hub/the-hub`
5. Vercel will auto-detect Vite
6. Click **"Deploy"** (wait for initial deployment)

### Step 2: Configure Environment Variables

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables (one by one or use bulk add):

```bash
# API Configuration (USE YOUR RAILWAY URL FROM STEP 1.3!)
VITE_API_URL=https://your-app.up.railway.app

# Supabase
VITE_SUPABASE_URL=https://sysvawxchniqelifyenl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODg5NTUsImV4cCI6MjA4NDM2NDk1NX0.kwJXfM8iutl5rBv5TCIlscwMq3_cj0nYfCM_d91jLwY

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SZ1EGCaz620S5FS2zfXu1mxbUTQgQzkaHeCOtnuY1KKoVP4QE9OwBWiS7q1Kj2UNrozHR3nLf2OSusbtEwF6sjE00JdE9XRXD
```

3. Click **"Save"**

### Step 3: Redeploy with Environment Variables

1. Go to **Deployments** tab
2. Click the three dots `...` on the latest deployment
3. Click **"Redeploy"**
4. Wait for build to complete

### Step 4: Get Your Vercel URL

1. Once deployed, copy your Vercel URL (e.g., `https://the-hub.vercel.app`)
2. **Save this URL!**

### Step 5: Update Backend CORS

Go back to Railway:
1. Go to your backend service → **Variables**
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://the-hub.vercel.app
   ```
3. Railway will auto-redeploy

---

## Part 3: Stripe Webhook Configuration

### Step 1: Add Webhook Endpoint

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter your Railway URL + webhook path:
   ```
   https://your-app.up.railway.app/api/webhooks/stripe
   ```

### Step 2: Select Events

Select these events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### Step 3: Get Signing Secret

1. After creating the endpoint, copy the **Signing secret** (starts with `whsec_`)
2. Go to Railway → Variables
3. Update `STRIPE_WEBHOOK_SECRET` with the new secret
4. Railway will auto-redeploy

---

## Part 4: Verification & Testing

### ✅ Backend Health Check

Visit: `https://your-railway-url.up.railway.app/health`

Should return:
```json
{
  "status": "OK",
  "timestamp": "..."
}
```

### ✅ Frontend Loads

Visit: `https://your-app.vercel.app`

- [ ] Homepage loads
- [ ] Navigation works
- [ ] Watch listings appear
- [ ] No console errors (F12)

### ✅ API Connection

Check browser console (F12) → Network tab:
- [ ] API requests going to Railway URL
- [ ] 200 status codes
- [ ] Data loading correctly

### ✅ Authentication Flow

1. Click **"Sign Up"**
2. Enter email/password
3. Should create account successfully
4. Should be able to log in
5. Dashboard should load

### ✅ Stripe Test Payment

1. Go to pricing page
2. Click **"Upgrade to Pro"**
3. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
4. Complete checkout
5. Check Railway logs for webhook received

### ✅ Check Logs

**Railway Logs:**
1. Go to Railway → Your service → Logs
2. Should see:
   ```
   🚀 Starting The Hub...
   ✅ API Server is running on port 3001
   ```

**Vercel Logs:**
1. Go to Vercel → Deployments → View Function Logs
2. Should see no errors

---

## 🎉 Production URLs

Once deployed, your URLs will be:

**Frontend (Vercel):**
```
https://the-hub.vercel.app
(or your custom domain)
```

**Backend (Railway):**
```
https://the-hub-production.up.railway.app
(or your custom domain)
```

**Health Check:**
```
https://the-hub-production.up.railway.app/health
```

---

## 📊 Next Steps After Deployment

### Immediate (First Hour)
- [ ] Test complete user journey end-to-end
- [ ] Verify Stripe webhooks are working
- [ ] Check Railway and Vercel logs
- [ ] Test on mobile device

### Within 24 Hours
- [ ] Set up uptime monitoring (see MONITORING-GUIDE.md)
- [ ] Monitor error rates
- [ ] Test PWA install flow
- [ ] Invite beta testers

### Within Week
- [ ] Consider custom domain
- [ ] Enable gradual features (scrapers, schedulers)
- [ ] Set up analytics
- [ ] Plan v1.1 improvements

---

## 🆘 Troubleshooting

### Backend Not Starting
- Check Railway logs for errors
- Verify all environment variables are set
- Check Supabase connection

### Frontend Can't Connect to Backend
- Verify VITE_API_URL is correct
- Check CORS settings (FRONTEND_URL in Railway)
- Look at browser console for errors

### Stripe Webhooks Failing
- Verify webhook secret is correct
- Check webhook endpoint URL
- Look at Stripe dashboard → Webhooks → Logs

See full troubleshooting guide: `TROUBLESHOOTING.md`

---

## 📞 Support Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Supabase Docs: https://supabase.com/docs

---

**Ready to deploy?** Start with Part 1 (Railway) above! 🚀

**Estimated Total Time:** 30-45 minutes
**Difficulty:** Easy (mostly copy/paste)
**Cost:** ~$5/month or free with hobby plans
