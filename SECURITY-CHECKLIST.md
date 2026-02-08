# 🔒 The Hub - Security Checklist

Pre-launch security verification for production deployment.

---

## 🎯 Critical Security Items

These MUST be completed before going live:

### 1. No Secrets in Git ✅

**Check:**
```bash
# From project root:
cd /Users/sydneyjackson/the-hub

# Check git history for .env files
git log --all --full-history --oneline -- '*.env'

# Should return empty or only .env.example entries
```

**Verify:**
```bash
# Check .gitignore includes .env
cat .gitignore | grep .env

# Should show:
# .env
# .env.local
# .env.production
```

**If secrets were committed:**
```bash
# Remove from git history (DANGEROUS - backup first!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Or use BFG Repo-Cleaner (safer):
# https://rtyley.github.io/bfg-repo-cleaner/
```

---

### 2. Strong JWT Secrets ✅

**Check Railway environment variables:**
- `JWT_SECRET` - Should be 32+ random characters
- `JWT_REFRESH_SECRET` - Should be different from JWT_SECRET

**Generate new secrets:**
```bash
# Generate a strong random secret:
openssl rand -base64 32
# Output example: X7k9mPqR2vZ8nLwA3yF6tC1dH4jM5sE0

# Generate another (different) one:
openssl rand -base64 32
# Output example: B2gH7nK3sP9mQ4wT1vY8aF5lD6jC0rE2
```

**Update in Railway:**
1. Go to Railway → Variables
2. Update `JWT_SECRET` with first generated value
3. Update `JWT_REFRESH_SECRET` with second generated value
4. Railway will auto-redeploy

---

### 3. HTTPS Enforced ✅

**Railway (Automatic):**
- Railway automatically provides HTTPS
- HTTP requests are auto-redirected to HTTPS
- SSL certificates are auto-provisioned

**Vercel (Automatic):**
- Vercel automatically provides HTTPS
- HTTP requests are auto-redirected to HTTPS
- SSL certificates are auto-provisioned

**Verify:**
```bash
# Test backend (should show 301 redirect)
curl -I http://your-app.up.railway.app

# Test frontend (should show 301 redirect)
curl -I http://your-app.vercel.app
```

---

### 4. CORS Properly Configured ✅

**Backend CORS Settings:**

The backend (`src/api/server.js`) should have:
```javascript
const allowedOrigins = [
  'https://your-app.vercel.app',
  'https://your-custom-domain.com', // if using custom domain
  /\.vercel\.app$/ // allows all vercel preview deployments
];
```

**Check:**
1. Open `src/api/server.js`
2. Find the `allowedOrigins` array
3. Ensure it includes your Vercel domain
4. Ensure it does NOT include `'*'` (wildcard)

**Test CORS:**
```bash
# Should succeed (from your frontend domain)
curl -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://your-app.up.railway.app/api/watches

# Should fail (from random domain)
curl -H "Origin: https://evil-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://your-app.up.railway.app/api/watches
```

---

### 5. Stripe Webhook Signature Verification ✅

**Check backend code:**
```javascript
// In src/api/webhooks.js:
const sig = req.headers['stripe-signature'];
event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Verify:**
1. Open `/Users/sydneyjackson/the-hub/src/api/webhooks.js`
2. Confirm signature verification is present
3. Ensure it happens BEFORE processing event
4. Check error handling exists

**Test webhook:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Click "Send test webhook"
4. Check Railway logs for verification message

---

### 6. Supabase RLS Policies ✅

**Row Level Security must be enabled for:**
- `users` - Users can only access their own data
- `user_profiles` - Users can only access their own profile
- `subscriptions` - Users can only see their own subscription
- `watches` - Users can only see their own watchlist
- `alerts` - Users can only see their own alerts

**Check in Supabase:**
```sql
-- See which tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Verify policies:**
```sql
-- See all policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Test (as authenticated user):**
```sql
-- Should only return YOUR data
SELECT * FROM subscriptions;
SELECT * FROM user_profiles;

-- Should return ALL data (public)
SELECT * FROM watch_listings LIMIT 10;
```

---

### 7. Rate Limiting Enabled ✅

**Backend already includes rate limiting:**
```javascript
// In src/api/server.js:
const rateLimit = require('express-rate-limit');

// Applied to all routes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

**Verify:**
```bash
# Send 110 requests rapidly
for i in {1..110}; do
  curl https://your-app.up.railway.app/health
done

# Should see "Too Many Requests" after 100
```

