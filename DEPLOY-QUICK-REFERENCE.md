# 🚀 Deploy Quick Reference

**Status:** ✅ READY TO DEPLOY  
**Time:** 1.5 hours  
**Difficulty:** Easy

---

## 📋 Deployment Order

1. **Database** (15 min) → Supabase SQL Editor
2. **Backend** (20 min) → Railway
3. **Frontend** (15 min) → Vercel
4. **Integrations** (10 min) → Stripe + CORS
5. **Testing** (30 min) → End-to-end verification

---

## 🔗 Essential Links

**GitHub Repo:** https://github.com/Saj8292008/the-hub.git  
**Supabase:** https://supabase.com/dashboard/project/sysvawxchniqelifyenl  
**Railway:** https://railway.app  
**Vercel:** https://vercel.com  
**Stripe:** https://dashboard.stripe.com/test  

---

## 🗄️ Database Setup (Step 1)

**Guide:** `DATABASE-MIGRATION-GUIDE.md`

### Quick Steps:
1. Open Supabase SQL Editor
2. Copy/paste these migrations in order:
   - `20260125193800_core_tables_schema.sql`
   - `20260125194500_add_timestamp_columns.sql`
   - `20260125195000_fix_rls_policies.sql`
   - `20260126000002_authentication_system.sql`
   - `20260126000000_newsletter_system.sql`
   - `20260128143000_deal_alerts_table.sql`
   - `20260128150000_channel_posts_table.sql`
   - `migrations/create_alert_queue.sql`
   - `migrations/add_instagram_tracking.sql`
3. Verify tables exist
4. Done ✅

---

## 🚂 Railway Backend (Step 2)

**Guide:** `PRODUCTION-DEPLOYMENT-READY.md` Part 1

### Quick Steps:
1. New Project → Deploy from GitHub
2. Select `Saj8292008/the-hub` (main branch)
3. Variables → Raw Editor → Paste this:

```bash
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app

SUPABASE_URL=https://sysvawxchniqelifyenl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODg5NTUsImV4cCI6MjA4NDM2NDk1NX0.kwJXfM8iutl5rBv5TCIlscwMq3_cj0nYfCM_d91jLwY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4ODk1NSwiZXhwIjoyMDg0MzY0OTU1fQ.2vT6lOoCcZPFg_slodGZEpmUrlQVjf2iNKdrF6lHfsA
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4ODk1NSwiZXhwIjoyMDg0MzY0OTU1fQ.2vT6lOoCcZPFg_slodGZEpmUrlQVjf2iNKdrF6lHfsA
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4ODk1NSwiZXhwIjoyMDg0MzY0OTU1fQ.2vT6lOoCcZPFg_slodGZEpmUrlQVjf2iNKdrF6lHfsA

STRIPE_SECRET_KEY=[USE YOUR STRIPE SECRET KEY FROM .env FILE]
STRIPE_PUBLISHABLE_KEY=[USE YOUR STRIPE PUBLISHABLE KEY FROM .env FILE]
STRIPE_WEBHOOK_SECRET=[GET THIS AFTER CREATING WEBHOOK ENDPOINT]
STRIPE_PRICE_ID_PRO_MONTHLY=price_1Sy1BjCaz620S5FSO8c5KhF9
STRIPE_PRICE_ID_PRO_YEARLY=price_1Sy1BjCaz620S5FSDGlVkwJ4
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_1Sy1BkCaz620S5FSZceyouEG
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_1Sy1BkCaz620S5FSHiGZvodz

JWT_SECRET=Z66Zxs3x7feoRnP85Y4LSCpT2BVSNCQESO3BT11gSRc=
JWT_REFRESH_SECRET=gM+nkj227Sm4io9ADk3eyyJwKMKAOxZE0f8DfRGxiXk=
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

TELEGRAM_BOT_TOKEN=8432859549:AAGOHwCl_57vYMsbCqeeZQc7Z6CnbZNh_s0
TELEGRAM_CHANNEL_ID=-1003850293697
TELEGRAM_EMPIRE_CHANNEL_ID=-1003884685341

INSTAGRAM_ACCESS_TOKEN=EAAQpjQAZCtVoBQrNp7tyqPZCLRfZBn2VwHiQGBwJBlmxi0XgT8r2eY6fIvfJ56Iz6y6175oPuyHe9ceNVjRDmwmuIcO8ltr8m0aBZCQgZAaZCORzMQOZC492ZAoDcoBCax8xNx9ECDyB99P5ziiR7BKsRCQ6ttDPiGFDBBHKTiCRsEMrJ5TlkZBcQeQGEJQSBdRORsNJd5ga6eUSWZChe4HNCPGWvZAhwQnfi0ptxBMovkMmvsZD
INSTAGRAM_ACCOUNT_ID=17841475721129222
INSTAGRAM_SCORE_THRESHOLD=12

IMGBB_API_KEY=5fd7f278a560fc8bfebd338063bae906

ENABLE_SCRAPER_SCHEDULER=false
ENABLE_SPORTS_SCHEDULER=false
ENABLE_DEAL_ALERTS=false
ENABLE_NEWSLETTER_SCHEDULER=false
ENABLE_INSTAGRAM_POSTER=false
```

