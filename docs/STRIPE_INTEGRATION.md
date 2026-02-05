# Stripe Subscription Integration

Complete guide for setting up and managing Stripe subscriptions in The Hub.

## Overview

The Hub uses Stripe for subscription billing with a multi-tier pricing model:

| Tier | Monthly | Yearly | Features |
|------|---------|--------|----------|
| **Free** | $0 | $0 | 3 tracks, 5 alerts/day, 15-min delay |
| **Pro** | $9 | $89 | 25 tracks, 100 alerts/day, real-time alerts, price history |
| **Premium** | $19 | $189 | Unlimited everything, priority support, API access |

## Quick Setup

### 1. Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Get API keys from [Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)

### 2. Create Products and Prices

In Stripe Dashboard → Products → Add Product:

**Pro Subscription:**
```
Name: The Hub Pro
Description: Real-time alerts and price history for serious deal hunters

Pricing:
- $9/month (recurring, monthly)
- $89/year (recurring, yearly) 
```

**Premium Subscription:**
```
Name: The Hub Premium  
Description: Unlimited tracking with API access for power users and resellers

Pricing:
- $19/month (recurring, monthly)
- $189/year (recurring, yearly)
```

Copy the Price IDs (start with `price_`) for each.

### 3. Configure Environment Variables

**Backend (.env):**
```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Set Up Webhooks

1. Go to [Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the Signing Secret to `STRIPE_WEBHOOK_SECRET`

### 5. Configure Billing Portal

1. Go to [Dashboard → Settings → Billing → Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable features:
   - Update subscription (change plan)
   - Cancel subscription
   - Update payment method
   - View invoices

## API Endpoints

### Create Checkout Session
```http
POST /api/stripe/create-checkout-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "price_xxx"
}
```

Response:
```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/...",
  "tier": "pro"
}
```

### Get Subscription Status
```http
GET /api/stripe/subscription-status
Authorization: Bearer <token>
```

Response:
```json
{
  "tier": "pro",
  "status": "active",
  "subscriptionEndsAt": "2026-03-05T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "priceId": "price_xxx",
  "interval": "month"
}
```

### Create Billing Portal Session
```http
POST /api/stripe/create-portal-session
Authorization: Bearer <token>
```

Response:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### Get Available Prices
```http
GET /api/stripe/prices
```

Response:
```json
{
  "prices": [...],
  "tiers": [...],
  "stripeConfigured": true
}
```

### Change Plan
```http
POST /api/stripe/change-plan
Authorization: Bearer <token>
```

Redirects to Stripe billing portal for plan management.

## Webhook Events

The webhook handler at `/api/webhooks/stripe` processes:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set user tier from metadata |
| `customer.subscription.created` | Update tier and subscription dates |
| `customer.subscription.updated` | Handle plan changes (upgrade/downgrade) |
| `customer.subscription.deleted` | Downgrade user to free tier |
| `invoice.payment_succeeded` | Extend subscription, confirm tier |
| `invoice.payment_failed` | Log warning (TODO: email notification) |

## Database Schema

Users table includes:
```sql
tier VARCHAR(50) DEFAULT 'free',
stripe_customer_id VARCHAR(255),
subscription_starts_at TIMESTAMP,
subscription_ends_at TIMESTAMP
```

## Testing

### Test Mode
Use test API keys (`sk_test_`, `pk_test_`) during development.

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth Required: 4000 0025 0000 3155
```

### Test Webhooks Locally
Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Tier Configuration

Tiers are defined in `src/services/tiers/tierConfig.js`:

```javascript
const TIERS = {
  free: {
    priceMonthly: 0,
    limits: { tracks: 3, alertsPerDay: 5, realTimeAlerts: false }
  },
  pro: {
    priceMonthly: 9,
    priceYearly: 89,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    limits: { tracks: 25, alertsPerDay: 100, realTimeAlerts: true }
  },
  premium: {
    priceMonthly: 19,
    priceYearly: 189,
    stripePriceIdMonthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    limits: { tracks: Infinity, alertsPerDay: Infinity, realTimeAlerts: true }
  }
};
```

## Troubleshooting

### "Stripe not configured"
- Check `STRIPE_SECRET_KEY` is set correctly
- Ensure key starts with `sk_test_` or `sk_live_`

### Webhook signature verification failed
- Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint
- Ensure raw body parsing for webhook route

### User tier not updating
- Check webhook logs in Stripe Dashboard
- Verify `userId` in checkout session metadata
- Check webhook endpoint is reachable

### Checkout redirects to wrong URL
- Verify `FRONTEND_URL` environment variable
- Check success/cancel URLs in checkout session

## Going to Production

1. Switch to live API keys (`sk_live_`, `pk_live_`)
2. Create live products/prices in Stripe
3. Set up production webhook endpoint
4. Update all environment variables
5. Test full flow with real card
6. Enable Stripe Radar for fraud protection

## Support

- Stripe Docs: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Dashboard: https://dashboard.stripe.com
