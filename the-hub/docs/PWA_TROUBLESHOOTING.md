# PWA Troubleshooting Guide 🔧

## Installation Issues

### Problem: "Install" button never appears

**Symptoms:**
- No install prompt shown
- Browser doesn't show install icon in address bar
- `beforeinstallprompt` event not firing

**Solutions:**

1. **Check HTTPS requirement:**
   ```bash
   # ✅ Correct
   https://yourdomain.com
   http://localhost:5173
   http://127.0.0.1:5173
   
   # ❌ Wrong
   http://yourdomain.com  # Must be HTTPS in production
   ```

2. **Verify manifest is valid:**
   - Open DevTools → Application → Manifest
   - Check for errors in red
   - Verify all required fields are present

3. **Check installation criteria:**
   - App must be served over HTTPS (or localhost)
   - Must have a valid `manifest.json`
   - Must have a registered service worker
   - Must have at least one 192px icon
   - Page must not already be installed

4. **Clear and retry:**
   ```javascript
   // In Console
   localStorage.removeItem('pwa-install-dismissed');
   location.reload();
   ```

5. **Check browser support:**
   - Chrome/Edge: Full support ✅
   - Firefox: Limited support ⚠️
   - Safari: Manual "Add to Home Screen" only ⚠️

### Problem: App installs but doesn't open in standalone mode

**Solutions:**

1. **Check display mode in manifest:**
   ```json
   {
     "display": "standalone"  // Not "browser"
   }
   ```

2. **Verify start_url:**
   ```json
   {
     "start_url": "/"  // Must be relative to manifest location
   }
   ```

3. **Check scope:**
   ```json
   {
     "scope": "/"  // Must include start_url
   }
   ```

## Service Worker Issues

### Problem: Service Worker won't register

**Symptoms:**
- Console shows registration error
- No service worker in Application tab
- Offline mode doesn't work

**Solutions:**

1. **Check file location:**
   ```
   ✅ Correct: public/sw.js
   ❌ Wrong: src/sw.js
   ```

2. **Verify registration code:**
   ```javascript
   // In index.html or main.tsx
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js')
       .then(reg => console.log('SW registered', reg))
       .catch(err => console.error('SW registration failed', err));
   }
   ```

3. **Check for JavaScript errors:**
   - Open DevTools → Console
   - Look for syntax errors in sw.js
   - Fix any ESLint warnings

4. **Clear existing service workers:**
   ```javascript
   // In Console
   navigator.serviceWorker.getRegistrations()
     .then(regs => regs.forEach(reg => reg.unregister()));
   location.reload();
   ```

### Problem: Service Worker stuck in "waiting" state

**Solutions:**

1. **Skip waiting manually:**
   ```javascript
   // In Console
   navigator.serviceWorker.getRegistration()
     .then(reg => reg.waiting?.postMessage({ type: 'SKIP_WAITING' }));
   ```

2. **Close all tabs and reopen**

3. **Add update notification:**
   ```typescript
   // Already implemented in pwa.ts
   // Shows "New version available" prompt
   ```

### Problem: Updates not applying

**Solutions:**

1. **Update cache version:**
   ```javascript
   // In sw.js
   const CACHE_VERSION = 'the-hub-v2';  // Increment version
   ```

2. **Clear caches:**
   ```javascript
   // In Console
   caches.keys().then(names => {
     names.forEach(name => caches.delete(name));
   });
   ```

3. **Unregister and re-register:**
   - DevTools → Application → Service Workers
   - Click "Unregister"
   - Refresh page

## Caching Issues

### Problem: Changes not showing after deploy

**Solutions:**

1. **Hard refresh:**
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

2. **Clear site data:**
   - DevTools → Application → Clear Storage
   - Check "Unregister service workers"
   - Click "Clear site data"

3. **Check cache strategy:**
   ```javascript
   // API requests should use network-first
   // Static assets can use cache-first
   ```

### Problem: API responses are stale

**Solutions:**

1. **Change to network-first for APIs:**
   ```javascript
   // In sw.js - already implemented
   if (url.pathname.startsWith('/api/')) {
     return networkFirstStrategy(request);
   }
   ```

2. **Set cache expiration:**
   ```javascript
   // Check response age
   const cached = await caches.match(request);
   const cacheTime = cached?.headers.get('date');
   // Implement TTL logic
   ```

## Notification Issues

### Problem: Notifications not showing

**Symptoms:**
- `requestPermission()` resolves but no notifications
- Console shows no errors
- Subscription succeeds but no push received

**Solutions:**

1. **Check permission:**
   ```javascript
   // In Console
   console.log(Notification.permission);
   // Should be "granted", not "default" or "denied"
   ```

2. **Reset permission:**
   - Browser settings → Site settings
   - Find your site
   - Reset notifications permission
   - Try again

3. **Test with local notification:**
   ```javascript
   // In Console
   new Notification('Test', {
     body: 'Testing notifications',
     icon: '/icons/icon-192x192.png'
   });
   ```

4. **Check browser support:**
   - Safari iOS: NOT supported ❌
   - Chrome/Firefox/Edge: Fully supported ✅

### Problem: Push notifications not received

**Solutions:**

