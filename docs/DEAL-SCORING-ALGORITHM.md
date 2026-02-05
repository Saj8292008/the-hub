# Deal Scoring Algorithm v2.0

**The Hub's intelligent deal scoring system for watches, sneakers, and cars.**

## Overview

The deal scoring algorithm evaluates listings on a 0-100 scale, with category-specific weights and thresholds to identify the best deals for buyers and resellers.

### Key Improvements in v2.0

- ✅ **Category-specific configurations** - Different weights for watches vs sneakers vs cars
- ✅ **Deal velocity scoring** - Fresh listings and price drops get priority
- ✅ **Brand/model demand** - Hot items like Rolex Daytona or Jordan 1s score higher
- ✅ **Profit potential estimation** - Helps resellers identify flip opportunities
- ✅ **Deal of the Day** - Automatic daily highlight of best deal per category
- ✅ **Lower, achievable thresholds** - Fixed the "everything scores 6-7" problem

---

## Scoring Components

Each listing is evaluated on 6 factors. Weights vary by category.

### 1. Price vs Market Average (25-35% weight)

Compares listing price against historical market data.

| Discount | Score |
|----------|-------|
| 35%+ below market | 100 |
| 30-35% below | 95 |
| 25-30% below | 90 |
| 20-25% below | 85 |
| 15-20% below | 78 |
| 10-15% below | 70 |
| 5-10% below | 62 |
| At market | 55 |
| 5% above | 45 |
| 10% above | 35 |
| 15% above | 25 |
| 20%+ above | 5 |

**Market data source:** 90-day rolling average of similar listings, with outlier trimming (15% from each end).

### 2. Condition Score (15-20% weight)

| Condition | Score |
|-----------|-------|
| New/BNIB/Deadstock | 100 |
| Unworn | 98 |
| Mint | 95 |
| Like New | 93 |
| Excellent | 90 |
| Near Mint | 85 |
| Very Good | 80 |
| Good | 65 |
| Used/Pre-owned | 55 |
| Fair | 50 |
| Worn | 40 |
| Poor | 20 |

### 3. Seller Reputation (10-15% weight)

Trust scores based on platform and seller details.

**Watches:**
| Platform | Base Score |
|----------|------------|
| Chrono24 | 95 |
| WatchBox | 90 |
| Hodinkee | 88 |
| WatchUSeek | 80 |
| Reddit r/watchexchange | 65 |
| eBay | 60 |
| Facebook | 55 |

**Sneakers:**
| Platform | Base Score |
|----------|------------|
| StockX | 90 |
| GOAT | 88 |
| eBay | 65 |
| Reddit | 60 |

**Cars:**
| Platform | Base Score |
|----------|------------|
| Bring a Trailer | 90 |
| Cars & Bids | 88 |
| CarGurus | 85 |
| AutoTrader | 80 |
| Carvana | 75 |
| Craigslist | 45 |

**Seller modifiers:**
- Verified/Top Rated: +10
- 100+ sales: +7
- Pro/Dealer: +5
- New seller: -10
- No returns: -5

### 4. Deal Velocity/Urgency (10-20% weight)

Rewards fresh listings and motivated sellers.

| Factor | Score Adjustment |
|--------|-----------------|
| Listed < 24 hours ago | +25 |
| Listed 1-3 days ago | +20 |
| Listed 3-7 days ago | +12 |
| Listed 1-2 weeks ago | +5 |
| Listed > 30 days ago | -10 |
| Listed > 60 days ago | -20 |
| Price dropped 20%+ | +20 |
| Price dropped 10%+ | +15 |
| Price dropped 5%+ | +8 |
| 1000+ views | +15 |
| 20+ watchers/inquiries | +15 |

### 5. Brand/Model Demand (10-15% weight)

Hot brands and models get bonus multipliers.

**Watch Brand Multipliers:**
| Brand | Multiplier |
|-------|------------|
| Patek Philippe | 1.6x |
| Rolex | 1.5x |
| Audemars Piguet | 1.5x |
| Vacheron Constantin | 1.4x |
| A. Lange & Söhne | 1.4x |
| Omega | 1.2x |
| Tudor | 1.2x |
| Grand Seiko | 1.15x |

**Hot Watch Models:**
| Model | Multiplier |
|-------|------------|
| Nautilus | 1.6x |
| Daytona | 1.5x |
| Submariner | 1.4x |
| Royal Oak | 1.4x |
| Aquanaut | 1.4x |
| GMT-Master | 1.3x |
| Speedmaster | 1.2x |

**Sneaker Demand:**
- Travis Scott collabs: 1.5x
- Off-White collabs: 1.4x
- Jordan 1: 1.4x
- Yeezy: 1.3x
- Dunk: 1.3x

### 6. Listing Quality (5-10% weight)

| Factor | Points |
|--------|--------|
| 10+ images | 50 |
| 6-9 images | 40 |
| 4-5 images | 30 |
| 2-3 images | 20 |
| 1 image | 10 |
| 500+ char description | 30 |
| 300+ char description | 24 |
| 150+ char description | 18 |
| Mentions box/papers | +5 |
| Mentions warranty | +5 |
| Mentions serial/ref | +5 |
| Includes year | +5 |

---

## Category Weights

