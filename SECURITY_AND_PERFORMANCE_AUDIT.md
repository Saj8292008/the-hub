# Security and Performance Audit Guide

Complete guide for security auditing and performance optimization of The Hub platform.

---

## Quick Start

```bash
# Run security audit
node scripts/securityAudit.js

# Run performance benchmark
node scripts/performanceBenchmark.js

# Run both
npm run audit
```

---

## Table of Contents

1. [Security Audit](#security-audit)
2. [Performance Audit](#performance-audit)
3. [Automated Scripts](#automated-scripts)
4. [Manual Review Checklist](#manual-review-checklist)
5. [Security Best Practices](#security-best-practices)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring and Alerts](#monitoring-and-alerts)

---

## Security Audit

### Automated Security Scan

Run the automated security auditor:

```bash
node scripts/securityAudit.js
```

This checks for:
- ✅ Environment file security
- ✅ Dependency vulnerabilities
- ✅ API security configurations
- ✅ Input validation
- ✅ Authentication implementation
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Security headers
- ✅ File permissions
- ✅ Secrets exposure
- ✅ SQL injection risks
- ✅ XSS protection

### Security Checklist

#### 1. Environment and Secrets

- [ ] `.env` files are in `.gitignore`
- [ ] No `.env` files committed to git
- [ ] No API keys hardcoded in source code
- [ ] Production and development use different API keys
- [ ] Service role keys never exposed in frontend
- [ ] `.env.example` provided with placeholder values

**Verify:**
```bash
# Check git history for secrets
git log --all --full-history --source --find-object=OPENAI_API_KEY

# Check for hardcoded secrets
grep -r "sk-" src/
```

#### 2. Dependency Security

- [ ] All dependencies up to date
- [ ] No known vulnerabilities (`npm audit`)
- [ ] Dev dependencies not in production
- [ ] `package-lock.json` committed
- [ ] Regular security updates scheduled

**Commands:**
```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update all dependencies
npm update
```

#### 3. API Security

**Authentication:**
- [ ] Supabase Auth implemented
- [ ] Admin routes protected
- [ ] JWT tokens validated
- [ ] Session management secure
- [ ] Password requirements enforced

**Input Validation:**
- [ ] All user input validated
- [ ] Email format validated
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS protection (DOMPurify)
- [ ] File upload validation

**Rate Limiting:**
- [ ] Rate limiting active (60 req/min)
- [ ] AI endpoints have stricter limits
- [ ] Rate limit headers sent
- [ ] Graceful error handling

**CORS:**
- [ ] CORS origin restricted in production
- [ ] Credentials handling secure
- [ ] Preflight requests handled

#### 4. Frontend Security

- [ ] No secrets in frontend code
- [ ] XSS protection enabled
- [ ] Content Security Policy configured
- [ ] Secure cookie settings (httpOnly, secure, sameSite)
- [ ] No eval() or Function() usage

**Verify:**
```bash
# Check for secrets in frontend
grep -r "SUPABASE_SERVICE_ROLE_KEY" the-hub/src/
grep -r "sk-" the-hub/src/

# Check for dangerous patterns
grep -r "innerHTML" the-hub/src/
grep -r "eval(" the-hub/src/
```

#### 5. Database Security

- [ ] Row Level Security (RLS) enabled
- [ ] RLS policies tested
- [ ] Service role key only used on backend
- [ ] Database backups configured
- [ ] Connection pooling enabled
- [ ] Indexes on all queried columns

**Test RLS:**
```sql
-- Try to access data without auth
SELECT * FROM blog_posts WHERE status = 'draft';

-- Should fail if RLS is working correctly
```

#### 6. Security Headers

Required headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
```

**Verify:**
```bash
curl -I https://yourdomain.com | grep -E "X-|Content-Security|Strict-Transport"
```

#### 7. File Upload Security

- [ ] File type validation (whitelist)
- [ ] File size limits enforced
- [ ] Files scanned for malware
- [ ] Files stored in secure location
- [ ] CDN/storage has proper permissions

### Vulnerability Scanning

**Manual Tools:**

```bash
# NPM Audit
npm audit --production

# OWASP Dependency Check
dependency-check --project "The Hub" --scan .

# Snyk
npx snyk test

# Retire.js (frontend)
npx retire --path the-hub/
```

---

## Performance Audit

### Automated Performance Benchmark

Run the performance benchmarker:

```bash
# Local testing
node scripts/performanceBenchmark.js

# Remote testing
node scripts/performanceBenchmark.js https://api.yourdomain.com
```

This tests:
- ⏱️ API response times
- ⏱️ Blog endpoint performance
- ⏱️ AI feature latency
- ⏱️ SEO endpoint speed
- ⏱️ Cache effectiveness

### Performance Targets

**Backend API:**
- Simple GET: < 100ms
- Complex queries: < 500ms
- AI search: < 3s
- Blog generation: 10-30s (acceptable)
- Deal scoring: < 5 min for 1000 items

**Frontend:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Total Blocking Time: < 200ms
- Cumulative Layout Shift: < 0.1
- Largest Contentful Paint: < 2.5s

### Lighthouse Audit

**Run Lighthouse:**
```bash
# Install
npm install -g lighthouse

# Run audit
lighthouse https://yourdomain.com --output html --output-path ./lighthouse-report.html

# View report
open lighthouse-report.html
```

**Targets:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 95+

### Performance Checklist

#### 1. Frontend Performance

- [ ] Bundle size < 500KB gzipped
- [ ] Code splitting implemented
- [ ] Lazy loading for images
- [ ] Route-based code splitting
- [ ] Tree shaking enabled
- [ ] Minification active

**Check bundle size:**
```bash
cd the-hub
npm run build
ls -lh dist/assets/*.js
```

#### 2. API Performance

- [ ] Response caching active
- [ ] Database indexes created
- [ ] Query optimization done
- [ ] Pagination implemented
- [ ] N+1 queries eliminated

**Test response times:**
```bash
# Blog posts endpoint
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/blog/posts

# Create curl-format.txt:
echo "time_total: %{time_total}s\n" > curl-format.txt
```

#### 3. Database Performance

- [ ] All queries < 100ms
- [ ] Indexes on frequently queried columns
- [ ] Connection pooling enabled
- [ ] Query plan analyzed
- [ ] No full table scans

**Analyze queries:**
```sql
-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM blog_posts
WHERE category = 'watches'
ORDER BY published_at DESC
LIMIT 10;

-- Check missing indexes
SELECT * FROM pg_stat_user_tables
WHERE idx_scan = 0;
```

#### 4. Caching Strategy

- [ ] Response cache hit rate > 60%
- [ ] Cache invalidation working
- [ ] Appropriate TTL values
- [ ] Cache headers sent
- [ ] CDN caching configured

**Monitor cache:**
```bash
# Get cache stats
curl http://localhost:3000/api/admin/cache/stats

# Check cache headers
curl -I http://localhost:3000/api/blog/posts | grep -i cache
```

#### 5. Image Optimization

- [ ] Images lazy load
- [ ] WebP format used
- [ ] Responsive images
- [ ] Image compression
- [ ] CDN for images

**Test lazy loading:**
```bash
# Check image loading behavior
lighthouse https://yourdomain.com --only-categories=performance
```

### Load Testing

**Using Apache Bench:**
```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3000/api/blog/posts

# With POST data
ab -n 100 -c 10 -p data.json -T application/json http://localhost:3000/api/search/watches
```

**Using wrk:**
```bash
# Install wrk
brew install wrk  # macOS
apt-get install wrk  # Linux

# Run load test
wrk -t4 -c100 -d30s http://localhost:3000/api/blog/posts
```

---

## Automated Scripts

### Security Audit Script

**Location:** `scripts/securityAudit.js`

**Features:**
- Environment file security check
- Dependency vulnerability scan
- API security configuration review
- Secrets exposure detection
- SQL injection risk assessment
- XSS protection verification
- CORS and rate limiting checks

**Usage:**
```bash
node scripts/securityAudit.js
```

**Exit codes:**
- `0` - Passed, no critical issues
- `1` - Failed, critical or high priority issues found

### Performance Benchmark Script

**Location:** `scripts/performanceBenchmark.js`

**Features:**
- API endpoint response time measurement
- Concurrent request testing
- Performance rating (Excellent/Good/Moderate/Poor)
- Results export to JSON

**Usage:**
```bash
# Local
node scripts/performanceBenchmark.js

# Production
node scripts/performanceBenchmark.js https://api.yourdomain.com
```

**Output:**
- Console report with color-coded results
- JSON file: `benchmark-results-{timestamp}.json`

---

## Manual Review Checklist

### Code Review

- [ ] No console.log in production code
- [ ] Error messages don't expose internals
- [ ] No hardcoded credentials
- [ ] Input sanitization present
- [ ] Error handling comprehensive
- [ ] Comments explain complex logic
- [ ] No unused code

### Architecture Review

- [ ] Separation of concerns
- [ ] DRY principles followed
- [ ] Single Responsibility Principle
- [ ] Proper error propagation
- [ ] Consistent coding style
- [ ] Type safety (TypeScript)

### Infrastructure Review

- [ ] HTTPS/SSL configured
- [ ] Firewall rules set
- [ ] Database access restricted
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## Security Best Practices

### 1. API Key Management

**DO:**
- ✅ Use environment variables
- ✅ Rotate keys regularly (90 days)
- ✅ Use different keys per environment
- ✅ Set usage limits
- ✅ Monitor API usage

**DON'T:**
- ❌ Hardcode API keys
- ❌ Commit keys to git
- ❌ Share keys in Slack/email
- ❌ Use the same key everywhere
- ❌ Leave keys in browser console

### 2. Input Validation

**Always validate:**
- Email format
- URL format
- Integer ranges
- String lengths
- Enum values
- File types

**Example:**
```javascript
// Good
const email = req.body.email;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Invalid email');
}

// Bad
const email = req.body.email;
// No validation
```

### 3. Authentication

**Best practices:**
- Use established libraries (Supabase Auth)
- Implement MFA for admins
- Enforce strong passwords
- Use HTTPS only
- Implement session timeout
- Log authentication attempts

### 4. Error Handling

**Good:**
```javascript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new Error('Operation failed'); // Generic message
}
```

**Bad:**
```javascript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  throw error; // Exposes internal details
}
```

---

## Performance Optimization

### Frontend Optimization

**1. Code Splitting:**
```typescript
// Route-based splitting
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
```

**2. Image Optimization:**
```tsx
<LazyImage
  src="image.jpg"
  alt="Description"
  loading="lazy"
  width={800}
  height={600}
/>
```

**3. Bundle Optimization:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react']
        }
      }
    }
  }
});
```

### Backend Optimization

**1. Database Queries:**
```javascript
// Good - selective fields
const posts = await supabase
  .from('blog_posts')
  .select('id, title, slug, excerpt')
  .limit(50);

// Bad - all fields
const posts = await supabase
  .from('blog_posts')
  .select('*');
```

**2. Caching:**
```javascript
app.get('/api/blog/posts',
  cacheMiddleware.cache({ maxAge: 2 * 60 * 1000 }),
  handleRoute(blogAPI.getPosts)
);
```

**3. Pagination:**
```javascript
const posts = await blogQueries.getPosts({
  limit: 50,
  offset: (page - 1) * 50
});
```

---

## Monitoring and Alerts

### Metrics to Monitor

**Application:**
- Response times (p50, p95, p99)
- Error rate
- Request volume
- Cache hit rate
- Memory usage
- CPU usage

**Business:**
- Blog views
- Email subscriptions
- Search queries
- Deal scores generated
- API costs (OpenAI)

### Alerting Rules

**Critical (immediate action):**
- Error rate > 5%
- API down > 1 minute
- Database connection lost
- OpenAI quota exceeded

**Warning (review within 1 hour):**
- Response time > 1s average
- Cache hit rate < 40%
- Memory usage > 80%
- High API costs

**Info (daily review):**
- Slow queries detected
- High traffic spike
- New error types
- Unusual search patterns

### Monitoring Tools

**Free Tier:**
- Supabase Dashboard (database metrics)
- Vercel Analytics (if using Vercel)
- OpenAI Usage Dashboard
- Google Search Console (SEO)

**Paid Recommended:**
- Sentry (error tracking) - $26/month
- Better Uptime (uptime monitoring) - $10/month
- LogRocket (session replay) - $99/month

---

## Pre-Deployment Checklist

### Security

- [ ] Security audit passed
- [ ] All critical vulnerabilities fixed
- [ ] npm audit clean
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers set
- [ ] Rate limiting active

### Performance

- [ ] Performance benchmark passed
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB
- [ ] Images optimized
- [ ] Caching configured
- [ ] Database indexed
- [ ] CDN configured

### Testing

- [ ] All tests passing
- [ ] End-to-end tests passed
- [ ] Load testing completed
- [ ] Security testing done

### Documentation

- [ ] API documentation updated
- [ ] Deployment guide ready
- [ ] Rollback procedure documented
- [ ] Monitoring configured
- [ ] Alerts set up

---

## Post-Deployment

### Immediate (within 1 hour)

- [ ] Verify all endpoints working
- [ ] Check error logs
- [ ] Monitor response times
- [ ] Verify SSL certificate
- [ ] Test critical user flows

### Day 1

- [ ] Review monitoring dashboards
- [ ] Check error rates
- [ ] Verify caching working
- [ ] Test automated processes
- [ ] Monitor API costs

### Week 1

- [ ] Security scan on production
- [ ] Performance audit
- [ ] Review slow queries
- [ ] Check SEO indexing
- [ ] Gather user feedback

---

## Emergency Procedures

### Security Breach Response

1. **Immediate:**
   - Take affected service offline
   - Rotate all API keys
   - Review access logs
   - Notify users if data compromised

2. **Investigation:**
   - Identify breach vector
   - Assess data impact
   - Document timeline
   - Fix vulnerability

3. **Recovery:**
   - Deploy security patch
   - Monitor for suspicious activity
   - Update security procedures
   - Conduct post-mortem

### Performance Degradation

1. **Identify:**
   - Check monitoring dashboards
   - Review slow query logs
   - Check error rates
   - Verify external services

2. **Mitigate:**
   - Clear cache if corrupted
   - Restart services
   - Scale resources
   - Disable non-critical features

3. **Resolve:**
   - Fix root cause
   - Deploy optimization
   - Load test fix
   - Update monitoring

---

## Resources

**Security:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase Security: https://supabase.com/docs/guides/auth
- OpenAI API Security: https://platform.openai.com/docs/guides/safety-best-practices

**Performance:**
- Web Vitals: https://web.dev/vitals/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- Performance Budget Calculator: https://perf-budget-calculator.firebaseapp.com/

**Monitoring:**
- Sentry: https://sentry.io/
- Better Uptime: https://betteruptime.com/
- Google Search Console: https://search.google.com/search-console

---

**Version:** 1.0.0
**Last Updated:** January 24, 2026
