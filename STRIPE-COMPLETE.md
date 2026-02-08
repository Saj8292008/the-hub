# ✅ Stripe Setup Complete!

## What's Configured

### ✅ API Keys
- Secret Key: `sk_test_51...` (added to .env)
- Publishable Key: `pk_test_51...` (added to .env)
- Webhook Secret: `whsec_ebe3b...` (added to .env)

### ✅ Products Created
1. **The Hub Pro** (`prod_Tvsxt13iVI6AYC`)
   - Pro Monthly: `price_1Sy1BjCaz620S5FSO8c5KhF9` - $9/mo
   - Pro Yearly: `price_1Sy1BjCaz620S5FSDGlVkwJ4` - $86.40/yr

2. **The Hub Premium** (`prod_Tvsx8pfsRyGXU1`)
   - Premium Monthly: `price_1Sy1BkCaz620S5FSZceyouEG` - $19/mo
   - Premium Yearly: `price_1Sy1BkCaz620S5FSHiGZvodz` - $182.40/yr

### ✅ Webhook Listener
Running in background, forwarding events to `localhost:3000/api/webhooks/stripe`

### ✅ Server Status
- Server: ✅ Running on port 3000
- Health: ✅ http://localhost:3000/health
- Stripe API: ✅ http://localhost:3000/api/stripe/prices

---

## Test It Now!

### 1. Open Premium Page
```bash
open http://localhost:3000/premium
```

### 2. Click "Subscribe to Pro" or "Subscribe to Premium"

### 3. Use Test Card
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### 4. Complete Payment
- Should redirect to success page
- User will be upgraded to Pro/Premium tier
- Webhook events will fire

---

## Verify Payment Worked

### Check Stripe Dashboard
```bash
open https://dashboard.stripe.com/test/customers
open https://dashboard.stripe.com/test/subscriptions
```

### Check Database
```bash
# Check if user was upgraded
psql $DATABASE_URL -c "SELECT email, tier, stripe_customer_id FROM users WHERE tier != 'free';"
```

### Check Webhook Events
Look for these in webhook listener terminal:
- `checkout.session.completed`
- `customer.subscription.created`
- `invoice.paid`

---

## Stripe CLI Commands

```bash
# View recent events
stripe events list --limit 10

# View customers
stripe customers list --limit 5

# View subscriptions
stripe subscriptions list --limit 5

# Trigger test webhook
stripe trigger checkout.session.completed

# View products
stripe products list

# View prices
stripe prices list --limit 10
```

---

## Going Live (When Ready)

1. Switch to live keys in dashboard
2. Update `.env` with live keys (sk_live_, pk_live_)
3. Create webhook endpoint in dashboard: https://dashboard.stripe.com/webhooks
4. Point it to: `https://yourdomain.com/api/webhooks/stripe`
5. Test with real card (small amount first)

---

## Status: ✅ READY TO ACCEPT PAYMENTS

Everything is configured and running. You can now test the checkout flow!

**Next:** Visit http://localhost:3000/premium and try a test payment.