**Configure in Railway (optional):**
```bash
# Add to environment variables:
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # per window
```

---

### 8. SQL Injection Protection ✅

**Backend uses parameterized queries:**
```javascript
// Good (parameterized):
const { data } = await supabase
  .from('watches')
  .select('*')
  .eq('id', userId); // Safe

// Bad (vulnerable):
const query = `SELECT * FROM watches WHERE id = '${userId}'`; // DON'T DO THIS
```

**Verify:**
1. Search codebase for raw SQL strings
2. Ensure all use Supabase client methods (safe by default)
3. No string concatenation in queries

**Test:**
```bash
# Try SQL injection in API request
curl -X POST https://your-app.up.railway.app/api/watches \
  -H "Content-Type: application/json" \
  -d '{"brand":"Rolex'; DROP TABLE watches;--"}'

# Should be safely escaped, not execute SQL
```

---

### 9. XSS Protection ✅

**Frontend already includes:**
- React automatically escapes output (prevents XSS)
- DOMPurify for sanitizing HTML content
- Content Security Policy headers

**Verify DOMPurify is used:**
```bash
# Check if DOMPurify is in dependencies
cd /Users/sydneyjackson/the-hub
grep -r "dompurify" package.json
```

**Test:**
```javascript
// In browser console on your site:
document.body.innerHTML = '<script>alert("XSS")</script>';

// Should NOT execute the script (React prevents it)
```

---

### 10. Environment Variables Secured ✅

**Railway Variables:**
- Never logged or exposed publicly
- Encrypted at rest
- Only accessible to your service

**Vercel Variables:**
- Never logged or exposed publicly
- Encrypted at rest
- Only accessible to your frontend

**Verify:**
```bash
# Check Railway logs - should NOT show secrets
# Go to Railway → Deployments → View Logs
# Search for "STRIPE_SECRET" or "JWT_SECRET"
# Should NOT appear in logs

# Check Vercel build logs
# Should NOT show environment variable values
```

**Double-check `.gitignore`:**
```bash
# Should ignore all env files:
cat .gitignore | grep .env

# Expected:
# .env
# .env.local
# .env.production
# .env.*.local
```

---

## 🔐 Additional Security Measures

### 11. Password Hashing ✅

**Supabase handles this automatically** when using auth system.

If using custom auth:
```javascript
const bcrypt = require('bcrypt');

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const match = await bcrypt.compare(password, hash);
```

**Check:** Backend should never store plain-text passwords.

---

### 12. Session Management ✅

**JWT Tokens:**
- Expire after 24 hours (configurable via `JWT_EXPIRES_IN`)
- Refresh tokens expire after 7 days
- Stored in httpOnly cookies (not localStorage - more secure)

**Verify cookie settings:**
```javascript
// In auth code:
res.cookie('token', jwt, {
  httpOnly: true,  // ✅ Prevents JavaScript access
  secure: true,    // ✅ HTTPS only
  sameSite: 'strict' // ✅ CSRF protection
});
```

---

### 13. API Authentication ✅

**Protected endpoints require JWT:**
```javascript
// In middleware:
const authMiddleware = require('./middleware/auth');

// Apply to protected routes:
app.get('/api/user/profile', authMiddleware, handler);
```

**Test:**
```bash
# Without token (should fail)
curl https://your-app.up.railway.app/api/user/profile

# With token (should succeed)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.up.railway.app/api/user/profile
```

---

### 14. File Upload Security ✅

**If using file uploads:**
- Validate file types (whitelist, not blacklist)
- Limit file sizes (`MAX_FILE_SIZE` env var)
- Scan for malware (if possible)
- Store in S3/CDN, not on server

**Check environment variables:**
```bash
MAX_FILE_SIZE=10485760  # 10 MB
```

---

### 15. Dependency Security ✅

**Check for vulnerable dependencies:**
```bash
cd /Users/sydneyjackson/the-hub

# Check for security issues
npm audit

# Fix automatically
npm audit fix

# Update dependencies
npm update
```

**Set up automated checks:**
- Enable Dependabot on GitHub (automatically creates PRs for security updates)
- Or use Snyk: https://snyk.io/

---

### 16. Error Messages Don't Leak Info ✅

**Production errors should be generic:**
```javascript
// Good:
res.status(500).json({ error: 'Internal server error' });

// Bad (leaks info):
res.status(500).json({ 
  error: 'Database connection failed at line 42 in users.js',
  details: err.stack 
});
```

