# Feature Spec: Referral Program
> Priority: P0 | Effort: 3 days | Status: Planned

---

## User Story

> As a user, I want to invite friends and earn credits toward premium, so I can save money and share something useful.

---

## Problem Statement

Currently, growth is entirely through organic discovery. No viral loop exists. Users who love the product have no incentive or easy way to share it.

---

## Solution Overview

Two-sided referral program where both referrer and referee receive $5 credit toward premium subscription.

---

## Requirements

### Functional
- [ ] Unique referral code per user (e.g., `SYDNEY-HUB23`)
- [ ] Referral link: `thehub.io/r/SYDNEY-HUB23`
- [ ] Dashboard showing: clicks, signups, conversions
- [ ] $5 credit per successful referral (both parties)
- [ ] Credits apply to premium subscription
- [ ] Social sharing buttons (Twitter, WhatsApp, copy link)
- [ ] Fraud prevention (1 credit per IP, email verification required)

### Non-Functional
- [ ] Links should resolve in < 100ms
- [ ] Prevent duplicate credits for same user
- [ ] Track attribution even if user signs up later

---

## UI Design

### Referral Dashboard Page
```
┌─────────────────────────────────────────────────────────────┐
│  🎁 Invite Friends, Earn Rewards                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Share your link and both you and your friend get $5        │
│  toward premium when they sign up!                          │
│                                                              │
│  Your Referral Link:                                        │
│  ┌─────────────────────────────────────────┬──────────────┐ │
│  │ thehub.io/r/SYDNEY-HUB23                │  📋 Copy     │ │
│  └─────────────────────────────────────────┴──────────────┘ │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 🐦 Tweet │  │ 📱 WhatsApp│ │ ✉️ Email │  │ 💬 Text  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  📊 Your Stats                                              │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ 23           │ 8            │ $40          │            │
│  │ Links Clicked│ Friends Joined│ Credits Earned│           │
│  └──────────────┴──────────────┴──────────────┘            │
│                                                              │
│  💰 Credit Balance: $15.00                                  │
│  [Apply to Premium Subscription]                            │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  Recent Referrals                                           │
│  • j***@gmail.com signed up 2 days ago (+$5)               │
│  • m***@yahoo.com signed up 5 days ago (+$5)               │
│  • s***@hotmail.com signed up 1 week ago (+$5)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Signup Page (Referred User)
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🎉 You were invited by Sydney!                             │
│  Sign up now and you both get $5 credit toward premium.    │
│                                                              │
│  [Email]                                                    │
│  [Password]                                                 │
│                                                              │
│  [Create Account]                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Design

### Database Schema

```sql
-- Add referral columns to users table
ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN referral_credits_cents INTEGER DEFAULT 0;

-- Create referral events tracking table
CREATE TABLE referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) NOT NULL,
  referred_id UUID REFERENCES users(id),
  event_type VARCHAR(20) NOT NULL, -- 'click', 'signup', 'premium_convert'
  credits_awarded_cents INTEGER DEFAULT 0,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX idx_referral_events_referrer ON referral_events(referrer_id);
CREATE INDEX idx_referral_events_type ON referral_events(event_type);

-- Generate referral code trigger
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(NEW.email FROM 1 FOR 5)) || '-' || 
                       UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 4));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();
```

### Backend API

**New File: `src/api/referrals.js`**
```javascript
const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');

// Get referral stats for current user
router.get('/stats', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  // Get counts
  const { data: clicks } = await supabase
    .from('referral_events')
    .select('id', { count: 'exact' })
    .eq('referrer_id', userId)
    .eq('event_type', 'click');
    
  const { data: signups } = await supabase
    .from('referral_events')
    .select('id', { count: 'exact' })
    .eq('referrer_id', userId)
    .eq('event_type', 'signup');
    
  const { data: user } = await supabase
    .from('users')
    .select('referral_code, referral_credits_cents')
    .eq('id', userId)
    .single();
  
  res.json({
    referralCode: user.referral_code,
    referralLink: `${process.env.FRONTEND_URL}/r/${user.referral_code}`,
    stats: {
      clicks: clicks?.length || 0,
      signups: signups?.length || 0,
      creditsEarned: (user.referral_credits_cents || 0) / 100,
      creditBalance: (user.referral_credits_cents || 0) / 100
    }
  });
});

// Track referral click
router.post('/track-click', async (req, res) => {
  const { referralCode, ipAddress } = req.body;
  
  // Find referrer
  const { data: referrer } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', referralCode.toUpperCase())
    .single();
    
  if (!referrer) {
    return res.status(404).json({ error: 'Invalid referral code' });
  }
  
  // Record click
  await supabase.from('referral_events').insert({
    referrer_id: referrer.id,
    event_type: 'click',
    ip_address: ipAddress
  });
  
  res.json({ success: true, referrerId: referrer.id });
});

