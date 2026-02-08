# 🚀 The Hub - Production Deployment Guide

This guide will walk you through deploying The Hub to production using Railway (backend) and Vercel (frontend). No technical expertise required!

**Estimated Time:** 2-4 hours (mostly waiting for builds)

---

## 📋 Prerequisites

Before you start, make sure you have:

- [ ] A Supabase account with your database already set up
- [ ] A Stripe account (test mode is fine to start)
- [ ] A Railway account (free tier works great) - [Sign up here](https://railway.app/)
- [ ] A Vercel account (free tier works great) - [Sign up here](https://vercel.com/)
- [ ] Your code pushed to GitHub (or another git provider)
- [ ] A Telegram bot token (optional, but recommended for notifications)

---

## Part 1: Backend Deployment (Railway)

### Step 1: Create a New Railway Project

1. Go to [railway.app](https://railway.app/) and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `the-hub` repository
5. Railway will automatically detect the Node.js app

### Step 2: Configure Environment Variables

Railway needs to know your secrets. Here's how to add them:

1. Click on your newly created service
2. Go to the **"Variables"** tab
3. Click **"Raw Editor"** for easier bulk entry
4. Copy and paste the template below, then fill in your actual values:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app

# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Stripe (REQUIRED)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_...

# JWT Authentication (REQUIRED - generate random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-to-random-string
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Telegram Bot (OPTIONAL but recommended)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHI...
TELEGRAM_CHANNEL_ID=-1001234567890
TELEGRAM_ADMIN_CHAT_ID=your-telegram-user-id

# Feature Toggles (Start with these disabled)
ENABLE_SCRAPER_SCHEDULER=false
ENABLE_SPORTS_SCHEDULER=false
ENABLE_DEAL_ALERTS=false
ENABLE_NEWSLETTER_SCHEDULER=false
ENABLE_INSTAGRAM_POSTER=false

# Optional Services (add later if needed)
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# RESEND_API_KEY=re_...
# INSTAGRAM_ACCESS_TOKEN=...
```

#### 🔑 How to Get These Values

**Supabase Keys:**
1. Go to [your Supabase dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the URL and keys

**Stripe Keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret key** and **Publishable key**
3. For webhook secret, we'll get this in Step 3

**JWT Secrets:**
Run this in your terminal to generate secure random strings:
```bash
openssl rand -base64 32
```
Use the output for JWT_SECRET and JWT_REFRESH_SECRET (generate twice for different values)

**Telegram Bot Token (Optional):**
1. Open Telegram and search for @BotFather
2. Send `/newbot` and follow the instructions
3. Copy the token you receive

### Step 3: Deploy and Get Your Railway URL

1. Click **"Deploy"** (Railway does this automatically usually)
2. Wait for the build to complete (2-5 minutes)
3. Once deployed, Railway will give you a URL like: `https://your-app.up.railway.app`
4. **Save this URL** - you'll need it for:
   - Frontend configuration (VITE_API_URL)
   - Stripe webhook endpoint

### Step 4: Test Your Backend

Open a new browser tab and visit:
```
https://your-app.up.railway.app/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "2026-02-08T..."
}
```

✅ If you see this, your backend is live!

### Step 5: Configure Stripe Webhooks

Stripe needs to know where to send payment events:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://your-app.up.railway.app/api/webhooks/stripe
   ```
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Go back to Railway → Variables and add:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Step 6: Update CORS (Allow Frontend Access)

1. Go back to Railway → Variables
2. Update `FRONTEND_URL` to your Vercel URL (we'll get this in Part 2)
3. The backend is already configured to allow Vercel domains

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Your Frontend

1. Make sure you're in the frontend directory:
   ```bash
   cd the-hub/the-hub
   ```

2. Test the production build locally:
   ```bash
   npm run build
   ```
   ✅ Should complete without errors

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy from the frontend directory:
   ```bash
   cd the-hub/the-hub
   vercel --prod
   ```

4. Follow the prompts:
   - Link to existing project? **No**
   - What's your project's name? **the-hub**
   - In which directory is your code? **./the-hub** (or press Enter if already in the directory)
   - Want to override settings? **No**

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com/) and log in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite app
5. Set the **Root Directory** to: `the-hub/the-hub`
6. Click **"Deploy"**

### Step 3: Configure Environment Variables

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add these variables:

```bash
# API Configuration (REQUIRED)
VITE_API_URL=https://your-app.up.railway.app

# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Stripe (REQUIRED)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

4. Click **"Save"**
5. **Important:** Redeploy after adding environment variables:
   - Go to **"Deployments"** tab
   - Click the three dots on the latest deployment
   - Click **"Redeploy"**

### Step 4: Update Backend CORS

Now that you have your Vercel URL, go back to Railway:

1. Go to Railway → Your backend service → Variables
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Railway will automatically redeploy

### Step 5: Test Your Frontend

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. You should see The Hub homepage
3. Try navigating around (Watches, Cars, Sneakers, etc.)
4. Everything should load without errors

✅ If you see data loading, you're live!

---

## Part 3: Database Setup

### Step 1: Run Migrations

Your Supabase database needs the correct schema. Here's how to set it up:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Click **"New query"**
5. Copy and paste the main migration file:
   ```bash
   # On your local machine:
   cat supabase/migrations/20260125193800_core_tables_schema.sql
   ```
6. Click **"Run"**
7. Repeat for other essential migrations:
   - `20260126000002_authentication_system.sql`
   - `20260126000000_newsletter_system.sql`
   - `20260128143000_deal_alerts_table.sql`
   - `20260128150000_channel_posts_table.sql`

### Step 2: Verify Tables Exist

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - `watches`
   - `watch_listings`
   - `cars`
   - `car_listings`
   - `sneakers`
   - `sneaker_listings`
   - `sports_teams`
   - `sports_games`
   - `users`
   - `user_profiles`
   - `subscriptions`

✅ If you see all these tables, your database is ready!

### Step 3: Check Row Level Security (RLS)

1. In Supabase, go to **Authentication** → **Policies**
2. Make sure these tables have RLS enabled:
   - `watch_listings` - Public read access
   - `car_listings` - Public read access
   - `sneaker_listings` - Public read access
   - `users` - User can only read/write their own data
   - `subscriptions` - User can only read their own subscription

---

## Part 4: Testing & Verification

### ✅ Backend Health Check

Visit:
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

### ✅ Frontend Loads

Visit your Vercel URL and check:
- [ ] Homepage loads
- [ ] Navigation works
- [ ] Watch listings appear
- [ ] No console errors (F12 → Console tab)

### ✅ Authentication Flow

1. Click **"Sign Up"**
2. Enter email and password
3. Should receive success message
4. Should be able to log in

### ✅ Stripe Integration (Test Mode)

1. Go to pricing page
2. Click **"Upgrade to Pro"**
3. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
4. Complete checkout
5. Verify webhook was received:
   - Check Railway logs: Go to Railway → Deployments → Logs
   - Should see: "Webhook received: checkout.session.completed"

### ✅ Check Railway Logs

1. Go to Railway → Your service → Deployments
2. Click on latest deployment → **"View Logs"**
3. Should see:
   ```
   🚀 Starting The Hub...
   ✅ API Server is running on port 3001
   ✅ Logger initialized
   📱 Telegram bot: Active (or disabled)
   ```

---

## Part 5: Post-Deployment Configuration

### Enable Production Features

Once everything is working, you can enable additional features:

1. Go to Railway → Variables
2. Update these as needed:

```bash
# Gradually enable features as you're ready
ENABLE_SCRAPER_SCHEDULER=true          # Auto-fetch new deals
ENABLE_SPORTS_SCHEDULER=true           # Update sports scores
ENABLE_DEAL_ALERTS=true                # Send deal notifications
ENABLE_NEWSLETTER_SCHEDULER=true       # Auto-send newsletters
ENABLE_INSTAGRAM_POSTER=true           # Auto-post to Instagram
```

⚠️ **Important:** Only enable features you've configured (e.g., don't enable Instagram poster without Instagram API credentials)

### Set Up Custom Domain (Optional)

**For Vercel (Frontend):**
1. Go to Vercel → Settings → Domains
2. Add your domain (e.g., `thehub.com`)
3. Follow DNS configuration instructions
4. Update Railway's `FRONTEND_URL` to your custom domain

**For Railway (Backend):**
1. Railway provides automatic `*.up.railway.app` domains
2. For custom domain: Go to Railway → Settings → Domains
3. Add your API subdomain (e.g., `api.thehub.com`)
4. Configure DNS as instructed
5. Update Vercel's `VITE_API_URL` to your custom domain

### Configure Email Service (Optional)

If you want to send newsletters:

1. Sign up for [Resend](https://resend.com/) (free tier: 3,000 emails/month)
2. Get your API key
3. Add to Railway:
   ```bash
   RESEND_API_KEY=re_your_key
   FROM_EMAIL=noreply@yourdomain.com
   NEWSLETTER_FROM_EMAIL=newsletter@yourdomain.com
   NEWSLETTER_FROM_NAME=The Hub
   ```
4. Verify your domain in Resend dashboard

---

## 🎉 You're Live!

Congratulations! The Hub is now live in production. Here's what to do next:

### Immediate Actions:
1. [ ] Test user signup flow end-to-end
2. [ ] Test a Stripe payment (test mode)
3. [ ] Add yourself as the first user
4. [ ] Verify all pages load correctly
5. [ ] Check mobile responsiveness

### Within 24 Hours:
1. [ ] Monitor Railway logs for errors
2. [ ] Set up uptime monitoring (see TROUBLESHOOTING.md)
3. [ ] Test Telegram notifications (if enabled)
4. [ ] Verify Stripe webhooks are working
5. [ ] Do a test subscription upgrade

### Ongoing:
1. Monitor Railway and Vercel dashboards for:
   - Usage/bandwidth
   - Error rates
   - Response times
2. Check Stripe dashboard for subscriptions
3. Monitor Supabase for database size

---

## 🆘 Need Help?

- **Deployment issues?** See `TROUBLESHOOTING.md`
- **Database problems?** Check Supabase logs
- **Stripe not working?** Verify webhook signature in Railway logs
- **Frontend not connecting?** Double-check `VITE_API_URL` in Vercel

---

## 📊 What You Just Built

- ✅ **Backend:** Node.js API running on Railway
- ✅ **Frontend:** React app running on Vercel
- ✅ **Database:** PostgreSQL on Supabase
- ✅ **Payments:** Stripe integration with webhooks
- ✅ **Real-time:** WebSocket connections for live updates
- ✅ **Authentication:** JWT-based auth system
- ✅ **Scalable:** Auto-scales with traffic

**Cost Estimate (Free Tiers):**
- Railway: $5/month (after free trial) or $0 with hobby plan
- Vercel: Free (up to 100 GB bandwidth)
- Supabase: Free (up to 500 MB database)
- Stripe: Free (2.9% + 30¢ per transaction)

**Total: ~$5/month or less**

---

## 🔒 Security Checklist

Before going fully live, verify:

- [ ] All `.env` files are in `.gitignore`
- [ ] No secrets committed to git
- [ ] HTTPS is enabled (automatic with Railway/Vercel)
- [ ] CORS is restricted to your domains only
- [ ] Stripe webhook signature verification is enabled
- [ ] Supabase RLS policies are configured
- [ ] JWT secrets are strong random strings
- [ ] Rate limiting is enabled (built into the API)

---

**Last Updated:** 2026-02-08
**Estimated Deployment Time:** 2-4 hours
**Difficulty:** Beginner-friendly (no terminal commands required)
