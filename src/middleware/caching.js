/**
 * Response Caching Middleware
 * Caches API responses to improve performance
 */

class CacheMiddleware {
  constructor() {
    this._cache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes default
    this.maxSize = 100; // Max cache entries
  }

  /**
   * Cache middleware factory
   * @param {Object} options - Caching options
   * @returns {Function} - Express middleware
   */
  cache(options = {}) {
    const {
      maxAge = this.maxAge,
      key = null,
      condition = null
    } = options;

    return (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Check condition if provided
      if (condition && !condition(req)) {
        return next();
      }

      // Generate cache key
      const cacheKey = key
        ? key(req)
        : this.generateKey(req.originalUrl || req.url);

      // Check if response is cached
      const cached = this.get(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `public, max-age=${Math.floor(maxAge / 1000)}`);
        return res.json(cached.data);
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache response
      res.json = (data) => {
        // Cache the response
        this.set(cacheKey, data, maxAge);

        // Set cache headers
        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', `public, max-age=${Math.floor(maxAge / 1000)}`);

        // Call original json method
        return originalJson(data);
      };

      next();
    };
  }

  /**
   * Get cached value
   */
  get(key) {
    const cached = this._cache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this._cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Set cache value
   */
  set(key, data, maxAge = this.maxAge) {
    // Enforce max size
    if (this._cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }

    this._cache.set(key, {
      data,
      expiresAt: Date.now() + maxAge,
      createdAt: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clear(pattern = null) {
    if (pattern) {
      // Clear entries matching pattern
      const regex = new RegExp(pattern);
      for (const [key] of this._cache) {
        if (regex.test(key)) {
          this._cache.delete(key);
        }
      }
    } else {
      // Clear all
      this._cache.clear();
    }
  }

  /**
   * Generate cache key from URL
   */
  generateKey(url) {
    return url;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let hits = 0;
    let misses = 0;
    let totalSize = 0;

    for (const [key, value] of this._cache) {
      totalSize += JSON.stringify(value.data).length;
    }

    return {
      entries: this._cache.size,
      maxSize: this.maxSize,
      totalSizeBytes: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      hitRate: hits / (hits + misses) || 0
    };
  }

  /**
   * Invalidate cache by key or pattern
   */
  invalidate(keyOrPattern) {
    if (typeof keyOrPattern === 'string') {
      if (this._cache.has(keyOrPattern)) {
        this._cache.delete(keyOrPattern);
        return 1;
      }
    }

    // Pattern matching
    let deleted = 0;
    const regex = new RegExp(keyOrPattern);
    for (const [key] of this._cache) {
      if (regex.test(key)) {
        this._cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }
}

// Singleton instance
const cacheMiddleware = new CacheMiddleware();

module.exports = cacheMiddleware;
