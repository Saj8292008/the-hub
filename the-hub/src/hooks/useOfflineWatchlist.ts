/**
 * Custom hook for offline-first watchlist management
 */

import { useState, useEffect, useCallback } from 'react';
import { db, WatchlistItem } from '../utils/db';
import { isOnline } from '../utils/pwa';
import toast from 'react-hot-toast';

export function useOfflineWatchlist(category?: string) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [online, setOnline] = useState(isOnline());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Load watchlist from IndexedDB
  const loadWatchlist = useCallback(async () => {
    try {
      const dbItems = await db.getWatchlist(category);
      setItems(dbItems);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // Sync with backend when online
  const syncWithBackend = useCallback(async () => {
    if (!online) return;

    setSyncStatus('syncing');

    try {
      // Fetch from backend
      const response = await fetch('/api/watchlist', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }

      const backendItems = await response.json();

      // Cache in IndexedDB
      // TODO: Implement proper sync logic (merge local + remote changes)
      
      setSyncStatus('synced');
      await loadWatchlist();
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('idle');
    }
  }, [online, loadWatchlist]);

  // Add item to watchlist (offline-first)
  const addItem = useCallback(async (
    item: Omit<WatchlistItem, 'id' | 'timestamp' | 'synced'>
  ) => {
    try {
      // Add to local IndexedDB first
      const id = await db.addToWatchlist(item);

      // Update UI immediately
      await loadWatchlist();

      // Show success message
      if (online) {
        toast.success('Added to watchlist');
      } else {
        toast.success('Added to watchlist (will sync when online)');
      }

      // Try to sync with backend if online
      if (online) {
        try {
          const response = await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(item),
          });

          if (response.ok) {
            // Mark as synced
            await db.markAsSynced(`sync-${id}`, id);
            await loadWatchlist();
          }
        } catch (err) {
          console.error('Backend sync failed, will retry later:', err);
        }
      }

      return id;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
      throw error;
    }
  }, [online, loadWatchlist]);

  // Remove item from watchlist
  const removeItem = useCallback(async (id: string) => {
    try {
      // Remove from local IndexedDB first
      await db.removeFromWatchlist(id);

      // Update UI immediately
      await loadWatchlist();

      toast.success('Removed from watchlist');

      // Try to sync with backend if online
      if (online) {
        try {
          await fetch(`/api/watchlist/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
        } catch (err) {
          console.error('Backend sync failed:', err);
        }
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
      throw error;
    }
  }, [online, loadWatchlist]);

  // Clear all items
  const clearAll = useCallback(async () => {
    try {
      await db.clearAll();
      await loadWatchlist();
      toast.success('Watchlist cleared');
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      toast.error('Failed to clear watchlist');
    }
  }, [loadWatchlist]);

  // Get storage stats
  const getStats = useCallback(async () => {
    return await db.getStats();
  }, []);

  // Setup online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.success('Back online! Syncing...');
      syncWithBackend();
    };

    const handleOffline = () => {
      setOnline(false);
      toast('You\'re offline. Changes will sync when you\'re back online.', {
        icon: '📡',
        duration: 3000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithBackend]);

  // Listen for background sync completion
  useEffect(() => {
    const handleWatchlistSynced = () => {
      loadWatchlist();
      toast.success('Watchlist synced');
    };

    window.addEventListener('watchlist-synced', handleWatchlistSynced);

    return () => {
      window.removeEventListener('watchlist-synced', handleWatchlistSynced);
    };
  }, [loadWatchlist]);

  // Initial load
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Sync when coming online
  useEffect(() => {
    if (online) {
      syncWithBackend();
    }
  }, [online, syncWithBackend]);

  return {
    items,
    isLoading,
    online,
    syncStatus,
    addItem,
    removeItem,
    clearAll,
    refresh: loadWatchlist,
    getStats,
  };
}

export default useOfflineWatchlist;
