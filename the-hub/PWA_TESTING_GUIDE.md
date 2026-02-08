# PWA Testing Guide - The Hub

Complete guide for testing Progressive Web App functionality to achieve Lighthouse PWA score >90.

## Prerequisites

### Development Environment
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Required Tools
- Chrome DevTools (Lighthouse, Application tab)
- Mobile device (iOS/Android) for real-world testing
- HTTPS connection (required for service workers)

---

## 1. Service Worker Testing

### A. Registration
1. Open Chrome DevTools → Application tab → Service Workers
2. Verify service worker is registered at `/sw.js`
3. Check status shows "activated and running"
4. Test update mechanism:
   - Click "Update" button
   - Modify `sw.js` and reload
   - Verify new worker installs

### B. Offline Functionality
```bash
# Test offline mode:
1. Load the app
2. DevTools → Network tab → Set to "Offline"
3. Refresh page → Should show offline.html
4. Navigate to /dashboard → Should load from cache
5. Test offline watchlist (add/remove items)
```

**Expected Results:**
- ✅ App loads offline page when no connection
- ✅ Previously visited pages load from cache
- ✅ Watchlist changes are queued for sync
- ✅ Graceful error messages for failed requests

### C. Caching Strategy
```javascript
// Test cache behavior:
1. Open DevTools → Application → Cache Storage
2. Verify these caches exist:
   - the-hub-v1-static
   - the-hub-v1-dynamic
   - the-hub-v1-api

3. Check cached resources:
   - Static: index.html, manifest.json, icons
   - Dynamic: Visited pages
   - API: /api/deals, /api/watchlist
```

---

## 2. Manifest Testing

### A. Manifest Validation
```bash
# Check manifest is valid:
1. DevTools → Application → Manifest
2. Verify all fields are populated:
   - ✅ Name: "The Hub - Deal Aggregator"
   - ✅ Short Name: "The Hub"
   - ✅ Start URL: "/"
   - ✅ Display: "standalone"
   - ✅ Theme Color: "#6366f1"
   - ✅ Background Color: "#0a0e27"
   - ✅ Icons: 192x192, 512x512
```

### B. Icons
```bash
# Verify icons:
1. Check /public/icons/ contains:
   - icon-192x192.png (or .svg)
   - icon-512x512.png (or .svg)
2. Verify icons are accessible:
   - Navigate to /icons/icon-192x192.svg
   - Should display The Hub logo
3. Test maskable icons (Android)
```

---

## 3. Install Prompt Testing

### A. Desktop Installation (Chrome)
```bash
1. Load app in Chrome
2. Wait 3 seconds for install banner to appear
3. Click "Install" button
4. Verify app installs and opens in standalone window
5. Check app icon in Applications folder/Start menu
```

### B. Mobile Installation

**iOS (Safari):**
```bash
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Verify icon appears on home screen
5. Launch app → Should open fullscreen (no Safari UI)
```

**Android (Chrome):**
```bash
1. Open app in Chrome
2. Banner should appear automatically
3. Tap "Install"
4. Verify app icon on home screen
5. Launch app → Should open as PWA
```

### C. Install Prompt Behavior
```javascript
// Test install prompt logic:
1. First visit → Wait 3 seconds → Banner appears
2. Click "Not Now" → Banner dismissed
3. Reload page → Banner should NOT appear (7-day cooldown)
4. Test localStorage flag:
   localStorage.removeItem('pwa-install-dismissed')
5. Reload → Banner should appear again
```

---

## 4. Push Notifications Testing

### A. Permission Flow
```bash
1. Settings → Notification Settings
2. Click "Enable Notifications"
3. Browser prompts for permission
4. Grant permission
5. Verify:
   - ✅ "Notifications Enabled" status
   - ✅ Test notification button appears
   - ✅ Subscription saved to backend
```

### B. Test Notifications
```bash
# Local test:
1. Click "Send Test Notification"
2. Verify notification appears:
   - Title: "Test Notification 🔔"
   - Body: "This is what a deal alert looks like!"
   - Icon: The Hub logo
   - Click → Opens app to /dashboard

# Backend test (requires backend):
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Price Drop Alert",
    "body": "Rolex Submariner dropped to $8,200",
    "url": "/watches",
    "tag": "price-drop"
  }'
```

