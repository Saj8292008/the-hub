# 🔧 The Hub - Deployment Troubleshooting Guide

Common deployment issues and how to fix them.

---

## 🚨 Quick Diagnostics

If something's not working, start here:

### 1. Check Backend Health
```
https://your-app.up.railway.app/health
```
- ✅ Should return: `{"status":"OK","timestamp":"..."}`
- ❌ If 404: Backend didn't deploy correctly
- ❌ If 500: Check Railway logs for errors
- ❌ If timeout: Backend crashed, check logs

### 2. Check Frontend Loads
```
https://your-app.vercel.app
```
- ✅ Homepage loads, no console errors
- ❌ If blank: Check browser console (F12)
- ❌ If 404: Check Vercel deployment status
- ❌ If "Cannot reach API": Backend URL is wrong

### 3. Check Railway Logs
1. Go to Railway dashboard
2. Click your service
3. Click "Deployments" → Latest → "View Logs"
4. Look for errors (red text)

### 4. Check Vercel Logs
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments" → Latest → "View Function Logs"
4. Look for errors

### 5. Check Browser Console
1. Open your app in browser
2. Press F12 (or right-click → Inspect)
3. Go to "Console" tab
4. Look for red errors

---

## 🐛 Common Issues & Solutions

### Issue: Railway Build Fails

**Symptoms:**
- Railway shows "Build Failed"
- Deployment never completes
- Red error in build logs

**Solutions:**

1. **Missing `package.json`:**
   - Make sure `package.json` is in the root directory
   - Check that it has a `"scripts"` section with `"start"` command

2. **Node version mismatch:**
   - Add to `package.json`:
     ```json
     "engines": {
       "node": ">=18.0.0"
     }
     ```

3. **Missing dependencies:**
   - In Railway logs, look for "Cannot find module"
   - Run locally: `npm install`
   - Make sure `package-lock.json` is committed to git

4. **Environment variables needed at build time:**
   - Most env vars are runtime-only, but if you get build errors about missing vars:
   - Add them in Railway → Variables
   - Redeploy

**Fix:**
```bash
# Locally test the build
npm install
npm start

# If that works, commit and push:
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push

# Railway will auto-redeploy
```

---

### Issue: Backend Returns 500 Internal Server Error

**Symptoms:**
- `/health` endpoint returns 500
- Railway logs show error messages
- App crashes on startup

**Common Causes:**

1. **Missing environment variables:**
   ```
   Error: SUPABASE_URL is not defined
   ```
   **Fix:** Add missing variable in Railway → Variables

2. **Database connection failed:**
   ```
   Error: connect ECONNREFUSED
   ```
   **Fix:** Check `SUPABASE_URL` is correct and database is running

3. **Stripe not configured:**
   ```
   Error: No API key provided
   ```
   **Fix:** Add `STRIPE_SECRET_KEY` in Railway

