/**
 * Response Caching Middleware
 * Simple in-memory cache for API responses
 */

const cache = new Map();

function cacheMiddleware(options = {}) {
  const maxAge = options.maxAge || 60000; // Default 1 minute
  
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = req.originalUrl || req.url;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return res.json(cached.data);
    }
    
    // Intercept the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return originalJson(data);
    };
    
    next();
  };
}

function clear(pattern) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

module.exports = {
  cache: cacheMiddleware,
  clear
};