**Check:** Railway logs should have detailed errors, but API responses should not.

---

### 17. Logging & Monitoring ✅

**What to log:**
- ✅ Failed authentication attempts
- ✅ Stripe webhook events
- ✅ API errors (in Railway, not to user)
- ✅ Database errors
- ❌ Passwords or secrets
- ❌ Full credit card numbers
- ❌ JWT tokens

**Check Railway logs:**
1. Go to Railway → Deployments → Logs
2. Should see structured logs
3. Should NOT see secrets or sensitive data

---

### 18. GDPR Compliance (If applicable) ✅

If serving EU users:
- [ ] Privacy policy exists
- [ ] Cookie consent banner (if using cookies)
- [ ] User can delete their account
- [ ] User can export their data
- [ ] Data retention policy defined

**Add user data export:**
```javascript
// API endpoint for GDPR data export
app.get('/api/user/export', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  // Export all user data
  const data = {
    profile: await getUserProfile(userId),
    subscriptions: await getUserSubscriptions(userId),
    watches: await getUserWatches(userId),
    // ... etc
  };
  
  res.json(data);
});
```

---

### 19. Content Security Policy (CSP) ✅

**Add CSP headers (optional but recommended):**
```javascript
// In src/api/server.js:
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.stripe.com https://*.supabase.co"
  );
  next();
});
```

---

### 20. Regular Security Audits ✅

**Set recurring tasks:**
- [ ] Monthly: Run `npm audit`
- [ ] Monthly: Review Railway/Vercel logs for suspicious activity
- [ ] Quarterly: Review and rotate API keys
- [ ] Quarterly: Review user permissions and RLS policies
- [ ] Yearly: Full security audit

---

## 🚨 Security Incident Response Plan

### If You Suspect a Breach:

1. **Immediately:**
   - Disable affected API keys
   - Check Railway logs for suspicious activity
   - Check Supabase logs for unauthorized access

2. **Within 1 Hour:**
   - Rotate all secrets (JWT, Stripe, API keys)
   - Force logout all users (invalidate all JWTs)
   - Review access logs

3. **Within 24 Hours:**
   - Notify affected users (if required by law)
   - Document what happened
   - Fix the vulnerability
   - Deploy fix

4. **Within 1 Week:**
   - Full security audit
   - Update security practices
   - Train team on new procedures

---

## ✅ Pre-Launch Security Checklist

Before going live, verify ALL of these:

### Code Security
- [ ] No secrets in git history
- [ ] `.env` files in `.gitignore`
- [ ] All dependencies up to date (`npm update`)
- [ ] No `npm audit` vulnerabilities
- [ ] Error messages don't leak sensitive info

### Infrastructure Security
- [ ] HTTPS enabled (automatic with Railway/Vercel)
- [ ] Custom domains use HTTPS (if applicable)
- [ ] SSL certificates valid and not expiring soon
- [ ] Railway and Vercel environment variables secured

### API Security
- [ ] JWT secrets are strong and unique
- [ ] CORS restricted to frontend domain only
- [ ] Rate limiting enabled
- [ ] Protected routes require authentication
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (React + DOMPurify)

### Stripe Security
- [ ] Webhook signature verification enabled
- [ ] Using test keys initially (switch to live when ready)
- [ ] Webhook endpoint uses HTTPS
- [ ] Failed webhooks are logged

### Database Security
- [ ] Supabase RLS policies enabled
- [ ] Users can only access their own data
- [ ] Public data is clearly defined
- [ ] No direct database credentials in code
- [ ] Backups enabled (automatic with Supabase)

### Authentication Security
- [ ] Passwords hashed (Supabase handles this)
- [ ] JWT tokens expire (24h default)
- [ ] Refresh tokens expire (7d default)
- [ ] Session cookies are httpOnly and secure

### Monitoring & Logging
- [ ] Error logging enabled (Railway logs)
- [ ] Failed login attempts logged
- [ ] Stripe webhook events logged
- [ ] No sensitive data in logs

---

## 📞 Resources

**Security Tools:**
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Check for vulnerabilities
- [Snyk](https://snyk.io/) - Continuous security monitoring
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Common web vulnerabilities
- [Security Headers](https://securityheaders.com/) - Check your security headers

**Documentation:**
- [Railway Security](https://docs.railway.app/reference/security)
- [Vercel Security](https://vercel.com/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Stripe Security](https://stripe.com/docs/security)

---

**Last Updated:** 2026-02-08
**Next Review:** 2026-03-08 (monthly)
