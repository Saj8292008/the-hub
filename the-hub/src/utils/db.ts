/**
 * IndexedDB utilities for offline data storage
 */

const DB_NAME = 'the-hub-db';
const DB_VERSION = 1;

interface DBSchema {
  watchlist: {
    key: string;
    value: WatchlistItem;
    indexes: { 'by-category': string; 'by-timestamp': number };
  };
  deals: {
    key: string;
    value: Deal;
    indexes: { 'by-category': string; 'by-price': number };
  };
  pendingSync: {
    key: string;
    value: PendingSyncItem;
    indexes: { 'by-timestamp': number };
  };
}

interface WatchlistItem {
  id: string;
  category: 'watches' | 'sneakers' | 'cars';
  title: string;
  price: number;
  imageUrl?: string;
  url?: string;
  timestamp: number;
  synced: boolean;
}

interface Deal {
  id: string;
  category: 'watches' | 'sneakers' | 'cars';
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  imageUrl?: string;
  url?: string;
  timestamp: number;
}

interface PendingSyncItem {
  id: string;
  type: 'add-watchlist' | 'remove-watchlist' | 'update-watchlist';
  data: any;
  timestamp: number;
  retries: number;
}

class Database {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        console.log('🔧 Upgrading database schema...');

        // Watchlist store
        if (!db.objectStoreNames.contains('watchlist')) {
          const watchlistStore = db.createObjectStore('watchlist', { keyPath: 'id' });
          watchlistStore.createIndex('by-category', 'category', { unique: false });
          watchlistStore.createIndex('by-timestamp', 'timestamp', { unique: false });
          console.log('✓ Created watchlist store');
        }

        // Deals store
        if (!db.objectStoreNames.contains('deals')) {
          const dealsStore = db.createObjectStore('deals', { keyPath: 'id' });
          dealsStore.createIndex('by-category', 'category', { unique: false });
          dealsStore.createIndex('by-price', 'price', { unique: false });
          console.log('✓ Created deals store');
        }

        // Pending sync store
        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          syncStore.createIndex('by-timestamp', 'timestamp', { unique: false });
          console.log('✓ Created pendingSync store');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Add item to watchlist (offline-first)
   */
  async addToWatchlist(item: Omit<WatchlistItem, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = `watchlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    const watchlistItem: WatchlistItem = {
      ...item,
      id,
      timestamp,
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['watchlist', 'pendingSync'], 'readwrite');
      
      // Add to watchlist
      const watchlistStore = transaction.objectStore('watchlist');
      const watchlistRequest = watchlistStore.add(watchlistItem);

      // Add to pending sync
      const syncStore = transaction.objectStore('pendingSync');
      const syncItem: PendingSyncItem = {
        id: `sync-${id}`,
        type: 'add-watchlist',
        data: watchlistItem,
        timestamp,
        retries: 0,
      };
      syncStore.add(syncItem);

      transaction.oncomplete = () => {
        console.log('✅ Added to watchlist (offline):', id);
        
        // Trigger background sync if available
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register(`add-to-watchlist-${id}`);
          });
        }
        
        resolve(id);
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get all watchlist items
   */
  async getWatchlist(category?: string): Promise<WatchlistItem[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('watchlist', 'readonly');
      const store = transaction.objectStore('watchlist');
      
      let request: IDBRequest;
      if (category) {
        const index = store.index('by-category');
        request = index.getAll(category);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove from watchlist
   */
  async removeFromWatchlist(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['watchlist', 'pendingSync'], 'readwrite');
      
      const watchlistStore = transaction.objectStore('watchlist');
      watchlistStore.delete(id);

      const syncStore = transaction.objectStore('pendingSync');
      const syncItem: PendingSyncItem = {
        id: `sync-remove-${id}`,
        type: 'remove-watchlist',
        data: { id },
        timestamp: Date.now(),
        retries: 0,
      };
      syncStore.add(syncItem);

      transaction.oncomplete = () => {
        console.log('✅ Removed from watchlist:', id);
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Cache deals for offline viewing
   */
  async cacheDeals(deals: Deal[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('deals', 'readwrite');
      const store = transaction.objectStore('deals');

      deals.forEach((deal) => {
        store.put(deal);
      });

      transaction.oncomplete = () => {
        console.log(`✅ Cached ${deals.length} deals`);
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get cached deals
   */
  async getCachedDeals(category?: string): Promise<Deal[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('deals', 'readonly');
      const store = transaction.objectStore('deals');
      
      let request: IDBRequest;
      if (category) {
        const index = store.index('by-category');
        request = index.getAll(category);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pending sync items
   */
  async getPendingSync(): Promise<PendingSyncItem[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('pendingSync', 'readonly');
      const store = transaction.objectStore('pendingSync');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark item as synced
   */
  async markAsSynced(syncId: string, watchlistId?: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const storeNames: Array<'pendingSync' | 'watchlist'> = ['pendingSync'];
      if (watchlistId) storeNames.push('watchlist');

      const transaction = this.db!.transaction(storeNames, 'readwrite');
      
      // Remove from pending sync
      const syncStore = transaction.objectStore('pendingSync');
      syncStore.delete(syncId);

      // Mark watchlist item as synced
      if (watchlistId) {
        const watchlistStore = transaction.objectStore('watchlist');
        const getRequest = watchlistStore.get(watchlistId);
        
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (item) {
            item.synced = true;
            watchlistStore.put(item);
          }
        };
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Clear all data (for debugging)
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['watchlist', 'deals', 'pendingSync'], 'readwrite');
      
      transaction.objectStore('watchlist').clear();
      transaction.objectStore('deals').clear();
      transaction.objectStore('pendingSync').clear();

      transaction.oncomplete = () => {
        console.log('✅ Cleared all offline data');
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get storage usage stats
   */
  async getStats(): Promise<{ watchlist: number; deals: number; pendingSync: number }> {
    await this.init();
    if (!this.db) return { watchlist: 0, deals: 0, pendingSync: 0 };

    const [watchlist, deals, pendingSync] = await Promise.all([
      this.getCount('watchlist'),
      this.getCount('deals'),
      this.getCount('pendingSync'),
    ]);

    return { watchlist, deals, pendingSync };
  }

  private async getCount(storeName: string): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  }
}

// Export singleton instance
export const db = new Database();
export type { WatchlistItem, Deal, PendingSyncItem };
