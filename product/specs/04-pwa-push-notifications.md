# Feature Spec: PWA with Push Notifications
> Priority: P0 | Effort: 5 days | Status: Planned

---

## User Story

> As a mobile user, I want to install The Hub on my phone and receive push notifications for deals, so I never miss an opportunity.

---

## Problem Statement

- 60%+ of traffic is mobile
- Users must keep browser tab open to see updates
- No way to receive alerts when app is closed
- Competitors with mobile apps have advantage

---

## Solution Overview

Convert The Hub into a Progressive Web App (PWA) with:
- Install to home screen
- Offline support
- Push notifications for alerts and deals
- Mobile-optimized UI

---

## Requirements

### PWA Core
- [ ] Web App Manifest (`manifest.json`)
- [ ] Service Worker for offline caching
- [ ] App icon in multiple sizes (192x192, 512x512)
- [ ] Splash screen
- [ ] Add-to-homescreen prompt

### Push Notifications
- [ ] Push notification permission flow
- [ ] Notifications for:
  - Price alerts triggered
  - Below-market deals found
  - Daily/weekly digest (optional)
- [ ] Notification preferences in settings
- [ ] Click-through to relevant item/page

### Mobile UX
- [ ] Bottom navigation bar
- [ ] Touch-friendly buttons (min 44px)
- [ ] Pull-to-refresh
- [ ] Swipe gestures where appropriate
- [ ] Works offline (cached data)

---

## UI Design

### Mobile Layout
```
┌───────────────────────────────────┐
│ ≡  The Hub              🔔 2  👤 │ ← Header (44px)
├───────────────────────────────────┤
│                                   │
│  Total Portfolio Value            │
│  $48,230  ▲ 2.3%                 │
│  ──────────────────────────────  │
│                                   │
│  🔥 Hot Deal Alert!               │
│  ┌─────────────────────────────┐ │
│  │ Rolex Submariner            │ │
│  │ $11,200 • 8% below market   │ │
│  │ [View Deal →]               │ │
│  └─────────────────────────────┘ │
│                                   │
│  Your Watchlist                   │
│  ┌─────────────────────────────┐ │
│  │ 👟 Jordan 1 Chicago         │ │
│  │    $380 ▼ 1.5%              │ │
│  ├─────────────────────────────┤ │
│  │ ⌚ Omega Speedmaster        │ │
│  │    $5,200 ▲ 0.8%            │ │
│  ├─────────────────────────────┤ │
│  │ 🚗 911 GT3 Touring          │ │
│  │    $215,000 —               │ │
│  └─────────────────────────────┘ │
│                                   │
│  [Pull down to refresh ↓]        │
│                                   │
├───────────────────────────────────┤
│  🏠      📊      🔔      ⚙️      │ ← Bottom nav
│ Home   Deals   Alerts  Settings  │
└───────────────────────────────────┘
```

### Add to Home Screen Prompt
```
┌───────────────────────────────────┐
│                                   │
│  📲 Add The Hub to your          │
│     home screen?                  │
│                                   │
│  Get instant access and push     │
│  notifications for deals.         │
│                                   │
│  [Add to Home Screen]            │
│  [Maybe Later]                   │
│                                   │
└───────────────────────────────────┘
```

### Push Notification Examples
```
┌───────────────────────────────────┐
│ 🔔 The Hub                   now │
│ Price Alert: Rolex Submariner    │
│ Now $11,200 (8% below target)    │
│ [Tap to view →]                  │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ 🔥 The Hub                  2m   │
│ Hot Deal Found!                  │
│ Jordan 1 Chicago - $350          │
│ Score: 94/100 • Won't last long  │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ 📊 The Hub                  9am  │
│ Your Daily Digest                │
│ Portfolio up 1.2% • 3 new deals  │
└───────────────────────────────────┘
```

---

## Technical Design

### PWA Manifest

**File: `public/manifest.json`**
```json
{
  "name": "The Hub - Luxury Asset Tracker",
  "short_name": "The Hub",
  "description": "Track watches, sneakers, and cars. Find the best deals.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#6366f1",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Hot Deals",
      "url": "/deals",
      "icons": [{ "src": "/icons/deals.png", "sizes": "96x96" }]
    },
    {
      "name": "My Alerts",
      "url": "/alerts",
      "icons": [{ "src": "/icons/alerts.png", "sizes": "96x96" }]
    }
  ]
}
```

### Service Worker

**File: `public/sw.js`** (using Workbox)
```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      }),
    ],
  })
);

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
```

