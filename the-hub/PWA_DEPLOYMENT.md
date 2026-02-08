# PWA Deployment Guide - The Hub

Step-by-step guide to deploy The Hub PWA to production with full offline and push notification support.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] HTTPS certificate installed (required for PWAs)
- [ ] Domain configured and verified
- [ ] CDN configured (optional but recommended)
- [ ] Backend API endpoints ready

### 2. VAPID Keys Configuration

```bash
# Install web-push CLI
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Output:
# =======================================
# Public Key:
# BEl62iUYgUivxIkv69yViEuiBIa-Ib27SBgQiCbEWcVo...
# 
# Private Key:
# -B7SREQXbaZcKhv...
# =======================================
```

### 3. Environment Variables

**Frontend (.env.production):**
```bash
VITE_VAPID_PUBLIC_KEY=your_public_key_here
VITE_API_URL=https://api.thehub.com
```

**Backend (.env):**
```bash
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:support@thehub.com

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

---

## 🚀 Deployment Steps

### Step 1: Build Production Version

```bash
# Clean previous builds
rm -rf dist

# Install dependencies
npm install

# Build for production
npm run build

# Output will be in /dist folder
```

**Build Output:**
```
dist/
├── assets/
│   ├── index-[hash].js     (~1.3 MB)
│   └── index-[hash].css    (~91 KB)
├── icons/
│   ├── icon-192x192.svg
│   ├── icon-512x512.svg
│   └── icon.svg
├── index.html
├── manifest.json
├── sw.js
├── offline.html
├── robots.txt
└── sitemap.xml
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Vercel will:
# 1. Upload /dist folder
# 2. Configure HTTPS automatically
# 3. Set up CDN
# 4. Deploy to production domain
```

**vercel.json Configuration:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/sw.js",
      "headers": {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Service-Worker-Allowed": "/"
      },
      "dest": "/sw.js"
    },
    {
      "src": "/manifest.json",
      "headers": {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=31536000, immutable"
      },
      "dest": "/manifest.json"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Step 3: Deploy Backend (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Set environment variables
railway variables set VAPID_PUBLIC_KEY=your_key
railway variables set VAPID_PRIVATE_KEY=your_key
railway variables set VAPID_SUBJECT=mailto:support@thehub.com

# Deploy
railway up
```

**Backend Requirements:**
- Node.js server (Express)
- Push notification endpoints:
  - POST `/api/notifications/subscribe`
  - POST `/api/notifications/unsubscribe`
  - POST `/api/notifications/preferences`
  - POST `/api/notifications/send`
- Supabase integration
- HTTPS enabled

### Step 4: Database Setup (Supabase)

```sql
-- Run in Supabase SQL Editor

-- Create push_subscriptions table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
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

-- Create notification_metrics table (optional, for analytics)
CREATE TABLE notification_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  notification_tag TEXT,
  user_id UUID REFERENCES auth.users(id),
  error_code INT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_metrics_created_at ON notification_metrics(created_at);
```

---

## ✅ Post-Deployment Verification

### 1. Test HTTPS

```bash
# Check SSL certificate
curl -I https://thehub.com

# Should return:
# HTTP/2 200
# Strict-Transport-Security: max-age=31536000
```

### 2. Test Service Worker Registration

```javascript
// Open browser console at https://thehub.com
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg);
  console.log('Scope:', reg.scope);
  console.log('Active:', reg.active);
});

// Should show registered service worker
```

### 3. Test Manifest

```bash
# Check manifest is accessible
curl https://thehub.com/manifest.json

# Should return valid JSON with:
# - name
# - short_name
# - icons
# - theme_color
# - display: standalone
```

### 4. Test Offline Functionality

```javascript
// In browser:
// 1. Load https://thehub.com
// 2. DevTools → Network → Offline
// 3. Refresh page
// Should show offline.html or cached content
```

### 5. Test Push Notifications

```bash
# Send test notification via backend API
curl -X POST https://api.thehub.com/api/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Should receive notification on subscribed devices
```

### 6. Run Lighthouse Audit

```bash
# Using CLI
npm install -g lighthouse

lighthouse https://thehub.com \
  --only-categories=pwa,performance \
  --output=html \
  --output-path=./lighthouse-report.html

# Open lighthouse-report.html
# Target: PWA score > 90
```

---

## 📊 Monitoring & Analytics

### 1. Setup Analytics Events

```javascript
// In your analytics provider (Google Analytics, Plausible, etc.)

// Track PWA installations
window.addEventListener('appinstalled', () => {
  gtag('event', 'pwa_installed');
});

// Track standalone launches
if (window.matchMedia('(display-mode: standalone)').matches) {
  gtag('event', 'pwa_launch');
}

// Track notification permissions
Notification.requestPermission().then(permission => {
  gtag('event', 'notification_permission', {
    permission: permission
  });
});
```

### 2. Monitor Service Worker Errors

```javascript
// In sw.js, add error logging
self.addEventListener('error', (event) => {
  // Send to error tracking service (Sentry, LogRocket, etc.)
  console.error('Service Worker error:', event);
  
  fetch('/api/log-error', {
    method: 'POST',
    body: JSON.stringify({
      type: 'service-worker-error',
      error: event.error?.message,
      stack: event.error?.stack,
    }),
  });
});
```

### 3. Track Push Notification Metrics

