# Deal Scoring Implementation Guide

## Overview

This document provides implementation details for The Hub's deal scoring algorithm based on price research findings.

---

## Core Scoring Formula

```python
def calculate_deal_score(listing, category):
    """
    Calculate a 0-100 deal score for a listing.
    
    Args:
        listing: dict with price, condition, source, posted_at, description
        category: "watch", "sneaker", or "car"
    
    Returns:
        int: 0-100 score (higher = better deal)
    """
    
    # 1. Get market value
    market_value = get_market_value(listing['item_id'], category)
    
    # 2. Calculate base score (price vs market)
    price_diff = (market_value - listing['price']) / market_value
    base_score = price_diff * 100
    
    # Cap at 100 (extreme deals may be scams)
    base_score = min(100, max(0, base_score))
    
    # 3. Apply modifiers
    modifier = 0
    
    # Category-specific modifiers
    modifier += get_category_modifiers(listing, category)
    
    # Timing bonus
    modifier += get_timing_bonus(listing['posted_at'])
    
    # Condition bonus
    modifier += get_condition_bonus(listing['condition'], listing['description'])
    
    # Brand multiplier
    brand_mult = get_brand_multiplier(listing['brand'], category)
    
    # Seasonal adjustment
    seasonal = get_seasonal_factor(category)
    
    # 4. Final calculation
    final_score = (base_score + modifier) * brand_mult * seasonal
    
    return min(100, max(0, int(final_score)))
```

---

## Component Functions

### Market Value Lookup

```python
def get_market_value(item_id, category):
    """
    Look up market value from price database.
    Returns average of market_low and market_high.
    """
    if category == "watch":
        data = watch_prices[item_id]
        return (data['market_low'] + data['market_high']) / 2
    
    elif category == "sneaker":
        data = sneaker_prices[item_id]
        return (data['market_low'] + data['market_high']) / 2
    
    elif category == "car":
        # Use 3-year used prices as baseline
        data = car_prices[item_id]
        used = data['used_3_4yr']
        return (used['low'] + used['high']) / 2
    
    return None
```

### Category Modifiers

```python
def get_category_modifiers(listing, category):
    modifier = 0
    
    if category == "watch":
        if listing.get('from_ad'):
            modifier += 10  # Authorized Dealer
        if listing.get('box_papers'):
            modifier += 5
        if not listing.get('service_history') and listing.get('age_years', 0) > 5:
            modifier -= 10
    
    elif category == "sneaker":
        if listing.get('condition') == 'DS':
            modifier += 10  # Deadstock
        if listing.get('og_all'):
            modifier += 5   # Original box, laces, etc
        if listing.get('condition') == 'worn':
            modifier -= 15
        modifier -= listing.get('flaws', 0) * 5
    
    elif category == "car":
        if listing.get('cpo'):
            modifier += 10  # Certified Pre-Owned
        if listing.get('one_owner'):
            modifier += 5
        modifier -= listing.get('accidents', 0) * 10
        if listing.get('rebuilt_title'):
            modifier -= 30
    
    return modifier
```

### Timing Bonus

```python
def get_timing_bonus(posted_at):
    """Fresh listings get a bonus - first to see = first to buy."""
    hours_old = (datetime.now() - posted_at).total_seconds() / 3600
    
    if hours_old < 24:
        return 5
    elif hours_old < 48:
        return 3
    else:
        return 0
```

### Condition Scoring

```python
CONDITION_KEYWORDS = {
    'mint': 5,
    'bnib': 5,
    'ds': 5,
    'deadstock': 5,
    'new': 5,
    'like new': 3,
    'excellent': 3,
    'vnds': 3,
    'good': 0,
    'used': 0,
    'fair': -5,
    'beater': -5,
    'needs work': -10,
}

def get_condition_bonus(condition, description):
    """Parse condition from listing text."""
    text = f"{condition} {description}".lower()
    
    for keyword, bonus in CONDITION_KEYWORDS.items():
        if keyword in text:
            return bonus
    
    return 0
```

### Brand Multipliers

```python
BRAND_MULTIPLIERS = {
    "watch": {
        "Rolex": 1.1,    # Fast liquidity
        "Omega": 1.0,
        "Tudor": 1.0,
        "Cartier": 0.95,
        "AP": 0.9,       # Longer hold
        "Patek": 0.9,
    },
    "sneaker": {
        "Jordan": 1.05,
        "Nike": 1.0,
        "Nike SB": 1.0,
        "Yeezy": 0.9,    # Volatile
        "New Balance": 0.95,
    },
    "car": {
        "Toyota": 1.1,   # Best retention
        "Lexus": 1.1,
        "Honda": 1.05,
        "Porsche": 1.05,
        "German Luxury": 0.9,
        "Tesla": 0.8,    # High depreciation
    }
}

def get_brand_multiplier(brand, category):
    return BRAND_MULTIPLIERS.get(category, {}).get(brand, 1.0)
```

