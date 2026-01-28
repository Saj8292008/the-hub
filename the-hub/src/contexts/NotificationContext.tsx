import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import '../styles/Notifications.css';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  title?: string;
  message: string;
  removing?: boolean;
}

interface NotificationContextValue {
  addNotification: (type: NotificationType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: number) => {
    // Mark as removing to trigger slide-out animation
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, removing: true } : n));

    // Remove from DOM after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  }, []);

  const addNotification = useCallback((
    type: NotificationType,
    message: string,
    title?: string,
    duration: number = 5000
  ) => {
    const id = Date.now();
    const newNotification: Notification = { id, type, message, title };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  // Helper methods for specific notification types
  const success = useCallback((message: string, title?: string, duration?: number) => {
    addNotification('success', message, title, duration);
  }, [addNotification]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    addNotification('error', message, title, duration);
  }, [addNotification]);

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    addNotification('warning', message, title, duration);
  }, [addNotification]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    addNotification('info', message, title, duration);
  }, [addNotification]);

  const value: NotificationContextValue = {
    addNotification,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type} ${notification.removing ? 'notification-removing' : ''}`}
          >
            <div className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
              {notification.type === 'info' && 'ⓘ'}
            </div>
            <div className="notification-content">
              {notification.title && (
                <div className="notification-title">{notification.title}</div>
              )}
              <div className="notification-message">{notification.message}</div>
            </div>
            <button
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