| Factor | Watches | Sneakers | Cars |
|--------|---------|----------|------|
| Price | 30% | 35% | 35% |
| Condition | 15% | 15% | 20% |
| Seller | 15% | 10% | 15% |
| Velocity | 15% | 20% | 10% |
| Demand | 15% | 15% | 10% |
| Quality | 10% | 5% | 10% |

---

## Grade Thresholds

### Watches
| Grade | Score |
|-------|-------|
| 🔥 HOT DEAL | 82+ |
| ⭐ GREAT DEAL | 72-81 |
| 👍 GOOD DEAL | 62-71 |
| FAIR | 50-61 |
| BELOW MARKET | <50 |

### Sneakers
| Grade | Score |
|-------|-------|
| 🔥 HOT DEAL | 80+ |
| ⭐ GREAT DEAL | 70-79 |
| 👍 GOOD DEAL | 60-69 |
| FAIR | 45-59 |
| BELOW MARKET | <45 |

### Cars
| Grade | Score |
|-------|-------|
| 🔥 HOT DEAL | 78+ |
| ⭐ GREAT DEAL | 68-77 |
| 👍 GOOD DEAL | 58-67 |
| FAIR | 45-57 |
| BELOW MARKET | <45 |

---

## Profit Potential Estimation

For resellers, we calculate estimated profit potential:

```
Estimated Sale Price = Market Average × 0.97 (quick sale discount)
Platform Fee = Sale Price × 10%
Shipping = $30 (watches), $15 (sneakers), $500 (cars)

Net Profit = Sale Price - Listing Price - Platform Fee - Shipping
Profit % = (Net Profit / Listing Price) × 100
```

### Profit Recommendations

| Profit % | Recommendation |
|----------|----------------|
| 20%+ | 🔥 Strong flip opportunity |
| 10-20% | ✅ Good resale potential |
| 5-10% | ⚖️ Modest margin after fees |
| 0-5% | ⚠️ Thin margins - personal use only |
| <0% | ❌ Not recommended for resale |

---

## Deal of the Day

Automatically selected each day per category:

1. Query listings from last 48 hours with scores
2. Select highest-scoring listing
3. Generate reason summary (e.g., "25% below market • Fresh listing • High-demand")
4. Cache for 24 hours

### API Endpoint

```
GET /api/listings/deal-of-the-day?category=watch
```

Response:
```json
{
  "category": "watch",
  "found": true,
  "deal": {
    "listing": { ... },
    "score": 87,
    "grade": "🔥 HOT DEAL",
    "profitPotential": {
      "netProfit": 1250,
      "profitPercent": 18.5,
      "recommendation": "✅ Good resale potential"
    },
    "reason": "25% below market • Excellent condition • Highly trusted seller"
  }
}
```

---

## API Reference

### Score a Listing
```
POST /api/listings/score/:id
Body: { "category": "watch" }
```

### Score All Listings
```
POST /api/listings/score-all
Body: { "category": "watch", "limit": 100 }
```

### Get Hot Deals
```
GET /api/listings/hot-deals?category=watch&limit=10&minScore=70
```

### Get Deal of the Day
```
GET /api/listings/deal-of-the-day?category=watch
```

### Get Score Statistics
```
GET /api/listings/score-stats?category=watch
```

### Get/Update Configuration
```
GET /api/scoring/config
PUT /api/scoring/config/:category
Body: { "thresholds": { "hotDeal": 85 }, "weights": { "price": 35, ... } }
```

### Estimate Profit Potential
```
POST /api/listings/profit-estimate
Body: { "listingId": "123", "category": "watch" }
```

---

## Configuration

Weights and thresholds are configurable per category via the API or by editing `src/services/ai/dealScorer.js`.

Example: Making sneakers more price-sensitive:
```javascript
const config = dealScorer.getConfig('sneaker');
config.weights.price = 40;  // Was 35
config.weights.velocity = 15;  // Was 20 (rebalanced)
```

---

## Why v2.0 Works Better

### The Old Problem
The v1 algorithm had:
- Price score: 0-40 (often 20 with no data)
- Condition: 0-20 (often 10)
- Seller: 0-15 (often 7)
- Quality: 0-15 (often 5-8)
- Rarity: 0-10 (often 5)

**Typical score: 47-55** → Nothing ever hit "HOT DEAL" (90+)

### The v2 Solution
- All components now score 0-100
- Weighted average (not sum) normalizes the final score
- Lower thresholds: HOT DEAL at 82 instead of 90
- More granular scoring curves
- Better handling of missing data (neutral 50 instead of penalizing)
- Velocity scoring rewards fresh deals

**Typical good deal now scores 70-85** → HOT DEALs are achievable!

---

## Scheduler

The scoring scheduler runs hourly by default:

```javascript
// Start with custom interval (30 min) and categories
dealScoringScheduler.start(30 * 60 * 1000, ['watch', 'sneaker', 'car']);
```

### Manual Trigger
```
POST /api/deal-scoring/scheduler/run-now
```

### Status Check
```
GET /api/deal-scoring/scheduler/status
```

---

## Future Enhancements

- [ ] AI-powered demand scoring (currently heuristic-based)
- [ ] Real-time price alert webhooks
- [ ] Historical score tracking per listing
- [ ] Personalized deal recommendations based on user watch list
- [ ] Integration with more marketplaces (Mercari, Poshmark, etc.)
