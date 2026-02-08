# Backend Push Notifications API

Backend implementation guide for The Hub push notification system.

## Overview

The Hub uses the Web Push Protocol to send push notifications to users. This requires:
1. VAPID keys for authentication
2. Subscription storage in database
3. Push notification sender service

---

## 1. Generate VAPID Keys

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Output:
# Public Key: BEl...
# Private Key: -B7...
```

Add to `.env`:
```bash
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SBgQiCbEWcVo...
VAPID_PRIVATE_KEY=-B7SREQXbaZcKhv...
VAPID_SUBJECT=mailto:your-email@example.com
```

Add public key to frontend `.env`:
```bash
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SBgQiCbEWcVo...
```

---

## 2. Database Schema

### Supabase (PostgreSQL)

```sql
-- Push subscriptions table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- { p256dh, auth }
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## 3. API Endpoints

### Subscribe to Notifications

**POST** `/api/notifications/subscribe`

```typescript
// Request body
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BN...",
      "auth": "jV..."
    }
  },
  "preferences": {
    "priceDrops": true,
    "newListings": true,
    "restocks": true,
    "priceIncreases": false,
    "watchlistAlerts": true
  }
}

// Response
{
  "success": true,
  "subscriptionId": "uuid"
}
```

**Implementation (Express + Supabase):**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

app.post('/api/notifications/subscribe', async (req, res) => {
  try {
    const { subscription, preferences } = req.body;
    const userId = req.user.id; // From auth middleware

    // Store subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'endpoint'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, subscriptionId: data.id });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});
```

### Unsubscribe from Notifications

**POST** `/api/notifications/unsubscribe`

```typescript
app.post('/api/notifications/unsubscribe', async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});
```

### Update Preferences

**POST** `/api/notifications/preferences`

```typescript
app.post('/api/notifications/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user.id;

    const { error } = await supabase
      .from('push_subscriptions')
      .update({ preferences })
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});
```

---

## 4. Push Notification Sender

### Install Dependencies

```bash
npm install web-push
```

### Send Notification Function

```typescript
import webpush from 'web-push';

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: any;
}

async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
) {
  const notificationData = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-192x192.png',
    tag: payload.tag || 'general',
    data: {
      url: payload.url || '/dashboard',
      ...payload.data,
    },
  };

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(notificationData)
    );
    console.log('✅ Notification sent');
    return true;
  } catch (error: any) {
    console.error('❌ Notification error:', error);

    // Handle expired subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Subscription expired, removing from database');
      await removeSubscription(subscription.endpoint);
    }

    return false;
  }
}

async function removeSubscription(endpoint: string) {
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);
}
```

---

## 5. Notification Triggers

### Price Drop Alert

```typescript
// When a price drop is detected
async function sendPriceDropAlert(
  itemId: string,
  oldPrice: number,
  newPrice: number
) {
  // Get users watching this item
  const { data: watchers } = await supabase
    .from('watchlist')
    .select('user_id')
    .eq('item_id', itemId);

  if (!watchers) return;

  // Get subscriptions with price drop preference enabled
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', watchers.map(w => w.user_id))
    .contains('preferences', { priceDrops: true });

  if (!subscriptions) return;

  // Get item details
  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (!item) return;

  const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

  // Send notifications
  const promises = subscriptions.map(sub =>
    sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      } as PushSubscription,
      {
        title: '🔥 Price Drop Alert!',
        body: `${item.title} dropped ${discount}% to $${newPrice.toLocaleString()}`,
        tag: `price-drop-${itemId}`,
        url: `/items/${itemId}`,
        data: {
          type: 'price_drop',
          itemId,
          oldPrice,
          newPrice,
          discount,
        },
      }
    )
  );

  await Promise.all(promises);
  console.log(`Sent ${promises.length} price drop notifications`);
}
```

### New Listing Alert

```typescript
async function sendNewListingAlert(item: any) {
  // Get users interested in this category
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*, users!inner(preferences)')
    .contains('preferences', { newListings: true })
    .contains('users.preferences', { categories: [item.category] });

  if (!subscriptions) return;

  const promises = subscriptions.map(sub =>
    sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      } as PushSubscription,
      {
        title: '✨ New Listing!',
        body: `${item.title} - $${item.price.toLocaleString()}`,
        tag: `new-listing-${item.id}`,
        url: `/items/${item.id}`,
        data: {
          type: 'new_listing',
          itemId: item.id,
          category: item.category,
        },
      }
    )
  );

  await Promise.all(promises);
}
```

### Restock Alert

```typescript
async function sendRestockAlert(itemId: string) {
  // Get users who wanted restock notifications for this item
  const { data: watchers } = await supabase
    .from('watchlist')
    .select('user_id, users!inner(*)')
    .eq('item_id', itemId)
    .eq('notify_restock', true);

  if (!watchers) return;

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', watchers.map(w => w.user_id))
    .contains('preferences', { restocks: true });

  if (!subscriptions) return;

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (!item) return;

  const promises = subscriptions.map(sub =>
    sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      } as PushSubscription,
      {
        title: '⚡ Back in Stock!',
        body: `${item.title} is available again!`,
        tag: `restock-${itemId}`,
        url: `/items/${itemId}`,
        data: {
          type: 'restock',
          itemId,
        },
      }
    )
  );

  await Promise.all(promises);
}
```

---

## 6. Batch Notifications

### Daily Digest

```typescript
async function sendDailyDigest() {
  // Get all subscribed users
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*, users!inner(id, last_digest_sent)');

  if (!subscriptions) return;

  for (const sub of subscriptions) {
    // Get personalized deals for user
    const deals = await getPersonalizedDeals(sub.user_id);

    if (deals.length === 0) continue;

    await sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      } as PushSubscription,
      {
        title: `📬 ${deals.length} New Deals Today`,
        body: 'Check out the latest deals matching your interests',
        tag: 'daily-digest',
        url: '/dashboard',
        data: {
          type: 'digest',
          dealCount: deals.length,
        },
      }
    );

    // Update last digest sent
    await supabase
      .from('users')
      .update({ last_digest_sent: new Date().toISOString() })
      .eq('id', sub.user_id);
  }
}

