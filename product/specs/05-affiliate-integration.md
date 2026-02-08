# Feature Spec: Affiliate Integration System
> Priority: P0 | Effort: 5 days | Status: Planned

---

## User Story

> As a business, we want to earn commission when users click through to buy items, so we can generate revenue to sustain the platform.

---

## Problem Statement

Currently, The Hub provides value by showing where to buy items but captures zero revenue from those transactions. This leaves money on the table and limits growth investment.

---

## Solution Overview

Integrate affiliate programs from major luxury marketplaces. When users click "Buy" links, we earn 3-10% commission on resulting sales.

---

## Requirements

### Functional
- [ ] Affiliate accounts with top platforms
- [ ] Automatic affiliate link generation
- [ ] Click tracking with attribution
- [ ] Admin dashboard for revenue tracking
- [ ] A/B testing capability for link placement
- [ ] FTC disclosure compliance

### Non-Functional
- [ ] Links should redirect in < 200ms
- [ ] Tracking should not affect user experience
- [ ] Handle affiliate program changes gracefully
- [ ] GDPR-compliant tracking

---

## Affiliate Programs

### Target Programs

| Platform | Category | Commission | Application Status |
|----------|----------|------------|-------------------|
| **eBay Partner Network** | All | 50-70% of eBay fee | Apply Day 1 |
| **Chrono24 Partner** | Watches | 5-8% | Apply Day 1 |
| **Amazon Associates** | All | 1-10% | Apply Day 1 |
| **StockX Affiliate** | Sneakers | 3-5% | Apply Day 1 |
| **GOAT Affiliate** | Sneakers | 3-5% | Apply via network |
| **ShareASale** | Various | Variable | Aggregator |
| **Rakuten Advertising** | Various | Variable | Aggregator |

### Revenue Projections

| Scenario | Monthly Clicks | Conv. Rate | Avg Order | Commission | Revenue |
|----------|---------------|------------|-----------|------------|---------|
| **Conservative** | 5,000 | 2% | $500 | 5% | $2,500 |
| **Moderate** | 15,000 | 2.5% | $600 | 5% | $11,250 |
| **Optimistic** | 30,000 | 3% | $700 | 5% | $31,500 |

---

## UI Design

