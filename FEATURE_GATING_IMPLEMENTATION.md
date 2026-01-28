# Feature Gating Implementation Guide

## Overview
This document explains how to apply tier-based feature gating and limits to The Hub API endpoints.

## Database Migration

**IMPORTANT:** Run the migration first to add user_id columns to watchlist tables:

```bash
# Apply the migration in Supabase dashboard or via CLI
cat supabase/migrations/20260126120000_add_user_associations.sql | psql $DATABASE_URL
```

This migration adds:
- `user_id` columns to `watches`, `cars`, `sneakers`, `sports_teams`, and `alerts` tables
- Foreign key constraints linking to the `users` table
- Row Level Security (RLS) policies for user-specific access
- Renames `alerts` table to `price_alerts` for clarity

## Tier Limits

### Free Tier ($0/month)
- ✅ 5 tracked items (watches + cars + sneakers + sports teams combined)
- ✅ 3 price alerts
- ❌ No real-time Telegram alerts
- ❌ No advanced AI features
- ❌ No price history charts
- ❌ No data export
- ❌ No API access

### Premium Tier ($14.99/month)
- ✅ Unlimited tracked items
- ✅ Unlimited price alerts
- ✅ Real-time Telegram alerts
- ✅ Advanced AI features
- ✅ Price history charts
- ✅ Data export (CSV)
- ❌ No API access

### Pro Tier ($39.99/month - Optional)
- ✅ Everything in Premium
- ✅ API access with webhooks
- ✅ Bulk import/export
- ✅ White-label bot

## Middleware Usage

### 1. Import the Middleware

```javascript
const {
  checkTrackedItemsLimit,
  checkPriceAlertsLimit,
  requirePremium,
  requirePro
} = require('../middleware/featureGating');
const { authenticateToken } = require('../middleware/auth');
```

### 2. Apply to POST Endpoints

Apply middleware to endpoints that create tracked items:

```javascript
// Watch tracking endpoint
app.post('/watches',
  authenticateToken,           // Require authentication
  checkTrackedItemsLimit,      // Check if user has reached limit
  handleRoute((req) => {
    // Add user_id to the watch data
    req.body.user_id = req.userId;
    return watchTracker.addWatch(req.body);
  })
);

// Car tracking endpoint
app.post('/cars',
  authenticateToken,
  checkTrackedItemsLimit,
  handleRoute((req) => {
    req.body.user_id = req.userId;
    return carTracker.addCar(req.body);
  })
);

// Sneaker tracking endpoint
app.post('/sneakers',
  authenticateToken,
  checkTrackedItemsLimit,
  handleRoute((req) => {
    req.body.user_id = req.userId;
    return sneakerTracker.addSneaker(req.body);
  })
);

// Sports team tracking endpoint
app.post('/sports/teams',
  authenticateToken,
  checkTrackedItemsLimit,
  handleRoute((req) => {
    req.body.user_id = req.userId;
    return sportsTracker.addTeam(req.body);
  })
);
```

### 3. Apply to Alert Endpoints

Apply to price alert creation:

```javascript
// Create price alert endpoint
app.post('/api/alerts',
  authenticateToken,
  checkPriceAlertsLimit,
  handleRoute(async (req) => {
    req.body.user_id = req.userId;
    // Create alert logic here
  })
);
```

### 4. Gate Premium Features

Apply to premium-only features:

```javascript
// Real-time Telegram alerts (Premium only)
app.post('/api/integrations/telegram',
  authenticateToken,
  requirePremium,
  handleRoute(async (req) => {
    // Telegram integration logic
  })
);

// Advanced AI features (Premium only)
app.post('/api/ai/advanced-search',
  authenticateToken,
  requirePremium,
  handleRoute(async (req) => {
    // Advanced AI search logic
  })
);

// Price history charts (Premium only)
app.get('/api/listings/:id/price-history',
  authenticateToken,
  requirePremium,
  handleRoute(async (req) => {
    // Return price history data
  })
);

// Data export (Premium only)
app.get('/api/export/watchlist',
  authenticateToken,
  requirePremium,
  handleRoute(async (req) => {
    // Export user's watchlist as CSV
  })
);
```

