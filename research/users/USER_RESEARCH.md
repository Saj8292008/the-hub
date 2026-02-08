# The Hub - User Research Report

*Last Updated: February 2026*  
*Research conducted via Reddit analysis, competitor reviews, and market patterns*

---

## Executive Summary

The reselling and deal-tracking space is crowded but fractured. Users are spread across multiple tools (Slickdeals, Honey, CamelCamelCamel, inventory spreadsheets) with no unified solution. **The biggest opportunity is integration** — connecting deal discovery, price tracking, inventory management, and profit calculation in one platform.

---

## 1. User Research Findings

### 1.1 Reddit Community Analysis

**Communities Analyzed:**
- r/Flipping (466k+ members) — General reselling
- r/sneakermarket — Sneaker reselling
- r/reselling (83k+ members) — Multi-category reselling
- r/deals — Deal hunting general

### 1.2 Top Pain Points (by frequency)

| Pain Point | Frequency | Severity |
|------------|-----------|----------|
| **Inventory tracking is manual/painful** | Very High | Critical |
| **No unified profit/loss tracking** | High | High |
| **Deal alerts are too slow or spammy** | High | Medium |
| **Cross-platform price comparison is tedious** | High | High |
| **Fear of scams/bad buyers** | Medium | High |
| **Platform fees eat into margins** | Medium | Medium |
| **Missing restocks on hot items** | Medium | Critical (for sneakers) |

### 1.3 What Users Are Actually Saying

**From r/Flipping:**
> "I use spreadsheets for everything but they're getting out of control. 500+ items and I can't find anything."

> "The worst part isn't finding deals — it's tracking what I paid, what I listed for, and calculating profit after fees."

> "I got burned because eBay fees changed and I didn't update my pricing. Lost money on 20 items."

**From r/reselling:**
> "Every tool wants a subscription. I'm not paying $30/month when I'm just starting out."

> "I need something that works across eBay, Poshmark, Mercari, AND Facebook Marketplace."

**From r/sneakermarket:**
> "By the time I see a deal on Slickdeals, it's already dead. I need instant alerts."

> "Price tracking for sneakers is terrible. StockX prices change by the minute."

### 1.4 Competitor Complaints

**Slickdeals:**
- Too much noise, hard to filter relevant deals
- Community-driven = deals already dead by time they're posted
- Mobile app is clunky
- No integration with purchase tracking

**Honey (PayPal):**
- Only works at checkout (too late for resellers)
- Doesn't track historical pricing well
- Privacy concerns after PayPal acquisition
- No inventory management

**CamelCamelCamel:**
- Amazon only
- No mobile app
- Interface feels dated
- Just price tracking, no ecosystem

**Keepa:**
- Learning curve is steep
- Data overload without actionable insights
- Expensive for full features

### 1.5 Feature Requests (from forums)

1. **Instant deal alerts** — Push notifications, not email
2. **Multi-platform price comparison** — One search, all platforms
3. **Inventory + profit tracker** — Know your actual margins
4. **Fee calculators** — Built-in for eBay, Amazon, StockX, etc.
5. **Barcode scanning** — Instant lookup at thrift stores
6. **Historical pricing** — See if a "deal" is actually good
7. **Community verification** — Is this deal legit?
8. **Mobile-first** — Most sourcing happens on phones

---

## 2. User Personas

### 2.1 The Reseller (Marcus, 28)

**Demographics:**
- Age: 25-35
- Location: Suburban/Urban US
- Income: $40-80k (reselling is side hustle or main income)
- Tech: iPhone, uses 5+ apps daily

**Goals:**
- Turn $500/week profit flipping items
- Scale from side hustle to full-time
- Find underpriced items before others

**Frustrations:**
- Spends 2+ hours/day searching deals manually
- Lost track of inventory; items sitting unsold
- Platform fees constantly changing
- Can't calculate true profit easily

**Quote:**
> "I have items in 3 storage bins, listed on 4 platforms, tracked in 2 spreadsheets. It's chaos."

**What They Need:**
- ✅ Instant deal alerts by category
- ✅ Inventory management with photos
- ✅ Multi-platform listing tracker
- ✅ Automatic fee calculations
- ✅ Profit/loss dashboard

**Willingness to Pay:** $15-30/month for a tool that saves 5+ hours/week