### Item Detail Page - Buy Section
```
┌─────────────────────────────────────────────────────────────┐
│  Rolex Submariner Date 126610LN                             │
│  Current Market Price: $12,200                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🛒 Where to Buy                                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🏆 BEST PRICE                                        │  │
│  │ eBay • $11,200 (8% below market)                     │  │
│  │ ⭐ 99.8% seller rating • Free shipping               │  │
│  │                                                       │  │
│  │ [🛒 Buy on eBay]                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Chrono24 • $11,850                                   │  │
│  │ ✓ Trusted Checkout available                         │  │
│  │                                                       │  │
│  │ [View on Chrono24]                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Crown & Caliber • $12,100                            │  │
│  │ ✓ 1-year warranty • ✓ 30-day returns                │  │
│  │                                                       │  │
│  │ [View on Crown & Caliber]                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ────────────────────────────────────────────────────────  │
│  ℹ️ Disclosure: We may earn commission from purchases      │
│     made through these links at no extra cost to you.      │
│     This helps support The Hub.                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Admin Revenue Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│  💰 Affiliate Revenue Dashboard                   [Export]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  February 2026                                              │
│                                                              │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ $4,230      │ 12,450      │ 2.8%        │ $340        │ │
│  │ Est Revenue │ Clicks      │ Conv Rate   │ Avg Comm    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│                                                              │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░ 70% of $6,000 goal                  │
│                                                              │
│  By Platform                                                │
│  ─────────────────────────────────────────────────────────  │
│  Chrono24      ▓▓▓▓▓▓▓▓▓▓▓▓░░░░  $2,100 (50%)             │
│  eBay          ▓▓▓▓▓▓▓░░░░░░░░░  $1,200 (28%)             │
│  StockX        ▓▓▓▓░░░░░░░░░░░░  $680 (16%)               │
│  Other         ▓░░░░░░░░░░░░░░░  $250 (6%)                │
│                                                              │
│  Top Converting Items                                       │
│  ─────────────────────────────────────────────────────────  │
│  1. Rolex Submariner     • 45 clicks • 18% CTR • $890      │
│  2. Jordan 1 Retro       • 123 clicks • 15% CTR • $450     │
│  3. Omega Speedmaster    • 67 clicks • 12% CTR • $380      │
│  4. Air Max 1            • 89 clicks • 11% CTR • $220      │
│  5. Tudor Black Bay      • 34 clicks • 10% CTR • $180      │
│                                                              │
│  Click Trends (Last 30 Days)                               │
│  ─────────────────────────────────────────────────────────  │
│       ▁▂▃▄▅▆▇█▇▆▅▆▇█▇▆▅▄▅▆▇█▇▆▅▆▇█▇▆                      │
│  Feb 1                                           Feb 28     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Design

### Database Schema

```sql
-- Affiliate programs configuration
CREATE TABLE affiliate_programs (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  network VARCHAR(50), -- 'direct', 'shareasale', 'rakuten'
  base_url TEXT,
  affiliate_param VARCHAR(100), -- e.g., 'tag', 'ref', 'partner'
  affiliate_id VARCHAR(100),
  commission_rate DECIMAL(4,2), -- e.g., 0.05 for 5%
  categories TEXT[], -- ['watches', 'sneakers']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Click tracking
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(100),
  item_id UUID,
  item_type VARCHAR(20),
  item_name VARCHAR(200),
  program_id VARCHAR(50) REFERENCES affiliate_programs(id),
  original_url TEXT,
  affiliate_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  country VARCHAR(2),
  device_type VARCHAR(20), -- 'mobile', 'desktop', 'tablet'
  clicked_at TIMESTAMP DEFAULT NOW()
);

-- Conversion tracking (populated by webhooks/reports)
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id UUID REFERENCES affiliate_clicks(id),
  program_id VARCHAR(50) REFERENCES affiliate_programs(id),
  order_id VARCHAR(100),
  order_amount_cents INTEGER,
  commission_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  converted_at TIMESTAMP,
  reported_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX idx_clicks_date ON affiliate_clicks(clicked_at);
CREATE INDEX idx_clicks_program ON affiliate_clicks(program_id);
CREATE INDEX idx_conversions_click ON affiliate_conversions(click_id);
```

### Affiliate Link Service

**File: `src/services/affiliateLinks.js`**
```javascript
const { supabase } = require('../db/supabase');

// Cache affiliate programs in memory
let programsCache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getPrograms() {
  if (programsCache && Date.now() - cacheTime < CACHE_TTL) {
    return programsCache;
  }
  
  const { data } = await supabase
    .from('affiliate_programs')
    .select('*')
    .eq('is_active', true);
    
  programsCache = data;
  cacheTime = Date.now();
  return data;
}

// Generate affiliate link for a URL
async function generateAffiliateLink(originalUrl, programId) {
  const programs = await getPrograms();
  const program = programs?.find(p => p.id === programId);
  
  if (!program || !originalUrl) {
    return originalUrl;
  }
  
  try {
    const url = new URL(originalUrl);
    
    switch (program.network) {
      case 'direct':
        // Simple parameter append
        url.searchParams.set(program.affiliate_param, program.affiliate_id);
        return url.toString();
        
      case 'ebay-partner-network':
        // eBay uses ROI tracking links
        return `https://rover.ebay.com/rover/1/${program.affiliate_id}/1?mpre=${encodeURIComponent(originalUrl)}`;
        
      case 'amazon':
        // Amazon tag parameter
        url.searchParams.set('tag', program.affiliate_id);
        return url.toString();
        
      case 'shareasale':
        // ShareASale redirect
        return `https://www.shareasale.com/r.cfm?b=1&u=${program.affiliate_id}&m=${program.merchant_id}&urllink=${encodeURIComponent(originalUrl)}`;
        
      default:
        url.searchParams.set(program.affiliate_param || 'ref', program.affiliate_id);
        return url.toString();
    }
  } catch (e) {
    console.error('Error generating affiliate link:', e);
    return originalUrl;
  }
}

