# 🐛 The Hub - Bug Report

**Generated:** 2026-02-06
**Audited by:** Bug Hunter Agent
**Site:** https://the-hub-psi.vercel.app

---

## Executive Summary

Found **8 bugs** across frontend, backend, and integrations:
- 🔴 **2 Critical** - Site functionality broken
- 🟠 **3 High** - Major features impacted
- 🟡 **2 Medium** - Functionality degraded
- 🟢 **1 Low** - Minor issue

---

## 🔴 Critical Issues

### BUG-001: CORS Blocking All API Requests in Production

**Severity:** 🔴 CRITICAL  
**Component:** Backend API (server.js)  
**Status:** Active - Breaking production

**Description:**
The production frontend at `https://the-hub-psi.vercel.app` cannot communicate with the backend at `https://the-hub-hedg.onrender.com` due to CORS misconfiguration. The backend only allows localhost origins.

**Error Message:**
```
Access to fetch at 'https://the-hub-hedg.onrender.com/api/auth/me' from origin 
'https://the-hub-psi.vercel.app' has been blocked by CORS policy: Response to 
preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' 
header is present on the requested resource.
```

**Affected Features:**
- ❌ Blog page (shows "No posts found")
- ❌ Watch listings (shows "No Watches Found")
- ❌ User authentication/login
- ❌ All data fetching from backend

**Steps to Reproduce:**
1. Visit https://the-hub-psi.vercel.app/blog
2. Open browser DevTools (F12)
3. See CORS errors in console
4. Page shows empty state

**Root Cause:**
```javascript
// src/api/server.js line 31-36
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5001'],
  // Missing: production URLs!
}));
```

**Fix Recommendation:**
```javascript
// src/api/server.js
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000', 
  'http://localhost:3001',
  'http://localhost:5001',
  'https://the-hub-psi.vercel.app',  // ADD THIS
  'https://thehub.deals',             // ADD THIS (if custom domain)
  process.env.FRONTEND_URL            // ADD THIS for flexibility
].filter(Boolean);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### BUG-002: Supabase DNS Resolution Failure (ENOTFOUND)

**Severity:** 🔴 CRITICAL  
**Component:** Database Connection  
**Status:** Active - All database operations failing

**Description:**
Backend cannot resolve Supabase hostname. This causes all scraping jobs and data operations to fail with `getaddrinfo ENOTFOUND`.

**Error Logs:**
```
Error: getaddrinfo ENOTFOUND sysvawxchniqelifyenl.supabase.co
  at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
```

**Impact:**
- ❌ Reddit scraping fails
- ❌ Price polling fails  
- ❌ Listing saves fail
- ❌ Deal alerts can't check database

**Possible Causes:**
1. Supabase project paused/deleted
2. Environment variable `SUPABASE_URL` has typo
3. Network/DNS issues on hosting platform

**Fix Recommendation:**
1. Verify Supabase project is active at https://supabase.com/dashboard
2. Check environment variable: `echo $SUPABASE_URL`
3. Test connection: `curl -I https://sysvawxchniqelifyenl.supabase.co`
4. If project paused, reactivate it
5. Consider adding connection retry/fallback logic

---

## 🟠 High Priority Issues

### BUG-003: Telegram Markdown Parse Errors

**Severity:** 🟠 HIGH  
**Component:** TelegramChannelPoster, DealAlertService  
**Status:** Active - Deal alerts failing to send

**Description:**
Telegram messages fail to send with "can't parse entities" errors. This is caused by special characters in listing titles/URLs breaking Markdown parsing.

**Error Logs:**
```
Error sending deal alert: ETELEGRAM: 400 Bad Request: can't parse entities: 
Can't find end of the entity starting at byte offset 396
```

**Root Cause:**
The code uses Markdown mode but doesn't escape special characters (`_`, `*`, `[`, `]`, etc.) in dynamic content.

**Affected Files:**
- `src/services/social/TelegramChannelPoster.js`
- `src/services/alerts/DealAlertService.js`

**Fix Recommendation:**
```javascript
// Add escape function
function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// In formatDealMessage():
formatDealMessage(deal) {
  const { listing, watchlistItem, savings, savingsPercent, score } = deal;
  
  // Escape user-generated content
  const title = escapeMarkdown(listing.title || `${listing.brand} ${listing.model}`);
  
  let msg = `${emoji} *DEAL ALERT* ${emoji}\n\n`;
  msg += `${sourceEmoji} *${title}*\n\n`;  // Now safe
  // ... rest
}

// OR: Switch to HTML parse_mode (more forgiving)
await this.bot.sendMessage(chatId, message, { 
  parse_mode: 'HTML',  // More tolerant of special chars
  disable_web_page_preview: false 
});
```

---

### BUG-004: Scraper Blocking (403 Forbidden)

**Severity:** 🟠 HIGH  
**Component:** Web Scrapers  
**Status:** Active - No price data being collected

**Description:**
All external scrapers (Chrono24, StockX, WatchUSeek) are being blocked with 403/404 errors.

**Error Logs:**
```
Chrono24 blocked request. Consider rotating user agents or using proxies.
Failed to update watch rolex-submariner: Request failed with status code 403
StockX blocked request. May need to rotate IPs or use proxies.
```

