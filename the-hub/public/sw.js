/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 'the-hub-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints to cache
const API_ROUTES = [
  '/api/deals',
  '/api/watchlist',
  '/api/watches',
  '/api/sneakers',
  '/api/cars',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => {
          console.warn('[SW] Failed to cache some static assets:', err);
          // Continue even if some assets fail to cache
        });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('the-hub-') && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - Cache first, fallback to network
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Default: try network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Network-first strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for watchlist updates
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncWatchlist());
  }
  
  if (event.tag.startsWith('add-to-watchlist-')) {
    event.waitUntil(syncPendingWatchlistItem(event.tag));
  }
});

async function syncWatchlist() {
  try {
    console.log('[SW] Syncing watchlist...');
    const response = await fetch('/api/watchlist');
    
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put('/api/watchlist', response.clone());
      
      // Notify clients
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'WATCHLIST_SYNCED',
          timestamp: Date.now(),
        });
      });
    }
  } catch (error) {
    console.error('[SW] Watchlist sync failed:', error);
  }
}

async function syncPendingWatchlistItem(tag) {
  try {
    // Extract item ID from tag
    const itemId = tag.replace('add-to-watchlist-', '');
    
    // Get pending items from IndexedDB or cache
    // This is a placeholder - implement proper IndexedDB storage
    console.log('[SW] Syncing pending watchlist item:', itemId);
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'WATCHLIST_ITEM_SYNCED',
        itemId,
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    console.error('[SW] Pending item sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let notificationData = {
    title: 'The Hub',
    body: 'New deal alert!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'deal-alert',
    data: {
      url: '/dashboard',
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
      };
    } catch (error) {
      console.error('[SW] Failed to parse push notification:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
