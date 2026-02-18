# Affiliate Setup Checklist

Use this checklist to track your progress setting up affiliate programs for The Hub.

---

## Phase 1: Affiliate Program Signups

### StockX (via Impact) - Priority 1
- [ ] Create Impact account at https://impact.com
- [ ] Apply to StockX affiliate program in Impact marketplace
- [ ] Wait for approval (1-3 business days)
- [ ] Get your Impact Partner ID
- [ ] Add IMPACT_ID to .env file
- [ ] Test generating StockX tracking links in Impact dashboard
- [ ] Set up payment method (min $50 payout)

**Commission Rates:**
- Sneakers/Streetwear: 3% (new), 1% (returning)
- Watches/Handbags: 4% (new), 2% (returning)
- Cookie: 15 days

---

### eBay Partner Network - Priority 2
- [ ] Sign up at https://partnernetwork.ebay.com
- [ ] Complete application (business info, website, traffic sources)
- [ ] Wait for approval (1-5 business days)
- [ ] Log into EPN dashboard and get Campaign ID
- [ ] Add EBAY_CAMPAIGN_ID to .env file
- [ ] Test link generator tool
- [ ] Set up payment method (min $10 payout)

**Commission Rates:**
- Varies by category (1-4%)
- Watches/Jewelry: ~2-4%
- Cookie: 24 hours

---

### Amazon Associates - Priority 3
- [ ] Sign up at https://affiliate-program.amazon.com
- [ ] Fill out account info (name, address, website)
- [ ] Complete phone verification
- [ ] Add tax info (W-9 or W-8)
- [ ] Get your Tracking ID (format: yourtag-20)
- [ ] Add AMAZON_ASSOCIATE_TAG to .env file
- [ ] Set up payment method (direct deposit recommended, min $10)

**Commission Rates:**
- Watches: 4%
- Shoes/Accessories: 4%
- Sneaker care: 3-4%
- Cookie: 24 hours

---

## Phase 2: Technical Integration

### Database Setup
- [ ] Create `affiliate_clicks` table in Supabase (SQL below)
- [ ] Add `affiliate_url` and `affiliate_network` columns to `deals` table
- [ ] Test database insert/query operations

**SQL for affiliate_clicks table:**
```sql
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id),
  affiliate_url TEXT NOT NULL,
  affiliate_network TEXT,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clicks_deal ON affiliate_clicks(deal_id);
CREATE INDEX idx_clicks_date ON affiliate_clicks(clicked_at);
```

**SQL for updating deals table:**
```sql
ALTER TABLE deals ADD COLUMN affiliate_url TEXT;
ALTER TABLE deals ADD COLUMN affiliate_network TEXT;
ALTER TABLE deals ADD COLUMN tracking_id TEXT;
```

---

### Script Configuration
- [ ] Copy `.env.affiliate.example` to `.env`
- [ ] Fill in all affiliate IDs in `.env`
- [ ] Add Supabase credentials to `.env`
- [ ] Test affiliate-links.js script:
  ```bash
  node scripts/affiliate-links.js "https://stockx.com/test"
  node scripts/affiliate-links.js "https://ebay.com/itm/123456"
  node scripts/affiliate-links.js "https://amazon.com/dp/B08N5WRWNW"
  ```

---

### Integration with Deal Scrapers
- [ ] Import `affiliate-links.js` into scraper scripts
- [ ] Call `wrapAffiliateLink()` for each scraped deal
- [ ] Save `affiliate_url` to database
- [ ] Test with real deal URLs

**Example integration:**
```javascript
const { wrapAffiliateLink } = require('./scripts/affiliate-links.js');

// In your scraper
const deal = await scrapeDeal(url);
deal.affiliate_url = await wrapAffiliateLink(deal.original_url, {
  dealId: deal.id,
  source: 'scraper'
});

await saveDeal(deal);
```

---

### Frontend Integration
- [ ] Update deal card component to use `affiliate_url`
- [ ] Add click tracking before redirect
- [ ] Add affiliate disclosure (footer or deal page)
- [ ] Test links on staging site

