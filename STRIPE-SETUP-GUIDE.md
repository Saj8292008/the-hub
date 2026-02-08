# Stripe Payment Setup Guide

Complete guide to set up payments for The Hub.

---

## What You Have Built

✅ **Complete payment infrastructure:**
- Checkout sessions (subscription signup)
- Billing portal (manage subscriptions)
- Subscription status tracking
- Multi-tier support (Free, Pro $9/mo, Premium $19/mo)

**Files:**
- `/src/lib/stripe.js` - Stripe client
- `/src/api/stripe.js` - Payment API routes
- Webhook handling (needs setup)

---

## Step 1: Login to Stripe CLI (2 minutes)

```bash
stripe login
```

This will:
1. Open browser
2. Ask you to confirm authentication
3. Save your credentials locally

**If you don't have a Stripe account:**
```bash
# Sign up at stripe.com first, then login
open https://dashboard.stripe.com/register
```

---

## Step 2: Get Your API Keys (1 minute)

### Get Test Keys (for development)
```bash
# Get publishable key
stripe keys list --test | grep "Publishable key"

# Get secret key  
stripe keys list --test | grep "Secret key"
```

### Or get from Dashboard:
```bash
open https://dashboard.stripe.com/test/apikeys
```

Copy both:
- **Publishable key** (starts with `pk_test_`)
- **Secret key** (starts with `sk_test_`)

---

## Step 3: Configure Environment Variables

Add to `/the-hub/.env`:

```bash
# Stripe Keys (Test mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000

# Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx
STRIPE_PRICE_ID_PRO_YEARLY=price_xxx
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_xxx
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_xxx
```

---

## Step 4: Create Products & Prices in Stripe (5 minutes)

### Option A: Via Stripe CLI (Fast)

```bash
cd /Users/sydneyjackson/the-hub

# Create Pro tier (monthly)
stripe products create \
  --name "The Hub Pro" \
  --description "Advanced deal tracking and alerts"

# Get the product ID from output (prod_xxx), then create price:
stripe prices create \
  --product prod_YOUR_PRODUCT_ID \
  --currency usd \
  --recurring[interval]=month \
  --unit-amount 900 \
  --nickname "Pro Monthly"

# Create Pro (yearly) - 20% discount
stripe prices create \
  --product prod_YOUR_PRODUCT_ID \
  --currency usd \
  --recurring[interval]=year \
  --unit-amount 8640 \
  --nickname "Pro Yearly"

# Create Premium tier (monthly)
stripe products create \
  --name "The Hub Premium" \
  --description "Full platform access with AI features"

stripe prices create \
  --product prod_YOUR_PREMIUM_PRODUCT_ID \
  --currency usd \
  --recurring[interval]=month \
  --unit-amount 1900 \
  --nickname "Premium Monthly"

# Create Premium (yearly)
stripe prices create \
  --product prod_YOUR_PREMIUM_PRODUCT_ID \
  --currency usd \
  --recurring[interval]=year \
  --unit-amount 18240 \
  --nickname "Premium Yearly"
```

### Option B: Via Dashboard (Visual)

```bash
open https://dashboard.stripe.com/test/products
```

Create 2 products:
1. **The Hub Pro** - $9/month or $86.40/year
2. **The Hub Premium** - $19/month or $182.40/year

Copy the Price IDs and add to `.env`

---

## Step 5: Set Up Webhook Listener (Critical!)

Webhooks let Stripe notify your app about subscription events (payment success, cancellation, etc.)

### Start Webhook Listener

```bash
cd /Users/sydneyjackson/the-hub

# This forwards Stripe events to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copy that secret** and add to `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Keep this terminal running!** It needs to stay open during development.

---

## Step 6: Restart Your Server

```bash
# Kill current server
pkill -f "node.*server.js"

# Start with new env vars
cd /Users/sydneyjackson/the-hub
npm start
```

Or if using nodemon:
```bash
npm run dev
```

---

## Step 7: Test the Integration (5 minutes)

### Test Checkout Flow

```bash
# Open your app
open http://localhost:3000/premium

# Click "Subscribe to Pro"
# Use test card: 4242 4242 4242 4242
# Any future expiry date
# Any 3-digit CVC

# Should redirect to success page after payment
```

### Test Cards (from Stripe)

**Success:**
- `4242 4242 4242 4242` - Visa

**Requires authentication:**
- `4000 0025 0000 3155` - Visa (3D Secure)

**Decline:**
- `4000 0000 0000 9995` - Declined

**Full list:**
```bash
open https://stripe.com/docs/testing#cards
```

---

## Step 8: Verify Webhook Events

After test payment, check webhook terminal:
```
✔ Received event: checkout.session.completed
✔ Received event: customer.subscription.created
✔ Received event: invoice.paid
```

Check your database:
```bash
psql $DATABASE_URL -c "SELECT id, email, tier, stripe_customer_id FROM users WHERE tier != 'free';"
```

Should see user upgraded to 'pro' or 'premium'!

---

## Common Issues & Fixes

### "STRIPE_SECRET_KEY not configured"
→ Add keys to `.env` and restart server

### "Webhook signature verification failed"
→ Make sure `stripe listen` is running
→ Copy the correct `whsec_` secret to `.env`

### "Customer not found"
→ Make sure you're using TEST mode keys (sk_test_, pk_test_)
→ Check Stripe dashboard: https://dashboard.stripe.com/test/customers

### Payment succeeds but user not upgraded
→ Check webhook listener is running
→ Check server logs for errors
→ Verify webhook secret is correct

---

## Going Live (Production)

When ready for real payments:

1. **Switch to live mode** in Stripe Dashboard
2. **Get live keys:**
   ```bash
   stripe keys list --live
   ```
3. **Update `.env` with live keys** (sk_live_, pk_live_)
4. **Set up production webhook:**
   ```bash
   open https://dashboard.stripe.com/webhooks
   ```
   Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
5. **Update price IDs** to live prices
6. **Test with real card** (small amount)

---

## Quick Commands Reference

```bash
# Login
stripe login

# List keys
stripe keys list --test

# Create product
stripe products create --name "Product Name"

# Create price
stripe prices create --product prod_xxx --currency usd \
  --recurring[interval]=month --unit-amount 900

# Start webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test webhook
stripe trigger checkout.session.completed

# View events
stripe events list --limit 10

# View customers
stripe customers list --limit 10

# View subscriptions
stripe subscriptions list --limit 10
```

---

## Next Steps

1. ✅ Run `stripe login`
2. ✅ Get API keys
3. ✅ Add keys to `.env`
4. ✅ Create products & prices
5. ✅ Start webhook listener
6. ✅ Restart server
7. ✅ Test checkout

**Need help?** Everything is built - just need to wire up the Stripe credentials!

**Stripe Dashboard:** https://dashboard.stripe.com/test/dashboard