4. **Port already in use (shouldn't happen in production):**
   ```
   Error: Port 3001 is already in use
   ```
   **Fix:** Railway handles this automatically, but ensure `PORT` env var is set

**Debug Steps:**
1. Check Railway logs for the exact error
2. Add the missing environment variable
3. Railway will auto-redeploy
4. Test `/health` endpoint again

---

### Issue: Frontend Can't Connect to Backend (CORS Error)

**Symptoms:**
- Frontend loads but no data appears
- Browser console shows:
  ```
  Access to XMLHttpRequest at 'https://...' from origin 'https://...' has been blocked by CORS policy
  ```
- Red errors about "No 'Access-Control-Allow-Origin' header"

**Solution:**

1. **Check `FRONTEND_URL` in Railway:**
   - Go to Railway → Variables
   - Make sure `FRONTEND_URL` matches your Vercel URL exactly
   - Example: `https://your-app.vercel.app` (no trailing slash)

2. **Check `VITE_API_URL` in Vercel:**
   - Go to Vercel → Settings → Environment Variables
   - Make sure `VITE_API_URL` matches your Railway URL exactly
   - Example: `https://your-app.up.railway.app` (no trailing slash)

3. **Redeploy both after changes:**
   - Railway redeploys automatically when you change variables
   - Vercel needs manual redeploy: Deployments → ⋯ → Redeploy

4. **Still not working?**
   - Check if you're using the correct protocol (https:// not http://)
   - Verify no extra paths in the URLs (should end in `.app`, not `.app/api`)

---

### Issue: Stripe Webhooks Not Working

**Symptoms:**
- Payments complete but subscription doesn't activate
- Railway logs show: "Webhook signature verification failed"
- Stripe dashboard shows failed webhook deliveries

**Solutions:**

1. **Wrong webhook secret:**
   ```
   Error: No signatures found matching the expected signature for payload
   ```
   **Fix:**
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook endpoint
   - Copy the "Signing secret" (starts with `whsec_`)
   - Update in Railway: `STRIPE_WEBHOOK_SECRET=whsec_...`

2. **Wrong webhook URL:**
   - Should be: `https://your-app.up.railway.app/api/webhooks/stripe`
   - NOT: `https://your-app.vercel.app/...` (that's the frontend!)
   - Go to Stripe Dashboard → Webhooks
   - Click on your endpoint
   - Edit → Update URL
   - Make sure it ends in `/api/webhooks/stripe`

3. **Webhook endpoint not receiving events:**
   - In Stripe dashboard, check webhook "Logs" tab
   - If showing 404: URL is wrong
   - If showing 500: Check Railway logs for errors
   - If showing timeout: Backend is slow or crashed

**Test Webhook:**
```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Test webhook locally (for testing, not production)
stripe listen --forward-to https://your-app.up.railway.app/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

### Issue: Users Can't Sign Up / Authentication Fails

**Symptoms:**
- Sign up button doesn't work
- "Invalid credentials" error on login
- Console error about Supabase

**Solutions:**

1. **Supabase keys wrong:**
   - Frontend needs: `VITE_SUPABASE_ANON_KEY` (in Vercel)
   - Backend needs: `SUPABASE_SERVICE_ROLE_KEY` (in Railway)
   - Go to Supabase → Settings → API
   - Copy the correct keys
   - Update in Railway and Vercel

2. **JWT secrets not set:**
   - Backend needs `JWT_SECRET` and `JWT_REFRESH_SECRET`
   - Generate: `openssl rand -base64 32`
   - Add both to Railway

3. **Database migrations not run:**
   - Go to Supabase SQL Editor
   - Run `20260126000002_authentication_system.sql`
   - Verify `users` table exists

4. **RLS policies blocking access:**
   - In Supabase Table Editor, click on `users` table
   - Go to "Policies" tab
   - Should have policy: "Users can insert their own data"
   - If missing, run the authentication migration again

---

### Issue: Frontend Loads But Shows No Data

**Symptoms:**
- Homepage appears but listings are empty
- Console shows 404 errors
- "No items found" everywhere

**Solutions:**

1. **Database is empty:**
   - This is normal for a fresh deployment!
   - Data comes from scrapers or manual entry
   - You can:
     - Enable scrapers: `ENABLE_SCRAPER_SCHEDULER=true` in Railway
     - Or manually add test data in Supabase Table Editor

2. **API URL is wrong:**
   - Check Vercel → Environment Variables
   - `VITE_API_URL` should be your Railway backend URL
   - Must include `https://`
   - NO trailing slash

3. **API endpoints returning 404:**
   - Test directly: `https://your-app.up.railway.app/api/watches`
   - If 404: Backend routes not registered
   - Check Railway logs for startup errors

4. **Database connection failed:**
   - Check Railway logs for database errors
   - Verify `SUPABASE_URL` and keys are correct
   - Test Supabase dashboard - can you query tables manually?

---

### Issue: Vercel Build Fails

**Symptoms:**
- Vercel deployment shows "Build Failed"
- Error in Vercel logs
- Site doesn't update after push

**Solutions:**

1. **Wrong root directory:**
   - Go to Vercel → Settings → General
   - Root Directory should be: `the-hub/the-hub`
   - Save and redeploy

2. **Missing environment variables at build time:**
   - Some frameworks need env vars during build
   - Go to Vercel → Settings → Environment Variables
   - Add all `VITE_*` variables
   - Redeploy

3. **TypeScript errors:**
   ```
   Error: Type 'string' is not assignable to type 'number'
   ```
   - Fix the TypeScript error in code
   - Or temporarily disable strict checks in `tsconfig.json`:
     ```json
     {
       "compilerOptions": {
         "strict": false
       }
     }
     ```

4. **Node version mismatch:**
   - Add to `package.json` in frontend folder:
     ```json
     "engines": {
       "node": "18.x"
     }
     ```

---

### Issue: SSL / HTTPS Errors

**Symptoms:**
- "Your connection is not private" warning
- Mixed content errors (http/https)
- Stripe won't load

**Solutions:**

1. **Mixed content (http in https page):**
   - Check that `VITE_API_URL` uses `https://`
   - All external links should use `https://`
   - Update and redeploy

2. **Railway/Vercel SSL not working:**
   - Both provide automatic SSL - shouldn't happen
   - If you see this, it's usually a custom domain issue
   - Wait 24 hours for SSL cert to provision
   - Or check DNS settings

---

### Issue: Database Migrations Failed

**Symptoms:**
- Supabase SQL Editor shows errors
- "relation does not exist" errors
- Tables missing

**Solutions:**

1. **Run migrations in order:**
   - Start with: `20260125193800_core_tables_schema.sql`
   - Then: `20260126000002_authentication_system.sql`
   - Then: All others in numeric order
   - Don't skip any!

2. **Foreign key errors:**
   ```
   ERROR: relation "users" does not exist
   ```
   - You skipped the authentication migration
   - Run `20260126000002_authentication_system.sql` first

3. **Permission errors:**
   ```
   ERROR: permission denied for table
   ```
   - You're using the wrong database key
   - Use service_role key in Supabase SQL Editor
   - Or run through Supabase dashboard (auto-uses correct permissions)

4. **Duplicate errors:**
   ```
   ERROR: relation "watches" already exists
   ```
   - Migration was already run
   - Safe to ignore or use `CREATE TABLE IF NOT EXISTS`

---

### Issue: Slow Performance

**Symptoms:**
- Pages take >5 seconds to load
- API responses are slow
- Railway shows high CPU usage

**Solutions:**

1. **Database query is slow:**
   - Check Supabase Dashboard → Database → Query Performance
   - Add indexes to frequently queried columns
   - Example: Already included in migrations

2. **Too many API calls:**
   - Open browser console → Network tab
   - Look for repeated requests
   - Implement caching or request deduplication

3. **Large bundle size:**
   - Frontend bundle is 1.3 MB (normal for this app)
   - Consider code splitting for improvement
   - Run: `npm run build` and check bundle size

4. **Railway instance too small:**
   - Free tier has limited resources
   - Upgrade to Hobby plan ($5/month) for better performance
   - Or optimize code to use fewer resources

---

### Issue: Payment Works But Subscription Doesn't Activate

**Symptoms:**
- Stripe shows successful payment
- User doesn't get premium features
- Database shows no subscription

**Debug Steps:**

1. **Check Stripe webhook was received:**
   - Go to Railway → Logs
   - Search for "checkout.session.completed"
   - If not found: Webhook not reaching backend

2. **Check webhook signature:**
   - If logs show "signature verification failed"
   - Update `STRIPE_WEBHOOK_SECRET` in Railway
   - Get correct value from Stripe Dashboard → Webhooks

3. **Check database was updated:**
   - Go to Supabase → Table Editor → `subscriptions`
   - Look for row with the user's email
   - If missing: Webhook handler has a bug (check Railway logs for error)

4. **Check user metadata:**
   - Go to Supabase → Table Editor → `users`
   - User should have `subscription_tier` field set
   - If null: Update logic might have failed

**Manual Fix:**
If payment succeeded but subscription didn't activate:
```sql
-- In Supabase SQL Editor:
INSERT INTO subscriptions (user_id, stripe_subscription_id, plan, status)
VALUES (
  'user-uuid-here',
  'sub_xxx',
  'premium',
  'active'
);
```

---

### Issue: Railway/Vercel Running Out of Free Tier

**Symptoms:**
- Railway shows "Suspended"
- Vercel shows "Quota Exceeded"
- Site stops working at end of month

**Solutions:**

1. **Railway limits:**
   - Free trial: $5 credit
   - After trial: Hobby plan ($5/month)
   - Check usage: Railway Dashboard → Usage
   - Upgrade if needed

2. **Vercel limits:**
   - Free: 100 GB bandwidth/month
   - If exceeded: Upgrade to Pro ($20/month)
   - Or optimize images/assets
   - Use Vercel Analytics to see what's using bandwidth

3. **Supabase limits:**
   - Free: 500 MB database, 2 GB bandwidth
   - Check usage: Supabase Dashboard → Settings → Billing
   - If near limit:
     - Delete old data
     - Archive old records
     - Upgrade to Pro ($25/month)

---

## 🔍 Advanced Debugging

### Enable Debug Mode

Add to Railway environment variables:
```bash
LOG_LEVEL=debug
DEBUG_HTML=true
DEBUG_SCREENSHOTS=true
```

This will:
- Show detailed logs in Railway
- Save HTML snapshots (for scraper debugging)
- Capture screenshots on errors

### Check WebSocket Connection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Should see connection to backend
5. Status should be "101 Switching Protocols"

If not connected:
- Check backend logs for WebSocket errors
- Verify CORS settings include WebSocket

### Database Query Debugging

1. Go to Supabase → SQL Editor
2. Test query directly:
   ```sql
   SELECT * FROM watch_listings LIMIT 10;
   ```
3. If error: Note the exact message
4. Check table exists: Go to Table Editor

### API Response Debugging

Test API endpoints directly:
```bash
# Health check
curl https://your-app.up.railway.app/health

# Get watches
curl https://your-app.up.railway.app/api/watches

# With authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.up.railway.app/api/user/profile
```

---

## 📞 Still Stuck?

### Check These Resources:

1. **Railway Docs:** https://docs.railway.app/
2. **Vercel Docs:** https://vercel.com/docs
3. **Supabase Docs:** https://supabase.com/docs
4. **Stripe Docs:** https://stripe.com/docs/webhooks

### Get Help:

1. Check Railway logs for exact error message
2. Check Vercel logs for build errors
3. Check Supabase logs for database errors
4. Check browser console for frontend errors
5. Search the error message on Google/Stack Overflow

### Report an Issue:

When asking for help, include:
- What you were trying to do
- What you expected to happen
- What actually happened
- Error messages (full text)
- Screenshots of errors
- Links to Railway/Vercel logs (if public)

---

## ✅ Prevention Checklist

Avoid issues by following these best practices:

- [ ] Test locally before deploying
- [ ] Use `.env.example` to track required variables
- [ ] Keep Railway and Vercel env vars in sync
- [ ] Monitor logs after deployment
- [ ] Test payment flow in test mode first
- [ ] Run database migrations in order
- [ ] Keep dependencies up to date
- [ ] Use staging environment for testing (optional)
- [ ] Have rollback plan (git tags for releases)

---

**Last Updated:** 2026-02-08
