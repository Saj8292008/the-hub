# 🚀 The Hub - Deployment Checklist

Use this checklist to track your deployment progress. Check off items as you complete them!

---

## 📝 Pre-Deployment Preparation

### Accounts & Services
- [ ] Supabase account created
- [ ] Supabase project created and database configured
- [ ] Railway account created
- [ ] Vercel account created
- [ ] Stripe account created (test mode is fine)
- [ ] Telegram bot created (optional but recommended)
- [ ] Code pushed to GitHub repository

### Local Testing
- [ ] Backend runs successfully locally (`npm start` in root)
- [ ] Frontend builds successfully (`npm run build` in the-hub/the-hub)
- [ ] All environment variables documented
- [ ] `.env` files added to `.gitignore`
- [ ] No secrets committed to git

---

## 🎯 Part 1: Backend Deployment (Railway)

### Railway Project Setup
- [ ] Created new Railway project
- [ ] Connected GitHub repository
- [ ] Railway detected Node.js app automatically
- [ ] Build completed successfully

### Environment Variables Configuration
- [ ] `PORT=3001`
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` (will update after Vercel deployment)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_SERVICE_KEY` (alias)
- [ ] `SUPABASE_KEY` (alias)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET` (will add after webhook setup)
- [ ] `STRIPE_PRICE_ID_PRO_MONTHLY`
- [ ] `STRIPE_PRICE_ID_PRO_YEARLY`
- [ ] `STRIPE_PRICE_ID_PREMIUM_MONTHLY`
- [ ] `STRIPE_PRICE_ID_PREMIUM_YEARLY`
- [ ] `JWT_SECRET` (generated with `openssl rand -base64 32`)
- [ ] `JWT_REFRESH_SECRET` (generated with `openssl rand -base64 32`)
- [ ] `JWT_EXPIRES_IN=24h`
- [ ] `JWT_REFRESH_EXPIRES_IN=7d`
- [ ] `TELEGRAM_BOT_TOKEN` (optional)
- [ ] `TELEGRAM_CHANNEL_ID` (optional)
- [ ] `TELEGRAM_ADMIN_CHAT_ID` (optional)

### Optional Environment Variables (Add Later)
- [ ] `OPENAI_API_KEY` (for AI features)
- [ ] `ANTHROPIC_API_KEY` (for Claude AI)
- [ ] `RESEND_API_KEY` (for newsletters)
- [ ] `INSTAGRAM_ACCESS_TOKEN` (for auto-posting)
- [ ] `INSTAGRAM_ACCOUNT_ID`
- [ ] `TWITTER_API_KEY`
- [ ] Other integrations as needed

### Feature Toggles (Start Disabled)
- [ ] `ENABLE_SCRAPER_SCHEDULER=false`
- [ ] `ENABLE_SPORTS_SCHEDULER=false`
- [ ] `ENABLE_DEAL_ALERTS=false`
- [ ] `ENABLE_NEWSLETTER_SCHEDULER=false`
- [ ] `ENABLE_INSTAGRAM_POSTER=false`

### Deployment & Testing
- [ ] Railway deployment completed
- [ ] Railway URL obtained (e.g., `https://your-app.up.railway.app`)
- [ ] Health check endpoint working (`/health` returns OK)
- [ ] No errors in Railway deployment logs
- [ ] API responds to requests

---

## 💳 Part 2: Stripe Webhook Configuration

- [ ] Went to Stripe Dashboard → Webhooks
- [ ] Added new endpoint: `https://your-app.up.railway.app/api/webhooks/stripe`
- [ ] Selected events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Copied webhook signing secret
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Railway
- [ ] Railway redeployed automatically
- [ ] Tested webhook with Stripe CLI (optional)

---

## 🎨 Part 3: Frontend Deployment (Vercel)

### Vercel Project Setup
- [ ] Created new Vercel project
- [ ] Connected GitHub repository
- [ ] Set root directory to `the-hub/the-hub`
- [ ] Vercel auto-detected Vite configuration
- [ ] Initial deployment completed

