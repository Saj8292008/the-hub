# The Hub - Product Roadmap & Feature Planning
> Last Updated: February 5, 2026 | Feature Builder Agent

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Feature Backlog (Prioritized)](#feature-backlog)
3. [Top 5 Feature Specs](#top-5-feature-specs)
4. [Quick Wins (<1 Day)](#quick-wins)
5. [30/60/90 Day Roadmap](#roadmap)
6. [Monetization Features](#monetization-features)
7. [Growth Features](#growth-features)

---

## Executive Summary

The Hub is positioned as the **only cross-category luxury asset tracking platform** covering watches, sneakers, and collectible cars. Our competitive advantage is the unified experience - no competitor offers all three categories with AI-powered deal scoring.

### Current State
- ✅ Core tracking for watches, sneakers, cars
- ✅ AI-powered blog and deal scoring
- ✅ Natural language search
- ✅ Premium subscription system (Stripe)
- ✅ Price alerts and notifications
- ⚠️ Limited real-time updates
- ⚠️ No social/sharing features
- ⚠️ No mobile app/PWA

### North Star Metrics
- **Active Users:** Target 10,000 MAU by Q2 2026
- **Premium Conversion:** Target 5% free → premium
- **Retention:** Target 70% M1 retention
- **Revenue:** Target $10,000 MRR by Q3 2026

---

## Feature Backlog

### Priority Legend
- 🔴 **P0 - Critical:** Ship ASAP, blocks growth
- 🟡 **P1 - High:** Next sprint priority
- 🟢 **P2 - Medium:** Important but not urgent
- 🔵 **P3 - Low:** Nice to have

---

### User-Requested Features

| Priority | Feature | Description | Effort | Impact |
|----------|---------|-------------|--------|--------|
| 🔴 P0 | **Real-Time Price Updates** | WebSocket-based live dashboard updates | 3 days | High |
| 🔴 P0 | **Mobile-Responsive PWA** | Installable app with push notifications | 5 days | High |
| 🔴 P0 | **Portfolio Value History** | Track collection value over time with charts | 2 days | High |
| 🟡 P1 | **Percentage-Based Alerts** | "Alert me when price drops 10%" | 2 days | Medium |
| 🟡 P1 | **Export to CSV/Excel** | Download portfolio data | 1 day | Medium |
| 🟡 P1 | **Dark/Light Theme Toggle** | User preference for theme | 1 day | Medium |
| 🟢 P2 | **Keyboard Shortcuts** | Power user navigation (j/k, g+d, etc.) | 1 day | Low |
| 🟢 P2 | **Custom Watchlist Groups** | Organize items into folders/collections | 2 days | Medium |
| 🟢 P2 | **Price History Export** | Download historical price data | 1 day | Low |
| 🔵 P3 | **Multiple Currencies** | EUR, GBP, JPY support | 2 days | Low |

---

### Competitive Gap Features

| Priority | Feature | Description | Gap Filled | Effort |
|----------|---------|-------------|------------|--------|
| 🔴 P0 | **Cross-Platform Price Comparison** | Same item across StockX, Chrono24, eBay | No competitor does this | 5 days |
| 🔴 P0 | **Below-Market Deal Alerts** | Alert when item lists under market value | WatchCharts lacks this | 3 days |
| 🟡 P1 | **Arbitrage Detector** | Find price differences across platforms | Unique feature | 4 days |
| 🟡 P1 | **Investment Analytics Dashboard** | ROI, appreciation predictions, hold/sell recommendations | WatchCharts is basic | 5 days |
| 🟡 P1 | **Seller Reputation Aggregator** | Pull seller reviews from multiple platforms | Trust gap everywhere | 5 days |
| 🟢 P2 | **Authentication Confidence Scoring** | AI-powered authenticity probability | No one does this | 7 days |
| 🟢 P2 | **Pre-Purchase Inspection Integration** | Partner with inspection services | BaT doesn't offer | 10 days |
| 🔵 P3 | **Community Expert Badges** | Verify knowledgeable collectors | Weak on all platforms | 5 days |

---

### Growth Features (Virality & Acquisition)

| Priority | Feature | Description | Growth Lever | Effort |
|----------|---------|-------------|--------------|--------|
| 🔴 P0 | **Referral Program** | Give $5, get $5 credit toward premium | Viral loop | 3 days |
| 🔴 P0 | **Public Collection Pages** | Shareable portfolio URLs | SEO + Social | 2 days |
| 🟡 P1 | **Social Media Sharing** | "Just scored this deal" cards for Twitter/IG | Viral content | 2 days |
| 🟡 P1 | **Embeddable Widgets** | Price chart widgets for blogs/forums | Backlinks | 3 days |
| 🟡 P1 | **Email Digest Newsletter** | Weekly market updates + top deals | Retention | 2 days |
| 🟢 P2 | **Discord Bot Integration** | Price checks in Discord servers | Community | 3 days |
| 🟢 P2 | **Leaderboard - Top Collectors** | Gamification of portfolio value | Engagement | 2 days |
| 🔵 P3 | **Yearly Wrapped** | "Your 2026 Collection Wrapped" like Spotify | Viral annual | 3 days |

---

### Monetization Features

| Priority | Feature | Description | Revenue Model | Effort |
|----------|---------|-------------|---------------|--------|
| 🔴 P0 | **Affiliate Link Integration** | Buy buttons with affiliate tracking | Commission | 5 days |
| 🔴 P0 | **Premium Feature Gating Polish** | Better upgrade prompts, usage indicators | Subscription | 2 days |
| 🟡 P1 | **Annual Plan Discount** | 20% off yearly vs monthly | Higher LTV | 1 day |
| 🟡 P1 | **Team/Business Plan** | Multi-user for dealers | B2B revenue | 5 days |
| 🟢 P2 | **API Access (Pro Tier)** | Developer API for power users | $99/mo tier | 7 days |
| 🟢 P2 | **Sponsored Listings** | Dealers pay for visibility | Advertising | 5 days |
| 🔵 P3 | **Authentication Partnership Revenue** | Rev-share with auth services | Commission | External |

---

## Top 5 Feature Specs

### Spec #1: Real-Time Dashboard with WebSockets

**User Story:**
> As a collector, I want to see price updates live without refreshing the page, so I can react quickly to market changes.

**Requirements:**
- [ ] WebSocket server (Socket.io) integrated with Express backend
- [ ] Real-time price update broadcasts when scrapers find new data
- [ ] Visual indicator showing "Live" status in dashboard header
- [ ] Subtle animation when prices change (green flash for up, red for down)
- [ ] Reconnection logic with exponential backoff
- [ ] Fallback to polling if WebSocket fails
- [ ] "Last updated" timestamp per item

**UI Mockup (Text):**
```
┌─────────────────────────────────────────────────────────────┐
│  📊 My Portfolio                    🟢 Live • Updated 2s ago │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Rolex Sub      │  │ Jordan 1 Chi   │  │ 911 GT3        │ │
│  │ $12,450 ▲ 2.1% │  │ $380 ▼ 1.5%   │  │ $215,000       │ │
│  │ [flash green]  │  │ [flash red]    │  │ [no change]    │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                              │
│  Connection: 🟢 Connected | Reconnecting in 3s... (on fail) │
└─────────────────────────────────────────────────────────────┘
```

**Technical Approach:**
1. Add Socket.io to backend (`npm install socket.io`)
2. Create `src/realtime/socketServer.js` - initialize Socket.io
3. Modify scrapers to emit events: `io.emit('priceUpdate', { itemId, newPrice, change })`
4. Frontend: Create `useRealTimeUpdates()` hook
5. Connect on dashboard mount, disconnect on unmount
6. Update React state on socket events

**Acceptance Criteria:**
- [ ] Dashboard shows live connection status
- [ ] Price changes appear within 2 seconds of server update
- [ ] Visual animation on price change
- [ ] Graceful degradation on connection loss
- [ ] Mobile-friendly (works on cellular connections)

**Estimated Effort:** 3 days
**Dependencies:** None
**Risks:** High-frequency updates could overwhelm mobile devices → implement throttling

---

### Spec #2: Referral Program

**User Story:**
> As a user, I want to invite friends and earn credits toward premium, so I can save money and share something useful.

**Requirements:**
- [ ] Unique referral code per user (e.g., `SYDNEY-HUB23`)
- [ ] Referral link: `thehub.io/r/SYDNEY-HUB23`
- [ ] Dashboard showing: referrals sent, signed up, converted
- [ ] $5 credit per referral who signs up (both parties)
- [ ] Credits apply to premium subscription
- [ ] Social sharing buttons (Twitter, WhatsApp, copy link)
- [ ] Leaderboard of top referrers (optional, gamification)

**UI Mockup (Text):**
```
┌─────────────────────────────────────────────────────────────┐
│  🎁 Invite Friends, Earn Rewards                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Your Referral Link:                                        │
│  ┌─────────────────────────────────────────┬──────────────┐ │
│  │ thehub.io/r/SYDNEY-HUB23                │  📋 Copy     │ │
│  └─────────────────────────────────────────┴──────────────┘ │
│                                                              │
│  [🐦 Share on Twitter]  [📱 WhatsApp]  [✉️ Email]           │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  Your Stats:                                                │
│  • Links Clicked: 23                                        │
│  • Friends Signed Up: 8                                     │
│  • Credits Earned: $40 💰                                   │
│                                                              │
│  Your Credit Balance: $15.00                                │
│  [Apply to Premium Subscription]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Technical Approach:**
1. Add `referral_code` and `referred_by` columns to users table
2. Create `referral_credits` table to track earned credits
3. Backend: `POST /api/referrals/track` - track referral signups
4. Modify signup flow to accept `?ref=CODE` parameter
5. Apply credits at Stripe checkout via `discounts` parameter
6. Frontend: New Referrals.tsx page, share buttons

**Database Schema:**
```sql
ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN referral_credits_cents INT DEFAULT 0;

CREATE TABLE referral_events (
  id UUID PRIMARY KEY,
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  event_type VARCHAR(20), -- 'signup', 'premium_convert'
  credits_awarded_cents INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Acceptance Criteria:**
- [ ] User can see and copy their unique referral link
- [ ] Referred user sees "Invited by [name]" on signup
- [ ] Both parties receive $5 credit upon signup
- [ ] Credits automatically apply to next premium payment
- [ ] Analytics track funnel: clicks → signups → conversions

**Estimated Effort:** 3 days
**Dependencies:** Stripe integration (exists)
**Risks:** Fraud/abuse → implement: 1 credit per IP, email verification required

---

### Spec #3: Cross-Platform Price Comparison

**User Story:**
> As a collector, I want to see the same item's price across multiple platforms, so I can find the best deal without manually checking each site.

**Requirements:**
- [ ] For each item, show prices from 3-5 sources
- [ ] Watches: Chrono24, eBay, WatchCharts, Crown & Caliber
- [ ] Sneakers: StockX, GOAT, eBay, Flight Club
- [ ] Cars: BaT, Cars & Bids, Hemmings, AutoTrader
- [ ] Visual comparison with "lowest price" highlight
- [ ] Direct links to listings (affiliate where possible)
- [ ] "Price spread" indicator (max - min)
- [ ] Historical comparison chart

**UI Mockup (Text):**
```
┌─────────────────────────────────────────────────────────────┐
│  Rolex Submariner 126610LN                                  │
│  Price Comparison Across Platforms                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Platform        Price       vs Market    Link              │
│  ─────────────────────────────────────────────────────────  │
│  🏆 eBay         $11,200     -8.2%        [View →]          │
│     Chrono24     $11,850     -2.9%        [View →]          │
│     Crown&Cal    $12,100     -0.8%        [View →]          │
│     WatchCharts  $12,200     (Market)     [View →]          │
│                                                              │
│  💰 Potential Savings: $1,000 (8.2%)                        │
│     Price Spread: $1,000 across 4 sources                   │
│                                                              │
│  [📊 View Price History Chart]                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Technical Approach:**
1. Extend scraper framework to support multiple sources per item
2. Create `price_sources` table to store multi-platform prices
3. Normalize item identification (model numbers, SKUs)
4. Backend: `GET /api/items/:id/compare` returns all sources
5. Frontend: Comparison table component with sorting
6. Add affiliate link generation per source
7. Cache comparisons (15-min TTL to reduce scraping load)

**Acceptance Criteria:**
- [ ] Each item shows prices from 3+ platforms
- [ ] Lowest price is visually highlighted
- [ ] Links go directly to listings
- [ ] Affiliate tracking works on supported platforms
- [ ] Data refreshes at least daily

**Estimated Effort:** 5 days
**Dependencies:** Scraper framework (exists), affiliate accounts (needed)
**Risks:** Scraping blocked → implement proxy rotation, fallback sources

---

### Spec #4: Mobile PWA with Push Notifications

**User Story:**
> As a mobile user, I want to install The Hub on my phone and receive push notifications for deals, so I never miss an opportunity.

**Requirements:**
- [ ] PWA manifest with app icon and splash screen
- [ ] Service worker for offline support
- [ ] Add-to-homescreen prompt
- [ ] Push notifications for:
  - Price alerts triggered
  - Below-market deals found
  - Daily digest (optional)
- [ ] Mobile-optimized navigation (bottom nav bar)
- [ ] Touch-friendly interactions
- [ ] Works offline (shows cached data)

**UI Mockup (Text):**
```
Mobile View (375px):
┌───────────────────────────────────┐
│ ≡  The Hub              🔔 👤    │
├───────────────────────────────────┤
│                                   │
│  Total Portfolio Value            │
│  $48,230  ▲ 2.3%                 │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 🔥 Hot Deal!               │ │
│  │ Rolex Sub @ $11,200        │ │
│  │ 8% below market            │ │
│  │ [View Deal →]              │ │
│  └─────────────────────────────┘ │
│                                   │
│  Recent Activity                  │
│  • Jordan 1 price dropped 5%     │
│  • New deal scored 92/100        │
│                                   │
├───────────────────────────────────┤
│  🏠   📊   🔔   ⚙️   👤         │
│ Home  Deals Alerts Settings Me   │
└───────────────────────────────────┘

Push Notification:
┌───────────────────────────────────┐
│ 🔔 The Hub                        │
│ Price Alert: Rolex Submariner     │
│ Now $11,200 (-8.2% from target)   │
│ Tap to view →                     │
└───────────────────────────────────┘
```

**Technical Approach:**
1. Create `public/manifest.json` with PWA config
2. Create `public/sw.js` service worker (Workbox)
3. Backend: Web Push API integration
4. Store push subscriptions in database
5. Frontend: Request notification permission flow
6. Trigger notifications from alert system
7. Mobile-specific CSS breakpoints and touch handlers

**Acceptance Criteria:**
- [ ] App installable on iOS and Android
- [ ] Push notifications arrive within 30 seconds of trigger
- [ ] App works offline (shows cached portfolio)
- [ ] Mobile navigation is thumb-friendly
- [ ] Lighthouse PWA score > 90

**Estimated Effort:** 5 days
**Dependencies:** HTTPS (required for push)
**Risks:** iOS Safari push support is limited → fallback to email

---

### Spec #5: Affiliate Integration System

**User Story:**
> As a business, we want to earn commission when users click through to buy items, so we can generate revenue to sustain the platform.

**Requirements:**
- [ ] Affiliate accounts with: Amazon, Chrono24, StockX, eBay, BaT
- [ ] Automatic affiliate link generation
- [ ] Click tracking and analytics
- [ ] Commission dashboard for internal tracking
- [ ] A/B testing for button placement
- [ ] Legal: FTC disclosure compliance
- [ ] "Buy Now" buttons on item detail pages

**UI Mockup (Text):**
```
Item Detail Page:
┌─────────────────────────────────────────────────────────────┐
│  Rolex Submariner Date 126610LN                             │
│  Current Market Price: $12,200                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Best Available Prices:                                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🏆 eBay - $11,200                                    │  │
│  │ 8.2% below market • Excellent seller (99.8%)        │  │
│  │ [🛒 Buy Now on eBay]                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Chrono24 - $11,850                                   │  │
│  │ Trusted Checkout available                           │  │
│  │ [🛒 View on Chrono24]                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ℹ️ We may earn commission from purchases made through     │
│     these links at no extra cost to you.                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Admin Dashboard:
┌─────────────────────────────────────────────────────────────┐
│  💰 Affiliate Revenue Dashboard                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  This Month: $2,340 (est. commission)                       │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 58% of $4,000 goal                  │
│                                                              │
│  By Platform:                                               │
│  • Chrono24:  $1,200 (48 clicks, 3 sales)                  │
│  • eBay:      $680   (124 clicks, 12 sales)                │
│  • StockX:    $460   (89 clicks, 8 sales)                  │
│                                                              │
│  Top Converting Items:                                      │
│  1. Rolex Submariner - 15% CTR                             │
│  2. Jordan 1 Retro - 12% CTR                               │
│  3. Omega Speedmaster - 11% CTR                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Technical Approach:**
1. Create affiliate accounts (Chrono24 Partner, eBay Partner Network, Amazon Associates)
2. Build `src/services/affiliateLinks.js` - link generation per platform
3. Database: `affiliate_clicks` table for tracking
4. Middleware to inject affiliate parameters into outbound links
5. Admin dashboard to view click/conversion data
6. Add disclosure footer per FTC requirements

**Acceptance Criteria:**
- [ ] All "Buy" links include affiliate tracking
- [ ] Clicks are logged with: item, platform, user, timestamp
- [ ] Admin can view revenue estimates
- [ ] FTC disclosure visible on all pages with affiliate links
- [ ] A/B test shows lift from button placement

**Estimated Effort:** 5 days
**Dependencies:** Affiliate account approvals (1-2 weeks)
**Risks:** Account rejection → apply early, have backups

---

## Quick Wins

Features that can be built in **< 1 day** with high impact:

### UI/UX Improvements

| Feature | Effort | Impact | How |
|---------|--------|--------|-----|
| **"Last updated" timestamps** | 2 hrs | Trust | Add timestamp to each price card |
| **Loading skeletons** | 3 hrs | Polish | Replace spinners with skeleton loaders |
| **Empty state illustrations** | 2 hrs | Onboarding | Custom graphics for empty watchlists |
| **Keyboard shortcuts** | 4 hrs | Power users | j/k navigation, / to search |
| **Dark mode toggle** | 4 hrs | User pref | Already dark, add light option |
| **Copy item link** | 1 hr | Sharing | "Copy link" button on item cards |

### Bug Fixes That Matter

| Issue | Effort | Impact | Notes |
|-------|--------|--------|-------|
| **Mobile header overlap** | 2 hrs | Mobile UX | Header covers content on scroll |
| **Alert timezone display** | 2 hrs | Accuracy | Show times in user's timezone |
| **Search debouncing** | 1 hr | Performance | Prevent API spam while typing |
| **Form validation messages** | 2 hrs | UX | Better error messages on signup |
| **404 page design** | 2 hrs | Polish | Custom 404 instead of blank |

### Quick Growth Wins

| Feature | Effort | Impact | How |
|---------|--------|--------|-----|
| **Social meta tags** | 2 hrs | SEO/Share | OG tags for rich link previews |
| **Sitemap generation** | 2 hrs | SEO | Dynamic sitemap for blog + items |
| **Email capture popup** | 3 hrs | Leads | Exit-intent popup for newsletter |
| **Testimonials section** | 2 hrs | Trust | Add to landing page |
| **Intercom/chat widget** | 1 hr | Support | Quick customer support |

### Data & Analytics

| Feature | Effort | Impact | How |
|---------|--------|--------|-----|
| **Event tracking setup** | 3 hrs | Insights | Track key actions (signup, add item) |
| **Funnel visualization** | 4 hrs | Conversion | Signup → active → premium funnel |
| **Error monitoring** | 2 hrs | Stability | Sentry integration |
| **Uptime monitoring** | 1 hr | Reliability | UptimeRobot or Better Uptime |

---

## 30/60/90 Day Roadmap

### Days 1-30: Foundation & Quick Wins 🏗️

**Theme:** Ship fast, fix bugs, establish habits

**Week 1 (Days 1-7)**
- [ ] Deploy all quick wins from above list
- [ ] Fix mobile header overlap bug
- [ ] Add social meta tags (OG, Twitter cards)
- [ ] Set up error monitoring (Sentry)
- [ ] Implement loading skeletons

**Week 2 (Days 8-14)**
- [ ] **Real-Time Updates** (Spec #1) - WebSocket foundation
- [ ] Add "Last updated" timestamps
- [ ] Improve alert timezone handling
- [ ] Set up analytics tracking (PostHog or Plausible)

**Week 3 (Days 15-21)**
- [ ] **Referral Program** (Spec #2) - MVP launch
- [ ] Referral page UI
- [ ] Database schema for referrals
- [ ] Integration with Stripe credits

**Week 4 (Days 22-30)**
- [ ] **Public Collection Pages** - shareable portfolio URLs
- [ ] SEO optimization for collection pages
- [ ] Social sharing buttons
- [ ] Launch referral program to existing users

**Milestone:** Real-time updates live, referral program launched, 10% increase in signups

---

### Days 31-60: Growth & Monetization 📈

**Theme:** Drive revenue, expand features, build virality

**Week 5 (Days 31-37)**
- [ ] **Cross-Platform Price Comparison** (Spec #3) - Phase 1
- [ ] Add 2-3 sources per category
- [ ] Price comparison UI component
- [ ] "Best price" highlighting

**Week 6 (Days 38-44)**
- [ ] **Affiliate Integration** (Spec #5) - Launch
- [ ] Apply for affiliate programs (start week 1!)
- [ ] Build affiliate link system
- [ ] Add "Buy Now" buttons

**Week 7 (Days 45-51)**
- [ ] **PWA + Push Notifications** (Spec #4) - Phase 1
- [ ] PWA manifest and service worker
- [ ] Add-to-homescreen prompt
- [ ] Mobile navigation improvements

**Week 8 (Days 52-60)**
- [ ] Push notification system
- [ ] Notification preferences UI
- [ ] Below-market deal alerts
- [ ] A/B test affiliate button placement

**Milestone:** First affiliate revenue, PWA installable, push notifications live

---

### Days 61-90: Scale & Differentiate 🚀

**Theme:** Build moat, increase retention, premium features

**Week 9 (Days 61-67)**
- [ ] **Investment Analytics Dashboard**
- [ ] ROI calculation per item
- [ ] Portfolio performance over time
- [ ] "Hold vs Sell" recommendations

**Week 10 (Days 68-74)**
- [ ] **Below-Market Deal Finder**
- [ ] Proactive deal scoring + alerts
- [ ] "Hot Deals" feed on dashboard
- [ ] Deal score explanations

**Week 11 (Days 75-81)**
- [ ] **Arbitrage Detection**
- [ ] Cross-platform price discrepancies
- [ ] "Buy here, sell there" suggestions
- [ ] Premium-only feature

**Week 12 (Days 82-90)**
- [ ] **Seller Reputation Aggregator**
- [ ] Pull reviews from multiple platforms
- [ ] Trust score per seller
- [ ] Polish and bug fixes
- [ ] Prepare for Product Hunt launch

**Milestone:** $5,000+ MRR, 5,000+ users, ready for Product Hunt

---

## Monetization Features

### Current Revenue Streams
1. **Premium Subscription** - $9.99/mo or $99/yr
   - Unlimited tracked items
   - Unlimited alerts
   - Advanced analytics

### Planned Revenue Streams

| Feature | Revenue Model | Target Launch | Est. Monthly |
|---------|--------------|---------------|--------------|
| **Affiliate Commissions** | 5-10% commission | Day 45 | $2,000-5,000 |
| **Annual Plan Upsell** | Higher LTV | Day 30 | +20% revenue |
| **Pro Tier ($29/mo)** | API access, priority | Day 90 | $1,000-2,000 |
| **Team/Dealer Plan** | $99/mo multi-user | Day 90+ | $2,000-5,000 |
| **Sponsored Listings** | Dealer ads | Day 120+ | $1,000-3,000 |

### Revenue Projections

| Month | Users | Premium % | MRR (Sub) | Affiliate | Total |
|-------|-------|-----------|-----------|-----------|-------|
| Month 1 | 1,000 | 3% | $300 | $0 | $300 |
| Month 2 | 2,500 | 4% | $1,000 | $500 | $1,500 |
| Month 3 | 5,000 | 5% | $2,500 | $2,000 | $4,500 |
| Month 6 | 10,000 | 6% | $6,000 | $4,000 | $10,000 |

---

## Growth Features

### Viral Loops

1. **Referral Program**
   - Give $5 / Get $5
   - Track: invites sent → signups → conversions

2. **Public Collections**
   - Shareable portfolio pages
   - SEO-optimized for "watch collection" etc.

3. **Social Sharing**
   - "I just scored this deal" cards
   - Price drop announcements
   - Collection milestones

4. **Embeddable Widgets**
   - Price charts for forums/blogs
   - "Powered by The Hub" branding

### Retention Hooks

1. **Daily/Weekly Digest**
   - Portfolio value changes
   - Top deals in your watchlist
   - Market news

2. **Streak/Gamification**
   - "Checked in 7 days straight!"
   - Collector badges
   - Achievement system

3. **Push Notifications**
   - Price alerts
   - Deal recommendations
   - Re-engagement nudges

### Acquisition Channels

| Channel | Strategy | Priority |
|---------|----------|----------|
| **SEO** | Blog content, collection pages | High |
| **Product Hunt** | Launch at Day 90 | High |
| **Reddit** | r/Watches, r/Sneakers, r/cars | High |
| **Twitter/X** | Market updates, deal alerts | Medium |
| **YouTube** | "How I track my collection" | Medium |
| **Influencers** | Watch/sneaker reviewers | Low (later) |

---

## Appendix: Feature Prioritization Framework

**Score each feature 1-5:**
- **Reach:** How many users does this affect?
- **Impact:** How much does it improve their experience?
- **Confidence:** How sure are we this will work?
- **Effort:** How long will it take? (inverse: 5 = quick)

**RICE Score = (Reach × Impact × Confidence) / Effort**

| Feature | Reach | Impact | Conf | Effort | RICE |
|---------|-------|--------|------|--------|------|
| Real-Time Updates | 5 | 4 | 5 | 3 | 33 |
| Referral Program | 4 | 4 | 4 | 3 | 21 |
| Cross-Platform Compare | 5 | 5 | 4 | 2 | 50 |
| PWA + Push | 4 | 5 | 4 | 2 | 40 |
| Affiliate Integration | 2 | 5 | 5 | 2 | 25 |

---

*Document maintained by Feature Builder Agent*
*Next review: Weekly*
*Questions? Ping in main agent session*