// Process referral on signup (called from auth service)
async function processReferralSignup(referredUserId, referrerCode, ipAddress) {
  // Find referrer
  const { data: referrer } = await supabase
    .from('users')
    .select('id, referral_credits_cents')
    .eq('referral_code', referrerCode.toUpperCase())
    .single();
    
  if (!referrer) return false;
  
  // Check for fraud: same IP already got credit
  const { data: existingByIp } = await supabase
    .from('referral_events')
    .select('id')
    .eq('referrer_id', referrer.id)
    .eq('ip_address', ipAddress)
    .eq('event_type', 'signup')
    .limit(1);
    
  if (existingByIp?.length > 0) {
    console.log('Duplicate referral from same IP, skipping credit');
    return false;
  }
  
  const CREDIT_AMOUNT = 500; // $5 in cents
  
  // Update referrer's credits
  await supabase
    .from('users')
    .update({ 
      referral_credits_cents: referrer.referral_credits_cents + CREDIT_AMOUNT 
    })
    .eq('id', referrer.id);
    
  // Update referred user's credits
  await supabase
    .from('users')
    .update({ 
      referred_by: referrer.id,
      referral_credits_cents: CREDIT_AMOUNT 
    })
    .eq('id', referredUserId);
    
  // Record event
  await supabase.from('referral_events').insert({
    referrer_id: referrer.id,
    referred_id: referredUserId,
    event_type: 'signup',
    credits_awarded_cents: CREDIT_AMOUNT,
    ip_address: ipAddress
  });
  
  return true;
}

// Apply credits to Stripe checkout
router.post('/apply-credits', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  const { data: user } = await supabase
    .from('users')
    .select('referral_credits_cents')
    .eq('id', userId)
    .single();
    
  if (!user?.referral_credits_cents || user.referral_credits_cents <= 0) {
    return res.status(400).json({ error: 'No credits to apply' });
  }
  
  // Return credit amount for frontend to use with Stripe
  res.json({
    creditsAvailable: user.referral_credits_cents,
    amountOff: Math.min(user.referral_credits_cents, 999), // Max $9.99 off
  });
});

module.exports = router;
module.exports.processReferralSignup = processReferralSignup;
```

### Frontend Components

**New Page: `Referrals.tsx`**
```typescript
import { useState, useEffect } from 'react';
import { Copy, Twitter, MessageCircle, Mail, Gift } from 'lucide-react';
import { toast } from 'sonner';

export default function Referrals() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    const res = await fetch('/api/referrals/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setStats(data);
    setLoading(false);
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(stats.referralLink);
    toast.success('Link copied to clipboard!');
  };
  
  const shareOnTwitter = () => {
    const text = `I've been using The Hub to track my watch/sneaker collection. Sign up with my link and we both get $5 credit! ${stats.referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
  };
  
  const shareOnWhatsApp = () => {
    const text = `Check out The Hub - the best way to track luxury collectibles. Use my link and we both get $5: ${stats.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };
  
  // ... render component
}
```

---

## Fraud Prevention

1. **IP-based deduplication:** Only one credit per IP per referrer
2. **Email verification required:** No credits until email confirmed
3. **Rate limiting:** Max 100 referral credits per user per month
4. **Manual review:** Flag accounts with > 20 referrals for review

---

## Testing Plan

### Unit Tests
- [ ] Referral code generation
- [ ] Credit calculation and application
- [ ] Fraud prevention logic

### Integration Tests
- [ ] Full signup flow with referral code
- [ ] Credit application to Stripe checkout
- [ ] Stats API accuracy

### Manual Tests
- [ ] Share buttons work on all platforms
- [ ] Referred user sees "invited by" message
- [ ] Credits show correctly in dashboard

---

## Rollout Plan

1. **Day 1:** Database migration, backend API
2. **Day 2:** Frontend referral page, share buttons
3. **Day 3:** Stripe integration, testing, polish
4. **Launch:** Email existing users about referral program

---

## Success Metrics

| Metric | Target | Baseline |
|--------|--------|----------|
| Referral links shared | 500/month | 0 |
| Referred signups | 100/month | 0 |
| Referred premium conversions | 10/month | 0 |
| Cost per referred user | < $5 | N/A |

---

## Share Message Templates

**Twitter:**
> I've been using The Hub to track my watch/sneaker collection and spot deals. Sign up with my link and we both get $5 credit! [link]

**WhatsApp:**
> Hey! Check out The Hub - it's the best way to track prices on watches, sneakers, and cars. Use my link and we both get $5: [link]

**Email:**
> Subject: Track your collection like a pro (+ get $5)
> 
> I've been using The Hub to track my watch and sneaker collection. It shows price trends, alerts me to deals, and helps me know what my stuff is worth.
>
> Use my link to sign up and we'll both get $5 credit toward premium: [link]

---

*Spec Author: Feature Builder Agent*
*Created: Feb 5, 2026*