### Environment Variables Configuration
- [ ] `VITE_API_URL` (Railway backend URL)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY`

### Post-Configuration
- [ ] Saved environment variables
- [ ] Triggered manual redeploy
- [ ] Vercel URL obtained (e.g., `https://your-app.vercel.app`)
- [ ] Updated Railway's `FRONTEND_URL` to Vercel URL
- [ ] Railway redeployed with updated CORS

### Frontend Testing
- [ ] Homepage loads successfully
- [ ] Navigation works (Watches, Cars, Sneakers, etc.)
- [ ] No console errors (check browser DevTools)
- [ ] Images load correctly
- [ ] Mobile view looks good

---

## 🗄️ Part 4: Database Configuration

### Supabase Schema Setup
- [ ] Opened Supabase SQL Editor
- [ ] Ran migration: `20260125193800_core_tables_schema.sql`
- [ ] Ran migration: `20260126000002_authentication_system.sql`
- [ ] Ran migration: `20260126000000_newsletter_system.sql`
- [ ] Ran migration: `20260128143000_deal_alerts_table.sql`
- [ ] Ran migration: `20260128150000_channel_posts_table.sql`
- [ ] All migrations completed without errors

### Verify Tables Created
- [ ] `watches` table exists
- [ ] `watch_listings` table exists
- [ ] `cars` table exists
- [ ] `car_listings` table exists
- [ ] `sneakers` table exists
- [ ] `sneaker_listings` table exists
- [ ] `sports_teams` table exists
- [ ] `sports_games` table exists
- [ ] `users` table exists
- [ ] `user_profiles` table exists
- [ ] `subscriptions` table exists
- [ ] `newsletter_subscribers` table exists
- [ ] `deal_alerts` table exists
- [ ] `channel_posts` table exists

### Row Level Security (RLS)
- [ ] RLS enabled on `watch_listings`
- [ ] RLS enabled on `car_listings`
- [ ] RLS enabled on `sneaker_listings`
- [ ] Public read policy applied to listings
- [ ] User-specific policies applied to personal data
- [ ] Subscription data protected by RLS

---

## ✅ Part 5: End-to-End Testing

### Health Checks
- [ ] Backend health endpoint works: `https://your-app.up.railway.app/health`
- [ ] Frontend loads without errors
- [ ] API connection successful (data loads on frontend)

### Authentication Flow
- [ ] User signup works
- [ ] Email verification (if enabled)
- [ ] User login works
- [ ] JWT token stored correctly
- [ ] Protected routes require authentication
- [ ] Logout works

### Stripe Payment Flow (Test Mode)
- [ ] Navigate to pricing/subscription page
- [ ] Click upgrade button
- [ ] Stripe checkout modal appears
- [ ] Test card accepted: `4242 4242 4242 4242`
- [ ] Checkout completes successfully
- [ ] Redirected back to app
- [ ] Subscription status updated in database
- [ ] User sees premium features unlocked
- [ ] Webhook event logged in Railway

### Data Display
- [ ] Watch listings display
- [ ] Car listings display
- [ ] Sneaker listings display
- [ ] Sports scores display (if enabled)
- [ ] Blog posts display (if applicable)

### Real-time Features
- [ ] WebSocket connection established
- [ ] Live updates work (if applicable)
- [ ] No connection errors

---

## 🔒 Part 6: Security Verification

### Code Security
- [ ] No secrets in git history (`git log --all --full-history --oneline -- '*.env'` returns nothing)
- [ ] `.env` files in `.gitignore`
- [ ] `.env.example` files committed (no actual secrets)
- [ ] No API keys in client-side code

### API Security
- [ ] CORS restricted to frontend domain only
- [ ] Rate limiting enabled (test with rapid requests)
- [ ] JWT tokens expire correctly
- [ ] Refresh tokens work
- [ ] SQL injection protected (parameterized queries)
- [ ] XSS protection enabled

