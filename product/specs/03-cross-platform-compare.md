# Feature Spec: Cross-Platform Price Comparison
> Priority: P0 | Effort: 5 days | Status: Planned

---

## User Story

> As a collector, I want to see the same item's price across multiple platforms, so I can find the best deal without manually checking each site.

---

## Problem Statement

Users currently check 3-5 different websites manually to find the best price. This is:
- Time-consuming (15-30 min per item)
- Easy to miss deals
- Frustrating UX
- No competitor offers cross-platform comparison

---

## Solution Overview

For each tracked item, show prices from multiple sources in a comparison view. Highlight the best deal and provide direct links (with affiliate tracking).

---

## Requirements

### Functional
- [ ] Show prices from 3-5 sources per item
- [ ] Watches: Chrono24, eBay, WatchCharts, Crown & Caliber, Jomashop
- [ ] Sneakers: StockX, GOAT, eBay, Flight Club
- [ ] Cars: BaT, Cars & Bids, Hemmings, AutoTrader
- [ ] Visual comparison with "lowest price" highlight
- [ ] Direct links to listings
- [ ] "Price spread" indicator (max - min)
- [ ] Affiliate link generation where available

### Non-Functional
- [ ] Prices updated at least daily
- [ ] Cache comparisons (15-min TTL)
- [ ] Graceful handling when source unavailable
- [ ] Mobile-responsive comparison view

---

## UI Design

### Item Detail - Price Comparison Section
```
┌─────────────────────────────────────────────────────────────┐
│  💰 Price Comparison                                        │
│  Rolex Submariner 126610LN • Updated 12 min ago            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Platform        Price       vs Market    Condition  Link   │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🏆 eBay         $11,200     ▼ 8.2%       Excellent  [→]   │
│     ├─ BEST PRICE                                           │
│     └─ Free shipping • 99.8% seller rating                 │
│                                                              │
│     Chrono24     $11,850     ▼ 2.9%       Mint       [→]   │
│     └─ Trusted Checkout available                          │
│                                                              │
│     Crown&Cal    $12,100     ▼ 0.8%       Like New   [→]   │
│     └─ 1-year warranty included                            │
│                                                              │
│     WatchCharts  $12,200     — Market     Reference  [→]   │
│     └─ Market average price                                │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  📊 Price Spread: $1,000 (8.2%) across 4 sources           │
│  💰 Potential Savings: $1,000 by buying on eBay            │
│                                                              │
│  [📈 View Price History]  [🔔 Set Price Alert]             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Compact Card View (Dashboard)
```
┌────────────────────────────────┐
│ Rolex Submariner 126610LN      │
│                                │
│ Market: $12,200                │
│ Best:   $11,200 on eBay ▼8.2% │
│                                │
│ [Compare Prices →]             │
└────────────────────────────────┘
```

---

## Technical Design

### Database Schema

```sql
-- Table to store multi-source prices
CREATE TABLE price_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL, -- 'watch', 'sneaker', 'car'
  source VARCHAR(50) NOT NULL, -- 'ebay', 'chrono24', 'stockx', etc.
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  condition VARCHAR(50), -- 'mint', 'excellent', 'good'
  listing_url TEXT,
  seller_rating DECIMAL(3,2),
  extra_info JSONB, -- shipping, warranty, etc.
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(item_id, item_type, source)
);

-- Index for efficient lookups
CREATE INDEX idx_price_sources_item ON price_sources(item_id, item_type);
CREATE INDEX idx_price_sources_source ON price_sources(source);
CREATE INDEX idx_price_sources_fetched ON price_sources(fetched_at);
```

### Source Configuration

```javascript
// src/config/priceSources.js
module.exports = {
  watches: [
    {
      id: 'chrono24',
      name: 'Chrono24',
      logo: '/logos/chrono24.svg',
      affiliateParam: '?partner=thehub',
      scrapeEnabled: true,
    },
    {
      id: 'ebay',
      name: 'eBay',
      logo: '/logos/ebay.svg',
      affiliateNetwork: 'ebay-partner-network',
      scrapeEnabled: true,
    },
    {
      id: 'watchcharts',
      name: 'WatchCharts',
      logo: '/logos/watchcharts.svg',
      isMarketReference: true,
      scrapeEnabled: true,
    },
    {
      id: 'crown-caliber',
      name: 'Crown & Caliber',
      logo: '/logos/crown-caliber.svg',
      affiliateParam: '?ref=thehub',
      scrapeEnabled: true,
    },
  ],
  sneakers: [
    {
      id: 'stockx',
      name: 'StockX',
      logo: '/logos/stockx.svg',
      scrapeEnabled: true,
    },
    {
      id: 'goat',
      name: 'GOAT',
      logo: '/logos/goat.svg',
      scrapeEnabled: true,
    },
    {
      id: 'ebay',
      name: 'eBay',
      logo: '/logos/ebay.svg',
      affiliateNetwork: 'ebay-partner-network',
      scrapeEnabled: true,
    },
    {
      id: 'flightclub',
      name: 'Flight Club',
      logo: '/logos/flightclub.svg',
      scrapeEnabled: true,
    },
  ],
  cars: [
    {
      id: 'bringatrailer',
      name: 'Bring a Trailer',
      logo: '/logos/bat.svg',
      scrapeEnabled: true,
    },
    {
      id: 'carsandbids',
      name: 'Cars & Bids',
      logo: '/logos/carsandbids.svg',
      scrapeEnabled: true,
    },
    {
      id: 'hemmings',
      name: 'Hemmings',
      logo: '/logos/hemmings.svg',
      scrapeEnabled: true,
    },
  ],
};
```

### Backend API

**New File: `src/api/compare.js`**
```javascript
const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');
const { generateAffiliateLink } = require('../services/affiliateLinks');
const priceSources = require('../config/priceSources');

