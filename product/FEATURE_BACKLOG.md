# Feature Backlog - Prioritized
> Quick reference for what to build next

## Priority Legend
- 🔴 **P0** - Build NOW (blocks growth)
- 🟡 **P1** - Next sprint
- 🟢 **P2** - Important but not urgent
- 🔵 **P3** - Nice to have

---

## P0 - Critical (This Month)

| # | Feature | Category | Effort | Spec |
|---|---------|----------|--------|------|
| 1 | Real-Time Price Updates | Core | 3 days | ✅ Written |
| 2 | Mobile PWA + Push | Core | 5 days | ✅ Written |
| 3 | Portfolio Value History | Core | 2 days | - |
| 4 | Cross-Platform Price Compare | Competitive | 5 days | ✅ Written |
| 5 | Referral Program | Growth | 3 days | ✅ Written |
| 6 | Affiliate Integration | Revenue | 5 days | ✅ Written |
| 7 | Public Collection Pages | Growth | 2 days | - |
| 8 | Below-Market Deal Alerts | Competitive | 3 days | - |

---

## P1 - High Priority (Next 30-60 Days)

| # | Feature | Category | Effort |
|---|---------|----------|--------|
| 9 | Percentage-Based Alerts | User Request | 2 days |
| 10 | Export to CSV/Excel | User Request | 1 day |
| 11 | Dark/Light Theme Toggle | User Request | 1 day |
| 12 | Arbitrage Detector | Competitive | 4 days |
| 13 | Investment Analytics | Competitive | 5 days |
| 14 | Seller Reputation Aggregator | Competitive | 5 days |
| 15 | Social Media Sharing | Growth | 2 days |
| 16 | Embeddable Widgets | Growth | 3 days |
| 17 | Email Digest Newsletter | Retention | 2 days |
| 18 | Annual Plan Discount | Revenue | 1 day |
| 19 | Team/Business Plan | Revenue | 5 days |

---

## P2 - Medium Priority (60-90 Days)

| # | Feature | Category | Effort |
|---|---------|----------|--------|
| 20 | Keyboard Shortcuts | User Request | 1 day |
| 21 | Custom Watchlist Groups | User Request | 2 days |
| 22 | Price History Export | User Request | 1 day |
| 23 | Authentication Confidence | Competitive | 7 days |
| 24 | Pre-Purchase Inspection | Competitive | 10 days |
| 25 | Discord Bot Integration | Growth | 3 days |
| 26 | Leaderboard - Top Collectors | Growth | 2 days |
| 27 | API Access (Pro Tier) | Revenue | 7 days |
| 28 | Sponsored Listings | Revenue | 5 days |

---

## P3 - Low Priority (Backlog)

| # | Feature | Category | Effort |
|---|---------|----------|--------|
| 29 | Multiple Currencies | User Request | 2 days |
| 30 | Community Expert Badges | Competitive | 5 days |
| 31 | Yearly Wrapped | Growth | 3 days |
| 32 | Auth Partnership Revenue | Revenue | External |

---

## Quick Reference: What's Blocking What?

```
┌─────────────────┐
│ Affiliate Links │ ← Needs scraper URLs (exists) + affiliate accounts (apply NOW)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Revenue Growth  │ ← Can't scale without monetization
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Marketing Spend │ ← Need revenue to fund paid acquisition
└─────────────────┘

┌─────────────────┐
│ Referral System │ ← Needs user accounts (exists) + Stripe credits (exists)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Viral Growth    │ ← Can't grow virally without referrals
└─────────────────┘
```

---

## Dependencies Map

| Feature | Depends On |
|---------|------------|
| Real-Time Updates | Socket.io (add) |
| Push Notifications | PWA manifest, service worker |
| Affiliate Links | Affiliate accounts (external) |
| Referral Credits | Stripe integration (exists) |
| Cross-Platform Compare | Scraper framework (exists) |
| Public Collections | Auth system (exists) |

---

## Effort Estimates

| Effort | Days | Examples |
|--------|------|----------|
| XS | < 0.5 | Copy button, timestamps |
| S | 0.5-1 | Theme toggle, CSV export |
| M | 2-3 | Alerts, referrals, comparisons |
| L | 4-5 | PWA, affiliate system |
| XL | 7+ | API tier, inspection network |

---

*Updated: Feb 5, 2026*
