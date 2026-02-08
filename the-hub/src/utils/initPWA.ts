import {
  registerServiceWorker,
  setInstallPrompt,
  trackPWALaunch,
  registerBackgroundSync,
} from './pwa';

/**
 * Initialize PWA functionality
 */
export async function initPWA(): Promise<void> {
  console.log('🚀 Initializing PWA...');

  // Track if app is launched in standalone mode
  trackPWALaunch();

  // Register service worker
  try {
    const registration = await registerServiceWorker();
    
    if (registration) {
      console.log('✅ Service Worker registered');
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from SW:', event.data);
        
        if (event.data.type === 'WATCHLIST_SYNCED') {
          console.log('Watchlist synced at:', new Date(event.data.timestamp));
          // Dispatch custom event for components to listen to
          window.dispatchEvent(new CustomEvent('watchlist-synced', { detail: event.data }));
        }
        
        if (event.data.type === 'WATCHLIST_ITEM_SYNCED') {
          console.log('Watchlist item synced:', event.data.itemId);
          window.dispatchEvent(new CustomEvent('watchlist-item-synced', { detail: event.data }));
        }
      });
    }
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');
    e.preventDefault();
    setInstallPrompt(e as any);
    
    // Dispatch custom event so components can listen
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('✅ App installed!');
    
    // Clear the dismissed flag
    localStorage.removeItem('pwa-install-dismissed');
    
    // Track installation
    if (window.gtag) {
      window.gtag('event', 'pwa_installed', {
        event_category: 'PWA',
      });
    }
  });

  // Setup periodic background sync (if supported)
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    // Register sync when online
    window.addEventListener('online', async () => {
      console.log('📡 Back online - registering background sync');
      await registerBackgroundSync('sync-watchlist');
    });
  }

  // Log PWA status
  logPWAStatus();
}

/**
 * Log PWA capabilities and status
 */
function logPWAStatus(): void {
  const status = {
    'Service Worker': 'serviceWorker' in navigator,
    'Push Notifications': 'PushManager' in window,
    'Background Sync': 'sync' in ServiceWorkerRegistration.prototype,
    'Notifications': 'Notification' in window,
    'Notification Permission': typeof Notification !== 'undefined' ? Notification.permission : 'N/A',
    'Online': navigator.onLine,
    'Standalone Mode': window.matchMedia('(display-mode: standalone)').matches,
    'iOS Standalone': (navigator as any).standalone === true,
  };

  console.group('📱 PWA Status');
  Object.entries(status).forEach(([key, value]) => {
    const icon = value === true || value === 'granted' ? '✅' : 
                 value === false || value === 'denied' ? '❌' : '⚠️';
    console.log(`${icon} ${key}:`, value);
  });
  console.groupEnd();
}

export default initPWA;