// Track affiliate click
async function trackClick(clickData) {
  const {
    userId,
    sessionId,
    itemId,
    itemType,
    itemName,
    programId,
    originalUrl,
    affiliateUrl,
    referrer,
    userAgent,
    ipAddress,
  } = clickData;
  
  // Determine device type
  const deviceType = /mobile/i.test(userAgent) ? 'mobile' 
    : /tablet/i.test(userAgent) ? 'tablet' 
    : 'desktop';
  
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .insert({
      user_id: userId,
      session_id: sessionId,
      item_id: itemId,
      item_type: itemType,
      item_name: itemName,
      program_id: programId,
      original_url: originalUrl,
      affiliate_url: affiliateUrl,
      referrer,
      user_agent: userAgent,
      ip_address: ipAddress,
      device_type: deviceType,
    })
    .select()
    .single();
    
  return data;
}

// Get revenue stats for admin dashboard
async function getRevenueStats(startDate, endDate) {
  // Get click stats
  const { data: clicks } = await supabase
    .from('affiliate_clicks')
    .select('program_id, item_name, item_type')
    .gte('clicked_at', startDate)
    .lte('clicked_at', endDate);
    
  // Get conversion stats
  const { data: conversions } = await supabase
    .from('affiliate_conversions')
    .select('program_id, order_amount_cents, commission_cents, status')
    .gte('converted_at', startDate)
    .lte('converted_at', endDate);
    
  // Calculate stats
  const totalClicks = clicks?.length || 0;
  const totalConversions = conversions?.filter(c => c.status === 'approved').length || 0;
  const totalRevenue = conversions
    ?.filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + c.commission_cents, 0) || 0;
    
  // Group by platform
  const byPlatform = {};
  clicks?.forEach(c => {
    byPlatform[c.program_id] = byPlatform[c.program_id] || { clicks: 0, revenue: 0 };
    byPlatform[c.program_id].clicks++;
  });
  conversions?.forEach(c => {
    if (byPlatform[c.program_id]) {
      byPlatform[c.program_id].revenue += c.commission_cents;
    }
  });
  
  return {
    totalClicks,
    totalConversions,
    conversionRate: totalClicks ? (totalConversions / totalClicks * 100).toFixed(2) : 0,
    totalRevenue: totalRevenue / 100,
    byPlatform,
  };
}

module.exports = {
  generateAffiliateLink,
  trackClick,
  getRevenueStats,
};
```

### API Endpoints

**File: `src/api/affiliate.js`**
```javascript
const express = require('express');
const router = express.Router();
const { generateAffiliateLink, trackClick, getRevenueStats } = require('../services/affiliateLinks');

// Track click and redirect
router.get('/click', async (req, res) => {
  const { url, program, itemId, itemType, itemName } = req.query;
  
  if (!url || !program) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  try {
    const affiliateUrl = await generateAffiliateLink(url, program);
    
    // Track click asynchronously (don't block redirect)
    trackClick({
      userId: req.user?.id,
      sessionId: req.cookies?.sessionId,
      itemId,
      itemType,
      itemName,
      programId: program,
      originalUrl: url,
      affiliateUrl,
      referrer: req.get('Referer'),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
    }).catch(err => console.error('Click tracking failed:', err));
    
    // Redirect to affiliate URL
    res.redirect(302, affiliateUrl);
  } catch (err) {
    console.error('Affiliate redirect failed:', err);
    res.redirect(302, url); // Fallback to original URL
  }
});

// Admin: Get revenue stats
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  const { start, end } = req.query;
  const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = end || new Date().toISOString();
  
  const stats = await getRevenueStats(startDate, endDate);
  res.json(stats);
});