### Push Notification Backend

**File: `src/services/pushNotifications.js`**
```javascript
const webpush = require('web-push');
const { supabase } = require('../db/supabase');

// Configure web-push
webpush.setVapidDetails(
  'mailto:support@thehub.io',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save push subscription
async function saveSubscription(userId, subscription) {
  await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    created_at: new Date().toISOString(),
  });
}

// Send push notification
async function sendPushNotification(userId, notification) {
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys')
    .eq('user_id', userId);
    
  if (!subscriptions?.length) return;
  
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
  });
  
  const results = await Promise.allSettled(
    subscriptions.map(sub => 
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      )
    )
  );
  
  // Clean up invalid subscriptions
  const failedEndpoints = results
    .filter(r => r.status === 'rejected')
    .map((_, i) => subscriptions[i].endpoint);
    
  if (failedEndpoints.length) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', failedEndpoints);
  }
}

// Send price alert notification
async function sendPriceAlertNotification(userId, item, currentPrice, targetPrice) {
  await sendPushNotification(userId, {
    title: `🔔 Price Alert: ${item.name}`,
    body: `Now $${currentPrice.toLocaleString()} (${((targetPrice - currentPrice) / targetPrice * 100).toFixed(1)}% below target)`,
    url: `/item/${item.type}/${item.id}`,
  });
}

// Send hot deal notification
async function sendHotDealNotification(userId, deal) {
  await sendPushNotification(userId, {
    title: `🔥 Hot Deal Found!`,
    body: `${deal.name} - $${deal.price.toLocaleString()} • Score: ${deal.score}/100`,
    url: `/deals/${deal.id}`,
  });
}

module.exports = {
  saveSubscription,
  sendPushNotification,
  sendPriceAlertNotification,
  sendHotDealNotification,
};
```

### Database Schema

```sql
-- Push notification subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  price_alerts BOOLEAN DEFAULT true,
  deal_alerts BOOLEAN DEFAULT true,
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  quiet_hours_start TIME, -- e.g., 22:00
  quiet_hours_end TIME,   -- e.g., 08:00
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Frontend Push Registration

**File: `hooks/usePushNotifications.ts`**
```typescript
import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribeToPush();
    }

    return result === 'granted';
  };

  const subscribeToPush = async () => {
    const registration = await navigator.serviceWorker.ready;
    
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY
      ),
    });

    setSubscription(sub);

    // Send to backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(sub),
    });
  };

  return {
    permission,
    subscription,
    requestPermission,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
```

### Mobile Navigation Component

**File: `components/MobileNav.tsx`**
```typescript
import { Home, TrendingUp, Bell, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/deals', icon: TrendingUp, label: 'Deals' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 ${
                isActive ? 'text-indigo-400' : 'text-gray-400'
              }`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

---

## Testing Plan

### PWA Tests
- [ ] Lighthouse PWA audit score > 90
- [ ] Installable on iOS Safari
- [ ] Installable on Android Chrome
- [ ] Offline mode shows cached data
- [ ] Service worker updates correctly

### Push Notification Tests
- [ ] Permission prompt appears correctly
- [ ] Notifications delivered on Chrome/Firefox/Safari
- [ ] Click-through opens correct page
- [ ] Preferences respected (quiet hours)
- [ ] Invalid subscriptions cleaned up

### Mobile UX Tests
- [ ] Bottom nav works on all screen sizes
- [ ] Touch targets are 44px minimum
- [ ] Pull-to-refresh works
- [ ] No horizontal scroll
- [ ] Safe area insets respected

---

## Rollout Plan

1. **Day 1:** PWA manifest, service worker, icons
2. **Day 2:** Add-to-homescreen prompt, offline caching
3. **Day 3:** Push notification backend, VAPID setup
4. **Day 4:** Frontend push registration, notification UI
5. **Day 5:** Mobile navigation, polish, testing

---

## Success Metrics

| Metric | Target | Baseline |
|--------|--------|----------|
| PWA installs | 500/month | 0 |
| Push opt-in rate | 40% | N/A |
| Push click-through | 15% | N/A |
| Mobile session duration | +20% | Current |

---

## iOS Limitations

Note: iOS Safari has limited PWA support:
- No push notifications (until iOS 16.4+, requires home screen install)
- No background sync
- Limited offline storage (50MB)
- Apps purged after 7 days of non-use

**Mitigation:** Encourage email alerts as fallback for iOS users.

---

*Spec Author: Feature Builder Agent*
*Created: Feb 5, 2026*