4. Wait for deployment
5. Copy Railway URL
6. Test: `https://YOUR-URL.up.railway.app/health`
7. Done ✅

---

## 🎨 Vercel Frontend (Step 3)

**Guide:** `PRODUCTION-DEPLOYMENT-READY.md` Part 2

### Quick Steps:
1. New Project → Import from GitHub
2. Select `Saj8292008/the-hub`
3. **Important:** Root Directory = `the-hub/the-hub`
4. Deploy (wait)
5. Settings → Environment Variables:

```bash
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
VITE_SUPABASE_URL=https://sysvawxchniqelifyenl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODg5NTUsImV4cCI6MjA4NDM2NDk1NX0.kwJXfM8iutl5rBv5TCIlscwMq3_cj0nYfCM_d91jLwY
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SZ1EGCaz620S5FS2zfXu1mxbUTQgQzkaHeCOtnuY1KKoVP4QE9OwBWiS7q1Kj2UNrozHR3nLf2OSusbtEwF6sjE00JdE9XRXD
```

6. Deployments → Redeploy
7. Copy Vercel URL
8. Done ✅

---

## 🔄 Connect Services (Step 4)

### Update CORS
1. Railway → Variables
2. Update `FRONTEND_URL` = Your Vercel URL
3. Railway auto-redeploys

### Configure Stripe Webhook
1. Stripe Dashboard → Webhooks
2. Add endpoint: `https://YOUR-RAILWAY-URL/api/webhooks/stripe`
3. Select events:
   - checkout.session.completed
   - customer.subscription.*
   - invoice.payment_*
4. Copy signing secret
5. Railway → Update `STRIPE_WEBHOOK_SECRET`
6. Done ✅

---

## ✅ Quick Verification

### Backend
```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
# Should return: {"status":"OK","timestamp":"..."}
```

### Frontend
1. Visit Vercel URL
2. Check homepage loads
3. F12 → Console (no errors)
4. Network tab (API calls work)

### Auth
1. Sign up new user
2. Log in
3. Dashboard loads

### Payment
1. Pricing page
2. Upgrade to Pro
3. Card: 4242 4242 4242 4242
4. Complete checkout
5. Check webhook in Railway logs

---

## 📊 Quick Checklist

- [ ] Database migrations run
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] CORS updated
- [ ] Stripe webhook configured
- [ ] Health check passes
- [ ] Frontend loads
- [ ] Auth works
- [ ] Payment works
- [ ] No errors in logs

**All checked? 🎉 YOU'RE LIVE!**

---

## 🆘 Quick Troubleshooting

**Backend won't start:**
→ Check Railway logs for errors

**Frontend can't connect:**
→ Verify VITE_API_URL is correct
→ Check CORS (FRONTEND_URL in Railway)

**Stripe webhook fails:**
→ Verify webhook secret is correct
→ Check webhook URL is correct

**Full Guide:** `TROUBLESHOOTING.md`

---

## 📞 Resources

**Main Deployment Guide:** `PRODUCTION-DEPLOYMENT-READY.md`  
**Database Guide:** `DATABASE-MIGRATION-GUIDE.md`  
**Progress Tracker:** `DEPLOYMENT-TRACKER.md`  
**Troubleshooting:** `TROUBLESHOOTING.md`  
**Completion Report:** `DEPLOYMENT-COMPLETION-REPORT.md`

---

**Ready? Start with Step 1: Database Setup** 🚀

**Total Time:** ~1.5 hours  
**Cost:** $0-5/month  
**Difficulty:** Easy