// Get price comparison for an item
router.get('/:itemType/:itemId', async (req, res) => {
  const { itemType, itemId } = req.params;
  
  // Validate item type
  if (!['watch', 'sneaker', 'car'].includes(itemType)) {
    return res.status(400).json({ error: 'Invalid item type' });
  }
  
  // Fetch all price sources for this item
  const { data: prices, error } = await supabase
    .from('price_sources')
    .select('*')
    .eq('item_id', itemId)
    .eq('item_type', itemType)
    .order('price_cents', { ascending: true });
    
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
  
  if (!prices?.length) {
    return res.json({
      itemId,
      itemType,
      comparison: [],
      summary: { available: false }
    });
  }
  
  // Find market reference and calculate stats
  const marketRef = prices.find(p => 
    priceSources[itemType + 's']?.find(s => s.id === p.source)?.isMarketReference
  );
  const marketPrice = marketRef?.price_cents || prices[0]?.price_cents;
  
  const lowest = prices[0];
  const highest = prices[prices.length - 1];
  const spread = highest.price_cents - lowest.price_cents;
  const savings = marketPrice - lowest.price_cents;
  
  // Enrich with affiliate links and source metadata
  const enrichedPrices = prices.map(p => {
    const sourceConfig = priceSources[itemType + 's']?.find(s => s.id === p.source);
    return {
      ...p,
      price: p.price_cents / 100,
      vsMarket: ((p.price_cents - marketPrice) / marketPrice * 100).toFixed(1),
      isBestPrice: p.id === lowest.id,
      isMarketReference: sourceConfig?.isMarketReference || false,
      affiliateUrl: generateAffiliateLink(p.listing_url, p.source),
      sourceInfo: {
        name: sourceConfig?.name || p.source,
        logo: sourceConfig?.logo,
      }
    };
  });
  
  res.json({
    itemId,
    itemType,
    comparison: enrichedPrices,
    summary: {
      available: true,
      marketPrice: marketPrice / 100,
      lowestPrice: lowest.price_cents / 100,
      lowestSource: lowest.source,
      highestPrice: highest.price_cents / 100,
      priceSpread: spread / 100,
      priceSpreadPercent: (spread / marketPrice * 100).toFixed(1),
      potentialSavings: savings / 100,
      potentialSavingsPercent: (savings / marketPrice * 100).toFixed(1),
      sourcesChecked: prices.length,
      lastUpdated: prices[0]?.fetched_at,
    }
  });
});

// Force refresh prices for an item (premium feature)
router.post('/:itemType/:itemId/refresh', requireAuth, requirePremium, async (req, res) => {
  const { itemType, itemId } = req.params;
  
  // Queue refresh job
  await refreshQueue.add('refresh-prices', { itemType, itemId });
  
  res.json({ message: 'Price refresh queued', estimatedTime: '2-5 minutes' });
});

module.exports = router;
```

### Frontend Component

**New Component: `PriceComparison.tsx`**
```typescript
import { useState, useEffect } from 'react';
import { ExternalLink, TrendingDown, TrendingUp, Award } from 'lucide-react';

interface PriceSource {
  source: string;
  price: number;
  vsMarket: string;
  isBestPrice: boolean;
  isMarketReference: boolean;
  affiliateUrl: string;
  condition?: string;
  seller_rating?: number;
  extra_info?: {
    shipping?: string;
    warranty?: string;
  };
  sourceInfo: {
    name: string;
    logo?: string;
  };
}