---

### 2.2 The Collector (Jamie, 34)

**Demographics:**
- Age: 28-45
- Location: Any
- Income: $60-120k
- Tech: Mixed, not always tech-savvy

**Goals:**
- Complete their collection (sneakers, cards, vinyl, etc.)
- Find rare items at fair prices
- Never miss a restock or drop

**Frustrations:**
- Missed restocks because alerts came late
- Overpaid because didn't know historical prices
- Got scammed by fake listings
- FOMO is real

**Quote:**
> "I've been hunting for this Jordan 4 for 6 months. I just need ONE alert to work."

**What They Need:**
- ✅ Lightning-fast restock alerts
- ✅ Historical price charts
- ✅ Authentication/legitimacy scoring
- ✅ Wishlist management
- ✅ Price drop notifications

**Willingness to Pay:** $10-20/month for peace of mind on grails

---

### 2.3 The Bargain Hunter (Sarah, 42)

**Demographics:**
- Age: 35-55
- Location: Suburban US
- Income: $50-100k household
- Tech: Moderate — uses apps but not early adopter

**Goals:**
- Never pay full price for anything
- Save money on household purchases
- Feel smart about purchasing decisions

**Frustrations:**
- Too many deal sites to check
- Coupon codes that don't work
- Deals expire before she can use them
- Overwhelmed by options

**Quote:**
> "I just want to know if this is a good price or if I should wait."

**What They Need:**
- ✅ Simple "is this a good deal?" indicator
- ✅ Price history (simple, not charts)
- ✅ Curated deals in her categories
- ✅ Working coupon codes
- ✅ Email digest, not constant notifications

**Willingness to Pay:** $5/month or ad-supported free tier

---

### 2.4 The Dealer (Tony, 45)

**Demographics:**
- Age: 35-55
- Location: Has physical store or warehouse
- Income: $100-300k (business)
- Tech: Uses whatever works, values reliability

**Goals:**
- Source inventory efficiently
- Track hundreds/thousands of SKUs
- Maintain healthy margins
- Grow the business

**Frustrations:**
- No good B2B deal discovery
- Inventory software is either too simple or enterprise-level expensive
- Need accountant-friendly reporting
- Current tools don't scale

**Quote:**
> "I process 200 items a week. I need software that handles volume, not hobby-level tools."

**What They Need:**
- ✅ Bulk operations (import/export)
- ✅ Integration with accounting software
- ✅ Employee accounts with permissions
- ✅ API access for custom workflows
- ✅ Wholesale/liquidation deal alerts

**Willingness to Pay:** $50-200/month for business-critical tools

---

## 3. User Journey Maps

### 3.1 The Reseller Journey

```
DISCOVERY                    ONBOARDING                     ACTIVATION
    │                            │                              │
    ▼                            ▼                              ▼
┌─────────────┐          ┌──────────────┐          ┌──────────────────┐
│ Sees ad or  │          │ Signs up     │          │ Sets up first    │
│ Reddit post │───────►  │ (email/      │───────►  │ alert or imports │
│ about Hub   │          │ Google SSO)  │          │ inventory        │
└─────────────┘          └──────────────┘          └──────────────────┘
                                                            │
                              RETENTION ◄───────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │ First deal alert hits →     │
                    │ Makes a purchase →          │
                    │ Tracks in inventory →       │
                    │ Sees profit dashboard       │
                    └─────────────────────────────┘
                                  │
                                  ▼
                              EXPANSION
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │ Hits free tier limits →     │
                    │ Sees value in premium →     │
                    │ Upgrades to Pro             │
                    └─────────────────────────────┘
```

**Key Moments:**
1. **First deal alert that works** — Makes or breaks retention
2. **First tracked sale** — Seeing profit calculated = "aha moment"
3. **First month summary** — Understanding total profit drives upgrades

### 3.2 The Collector Journey

