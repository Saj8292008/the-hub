import { useState, useEffect, useCallback } from 'react';
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showNotification,
} from '../utils/pwa';

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showLocalNotification: (title: string, options?: NotificationOptions) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
    
    setIsSupported(supported);

    if (supported) {
      checkSubscription();
    }
  }, []);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  }, []);

  // Request notification permission
  const handleRequestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await subscribeToPushNotifications();
      
      if (subscription) {
        setIsSubscribed(true);
        
        // Send subscription to your backend
        await sendSubscriptionToBackend(subscription);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      return false;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const success = await unsubscribeFromPushNotifications();
      
      if (success) {
        setIsSubscribed(false);
        
        // Remove subscription from your backend
        await removeSubscriptionFromBackend();
      }
      
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      return false;
    }
  }, []);

  // Show local notification
  const showLocalNotification = useCallback(
    async (title: string, options?: NotificationOptions): Promise<void> => {
      await showNotification(title, options);
    },
    []
  );

  return {
    permission,
    isSubscribed,
    isSupported,
    requestPermission: handleRequestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
}

/**
 * Send subscription to backend
 */
async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }

    console.log('Subscription saved to backend');
  } catch (error) {
    console.error('Failed to send subscription to backend:', error);
    // Don't throw - subscription still works locally
  }
}

/**
 * Remove subscription from backend
 */
async function removeSubscriptionFromBackend(): Promise<void> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription');
    }

    console.log('Subscription removed from backend');
  } catch (error) {
    console.error('Failed to remove subscription from backend:', error);
  }
}

export default useNotifications;
