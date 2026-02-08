# ⚡ The Hub - 30-Minute Deployment Quickstart

**Goal:** Get The Hub live in production in 30 minutes or less.

This is the fast-track version. For detailed explanations, see `DEPLOYMENT.md`.

---

## ✅ Prerequisites (5 minutes)

Make sure you have:
- [ ] Supabase project created and database set up
- [ ] Railway account
- [ ] Vercel account
- [ ] Stripe account (test mode is fine)
- [ ] Code pushed to GitHub

---

## 🚀 Part 1: Backend on Railway (10 minutes)

### Step 1: Deploy to Railway
1. Go to [railway.app](https://railway.app/)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `the-hub` repository
4. Wait for initial deployment (2-3 minutes)

### Step 2: Add Environment Variables
1. Click your service → **"Variables"** tab
2. Click **"Raw Editor"**
3. Paste this (fill in your actual values):

```bash
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
SUPABASE_KEY=eyJhbGci...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_...

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

ENABLE_SCRAPER_SCHEDULER=false
ENABLE_SPORTS_SCHEDULER=false
ENABLE_DEAL_ALERTS=false
```

**Generate JWT secrets:**
```bash
openssl rand -base64 32  # Use output for JWT_SECRET
openssl rand -base64 32  # Use output for JWT_REFRESH_SECRET
```

4. Click **"Save"** - Railway will redeploy

### Step 3: Get Your Backend URL
- Copy your Railway URL: `https://your-app.up.railway.app`
- Test: Visit `https://your-app.up.railway.app/health`
- Should see: `{"status":"OK",...}`

✅ **Backend is live!**

---

## 🎨 Part 2: Frontend on Vercel (10 minutes)

### Step 1: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com/)
2. Click **"Add New"** → **"Project"**
3. Import your `the-hub` repository
4. Set **"Root Directory"** to: `the-hub/the-hub`
5. Click **"Deploy"** (wait 2-3 minutes)

### Step 2: Add Environment Variables
1. Go to **"Settings"** → **"Environment Variables"**
2. Add these:

```bash
VITE_API_URL=https://your-app.up.railway.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. Click **"Save"**
4. Go to **"Deployments"** → click ⋯ on latest → **"Redeploy"**

### Step 3: Update Backend CORS
1. Go back to Railway → Your service → **"Variables"**
2. Update `FRONTEND_URL` to your Vercel URL: `https://your-app.vercel.app`
3. Railway will auto-redeploy

✅ **Frontend is live!**

---

## 💳 Part 3: Configure Stripe (5 minutes)

### Step 1: Set Up Webhook
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter: `https://your-app.up.railway.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**

### Step 2: Update Webhook Secret
1. Copy the **"Signing secret"** (starts with `whsec_`)
2. Go to Railway → Variables
3. Update `STRIPE_WEBHOOK_SECRET=whsec_your_secret_here`

✅ **Stripe is configured!**

---

## 🗄️ Part 4: Database Setup (5 minutes)

### Run Migrations in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **"SQL Editor"** → **"New query"**
3. Copy contents of each file and run:

**Required migrations (run in order):**
1. `supabase/migrations/20260125193800_core_tables_schema.sql` ✅ REQUIRED
2. `supabase/migrations/20260126000002_authentication_system.sql` ✅ REQUIRED

**Optional migrations:**
3. `supabase/migrations/20260126000000_newsletter_system.sql` (if using newsletters)
4. `supabase/migrations/20260128143000_deal_alerts_table.sql` (if using alerts)

### Verify Tables Exist
```sql
-- Run this in Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should see: `watches`, `watch_listings`, `users`, `subscriptions`, etc.

✅ **Database is ready!**

---

## ✅ Part 5: Test Everything (5 minutes)

### Test Backend
```bash
curl https://your-app.up.railway.app/health
# Should return: {"status":"OK","timestamp":"..."}
```

### Test Frontend
1. Visit: `https://your-app.vercel.app`
2. Should load without errors
3. Check browser console (F12) - no red errors

### Test Auth
1. Click **"Sign Up"**
2. Create account
3. Should successfully create account and log in

### Test Stripe
1. Go to pricing/subscription page
2. Click **"Upgrade"**
3. Use test card: `4242 4242 4242 4242`
4. Exp: `12/34`, CVC: `123`
5. Complete checkout
6. Should redirect back to app
7. Check Railway logs for webhook event

---

## 🎉 You're Live!

Your deployment is complete! Here's what you have:

✅ **Backend:** `https://your-app.up.railway.app`  
✅ **Frontend:** `https://your-app.vercel.app`  
✅ **Database:** Supabase with all tables  
✅ **Payments:** Stripe webhooks configured  

---

## 📋 Post-Deployment Checklist

**Immediately:**
- [ ] Test user signup
- [ ] Test Stripe payment (test mode)
- [ ] Verify health endpoint works
- [ ] Check Railway logs - no errors

**Within 24 Hours:**
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Test on mobile device
- [ ] Review security checklist
- [ ] Test all main features

**Next Steps:**
- [ ] Add your content
- [ ] Enable desired features (scrapers, etc.)
- [ ] Switch Stripe to live mode when ready
- [ ] Consider custom domain

---

## 🆘 If Something Goes Wrong

**Backend not working?**
- Check Railway logs for errors
- Verify all environment variables are set
- Test health endpoint: `/health`

**Frontend not connecting?**
- Check `VITE_API_URL` in Vercel matches Railway URL
- Check CORS: `FRONTEND_URL` in Railway matches Vercel URL
- Check browser console for errors

**Stripe not working?**
- Verify webhook secret in Railway matches Stripe
- Check webhook URL ends in `/api/webhooks/stripe`
- Check Railway logs for webhook events

**More help:** See `TROUBLESHOOTING.md`

---

## 📚 Full Documentation

For detailed explanations and advanced configuration:
- `DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT-CHECKLIST.md` - Detailed checklist
- `TROUBLESHOOTING.md` - Common issues
- `DATABASE-SETUP.md` - Database configuration
- `SECURITY-CHECKLIST.md` - Security verification
- `MONITORING-GUIDE.md` - Production monitoring

---

**Deployment Time:** ~30 minutes  
**Difficulty:** Beginner-friendly  
**Cost:** ~$5/month (Railway) + Free (Vercel/Supabase)

**Last Updated:** 2026-02-08