### 5. Gate Pro Features

Apply to Pro-only API access:

```javascript
// API key endpoints (Pro only)
app.post('/api/keys',
  authenticateToken,
  requirePro,
  handleRoute(async (req) => {
    // Generate API key
  })
);

// Webhook endpoints (Pro only)
app.post('/api/webhooks/register',
  authenticateToken,
  requirePro,
  handleRoute(async (req) => {
    // Register webhook
  })
);
```

## Error Responses

When a user hits a limit, the middleware returns a 403 response:

```json
{
  "error": "Tracked items limit reached",
  "limit": 5,
  "current": 5,
  "tier": "free",
  "upgradeRequired": true,
  "message": "You've reached the free tier limit of 5 tracked items. Upgrade to Premium for unlimited tracking."
}
```

When a user tries to access a premium feature:

```json
{
  "error": "Premium feature",
  "tier": "free",
  "upgradeRequired": true,
  "message": "This feature is only available for Premium subscribers. Upgrade now to unlock."
}
```

## Usage Stats Endpoint

Get user's current usage and limits:

```http
GET /api/auth/usage
Authorization: Bearer <access_token>
```

Response:

```json
{
  "tier": "free",
  "limits": {
    "trackedItems": 5,
    "priceAlerts": 3
  },
  "usage": {
    "trackedItems": 3,
    "priceAlerts": 2
  },
  "available": {
    "trackedItems": 2,
    "priceAlerts": 1
  },
  "features": {
    "realtimeAlerts": false,
    "advancedAI": false,
    "priceHistory": false,
    "exportData": false,
    "apiAccess": false
  }
}
```

## Frontend Integration

### Display Usage Stats

```typescript
import { useState, useEffect } from 'react';

function UsageDisplay() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetch('/api/auth/usage', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(setUsage);
  }, []);

  if (!usage) return null;

  return (
    <div>
      <h3>{usage.tier} Plan</h3>
      <p>Tracked Items: {usage.usage.trackedItems} / {usage.limits.trackedItems}</p>
      <p>Price Alerts: {usage.usage.priceAlerts} / {usage.limits.priceAlerts}</p>
      {usage.tier === 'free' && (
        <button onClick={() => navigate('/premium')}>
          Upgrade to Premium
        </button>
      )}
    </div>
  );
}
```

### Handle Limit Errors

```typescript
async function addWatch(watchData) {
  try {
    const res = await fetch('/watches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(watchData)
    });

    if (!res.ok) {
      const error = await res.json();

      if (error.upgradeRequired) {
        // Show upgrade prompt
        showUpgradeModal({
          title: 'Limit Reached',
          message: error.message,
          limit: error.limit,
          current: error.current
        });
        return;
      }

      throw new Error(error.message);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to add watch:', error);
    throw error;
  }
}
```

## Testing

### Test Free Tier Limits

1. Create a free tier user account
2. Add 5 watches/cars/sneakers (any combination)
3. Try to add a 6th item - should receive 403 error
4. Create 3 price alerts
5. Try to create a 4th alert - should receive 403 error

### Test Premium Features

1. Upgrade a user to Premium (manually update tier in database)
2. Verify unlimited items can be added
3. Verify unlimited alerts can be created
4. Verify premium features are accessible

### Test Pro Features

1. Upgrade a user to Pro
2. Verify API key generation works
3. Verify webhook registration works

## Production Checklist

- [ ] Run database migration to add user_id columns
- [ ] Apply authentication middleware to all watchlist endpoints
- [ ] Apply limit checking middleware to POST endpoints
- [ ] Apply premium gates to premium features
- [ ] Add usage stats display to dashboard
- [ ] Add upgrade prompts when limits are hit
- [ ] Test all tier transitions (free → premium → pro)
- [ ] Test downgrade behavior (premium → free)
- [ ] Add tier badges to UI
- [ ] Document API limits in API documentation

## Next Steps

1. Apply middleware to `src/api/server.js` endpoints
2. Update tracker classes to accept and use `user_id`
3. Create frontend components for upgrade prompts
4. Add usage stats widget to dashboard
5. Test entire flow end-to-end