interface ComparisonData {
  comparison: PriceSource[];
  summary: {
    marketPrice: number;
    lowestPrice: number;
    lowestSource: string;
    priceSpread: number;
    priceSpreadPercent: string;
    potentialSavings: number;
    potentialSavingsPercent: string;
    sourcesChecked: number;
    lastUpdated: string;
  };
}

export function PriceComparison({ itemId, itemType }: { itemId: string; itemType: string }) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparison();
  }, [itemId, itemType]);

  const fetchComparison = async () => {
    const res = await fetch(`/api/compare/${itemType}/${itemId}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  if (loading) return <PriceComparisonSkeleton />;
  if (!data?.summary?.available) return <NoPricesAvailable />;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        💰 Price Comparison
        <span className="text-sm font-normal text-gray-400">
          Updated {formatTimeAgo(data.summary.lastUpdated)}
        </span>
      </h3>

      {/* Price List */}
      <div className="space-y-3">
        {data.comparison.map((source, i) => (
          <PriceRow key={source.source} source={source} rank={i + 1} />
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 text-sm">Price Spread</span>
            <p className="text-lg font-semibold">
              ${data.summary.priceSpread.toLocaleString()} 
              <span className="text-sm text-gray-400">
                ({data.summary.priceSpreadPercent}%)
              </span>
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Potential Savings</span>
            <p className="text-lg font-semibold text-green-400">
              ${data.summary.potentialSavings.toLocaleString()}
              <span className="text-sm">
                ({data.summary.potentialSavingsPercent}%)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ source, rank }: { source: PriceSource; rank: number }) {
  const vsMarketNum = parseFloat(source.vsMarket);
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      source.isBestPrice ? 'bg-green-900/30 border border-green-500/50' : 'bg-gray-700/50'
    }`}>
      <div className="flex items-center gap-3">
        {source.isBestPrice && (
          <Award className="w-5 h-5 text-yellow-400" />
        )}
        <div>
          <p className="font-medium flex items-center gap-2">
            {source.sourceInfo.name}
            {source.isMarketReference && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                Market Ref
              </span>
            )}
          </p>
          {source.extra_info?.warranty && (
            <p className="text-xs text-gray-400">{source.extra_info.warranty}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold">${source.price.toLocaleString()}</p>
          {!source.isMarketReference && (
            <p className={`text-sm flex items-center gap-1 ${
              vsMarketNum < 0 ? 'text-green-400' : vsMarketNum > 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {vsMarketNum < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {source.vsMarket}%
            </p>
          )}
        </div>

        <a
          href={source.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          onClick={() => trackAffiliateClick(source.source)}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
```

---

## Scraping Strategy

### Per-Source Approach

| Source | Method | Frequency | Notes |
|--------|--------|-----------|-------|
| Chrono24 | API if available, else scrape | 4x/day | Best watch data |
| eBay | eBay API (official) | 4x/day | Reliable, has API |
| StockX | Scrape + proxy | 4x/day | No public API |
| GOAT | Scrape + proxy | 4x/day | Aggressive anti-bot |
| BaT | RSS + scrape | 1x/day | Auction-based |

### Normalization

Key challenge: matching items across platforms.

```javascript
// src/services/itemMatcher.js
function normalizeWatchModel(input) {
  // "Rolex Submariner Date 126610LN" 
  // → { brand: 'rolex', model: 'submariner', ref: '126610ln' }
  
  const patterns = {
    rolex: /rolex\s+(submariner|datejust|daytona|gmt-?master)/i,
    omega: /omega\s+(speedmaster|seamaster|constellation)/i,
    // ... more patterns
  };
  
  // Extract reference number
  const refMatch = input.match(/\d{5,6}[a-z]*/i);
  
  return {
    brand: extractBrand(input),
    model: extractModel(input),
    ref: refMatch?.[0]?.toLowerCase(),
    normalized: `${brand}-${model}-${ref}`,
  };
}
```

---

## Testing Plan

### Unit Tests
- [ ] Price normalization and sorting
- [ ] Affiliate link generation
- [ ] Item matching across platforms

### Integration Tests
- [ ] API returns correct comparison data
- [ ] Scraper updates propagate to comparison
- [ ] Affiliate clicks tracked

### Manual Tests
- [ ] Comparison UI renders correctly
- [ ] External links open correct pages
- [ ] Mobile view works

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Comparison views | 1000/day | Analytics |
| Affiliate clicks | 100/day | Click tracking |
| User time on page | +30% | Analytics |
| Manual refresh requests | < 50/day | API logs |

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scraping blocked | High | Proxy rotation, respect rate limits |
| Price data inaccurate | Medium | Multiple source validation |
| Affiliate programs reject | Low | Apply early, have alternatives |
| Item matching fails | Medium | Human review queue for uncertain matches |

---

*Spec Author: Feature Builder Agent*
*Created: Feb 5, 2026*
