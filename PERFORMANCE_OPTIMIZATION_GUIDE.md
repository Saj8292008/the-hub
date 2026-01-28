# Performance Optimization Guide

Complete guide to performance optimization features in The Hub.

---

## Table of Contents

1. [Image Optimization](#image-optimization)
2. [Response Caching](#response-caching)
3. [Performance Monitoring](#performance-monitoring)
4. [Bundle Optimization](#bundle-optimization)
5. [Database Optimization](#database-optimization)
6. [Best Practices](#best-practices)

---

## Image Optimization

### Lazy Loading Component

**Location:** `/the-hub/src/components/common/LazyImage.tsx`

**Usage:**

```tsx
import LazyImage from '../components/common/LazyImage';

<LazyImage
  src="https://example.com/image.jpg"
  alt="Description"
  className="w-full rounded-lg"
  width={800}
  height={600}
/>
```

**Features:**
- Intersection Observer for lazy loading
- Automatic placeholder generation
- Smooth fade-in transitions
- Error handling with fallback

### Responsive Images

```tsx
import { ResponsiveImage } from '../components/common/LazyImage';

<ResponsiveImage
  src="https://example.com/image.jpg"
  srcSet="
    https://example.com/image-300.jpg 300w,
    https://example.com/image-600.jpg 600w,
    https://example.com/image-900.jpg 900w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Description"
/>
```

### Blur-up Placeholder

```tsx
import { BlurImage } from '../components/common/LazyImage';

<BlurImage
  src="https://example.com/image.jpg"
  blurDataURL="data:image/jpeg;base64,..."
  alt="Description"
  width={800}
  height={600}
/>
```

---

## Response Caching

### How It Works

The caching middleware automatically caches GET request responses in memory.

**Features:**
- Automatic cache invalidation on POST/PUT/DELETE
- Configurable TTL (time-to-live)
- Pattern-based cache clearing
- Cache statistics endpoint

### Cached Endpoints

| Endpoint | Cache Duration |
|----------|----------------|
| `GET /api/blog/posts` | 2 minutes |
| `GET /api/blog/posts/:slug` | 5 minutes |
| `GET /api/blog/categories` | 10 minutes |
| `GET /sitemap.xml` | 1 hour |
| `GET /rss.xml` | 1 hour |

### Cache Management API

```bash
# Get cache statistics
GET /api/admin/cache/stats

Response:
{
  "entries": 42,
  "maxSize": 100,
  "totalSizeBytes": 524288,
  "totalSizeKB": "512.00"
}

# Clear entire cache
POST /api/admin/cache/clear
Body: {}

# Clear cache by pattern
POST /api/admin/cache/clear
Body: { "pattern": "/api/blog/*" }

# Invalidate specific key
POST /api/admin/cache/invalidate
Body: { "key": "/api/blog/posts?page=1" }
```

### Adding Caching to New Endpoints

```javascript
// In server.js
const cacheMiddleware = require('../middleware/caching');

app.get('/api/your-endpoint',
  cacheMiddleware.cache({ maxAge: 5 * 60 * 1000 }), // 5 minutes
  handleRoute((req) => yourHandler(req))
);
```

---

## Performance Monitoring

### Dashboard

**Location:** Admin Settings → Performance Tab

**URL:** `http://localhost:5173/admin` (select Performance tab)

### Metrics Tracked

1. **Total Requests** - All API calls
2. **Average Response Time** - Mean latency across all endpoints
3. **Error Rate** - Percentage of failed requests
4. **Unique Endpoints** - Number of distinct API routes

### Endpoint Metrics

For each endpoint, tracks:
- Call count
- Min/Max/Avg response time
- Error count
- Last called timestamp

### API Endpoints

```bash
# Get performance summary
GET /api/admin/performance/summary

Response:
{
  "totalRequests": 1234,
  "avgResponseTime": 145,
  "slowestEndpoint": {...},
  "fastestEndpoint": {...},
  "errorRate": "2.5%",
  "uniqueEndpoints": 45
}

# Get all metrics
GET /api/admin/performance/metrics

# Get slow endpoints (>1000ms by default)
GET /api/admin/performance/slow?threshold=1000

# Get error-prone endpoints
GET /api/admin/performance/errors

# Export metrics as JSON
GET /api/admin/performance/export

# Clear metrics
POST /api/admin/performance/clear
```

### Tracking Custom Operations

```javascript
const performanceMonitor = require('./services/performanceMonitor');

// Track async operation
const result = await performanceMonitor.trackOperation('my-operation', async () => {
  // Your operation here
  return await someAsyncTask();
});
```

---

## Bundle Optimization

### Frontend Build Optimization

**Vite Configuration** (`the-hub/vite.config.ts`):

```typescript
export default defineConfig({
  build: {
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'rehype-highlight']
        }
      }
    },
    // Minification
    minify: 'esbuild',
    // Source maps for production debugging
    sourcemap: false,
    // Target modern browsers
    target: 'es2015'
  }
});
```

### Code Splitting

**Route-based splitting:**

```tsx
import { lazy, Suspense } from 'react';

const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/blog" element={<Blog />} />
    <Route path="/blog/:slug" element={<BlogPost />} />
  </Routes>
</Suspense>
```

### Tree Shaking

Ensure imports are ES6 module syntax:

```typescript
// Good - tree-shakeable
import { Search, Filter } from 'lucide-react';

// Bad - imports everything
import * as Icons from 'lucide-react';
```

---

## Database Optimization

### Indexes

All critical queries use indexes:

```sql
-- Blog posts
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Watch listings
CREATE INDEX idx_watch_listings_deal_score ON watch_listings(deal_score DESC);
CREATE INDEX idx_watch_listings_brand ON watch_listings(brand);
CREATE INDEX idx_watch_listings_price ON watch_listings(price);
```

### Query Optimization

**Use pagination:**

```javascript
// Good
const posts = await blogQueries.getPosts({
  limit: 50,
  offset: 0
});

// Bad - loads everything
const posts = await blogQueries.getPosts();
```

**Select only needed columns:**

```javascript
// Good
const posts = await supabase
  .from('blog_posts')
  .select('id, title, slug, excerpt')
  .limit(50);

// Bad - loads all columns
const posts = await supabase
  .from('blog_posts')
  .select('*')
  .limit(50);
```

**Use count efficiently:**

```javascript
// Good - single query
const { data, count } = await supabase
  .from('blog_posts')
  .select('*', { count: 'exact' })
  .limit(50);

// Bad - two queries
const data = await supabase.from('blog_posts').select('*').limit(50);
const { count } = await supabase.from('blog_posts').select('*', { count: 'exact' });
```

---

## Best Practices

### 1. API Response Times

**Target response times:**
- Simple GET requests: <100ms
- Complex queries: <500ms
- AI operations: 10-30s (acceptable)

**How to improve:**
- Add caching for frequently accessed data
- Use indexes on commonly queried columns
- Paginate large result sets
- Denormalize data where appropriate

### 2. Frontend Performance

**Lighthouse targets:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 95+

**How to achieve:**
- Lazy load images with IntersectionObserver
- Code-split routes
- Minimize JavaScript bundle size
- Use CDN for static assets
- Compress images (WebP format)

### 3. Caching Strategy

**Cache by data volatility:**

| Data Type | Cache Duration | Rationale |
|-----------|----------------|-----------|
| Static content | 24 hours | Rarely changes |
| Blog posts | 5 minutes | Changes occasionally |
| Blog list | 2 minutes | Changes more often |
| User-specific data | No cache | Always fresh |
| Sitemap | 1 hour | Changes with new posts |

### 4. Memory Management

**Backend:**
- Cache max size: 100 entries (configurable)
- Performance metrics: 1000 entries max
- Auto-cleanup of expired entries

**Frontend:**
- Unsubscribe from event listeners in useEffect cleanup
- Clear intervals/timeouts on unmount
- Use React.memo for expensive components

### 5. Monitoring

**What to monitor:**
- API response times (track >1s requests)
- Error rates (alert if >5%)
- Cache hit rate (target >60%)
- Memory usage (alert if cache full)
- Slow database queries (>100ms)

**Tools:**
- Built-in performance monitor (Admin → Performance)
- Browser DevTools (Network, Performance tabs)
- Lighthouse (audits)
- Server logs (slow query warnings)

---

## Performance Checklist

### Before Deployment

- [ ] Run Lighthouse audit (score 90+)
- [ ] Check bundle size (<500KB gzipped)
- [ ] Verify all images lazy load
- [ ] Test with slow 3G network
- [ ] Check API response times (<200ms avg)
- [ ] Verify caching works (check X-Cache header)
- [ ] Test with 1000+ concurrent users (if possible)

### After Deployment

- [ ] Monitor performance metrics for 24 hours
- [ ] Check slow endpoints (Admin → Performance)
- [ ] Review error logs
- [ ] Verify cache hit rate >60%
- [ ] Check CDN cache status
- [ ] Monitor database query performance

### Weekly Maintenance

- [ ] Review performance metrics
- [ ] Clear old cache entries
- [ ] Analyze slow queries
- [ ] Optimize heavy endpoints
- [ ] Check memory usage trends

---

## Troubleshooting

### High Response Times

**Symptoms:** API requests taking >1s

**Solutions:**
1. Check slow endpoints: Admin → Performance → Slow Endpoints
2. Add database indexes if needed
3. Increase cache duration
4. Optimize database queries
5. Consider denormalization

### Cache Not Working

**Symptoms:** X-Cache header always shows "MISS"

**Solutions:**
1. Verify middleware is installed: `app.use(cacheMiddleware.cache())`
2. Check cache stats: `GET /api/admin/cache/stats`
3. Ensure GET requests (POST/PUT/DELETE not cached)
4. Check cache max size not exceeded

### Memory Issues

**Symptoms:** Server crashes, slow performance

**Solutions:**
1. Clear cache: `POST /api/admin/cache/clear`
2. Clear performance metrics: `POST /api/admin/performance/clear`
3. Reduce cache maxSize in `caching.js`
4. Implement cache LRU eviction

### Large Bundle Size

**Symptoms:** Frontend loads slowly

**Solutions:**
1. Analyze bundle: `cd the-hub && npm run build -- --stats`
2. Remove unused dependencies
3. Use code splitting for routes
4. Lazy load heavy components
5. Use dynamic imports for large libraries

---

## Resources

**Documentation:**
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

**Tools:**
- Chrome DevTools
- React DevTools Profiler
- Webpack Bundle Analyzer
- Supabase Query Performance

---

**Version:** 1.0.0
**Last Updated:** January 24, 2025