```sql
-- Query notification delivery rates
SELECT 
  DATE(created_at) as date,
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN error_code IS NULL THEN 1 END) as successful,
  COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) as failed
FROM notification_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date, type
ORDER BY date DESC;
```

---

## 🔧 Troubleshooting

### Issue: Service Worker Not Updating

**Symptoms:**
- Old version still running
- Changes not visible
- Update loop

**Solutions:**
```javascript
// 1. Force update on page load (in initPWA.ts)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.update(); // Force update check
  });
}

// 2. Clear old caches in sw.js activate event
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !currentCaches.includes(cacheName))
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// 3. Set proper cache headers in vercel.json
{
  "src": "/sw.js",
  "headers": {
    "Cache-Control": "public, max-age=0, must-revalidate"
  }
}
```

### Issue: Push Notifications Not Delivered

**Checklist:**
- [ ] VAPID keys configured correctly
- [ ] Subscription sent to backend
- [ ] Backend web-push configured
- [ ] HTTPS enabled
- [ ] User granted permission
- [ ] Service worker active

**Debug:**
```bash
# Check subscription on client
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub);
  });
});

# Test backend endpoint
curl -X POST https://api.thehub.com/api/notifications/test \
  -H "Authorization: Bearer TOKEN" \
  -v  # Verbose output
```

### Issue: Install Prompt Not Showing

**Criteria for install prompt:**
1. ✅ HTTPS enabled
2. ✅ Valid manifest.json
3. ✅ Service worker registered
4. ✅ Icons (192x192, 512x512)
5. ✅ start_url defined
6. ✅ display: standalone/fullscreen/minimal-ui
7. ✅ User engagement met (desktop: visited twice, mobile: heuristics)
8. ✅ Not dismissed recently
9. ✅ Not already installed

**Debug:**
```javascript
// Check installability
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt available!', e);
});

// Check if already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Already installed');
}

// Check manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log('Manifest:', m));
```

---

## 🔐 Security Best Practices

### 1. HTTPS Everywhere
```nginx
# Force HTTPS redirect
server {
  listen 80;
  server_name thehub.com;
  return 301 https://$server_name$request_uri;
}
```

### 2. Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self' 'unsafe-inline'; 
           style-src 'self' 'unsafe-inline';
           img-src 'self' data: https:;
           connect-src 'self' https://api.thehub.com wss://api.thehub.com;">
```

### 3. Secure VAPID Keys
```bash
# Never commit keys to git
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore

# Use environment variables
# Vercel: Settings → Environment Variables
# Railway: railway variables set KEY=value
```

### 4. Rate Limiting
```typescript
// Limit push notification sends
import rateLimit from 'express-rate-limit';

const notificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 notifications per minute per user
});

app.post('/api/notifications/send', 
  authenticate,
  notificationLimiter,
  sendNotificationHandler
);
```

---

## 📈 Performance Optimization

### 1. Code Splitting
```typescript
// Use dynamic imports for large components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/analytics" element={<Analytics />} />
  </Routes>
</Suspense>
```

### 2. Asset Optimization
```bash
# Compress images
npm install -g imagemin-cli
imagemin icons/*.png --out-dir=icons/optimized

# Generate WebP versions
imagemin icons/*.png --plugin=webp --out-dir=icons/webp
```

### 3. Caching Strategy
```javascript
// In sw.js - optimize cache strategy
const CACHE_MAX_AGE = {
  static: 7 * 24 * 60 * 60 * 1000,  // 7 days
  dynamic: 24 * 60 * 60 * 1000,      // 1 day
  api: 60 * 60 * 1000,               // 1 hour
};

// Implement cache expiration
async function cleanExpiredCaches() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    const response = await cache.match(request);
    const cachedTime = new Date(response.headers.get('date')).getTime();
    
    if (Date.now() - cachedTime > CACHE_MAX_AGE.dynamic) {
      await cache.delete(request);
    }
  }
}
```

---

## 🎯 Success Metrics

### Day 1 Targets
- [ ] Lighthouse PWA score > 90
- [ ] Service worker active
- [ ] Manifest valid
- [ ] Icons loading correctly
- [ ] Offline mode working
- [ ] Install prompt appearing

### Week 1 Targets
- [ ] 100+ PWA installs
- [ ] 50+ notification opt-ins
- [ ] 10+ offline sessions
- [ ] 0 critical errors
- [ ] Push notifications delivered successfully

### Month 1 Targets
- [ ] 10% install rate
- [ ] 30% notification opt-in rate
- [ ] 5% offline usage
- [ ] 40% return visits via PWA icon
- [ ] 15% push notification CTR

---

## 📞 Support

### Resources
- [PWA Implementation Guide](./PWA_IMPLEMENTATION.md)
- [Testing Guide](./PWA_TESTING_GUIDE.md)
- [Backend Push Notifications](./docs/BACKEND_PUSH_NOTIFICATIONS.md)

### Common Commands
```bash
# Rebuild and deploy
npm run build && vercel --prod

# Test locally
npm run preview

# Check service worker status
chrome://serviceworker-internals

# Clear all PWA data
chrome://settings/content/all → Find site → Clear data
```

---

**Deployment Complete! 🎉**

Your PWA is now live with:
- ✅ HTTPS enabled
- ✅ Service worker active
- ✅ Install prompt working
- ✅ Push notifications configured
- ✅ Offline support enabled
- ✅ Performance optimized

Monitor analytics and user feedback to continuously improve the PWA experience.

---

*Last Updated: February 2024*
