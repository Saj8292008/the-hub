// PWA Utility Functions

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available');
            
            // Notify user about update
            if (window.confirm('New version available! Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister the service worker (for debugging)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('Service Worker unregistered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if the app is installable
 */
export function isInstallable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Store the install prompt event
 */
export function setInstallPrompt(event: BeforeInstallPromptEvent): void {
  deferredPrompt = event;
}

/**
 * Show the install prompt
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return null;
  }

  // Show the install prompt
  await deferredPrompt.prompt();

  // Wait for the user's response
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`User response to install prompt: ${outcome}`);

  // Clear the deferred prompt
  deferredPrompt = null;

  return outcome;
}

/**
 * Check if the app is installed
 */
export function isAppInstalled(): boolean {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check for iOS standalone mode
  if ((navigator as any).standalone === true) {
    return true;
  }

  return false;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return subscription;
    }

    // Request permission
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Subscribe to push notifications
    // Note: You'll need to provide your own VAPID public key
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    
    if (!vapidPublicKey) {
      console.warn('VAPID public key not configured');
      return null;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('Push notification subscription:', subscription);

    // Send subscription to your server
    // await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Show a local notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  await registration.showNotification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    ...options,
  });
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.log('Background sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log(`Background sync registered: ${tag}`);
  } catch (error) {
    console.error('Background sync registration failed:', error);
  }
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Add online/offline event listeners
 */
export function addConnectionListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Cache URLs manually
 */
export async function cacheURLs(urls: string[]): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  if (registration.active) {
    registration.active.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('All caches cleared');
}

/**
 * Get cache storage estimate
 */
export async function getCacheSize(): Promise<{ usage: number; quota: number } | null> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null;
  }

  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage || 0,
    quota: estimate.quota || 0,
  };
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Track PWA install analytics
 */
export function trackPWAInstall(outcome: 'accepted' | 'dismissed'): void {
  console.log(`PWA install prompt: ${outcome}`);
  
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'pwa_install_prompt', {
      event_category: 'PWA',
      event_label: outcome,
    });
  }
}

/**
 * Track PWA launch
 */
export function trackPWALaunch(): void {
  if (isAppInstalled()) {
    console.log('App launched in standalone mode');
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'pwa_standalone_launch', {
        event_category: 'PWA',
      });
    }
  }
}

// Add TypeScript declarations for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
