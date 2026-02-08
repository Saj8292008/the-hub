# Stripe Setup Complete! 🎉

## ✅ What's Been Created

### Products
1. **The Hub Pro** - `prod_Tvsxt13iVI6AYC`
   - Advanced deal tracking and alerts
   
2. **The Hub Premium** - `prod_Tvsx8pfsRyGXU1`
   - Full platform access with AI features

### Prices
1. **Pro Monthly** - `price_1Sy1BjCaz620S5FSO8c5KhF9` - $9/month
2. **Pro Yearly** - `price_1Sy1BjCaz620S5FSDGlVkwJ4` - $86.40/year
3. **Premium Monthly** - `price_1Sy1BkCaz620S5FSZceyouEG` - $19/month
4. **Premium Yearly** - `price_1Sy1BkCaz620S5FSHiGZvodz` - $182.40/year

All price IDs have been added to `.env`!

---

## 🔑 Next Steps

### 1. Get Your API Keys (2 minutes)

**Dashboard is already open in your browser!**
Or visit: https://dashboard.stripe.com/test/apikeys

Copy these keys:
- **Publishable key** (starts with `pk_test_`)
- **Secret key** (starts with `sk_test_`)

Add them to `/the-hub/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### 2. Start Webhook Listener (Required!)

Open a new terminal and run:
```bash
cd /Users/sydneyjackson/the-hub
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copy that `whsec_` secret** and add to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Keep that terminal running!** Webhooks need it.

### 3. Restart Your Server

```bash
# Kill current server
pkill -f "node.*server"

# Start fresh
cd /Users/sydneyjackson/the-hub
npm start
```

### 4. Test It! 🧪

```bash
# Open pricing page
open http://localhost:3000/premium

# Click "Subscribe to Pro"
# Use test card: 4242 4242 4242 4242
# Any future date + any CVC
```

---

## 📊 Quick Reference

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Requires 3D Secure: `4000 0025 0000 3155`
- Decline: `4000 0000 0000 9995`

**Dashboards:**
- API Keys: https://dashboard.stripe.com/test/apikeys
- Customers: https://dashboard.stripe.com/test/customers
- Subscriptions: https://dashboard.stripe.com/test/subscriptions
- Webhooks: https://dashboard.stripe.com/test/webhooks

**Stripe CLI Commands:**
```bash
# Trigger test webhook
stripe trigger checkout.session.completed

# View recent events
stripe events list --limit 10

# View customers
stripe customers list --limit 5
```

---

## ✅ Checklist

- [x] Created Pro product
- [x] Created Premium product
- [x] Created all prices (monthly + yearly)
- [x] Added price IDs to .env
- [ ] **Get API keys from dashboard** → Add to .env
- [ ] **Start webhook listener** → Copy whsec_ secret to .env
- [ ] Restart server
- [ ] Test a payment

**Almost done! Just need to add the API keys and start the webhook listener.**