### C. Notification Preferences
```bash
# Test preference toggles:
1. Toggle each notification type
2. Verify saved to localStorage
3. Check backend receives preferences update
4. Test selective notifications:
   - Disable "Price Increases"
   - Trigger price increase → No notification
   - Enable again → Notification works
```

---

## 5. Offline Watchlist Testing

### A. Add Items Offline
```bash
1. Load app while online
2. Set Network to "Offline" in DevTools
3. Navigate to /watches
4. Click "Add to Watchlist" on any item
5. Verify:
   - ✅ Item added successfully (no error)
   - ✅ Item appears in watchlist
   - ✅ IndexedDB contains item (synced: false)
   - ✅ pendingSync queue has entry
```

### B. Background Sync
```bash
1. Add items to watchlist while offline
2. Go back online
3. DevTools → Application → Service Workers
4. Check "Background Sync" events
5. Verify:
   - ✅ Sync event fired
   - ✅ Pending items synced to backend
   - ✅ Items marked as synced in IndexedDB
   - ✅ pendingSync queue cleared
```

### C. IndexedDB Testing
```javascript
// Inspect IndexedDB:
1. DevTools → Application → IndexedDB
2. Expand "the-hub-db"
3. Check stores:
   - watchlist: Items with synced status
   - deals: Cached deals for offline viewing
   - pendingSync: Queued sync operations

// Manual testing:
import { db } from './utils/db'

// Add to watchlist
await db.addToWatchlist({
  category: 'watches',
  title: 'Rolex Submariner',
  price: 8200,
  imageUrl: '/images/rolex.jpg',
  url: '/watches/rolex-submariner'
})

// Get watchlist
const items = await db.getWatchlist('watches')
console.log('Watchlist items:', items)

// Get stats
const stats = await db.getStats()
console.log('DB stats:', stats)
```

---

## 6. Performance Testing

### A. Lighthouse Audit
```bash
1. Build production version:
   npm run build
   npm run preview

2. Open Chrome DevTools → Lighthouse
3. Select:
   - ✅ Progressive Web App
   - ✅ Performance
   - ✅ Best Practices
   - ✅ Accessibility
   - ✅ SEO
   - Device: Mobile
   - Mode: Navigation

4. Click "Analyze page load"

5. Target Scores:
   - PWA: > 90
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90
```

### B. PWA Checklist
Lighthouse checks these PWA requirements:

- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Contains web app manifest
- ✅ Manifest has name/short_name
- ✅ Manifest has icons (192px, 512px)
- ✅ Manifest has start_url
- ✅ Manifest has display (standalone/fullscreen/minimal-ui)
- ✅ Manifest has theme_color
- ✅ Served over HTTPS
- ✅ Page load fast on mobile networks
- ✅ Viewport meta tag correct
- ✅ Content sized correctly for viewport

### C. Performance Optimization
```bash
# Check bundle size:
npm run build

# Analyze:
dist/index.html: ~2KB
dist/assets/index-[hash].js: <500KB
dist/assets/index-[hash].css: <50KB

# Test load times:
- First load: < 3s
- Repeat visit: < 1s (cached)
- Offline load: < 1s
```

---

## 7. Cross-Browser Testing

### A. Chrome/Edge (Desktop)
- ✅ Service worker works
- ✅ Install prompt appears
- ✅ Push notifications work
- ✅ Background sync works