**Example click handler:**
```javascript
async function handleDealClick(deal) {
  // Track click
  await fetch('/api/track-click', {
    method: 'POST',
    body: JSON.stringify({
      dealId: deal.id,
      affiliateUrl: deal.affiliate_url,
      affiliateNetwork: deal.affiliate_network
    })
  });
  
  // Open affiliate link
  window.open(deal.affiliate_url, '_blank');
}
```

---

## Phase 3: Testing & Compliance

### Functionality Testing
- [ ] Test affiliate links on desktop browser
- [ ] Test affiliate links on mobile browser
- [ ] Verify clicks appear in affiliate dashboards (24-48h delay)
- [ ] Test click tracking in Supabase
- [ ] Make test purchase to verify commission tracking

### Compliance
- [ ] Add affiliate disclosure to website footer
- [ ] Add disclosure to deal pages
- [ ] Review FTC guidelines: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
- [ ] Review each affiliate program's Terms of Service
- [ ] Ensure you're not violating any TOS rules

**Example disclosure:**
```
The Hub may earn a commission when you click links and make a purchase. 
This helps us keep the service free. Prices are not affected.
```

---

## Phase 4: Monitoring & Optimization

### Analytics Setup
- [ ] Set up dashboard to view click stats
- [ ] Create query to calculate CTR (click-through rate)
- [ ] Track top-performing deals
- [ ] Monitor affiliate network dashboards weekly

### Performance Tracking
- [ ] Log into Impact dashboard weekly (StockX)
- [ ] Log into EPN dashboard weekly (eBay)
- [ ] Log into Amazon Associates dashboard weekly
- [ ] Compare click logs to conversion reports
- [ ] Calculate revenue per 1,000 users (RPM)

### Optimization Tasks
- [ ] A/B test different link placements
- [ ] Test different CTAs ("Check Deal" vs "View on StockX")
- [ ] Optimize for mobile (most users)
- [ ] Focus on deals with highest CTR
- [ ] Remove underperforming platforms

---

## Phase 5: Revenue Tracking

### Financial Setup
- [ ] Create spreadsheet to track monthly earnings
- [ ] Set up separate bank account for affiliate income (optional)
- [ ] Track for tax purposes (1099-MISC income in US)
- [ ] Calculate monthly RPM (revenue per 1,000 users)

### Monthly Reporting
- [ ] Check affiliate dashboards for payouts
- [ ] Update revenue projections
- [ ] Identify top-performing platforms
- [ ] Report earnings in memory/YYYY-MM-DD.md

**Tracking Template:**
```
Month: February 2025

Affiliate Earnings:
- StockX: $XXX (YY clicks, ZZ conversions)
- eBay: $XXX (YY clicks, ZZ conversions)
- Amazon: $XXX (YY clicks, ZZ conversions)
Total: $XXX

CTR: X.X%
Conversion Rate: X.X%
RPM: $X.XX
```

---

## Troubleshooting

### Links Not Tracking
- **Issue:** Clicks not showing in affiliate dashboard
- **Fix:** Wait 24-48 hours for data to populate
- **Fix:** Verify affiliate ID is correct in .env
- **Fix:** Test link manually in incognito browser

### Low CTR
- **Issue:** Users not clicking affiliate links
- **Fix:** Improve deal quality (only post real deals)
- **Fix:** Better CTAs and link placement
- **Fix:** Mobile optimization

### Account Rejected
- **Issue:** Affiliate program rejected application
- **Fix:** Improve website quality (add more content)
- **Fix:** Show proof of traffic (analytics screenshots)
- **Fix:** Appeal decision with program support

---

## Resources

**Documentation:**
- [StockX Affiliate FAQ](https://stockx.com/news/affiliate-faq/)
- [eBay Partner Network Help](https://partnerhelp.ebay.com/)
- [Amazon Associates Help](https://affiliate-program.amazon.com/help)

**Tools:**
- Impact Dashboard: https://app.impact.com
- EPN Dashboard: https://publisher.ebaypartnernetwork.com
- Amazon Associates: https://affiliate-program.amazon.com

**Internal Docs:**
- Monetization Plan: `/content/monetization-plan.md`
- Affiliate Setup Guide: `/content/affiliate-setup-guide.md`
- Affiliate Script: `/scripts/affiliate-links.js`

---

**Last Updated:** February 2025  
**Next Review:** Monthly