1. **Verify VAPID keys:**
   ```bash
   # Generate new keys
   npx web-push generate-vapid-keys
   
   # Add to .env
   VITE_VAPID_PUBLIC_KEY=your_public_key
   ```

2. **Check subscription endpoint:**
   ```javascript
   // In Console
   navigator.serviceWorker.ready.then(reg => {
     reg.pushManager.getSubscription()
       .then(sub => console.log(sub));
   });
   ```

3. **Test backend endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/push/subscribe \
     -H "Content-Type: application/json" \
     -d '{"endpoint":"...","keys":{...}}'
   ```

## Offline Issues

### Problem: App doesn't work offline

**Solutions:**

1. **Verify service worker is active:**
   - DevTools → Application → Service Workers
   - Status should be "activated and is running"

2. **Check cache storage:**
   - DevTools → Application → Cache Storage
   - Should see `the-hub-v1-static`, etc.
   - Verify assets are cached

3. **Test offline mode:**
   - DevTools → Network → Throttling
   - Select "Offline"
   - Refresh page
   - Should show cached content or offline.html

4. **Check fetch event handler:**
   ```javascript
   // In sw.js - verify fetch event is implemented
   self.addEventListener('fetch', (event) => {
     // Handler should be here
   });
   ```

## Icon Issues

### Problem: Icons not displaying correctly

**Solutions:**

1. **Use PNG instead of SVG:**
   ```bash
   # Generate PNG icons
   open public/icons/generate-icons.html
   ```

2. **Check icon sizes:**
   ```json
   // manifest.json
   "icons": [
     { "src": "/icons/icon-192x192.png", "sizes": "192x192" },
     { "src": "/icons/icon-512x512.png", "sizes": "512x512" }
   ]
   ```

3. **Verify icon paths:**
   ```bash
   # Icons should be accessible
   curl http://localhost:5173/icons/icon-192x192.png
   ```

4. **Check purpose attribute:**
   ```json
   {
     "purpose": "any maskable"  // Works on all platforms
   }
   ```

## Performance Issues

### Problem: Slow load times

**Solutions:**

1. **Enable compression:**
   ```javascript
   // In vite.config.ts
   export default {
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom']
           }
         }
       }
     }
   }
   ```

2. **Optimize images:**
   - Use WebP format
   - Compress with TinyPNG
   - Lazy load images

3. **Reduce bundle size:**
   ```bash
   # Analyze bundle
   npm run build
   npx vite-bundle-visualizer
   ```

4. **Implement code splitting:**
   ```typescript
   // Use dynamic imports
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

## Lighthouse Audit Failures

### PWA Score < 90

**Common Issues:**

1. **Missing manifest properties:**
   - Add `short_name`
   - Add proper icons
   - Set `display: "standalone"`

2. **Service worker not registered:**
   - Check registration code
   - Verify sw.js is served

3. **No offline fallback:**
   - Ensure offline.html exists
   - Verify fetch handler catches failures

4. **HTTPS not used:**
   - Deploy to HTTPS host
   - Test with localhost for development

### Performance Score < 90

**Solutions:**

1. **Enable caching:**
   - Already implemented in sw.js
   - Verify cache-first for static assets

2. **Optimize images:**
   - Use modern formats (WebP)
   - Serve responsive images
   - Lazy load off-screen images

3. **Reduce JavaScript:**
   - Code split
   - Tree shake unused code
   - Minify in production

## Platform-Specific Issues

### iOS Safari

**Known Limitations:**
- No install banner (must use "Add to Home Screen")
- No push notifications
- No background sync
- Limited service worker features

**Solutions:**
- Add instructions for manual installation
- Use localStorage instead of background sync
- Implement polling instead of push

### Android Chrome

**Known Issues:**
- Install prompt may not show immediately
- Requires engagement heuristics

**Solutions:**
- Wait for user interaction before showing prompt
- Don't show prompt on first visit
- Show custom UI to encourage installation

### Desktop Chrome

**Known Issues:**
- Window size not saved
- Multiple instances can open

**Solutions:**
- Set `display_override` in manifest
- Handle window management in service worker

## Debug Commands

```javascript
// Check PWA status
navigator.serviceWorker.getRegistrations().then(console.log);

// Check cache
caches.keys().then(console.log);

// Check notification permission
console.log(Notification.permission);

// Check if installed
console.log(window.matchMedia('(display-mode: standalone)').matches);

// Check manifest
fetch('/manifest.json').then(r => r.json()).then(console.log);

// Force service worker update
navigator.serviceWorker.getRegistration()
  .then(reg => reg.update());
```

## Getting Help

If issues persist:

1. **Check browser console** for specific errors
2. **Run Lighthouse audit** for detailed diagnostics
3. **Test in different browsers** to isolate issues
4. **Check network tab** for failed requests
5. **Verify all files exist** and paths are correct

Still stuck? Check:
- [web.dev/pwa](https://web.dev/progressive-web-apps/)
- [MDN Service Worker Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- Chrome DevTools → Application → Manifest → Errors

---

**Most issues are fixed by:**
1. Hard refresh (Cmd+Shift+R)
2. Clear site data
3. Unregister service worker
4. Verify file paths

