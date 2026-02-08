# PWA Quick Reference - The Hub

Quick commands and snippets for The Hub PWA.

## 🚀 Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run preview                # Preview production build

# Testing
lighthouse https://localhost:4173 --view  # Run Lighthouse
chrome://inspect/#service-workers         # Debug service workers

# Deployment
vercel --prod                  # Deploy to Vercel
railway up                     # Deploy backend to Railway
```

---

## 📝 Code Snippets

### Install Prompt
```tsx
import { InstallPrompt } from '@/components/InstallPrompt';

// Banner (auto-appears after 3 seconds)
<InstallPrompt variant="banner" />

// Button (manual trigger)
<InstallPrompt variant="button" />
```

### Offline Watchlist
```tsx
import { useOfflineWatchlist } from '@/hooks/useOfflineWatchlist';

const { items, addItem, removeItem, online } = useOfflineWatchlist();

// Add item (works offline)
await addItem({
  category: 'watches',
  title: 'Rolex',
  price: 8200,
});
```

### Notification Settings
```tsx
import { NotificationSettings } from '@/components/NotificationSettings';

<NotificationSettings />
```

### PWA Utils
```typescript
import { 
  isAppInstalled,
  isOnline,
  showNotification,
  requestNotificationPermission
} from '@/utils/pwa';

// Check if installed
if (isAppInstalled()) {
  console.log('Running as PWA');
}

// Show notification
await showNotification('Title', {
  body: 'Message',
  tag: 'deal-alert',
});
```

---

## 🔧 Service Worker

### Force Update
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
});
```

### Clear Cache
```javascript
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Check Status
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('SW active:', reg.active);
  console.log('Scope:', reg.scope);
});
```

---

## 🔔 Push Notifications

### Subscribe
```typescript
import { subscribeToPushNotifications } from '@/utils/pwa';

const subscription = await subscribeToPushNotifications();

// Send to backend
await fetch('/api/notifications/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ subscription }),
});
```

### Send Test (Backend)
```typescript
import webpush from 'web-push';

await webpush.sendNotification(subscription, JSON.stringify({
  title: 'Test',
  body: 'Hello!',
  icon: '/icons/icon-192x192.svg',
}));
```

---

## 💾 IndexedDB

### Add to Watchlist
```typescript
import { db } from '@/utils/db';

await db.addToWatchlist({
  category: 'watches',
  title: 'Rolex Submariner',
  price: 8200,
});
```

### Get Watchlist
```typescript
const items = await db.getWatchlist('watches');
```

### Cache Deals
```typescript
await db.cacheDeals([
  { id: '1', category: 'watches', title: 'Rolex', price: 8200 },
]);
```

### Get Stats
```typescript
const stats = await db.getStats();
// { watchlist: 5, deals: 20, pendingSync: 2 }
```

---

## 🐛 Debugging

### Chrome DevTools
```
Application Tab:
- Service Workers: Check registration
- Manifest: Validate manifest.json
- Cache Storage: Inspect caches
- IndexedDB: View stored data

Network Tab:
- Set "Offline" to test offline mode
- Check if requests served from cache

Console:
- Check for service worker errors
- View PWA status logs
```

### Clear Everything
```javascript
// Unregister service worker
await navigator.serviceWorker.getRegistration()
  .then(reg => reg?.unregister());

// Clear caches
await caches.keys().then(names => 
  Promise.all(names.map(n => caches.delete(n)))
);

// Clear IndexedDB
import { db } from '@/utils/db';
await db.clearAll();

// Clear localStorage
localStorage.clear();
```

---

## 📊 Testing Checklist

- [ ] Service worker registered
- [ ] Manifest.json loads
- [ ] Icons accessible (192x192, 512x512)
- [ ] Offline page works
- [ ] Install prompt appears
- [ ] Push notifications work
- [ ] Offline watchlist syncs
- [ ] Background sync triggers
- [ ] Lighthouse score > 90

---

## 🔗 Key Files

```
public/
├── manifest.json        # PWA manifest
├── sw.js               # Service worker
├── offline.html        # Offline fallback
└── icons/              # App icons

src/
├── components/
│   ├── InstallPrompt.tsx
│   └── NotificationSettings.tsx
├── hooks/
│   └── useOfflineWatchlist.ts
└── utils/
    ├── pwa.ts          # PWA utilities
    ├── initPWA.ts      # Initialization
    └── db.ts           # IndexedDB wrapper
```

---

## 📱 Browser Support

✅ = Full Support | ⚠️ = Partial | ❌ = Not Supported

| Feature | Chrome | Safari | Firefox |
|---------|--------|--------|---------|
| Service Worker | ✅ | ✅ | ✅ |
| Install | ✅ | ⚠️ | ⚠️ |
| Push | ✅ | ✅ (16.4+) | ✅ |
| Background Sync | ✅ | ❌ | ❌ |

---

## 🎯 Quick Metrics

```sql
-- Install rate
SELECT 
  COUNT(DISTINCT CASE WHEN event = 'pwa_installed' THEN user_id END) * 100.0 /
  COUNT(DISTINCT user_id) as install_rate
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days';

-- Notification opt-in rate
SELECT 
  COUNT(*) as subscribed_users,
  (SELECT COUNT(*) FROM users) as total_users,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users) as opt_in_rate
FROM push_subscriptions;
```

---

## 🚨 Common Issues

**Install Prompt Not Showing?**
- Clear localStorage: `localStorage.removeItem('pwa-install-dismissed')`
- Try incognito mode
- Check HTTPS enabled
- Verify manifest valid

**Offline Not Working?**
- Check service worker registered
- Verify cache names match in sw.js
- Clear all caches and retry

**Push Notifications Failing?**
- Check VAPID keys configured
- Verify permission granted
- Check service worker active
- Test with simple payload first

---

## 📚 Documentation

- **Full Guide:** [PWA_IMPLEMENTATION.md](./PWA_IMPLEMENTATION.md)
- **Testing:** [PWA_TESTING_GUIDE.md](./PWA_TESTING_GUIDE.md)
- **Backend:** [docs/BACKEND_PUSH_NOTIFICATIONS.md](./docs/BACKEND_PUSH_NOTIFICATIONS.md)
- **Deployment:** [PWA_DEPLOYMENT.md](./PWA_DEPLOYMENT.md)

---

*Keep this handy for quick reference during development! 📌*