// Schedule daily at 9 AM
import cron from 'node-cron';

cron.schedule('0 9 * * *', sendDailyDigest);
```

---

## 7. Testing

### Send Test Notification

```typescript
app.post('/api/notifications/test', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    await sendPushNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      } as PushSubscription,
      {
        title: 'Test Notification 🔔',
        body: 'Your push notifications are working!',
        tag: 'test',
        url: '/dashboard',
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});
```

### cURL Examples

```bash
# Subscribe
curl -X POST http://localhost:3000/api/notifications/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "BN...",
        "auth": "jV..."
      }
    },
    "preferences": {
      "priceDrops": true,
      "newListings": true,
      "restocks": true
    }
  }'

# Send test notification
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 8. Error Handling

### Common Errors

**410 Gone / 404 Not Found:**
- Subscription expired or invalid
- Remove from database

**403 Forbidden:**
- Invalid VAPID keys
- Check configuration

**429 Too Many Requests:**
- Rate limited by push service
- Implement exponential backoff

**413 Payload Too Large:**
- Notification payload > 4KB
- Reduce data size

### Retry Logic

```typescript
async function sendNotificationWithRetry(
  subscription: PushSubscription,
  payload: NotificationPayload,
  maxRetries = 3
) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendPushNotification(subscription, payload);
      return true;
    } catch (error: any) {
      lastError = error;

      // Don't retry client errors
      if (error.statusCode >= 400 && error.statusCode < 500) {
        break;
      }

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('Failed after retries:', lastError);
  return false;
}
```

---

## 9. Monitoring

### Track Metrics

```typescript
// Create metrics table
CREATE TABLE notification_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'sent', 'clicked', 'failed'
  notification_tag TEXT,
  user_id UUID REFERENCES auth.users(id),
  error_code INT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// Log events
async function logNotificationEvent(
  type: 'sent' | 'clicked' | 'failed',
  data: any
) {
  await supabase.from('notification_metrics').insert({
    type,
    ...data,
  });
}

// Usage
await logNotificationEvent('sent', {
  notification_tag: 'price-drop',
  user_id: userId,
});
```

---

## 10. Production Checklist

- [ ] VAPID keys generated and secured
- [ ] Database schema created
- [ ] API endpoints implemented
- [ ] Push notification sender configured
- [ ] Error handling in place
- [ ] Retry logic implemented
- [ ] Monitoring/logging setup
- [ ] Test notifications working
- [ ] Rate limiting implemented
- [ ] Subscription cleanup (remove expired)
- [ ] Analytics tracking
- [ ] Privacy policy updated
- [ ] User consent flow implemented

---

## Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [web-push Library](https://github.com/web-push-libs/web-push)
- [Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

**Last Updated:** February 2024