```
DISCOVERY                    ONBOARDING                     ACTIVATION
    │                            │                              │
    ▼                            ▼                              ▼
┌─────────────┐          ┌──────────────┐          ┌──────────────────┐
│ Searches    │          │ Creates      │          │ Adds first       │
│ "price      │───────►  │ account,     │───────►  │ item to wishlist │
│ tracker X"  │          │ connects     │          │ or sets alert    │
└─────────────┘          │ platforms    │          └──────────────────┘
                         └──────────────┘                   │
                                                            ▼
                                                  ┌──────────────────┐
                                                  │ Waits...         │
                                                  │ (engagement risk)│
                                                  └──────────────────┘
                                                            │
                              RETENTION ◄───────────────────┘
                                  │ (alert hits!)
                                  ▼
                    ┌─────────────────────────────┐
                    │ Gets the item they wanted → │
                    │ Emotional high →            │
                    │ Adds more to wishlist       │
                    └─────────────────────────────┘
```

**Key Challenge:** Long wait times between signup and first alert. Need engagement hooks:
- Daily price updates on wishlist items
- "Similar items" suggestions
- Community activity feed

### 3.3 Upgrade Triggers

| Trigger | Conversion Rate | Persona |
|---------|-----------------|---------|
| Hit alert limit | High | Reseller |
| Need historical data | Medium | Collector |
| Want to remove ads | Low | Bargain Hunter |
| Need team features | High | Dealer |
| Export/API access | High | Dealer |

---

## 4. Interview Questions

### For Resellers:

1. Walk me through your typical day sourcing inventory.
2. What tools do you currently use? What's missing?
3. How do you track what you've bought and sold?
4. How do you decide if a deal is worth pursuing?
5. What's the most you've lost on a flip due to poor tracking?
6. If you could automate one part of your workflow, what would it be?
7. How much would you pay for a tool that saved you 5 hours a week?

### For Collectors:

1. What are you currently trying to find/collect?
2. How do you currently track prices on items you want?
3. Tell me about a time you missed a drop or restock.
4. How do you verify authenticity before purchasing?
5. What's the most you've overpaid because you didn't know the price history?
6. What would make you trust a deal alert tool?

### For Bargain Hunters:

1. How do you currently find deals?
2. What categories do you shop for most?
3. How do you decide if something is actually a good price?
4. What frustrates you about deal sites like Slickdeals?
5. Would you rather get fewer, better deals or more options?
6. Do you prefer email, push notifications, or checking an app?

### For Dealers:

1. How many SKUs do you manage?
2. What software do you currently use for inventory?
3. How do you source new inventory?
4. What integrations would save you the most time?
5. What reporting do you need for your accountant/taxes?
6. What would make you switch from your current system?

### Universal Questions:

1. On a scale of 1-10, how satisfied are you with your current deal-finding process?
2. What's the #1 thing you wish existed?
3. How did you hear about us / how do you typically find new tools?
4. What would make you recommend The Hub to a friend?
5. What would make you stop using The Hub?

---

## 5. Competitive Landscape Summary

| Competitor | Strength | Weakness | Opportunity for The Hub |
|------------|----------|----------|-------------------------|
| Slickdeals | Community, deals volume | Noise, no tracking | Curated + tracking |
| Honey | Easy checkout | No discovery | Full funnel |
| CamelCamelCamel | Price history | Amazon only | Multi-platform |
| Keepa | Data depth | Complexity | Simplicity + depth |
| Spreadsheets | Free, flexible | Manual, no alerts | Automate the spreadsheet |

---

## 6. Key Insights & Recommendations

### 🎯 Primary Insight
**Users don't want another deal site. They want a command center for their buying/selling operation.**

### Recommendations:

1. **Start with Resellers** — Highest willingness to pay, clearest pain points
2. **Nail deal alerts first** — Speed is the #1 differentiator
3. **Build inventory tracking second** — Creates lock-in and daily engagement
4. **Integrate fee calculators** — No one else does this well
5. **Mobile-first, always** — Sourcing happens on phones
6. **Freemium with clear limits** — Free tier for discovery, paid for power users

### MVP Feature Priority:

1. ⚡ Real-time deal alerts (push + in-app)
2. 📦 Basic inventory tracker
3. 📊 Profit calculator with fee integration
4. 📈 Price history charts
5. 🔍 Barcode scanner for in-store sourcing

---

## 7. Appendix: Data Sources

- Reddit r/Flipping (466,955 subscribers as of Feb 2026)
- Reddit r/reselling (83,031 subscribers)
- Reddit r/sneakermarket
- Reddit r/deals
- App store reviews for competitors
- Industry reports on recommerce market

---

*This document should be updated quarterly as we conduct more user interviews and gather product usage data.*