### Seasonal Factors

```python
def get_seasonal_factor(category):
    """Adjust score based on time of year."""
    month = datetime.now().month
    
    factors = {
        "watch": {1: 0.95, 2: 0.95, 9: 1.05, 10: 1.05, 11: 1.05, 12: 1.10},
        "sneaker": {6: 0.95, 7: 0.95, 8: 1.05, 11: 1.10, 12: 1.10},
        "car": {1: 1.05, 2: 1.05, 10: 0.95, 11: 0.95, 12: 0.90}
    }
    
    return factors.get(category, {}).get(month, 1.0)
```

---

## Red Flag Detection

```python
RED_FLAG_THRESHOLDS = {
    "watch": 0.30,   # >30% below market = suspicious
    "sneaker": 0.40, # >40% below market = suspicious
    "car": 0.25,     # >25% below market = suspicious
}

RED_FLAG_KEYWORDS = [
    'replica', 'rep', 'ua', 'unauthorized',
    'rebuilt title', 'salvage', 'flood damage',
    'no returns', 'as is', 'for parts',
    'contact me off platform', 'western union', 'wire transfer'
]

def detect_red_flags(listing, category, market_value):
    flags = []
    
    # Price-based
    discount = (market_value - listing['price']) / market_value
    threshold = RED_FLAG_THRESHOLDS.get(category, 0.30)
    
    if discount > threshold:
        flags.append(f"Price {discount:.0%} below market - potential scam")
    
    # Keyword-based
    text = f"{listing.get('title', '')} {listing.get('description', '')}".lower()
    for keyword in RED_FLAG_KEYWORDS:
        if keyword in text:
            flags.append(f"Red flag keyword: '{keyword}'")
    
    # Category-specific
    if category == "watch":
        if listing['price'] > 5000 and not listing.get('box_papers'):
            flags.append("Expensive watch without box/papers")
    
    elif category == "sneaker":
        if listing.get('multiple_sizes'):
            flags.append("Multiple sizes available - possible rep operation")
    
    elif category == "car":
        if listing.get('odometer_discrepancy'):
            flags.append("Odometer discrepancy detected")
    
    return flags
```

---

## Score Interpretation

| Score | Label | Action |
|-------|-------|--------|
| 80-100 | 🔥 Exceptional | Alert immediately, act fast |
| 60-79 | ✅ Good Deal | Worth considering |
| 40-59 | ➖ Fair | At market, not special |
| 20-39 | ⚠️ Overpriced | Below market, skip |
| 0-19 | ❌ Bad Deal | Way overpriced or suspicious |

---

## Alert Thresholds

Configure alerts when listings meet these criteria:

```python
ALERT_CRITERIA = {
    "immediate_alert": {
        "min_score": 75,
        "max_red_flags": 0,
        "max_hours_old": 4
    },
    "daily_digest": {
        "min_score": 60,
        "max_red_flags": 1,
        "max_hours_old": 24
    },
    "weekly_roundup": {
        "min_score": 50,
        "max_red_flags": 2,
        "max_hours_old": 168
    }
}
```

---

## Integration with The Hub

### Recommended Workflow

1. **Scrape listings** from configured sources (Reddit, eBay, FB, etc.)
2. **Normalize data** to standard schema
3. **Match to price database** (fuzzy match model names)
4. **Calculate deal score** using this algorithm
5. **Flag red flags** for review
6. **Filter by user preferences** (categories, brands, price range)
7. **Deliver alerts** via configured channels

### Database Schema Suggestion

```sql
CREATE TABLE deals (
    id UUID PRIMARY KEY,
    source VARCHAR(50),           -- reddit, ebay, fb, etc
    source_id VARCHAR(255),       -- original post/listing ID
    category VARCHAR(20),         -- watch, sneaker, car
    item_name VARCHAR(255),
    brand VARCHAR(100),
    price DECIMAL(10,2),
    market_value DECIMAL(10,2),
    deal_score INT,
    condition VARCHAR(50),
    posted_at TIMESTAMP,
    scraped_at TIMESTAMP,
    url TEXT,
    image_urls TEXT[],
    description TEXT,
    red_flags TEXT[],
    alerted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deals_score ON deals(deal_score DESC);
CREATE INDEX idx_deals_category ON deals(category);
CREATE INDEX idx_deals_posted ON deals(posted_at DESC);
```

---

## Next Steps

1. **Implement fuzzy matching** for item identification
2. **Build price update pipeline** (monthly refresh from market sources)
3. **Add user feedback loop** (did the deal work out? refine scoring)
4. **Track historical accuracy** of deal scores vs actual sale prices