### B. Firefox (Desktop)
- ✅ Service worker works
- ✅ Basic offline functionality
- ⚠️ No install prompt (Firefox doesn't support)
- ✅ Notifications work (with permission)

### C. Safari (Desktop)
- ✅ Service worker works (Safari 11.1+)
- ⚠️ No install prompt
- ✅ Notifications work (Safari 16+)
- ⚠️ Background sync not supported

### D. iOS Safari
- ✅ Service worker works (iOS 11.3+)
- ✅ Add to Home Screen
- ✅ Standalone mode
- ⚠️ Push notifications (iOS 16.4+ only)
- ⚠️ Background sync not supported

### E. Android Chrome
- ✅ Full PWA support
- ✅ Install prompt
- ✅ Push notifications
- ✅ Background sync
- ✅ Standalone mode

---

## 8. Real-World Scenarios

### Scenario 1: Commuter (Offline → Online)
```bash
1. User opens app on train (spotty connection)
2. Browses watches → Pages load from cache
3. Adds items to watchlist → Stored locally
4. Train enters tunnel → Fully offline
5. Continues browsing cached content
6. Exits tunnel → Background sync activates
7. Watchlist syncs to server
8. New deals load and cache
```

### Scenario 2: Push Notification Journey
```bash
1. User enables notifications
2. Adds Rolex Submariner to watchlist
3. Price drops from $9,000 to $8,200
4. Backend triggers push notification
5. Notification appears on phone/desktop
6. User clicks notification
7. App opens to watch detail page
8. User completes purchase
```

### Scenario 3: Install and Daily Use
```bash
Day 1:
- Visit site, see install banner
- Install app
- Enable notifications
- Browse deals, add to watchlist

Day 2:
- Click app icon (not browser)
- App opens instantly (cached)
- Receives push notification for new deal
- Quick access from home screen
```

---

## 9. Debugging Tips

### Service Worker Issues
```javascript
// Force update service worker:
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update()
})

// Unregister (for testing):
navigator.serviceWorker.getRegistration().then(reg => {
  reg.unregister()
})

// Check registration:
navigator.serviceWorker.ready.then(reg => {
  console.log('SW ready:', reg)
})
```

### Clear All Data
```javascript
// Clear caches:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
})

// Clear IndexedDB:
import { db } from './utils/db'
await db.clearAll()

// Clear localStorage:
localStorage.clear()

// Reset notification permission (can't be done programmatically)
// Chrome: Settings → Privacy → Site Settings → Notifications
```

### Common Issues

**Service Worker Not Updating:**
```bash
# Solution:
1. DevTools → Application → Service Workers
2. Check "Update on reload"
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Or click "Unregister" and reload
```

**Install Prompt Not Showing:**
```bash
# Checklist:
- ✅ HTTPS enabled
- ✅ Valid manifest.json
- ✅ Service worker registered
- ✅ Not dismissed in last 7 days
- ✅ Not already installed
- ✅ Desktop: Visited at least once before
- ✅ Mobile: Meets engagement heuristics
```

**Push Notifications Not Working:**
```bash
# Checklist:
- ✅ HTTPS enabled
- ✅ Permission granted
- ✅ Service worker active
- ✅ Valid VAPID keys configured
- ✅ Subscription sent to backend
- ✅ Backend correctly formatted payload
```

---

## 10. Production Deployment Checklist

### Pre-Deployment
- [ ] All Lighthouse audits > 90
- [ ] Service worker caching all critical assets
- [ ] Manifest.json properly configured
- [ ] Icons generated and accessible
- [ ] VAPID keys configured (push notifications)
- [ ] Backend API endpoints ready
- [ ] HTTPS certificate installed
- [ ] DNS configured correctly

### Post-Deployment
- [ ] Test on production URL
- [ ] Run Lighthouse on production
- [ ] Test install on real devices
- [ ] Send test push notification
- [ ] Monitor service worker updates
- [ ] Check analytics for PWA installs
- [ ] Monitor error logs

### Monitoring
```javascript
// Track PWA metrics:
- Installation rate
- Push notification click-through rate
- Offline usage
- Cache hit rate
- Service worker errors
- Background sync success rate
```

---

## 11. Success Metrics

### Target KPIs
- **Lighthouse PWA Score:** > 90
- **Install Rate:** > 10% of visitors
- **Notification Opt-in:** > 30%
- **Offline Usage:** > 5% of sessions
- **Return Visit (from icon):** > 40%
- **Load Time (cached):** < 1 second

### Analytics Events
```javascript
// Track these events:
- pwa_installable (prompt appeared)
- pwa_install_prompt (user action)
- pwa_installed (app installed)
- pwa_standalone_launch (opened as PWA)
- notification_permission_granted
- notification_clicked
- offline_session
- background_sync_triggered
```

---

## Support & Troubleshooting

### Resources
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Lighthouse PWA Audits](https://web.dev/lighthouse-pwa/)

### Need Help?
- Check DevTools Console for errors
- Review service worker logs
- Test in incognito mode (clean slate)
- Check browser compatibility: [caniuse.com](https://caniuse.com/)

---

**Last Updated:** February 2024  
**Maintainer:** Dev Team  
**Version:** 1.0.0