// Webhook for conversion tracking (called by affiliate networks)
router.post('/webhook/:program', async (req, res) => {
  const { program } = req.params;
  const payload = req.body;
  
  // Verify webhook signature (implementation varies by program)
  if (!verifyWebhookSignature(program, req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process conversion based on program format
  // ... (varies by affiliate network)
  
  res.json({ received: true });
});

module.exports = router;
```

### Frontend Buy Button Component

**File: `components/BuyButton.tsx`**
```typescript
import { ShoppingCart, ExternalLink } from 'lucide-react';

interface BuyButtonProps {
  url: string;
  program: string;
  itemId: string;
  itemType: string;
  itemName: string;
  price: number;
  platform: string;
  isBestPrice?: boolean;
}

export function BuyButton({
  url,
  program,
  itemId,
  itemType,
  itemName,
  price,
  platform,
  isBestPrice,
}: BuyButtonProps) {
  const trackingUrl = `/api/affiliate/click?${new URLSearchParams({
    url,
    program,
    itemId,
    itemType,
    itemName,
  })}`;

  return (
    <a
      href={trackingUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`
        flex items-center justify-center gap-2 px-4 py-3 rounded-lg
        font-medium transition-colors
        ${isBestPrice 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-gray-700 hover:bg-gray-600 text-white'
        }
      `}
    >
      {isBestPrice ? (
        <ShoppingCart className="w-5 h-5" />
      ) : (
        <ExternalLink className="w-5 h-5" />
      )}
      {isBestPrice ? `Buy on ${platform}` : `View on ${platform}`}
    </a>
  );
}
```

### FTC Disclosure Component

**File: `components/AffiliateDisclosure.tsx`**
```typescript
export function AffiliateDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-gray-500 mt-2">
        ℹ️ We may earn commission from purchases.{' '}
        <a href="/affiliate-disclosure" className="underline">Learn more</a>
      </p>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 mt-4">
      <p className="text-sm text-gray-400">
        <strong className="text-gray-300">Affiliate Disclosure:</strong> We may earn 
        commission from purchases made through links on this page at no extra cost 
        to you. This helps support The Hub and keep it free.{' '}
        <a href="/affiliate-disclosure" className="text-indigo-400 hover:underline">
          Learn more
        </a>
      </p>
    </div>
  );
}
```

---

## Compliance & Legal

### FTC Requirements
1. **Clear disclosure** on every page with affiliate links
2. **"sponsored" rel attribute** on all affiliate links
3. **Disclosure page** explaining affiliate relationships

### GDPR Requirements
1. Obtain consent before tracking (cookie banner)
2. Allow users to opt-out of tracking
3. Include in privacy policy

---

## Testing Plan

### Unit Tests
- [ ] Affiliate link generation for each network
- [ ] Click tracking inserts correct data
- [ ] Revenue calculation accuracy

### Integration Tests
- [ ] End-to-end click tracking flow
- [ ] Redirect speed < 200ms
- [ ] Webhook processing

### Manual Tests
- [ ] Links redirect to correct pages
- [ ] Tracking appears in admin dashboard
- [ ] Disclosure visible on all relevant pages

---

## Rollout Plan

1. **Day 1:** Apply for affiliate programs (Chrono24, eBay, Amazon, StockX)
2. **Day 2:** Database schema, affiliate link service
3. **Day 3:** Click tracking API, redirect endpoint
4. **Day 4:** Frontend buy buttons, disclosure component
5. **Day 5:** Admin dashboard, testing, polish

**Note:** Affiliate program approval can take 1-2 weeks. Apply early!

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Click-through rate | 5% | Clicks / item views |
| Conversion rate | 2% | Purchases / clicks |
| Revenue per click | $0.50 | Total revenue / clicks |
| Monthly revenue | $5,000 | Affiliate dashboard |

---

*Spec Author: Feature Builder Agent*
*Created: Feb 5, 2026*