### Infrastructure Security
- [ ] HTTPS enabled (automatic with Railway/Vercel)
- [ ] SSL certificates active (check browser lock icon)
- [ ] Stripe webhook signature verification working
- [ ] Supabase RLS policies protecting user data
- [ ] Environment variables stored securely (not in code)

---

## 📊 Part 7: Monitoring & Observability

### Railway Monitoring
- [ ] Checked deployment logs for errors
- [ ] Verified server startup logs look good
- [ ] No memory/CPU warnings
- [ ] Set up error alerts (optional)

### Vercel Monitoring
- [ ] Checked deployment logs
- [ ] Build completed successfully
- [ ] No 404 errors on key pages
- [ ] Response times reasonable (<2s)

### Supabase Monitoring
- [ ] Database connection successful
- [ ] Query performance acceptable
- [ ] No connection pool errors
- [ ] Storage usage within limits

### Stripe Monitoring
- [ ] Webhook delivery successful (check Stripe dashboard)
- [ ] Test payments processing
- [ ] No failed webhook deliveries

---

## 🎉 Part 8: Production Readiness

### Domain Setup (Optional)
- [ ] Custom domain purchased
- [ ] DNS configured for Vercel (frontend)
- [ ] DNS configured for Railway (backend - optional)
- [ ] SSL certificates issued for custom domain
- [ ] Updated `FRONTEND_URL` in Railway
- [ ] Updated `VITE_API_URL` in Vercel

### Email Configuration (Optional)
- [ ] Resend account created
- [ ] API key added to Railway
- [ ] Domain verified in Resend
- [ ] Test email sent successfully
- [ ] Newsletter subscription works

### Additional Integrations (Optional)
- [ ] Telegram bot working
- [ ] Instagram auto-poster configured
- [ ] Twitter integration active
- [ ] Analytics tracking added

### Enable Production Features
- [ ] Enabled desired schedulers in Railway
- [ ] Verified cron jobs running
- [ ] Tested automated features
- [ ] Monitoring automated posts/notifications

---

## 🚀 Part 9: Launch Preparation

### Final Testing
- [ ] Complete end-to-end user journey
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices (iOS and Android)
- [ ] Test all payment tiers
- [ ] Test edge cases (network failure, slow connection)

### Documentation
- [ ] README.md updated with live URLs
- [ ] API documentation accessible (if applicable)
- [ ] User guide created (if needed)
- [ ] Support contact info added

### Team Preparation
- [ ] Team has access to Railway dashboard
- [ ] Team has access to Vercel dashboard
- [ ] Team has access to Supabase dashboard
- [ ] Team has access to Stripe dashboard
- [ ] Emergency contact list created

---

## 📈 Part 10: Post-Launch

### First 24 Hours
- [ ] Monitor logs closely for errors
- [ ] Watch for unusual traffic patterns
- [ ] Respond to any user-reported issues
- [ ] Verify automated jobs running correctly

### First Week
- [ ] Review error logs daily
- [ ] Check Stripe for successful payments
- [ ] Monitor database growth
- [ ] Gather user feedback
- [ ] Fix any critical bugs

### Ongoing
- [ ] Set up weekly performance review
- [ ] Review Stripe payments weekly
- [ ] Monitor server costs
- [ ] Update dependencies monthly
- [ ] Backup database regularly (Supabase does this automatically)

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ **Backend:** Health check returns OK  
✅ **Frontend:** Homepage loads without errors  
✅ **Database:** All tables exist and accessible  
✅ **Authentication:** Users can sign up and log in  
✅ **Payments:** Test Stripe payment completes successfully  
✅ **Real-time:** WebSocket connections working  
✅ **Security:** No secrets exposed, HTTPS enabled  
✅ **Monitoring:** Logs accessible and clean  

---

## 🆘 If Something Goes Wrong

See `TROUBLESHOOTING.md` for common issues and solutions.

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Backend URL:** _______________  
**Frontend URL:** _______________  

---

**Last Updated:** 2026-02-08
