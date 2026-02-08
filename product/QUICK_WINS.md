# Quick Wins - Ship in < 1 Day
> Low-effort, high-impact improvements

---

## ✅ Checklist Format
Copy and work through these. Check off as you complete.

---

## UI/UX Polish (Priority Order)

### Must-Do Today
- [ ] **"Last updated" timestamps** (2 hrs)
  - Add "Updated 5 min ago" to each price card
  - Shows data freshness, builds trust
  
- [ ] **Loading skeletons** (3 hrs)
  - Replace spinners with shimmer skeletons
  - Copy Airbnb/Facebook style
  - Files: Dashboard.tsx, Deals.tsx

- [ ] **Mobile header fix** (2 hrs)
  - Header overlaps content on scroll
  - Add proper sticky positioning
  - File: Layout.tsx or Header component

### This Week
- [ ] **Empty state illustrations** (2 hrs)
  - Custom graphics when watchlist is empty
  - "Add your first watch" CTA
  - Use undraw.co or illustrations.co

- [ ] **Copy item link button** (1 hr)
  - "📋 Copy link" on item cards
  - Toast confirmation: "Link copied!"

- [ ] **404 page design** (2 hrs)
  - Custom 404 instead of blank
  - Include search bar + popular links

---

## Bug Fixes

### Critical
- [ ] **Alert timezone display** (2 hrs)
  - Currently shows UTC
  - Convert to user's timezone
  - Use `Intl.DateTimeFormat` or date-fns

- [ ] **Search debouncing** (1 hr)
  - Currently fires on every keystroke
  - Add 300ms debounce
  - Reduces API calls significantly

### Important
- [ ] **Form validation messages** (2 hrs)
  - Better error messages on signup/login
  - "Email already exists" vs generic error
  - Inline validation before submit

- [ ] **Price formatting consistency** (1 hr)
  - Some show $12,450, some show $12450
  - Standardize with `Intl.NumberFormat`

---

## SEO & Growth

### Today
- [ ] **Social meta tags** (2 hrs)
  - Add Open Graph tags
  - Twitter Card tags
  - Rich previews when shared
  ```html
  <meta property="og:title" content="The Hub - Track Your Collection">
  <meta property="og:image" content="/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  ```

- [ ] **Sitemap generation** (2 hrs)
  - Dynamic sitemap.xml
  - Include blog posts + item pages
  - Submit to Google Search Console

### This Week
- [ ] **Email capture popup** (3 hrs)
  - Exit-intent or 30-second delay
  - "Get deal alerts in your inbox"
  - Connect to existing newsletter system

- [ ] **Testimonials section** (2 hrs)
  - Add to landing page
  - 3-4 fake but realistic quotes for now
  - Replace with real ones as you get them

---

## Analytics & Monitoring

### Must-Do
- [ ] **Sentry error tracking** (2 hrs)
  - `npm install @sentry/react @sentry/node`
  - Catch and alert on errors
  - Free tier is sufficient

- [ ] **Event tracking** (3 hrs)
  - Track: signup, add_item, create_alert, upgrade_premium
  - Use PostHog (free) or Plausible
  - Add to key user actions

### Nice to Have
- [ ] **Uptime monitoring** (1 hr)
  - UptimeRobot or Better Uptime
  - Alert when site goes down
  - Free tier available

- [ ] **Performance monitoring** (2 hrs)
  - Core Web Vitals tracking
  - Lighthouse CI in deployment
  - Track LCP, FID, CLS

---

## Code Quality

- [ ] **TypeScript strict mode** (4 hrs)
  - Enable in tsconfig.json
  - Fix type errors
  - Prevents bugs

- [ ] **ESLint + Prettier** (2 hrs)
  - Consistent code formatting
  - Auto-fix on save
  - Pre-commit hooks

- [ ] **Unit test coverage** (ongoing)
  - Start with critical paths
  - Auth, payments, price calculations

---

## Quick Copy-Paste Implementations

### Debounced Search Hook
```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage:
const debouncedSearch = useDebounce(searchQuery, 300);
useEffect(() => {
  if (debouncedSearch) fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

### Price Formatter
```typescript
// utils/formatters.ts
export const formatPrice = (price: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Usage: formatPrice(12450) => "$12,450"
```

### Relative Time
```typescript
// utils/time.ts
export const timeAgo = (date: Date | string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// Usage: timeAgo(item.updatedAt) => "5m ago"
```

### Copy to Clipboard
```typescript
// utils/clipboard.ts
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};
```

---

## Priority Matrix

| Task | Effort | Impact | Do When |
|------|--------|--------|---------|
| Social meta tags | 2 hrs | High | Today |
| Loading skeletons | 3 hrs | High | Today |
| Last updated timestamps | 2 hrs | High | Today |
| Search debouncing | 1 hr | Medium | Today |
| Mobile header fix | 2 hrs | High | Today |
| Sentry setup | 2 hrs | High | Tomorrow |
| Event tracking | 3 hrs | High | This week |
| Email popup | 3 hrs | Medium | This week |
| 404 page | 2 hrs | Low | When time |

---

## Definition of Done

A quick win is "done" when:
- [ ] Feature works on desktop AND mobile
- [ ] No console errors
- [ ] Tested in production environment
- [ ] Committed with clear message
- [ ] Deployed to production

---

*Tip: Pick 3-4 quick wins per day. Ship fast, iterate.*
