import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Loader2, AlertCircle } from 'lucide-react';
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showNotification,
} from '../utils/pwa';

interface NotificationPreferences {
  priceDrops: boolean;
  newListings: boolean;
  restocks: boolean;
  priceIncreases: boolean;
  watchlistAlerts: boolean;
}

export function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    priceDrops: true,
    newListings: true,
    restocks: true,
    priceIncreases: false,
    watchlistAlerts: true,
  });

  useEffect(() => {
    checkNotificationStatus();
    loadPreferences();
  }, []);

  const checkNotificationStatus = async () => {
    if (!('Notification' in window)) {
      setError('Notifications are not supported in this browser');
      return;
    }

    setPermission(Notification.permission);

    // Check if already subscribed
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    }
  };

  const loadPreferences = () => {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    }
  };

  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notification-preferences', JSON.stringify(newPreferences));
    
    // Send to backend
    sendPreferencesToBackend(newPreferences);
  };

  const sendPreferencesToBackend = async (prefs: NotificationPreferences) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        console.error('Failed to save preferences to backend');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Please allow notifications in your browser settings');
        return;
      }

      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications();
      
      if (subscription) {
        setIsSubscribed(true);
        
        // Send subscription to backend
        await sendSubscriptionToBackend(subscription);
        
        // Show test notification
        await showNotification('Notifications Enabled! 🎉', {
          body: "You'll now receive deal alerts from The Hub",
          tag: 'notification-enabled',
        });
      } else {
        setError('Failed to subscribe to push notifications. Please check your browser settings.');
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
      setError('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await unsubscribeFromPushNotifications();
      
      if (success) {
        setIsSubscribed(false);
        await removeSubscriptionFromBackend();
      } else {
        setError('Failed to disable notifications');
      }
    } catch (err) {
      console.error('Error disabling notifications:', err);
      setError('Failed to disable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      console.log('✅ Subscription saved to backend');
    } catch (err) {
      console.error('Error saving subscription:', err);
      throw err;
    }
  };

  const removeSubscriptionFromBackend = async () => {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.error('Failed to remove subscription from backend');
      }
    } catch (err) {
      console.error('Error removing subscription:', err);
    }
  };

  const handleTestNotification = async () => {
    try {
      await showNotification('Test Notification 🔔', {
        body: 'This is what a deal alert looks like!',
        tag: 'test-notification',
        data: { url: '/dashboard' },
      });
    } catch (err) {
      console.error('Error showing test notification:', err);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  };

  if (!('Notification' in window)) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-500 font-semibold mb-1">
              Notifications Not Supported
            </h4>
            <p className="text-yellow-500/80 text-sm">
              Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Push Notifications</h3>
        <p className="text-gray-400 text-sm">
          Get instant alerts for new deals and price drops on items you're watching
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Enable/Disable Notifications */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-green-500" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                <BellOff className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h4 className="text-white font-semibold">
                {isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
              </h4>
              <p className="text-gray-400 text-sm">
                {isSubscribed
                  ? 'You\'re receiving push notifications'
                  : 'Get alerts for new deals and price drops'}
              </p>
            </div>
          </div>

          {isSubscribed ? (
            <button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Disable'
              )}
            </button>
          ) : (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading || permission === 'denied'}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Enable'
              )}
            </button>
          )}
        </div>

        {permission === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-500 text-sm">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {isSubscribed && (
          <button
            onClick={handleTestNotification}
            className="w-full mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Send Test Notification
          </button>
        )}
      </div>

      {/* Notification Preferences */}
      {isSubscribed && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">Notification Types</h4>
          
          <div className="space-y-3">
            <PreferenceToggle
              label="Price Drops"
              description="When a watched item's price decreases"
              checked={preferences.priceDrops}
              onChange={() => togglePreference('priceDrops')}
            />
            
            <PreferenceToggle
              label="New Listings"
              description="When new items match your interests"
              checked={preferences.newListings}
              onChange={() => togglePreference('newListings')}
            />
            
            <PreferenceToggle
              label="Restocks"
              description="When out-of-stock items become available"
              checked={preferences.restocks}
              onChange={() => togglePreference('restocks')}
            />
            
            <PreferenceToggle
              label="Price Increases"
              description="When a watched item's price increases"
              checked={preferences.priceIncreases}
              onChange={() => togglePreference('priceIncreases')}
            />
            
            <PreferenceToggle
              label="Watchlist Alerts"
              description="Important updates about items in your watchlist"
              checked={preferences.watchlistAlerts}
              onChange={() => togglePreference('watchlistAlerts')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface PreferenceToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function PreferenceToggle({ label, description, checked, onChange }: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0">
      <div className="flex-1">
        <h5 className="text-white font-medium text-sm">{label}</h5>
        <p className="text-gray-400 text-xs mt-0.5">{description}</p>
      </div>
      
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default NotificationSettings;