**Affected Sources:**
- ❌ Chrono24 - 403 Forbidden
- ❌ StockX - 403 Forbidden  
- ❌ WatchUSeek - 404 Not Found
- ❌ Bob's Watches - Parsing error

**Fix Recommendations:**
1. **Implement proxy rotation:**
```javascript
// src/services/scraping/proxyManager.js
const proxies = process.env.PROXY_LIST?.split(',') || [];
getRandomProxy() {
  return proxies[Math.floor(Math.random() * proxies.length)];
}
```

2. **Rotate user agents:**
```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  // Add more
];
```

3. **Add request delays and backoff**
4. **Consider headless browser (Puppeteer) for JS-rendered sites**

---

### BUG-005: Price Poller Data Validation Errors

**Severity:** 🟠 HIGH  
**Component:** Price Poller (schedulers/pricePoller.js)  
**Status:** Active

**Description:**
Price polling fails for seeded test data due to missing required fields.

**Error Logs:**
```
Failed to update car porsche-911: Make and model are required
Failed to update sneaker jordan-1-chicago: No search query provided
```

**Root Cause:**
Test/seed data in database lacks required fields for scraper APIs.

**Fix Recommendation:**
1. Add data validation before API calls:
```javascript
async pollCarPrices() {
  const cars = await this.getCars();
  for (const car of cars) {
    if (!car.make || !car.model) {
      logger.warn(`Skipping car ${car.id}: missing make/model`);
      continue;
    }
    // proceed with API call
  }
}
```

2. Update seed data with complete fields
3. Add database constraints for required fields

---

## 🟡 Medium Priority Issues

### BUG-006: Login Form Missing Autocomplete Attributes

**Severity:** 🟡 MEDIUM  
**Component:** Frontend (Login.tsx)  
**Status:** Active - Accessibility warning

**Description:**
Password field lacks `autocomplete="current-password"` attribute, causing browser warnings and degraded password manager support.

**Console Warning:**
```
[DOM] Input elements should have autocomplete attributes (suggested: "current-password")
```

**Fix Recommendation:**
```tsx
// src/pages/Login.tsx
<input
  type="password"
  placeholder="••••••••"
  autocomplete="current-password"  // ADD THIS
  {...register('password')}
/>
```

---

### BUG-007: RedditScraper Null Reference Error

**Severity:** 🟡 MEDIUM  
**Component:** RedditScraper.js  
**Status:** Intermittent

**Description:**
Reddit scraping occasionally fails with null reference error when API returns unexpected response.

**Error Log:**
```
❌ Failed to scrape reddit: Cannot read properties of null (reading 'sort')
```

**Root Cause:**
Missing null check when Reddit API returns unexpected response format.

**Fix Recommendation:**
```javascript
// src/services/scraping/sources/RedditScraper.js
async scrape(query, options = {}) {
  // Add defensive checks
  if (!response.data?.data?.children) {
    logger.warn('Reddit returned unexpected response format');
    return { listings: [], pagination: {} };
  }
  
  const posts = response.data.data.children;
  // Continue...
}
```

---

## 🟢 Low Priority Issues

### BUG-008: Hardcoded Telegram Channel Test ID

**Severity:** 🟢 LOW  
**Component:** Landing Page  
**Status:** Cosmetic

**Description:**
Landing page links to test Telegram channel `@hubtest123` instead of production channel `@TheHubDeals`.

**Location:**
- Line with `href="https://t.me/hubtest123"`

**Fix Recommendation:**
Update to production channel URL or use environment variable:
```tsx
const TELEGRAM_CHANNEL = process.env.VITE_TELEGRAM_CHANNEL || 'https://t.me/TheHubDeals';
```

---

## 📊 Summary Table

| ID | Bug | Severity | Component | Status |
|----|-----|----------|-----------|--------|
| BUG-001 | CORS blocking production | 🔴 Critical | server.js | Active |
| BUG-002 | Supabase DNS failure | 🔴 Critical | Database | Active |
| BUG-003 | Telegram parse errors | 🟠 High | Telegram bots | Active |
| BUG-004 | Scraper 403 blocks | 🟠 High | Scrapers | Active |
| BUG-005 | Price poller validation | 🟠 High | Price Poller | Active |
| BUG-006 | Missing autocomplete | 🟡 Medium | Login form | Active |
| BUG-007 | Reddit null reference | 🟡 Medium | RedditScraper | Intermittent |
| BUG-008 | Test Telegram link | 🟢 Low | Landing page | Active |

---

## 🔧 Priority Fix Order

1. **BUG-001** - CORS fix (5 minutes, unblocks entire frontend)
2. **BUG-002** - Supabase connection (verify env vars)
3. **BUG-003** - Telegram markdown escaping
4. **BUG-005** - Add data validation
5. **BUG-004** - Implement proxy rotation (larger effort)
6. **BUG-007** - Add null checks
7. **BUG-006** - Add autocomplete
8. **BUG-008** - Update Telegram link

---

## 📝 Notes

- **Frontend loads correctly** - Landing page, navigation, styling all work
- **WebSocket connection works** - Real-time features operational  
- **UI is responsive** - Tested on desktop viewport
- **No JavaScript runtime errors** on page load (only API failures)

---

*Report generated by Bug Hunter Agent*
