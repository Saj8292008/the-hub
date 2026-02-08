# The Hub - Metrics Playbook

> What to track, why it matters, and how to measure success.

---

## 🎯 North Star Metrics

These are the 3 numbers that define success:

| Metric | Target (Month 1) | Target (Month 3) | Why It Matters |
|--------|------------------|------------------|----------------|
| **MRR** (Monthly Recurring Revenue) | $100 | $500 | Business sustainability |
| **WAU** (Weekly Active Users) | 50 | 200 | Engagement health |
| **Alert CTR** (Click-Through Rate) | 15% | 25% | Value delivery |

---

## 📊 Metric Categories

### 1. User Metrics

**Acquisition**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| New signups | Users who created an account | Supabase `auth.users` | Daily |
| Signup source | Where users came from (organic, Telegram, referral) | Supabase `users.source` | Daily |
| Telegram joins | New channel subscribers | Telegram Bot API | Daily |
| Email subscribers | Newsletter signups | Supabase `blog_subscribers` | Daily |

**Engagement**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| DAU/WAU/MAU | Daily/Weekly/Monthly active users | Supabase activity logs | Daily |
| Session duration | Time spent on platform | Website analytics | Weekly |
| Deals viewed | Listings clicked/expanded | Supabase events | Daily |
| Searches performed | Natural language queries | Supabase `search_logs` | Daily |
| Alerts configured | Price alerts set up | Supabase `user_alert_preferences` | Daily |

**Retention**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| Day 1 retention | % returning next day | Supabase auth logs | Weekly |
| Day 7 retention | % returning within week | Supabase auth logs | Weekly |
| Day 30 retention | % returning within month | Supabase auth logs | Monthly |
| Churn rate | % of users who stopped using | Supabase + Stripe | Monthly |

---

### 2. Revenue Metrics

**Core Revenue**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| MRR | Monthly recurring revenue | Stripe | Daily |
| ARR | Annual recurring revenue (MRR × 12) | Stripe | Monthly |
| ARPU | Average revenue per user | Stripe ÷ active users | Monthly |
| LTV | Lifetime value estimate | ARPU × avg months | Monthly |

**Conversion**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| Trial → Paid | % converting from free to premium | Stripe + Supabase | Weekly |
| Upgrade rate | Free users who upgraded | Stripe | Weekly |
| Downgrade rate | Premium → Free | Stripe | Weekly |
| Churn rate | Cancellations / total subscribers | Stripe | Monthly |

**Stripe Metrics to Pull**
```javascript
// Key Stripe data points
- subscription.created (new subscribers)
- subscription.updated (plan changes)
- subscription.deleted (cancellations)
- invoice.paid (successful charges)
- invoice.payment_failed (failed charges)
- customer.created (new customers)
```

---

### 3. Engagement Metrics (Alerts & Deals)

**Alert Performance**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| Alerts sent | Total notifications delivered | Supabase `alert_delivery_log` | Daily |
| Alerts opened | Email/push opens | Delivery providers | Daily |
| Alert CTR | % of alerts clicked | Supabase events | Daily |
| Alerts per user | Avg alerts received/user | Supabase | Weekly |
| Time to click | How fast users respond | Supabase events | Weekly |

**Deal Metrics**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| Total deals | Listings in database | Supabase `watch_listings` | Daily |
| Hot deals | Score ≥ 85 | Supabase | Daily |
| Deals by category | watches/cars/sneakers | Supabase | Daily |
| Avg deal score | Quality of scraped deals | Supabase | Weekly |
| Deal freshness | % deals < 24h old | Supabase | Daily |

**Content Metrics**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| Blog views | Total page views | Supabase `blog_post_views` | Daily |
| Avg time on page | Engagement depth | Analytics | Weekly |
| Top posts | Most viewed content | Supabase | Weekly |
| Subscriber growth | Email list size | Supabase | Weekly |

---

### 4. Marketing & Growth Metrics

**Channel Performance**
| Metric | Description | Source | Frequency |
|--------|-------------|--------|-----------|
| Telegram subscribers | Channel member count | Telegram API | Daily |
| Telegram engagement | Replies, forwards | Telegram API | Weekly |
| Discord members | Server size | Discord API | Daily |
| Website traffic | Unique visitors | Analytics | Weekly |
| Referral signups | Users from referrals | Supabase | Weekly |

**Funnel Metrics**
```
Visitor → Signup → Active → Subscriber → Retained

Track conversion at each step:
1. Visit → Signup: X%
2. Signup → First deal view: X%
3. First view → Alert setup: X%
4. Alert setup → Premium: X%
```

---

## 📈 Dashboard Templates

### Daily Check (5 min)
```
╔══════════════════════════════════════════╗
║  THE HUB - DAILY PULSE                   ║
╠══════════════════════════════════════════╣
║  📈 New Signups:        ___              ║
║  💰 New Subscribers:    ___              ║
║  🔔 Alerts Sent:        ___              ║
║  👀 Deals Viewed:       ___              ║
║  📰 Blog Views:         ___              ║
╠══════════════════════════════════════════╣
║  ⚠️  Issues:                             ║
║  - Scraper status: ✅/❌                  ║
║  - Failed alerts: ___                    ║
║  - Error rate: ___%                      ║
╚══════════════════════════════════════════╝
```

### Weekly Review (15 min)
```
╔══════════════════════════════════════════╗
║  THE HUB - WEEKLY REVIEW                 ║
╠══════════════════════════════════════════╣
║  USER METRICS                            ║
║  • Total users:         ___ (+/-___)     ║
║  • WAU:                 ___ (+/-___)     ║
║  • Retention (7d):      ___%             ║
║                                          ║
║  REVENUE                                 ║
║  • MRR:                 $___ (+/-$___)   ║
║  • New subscribers:     ___              ║
║  • Churn:               ___              ║
║                                          ║
║  ENGAGEMENT                              ║
║  • Alerts delivered:    ___              ║
║  • Alert CTR:           ___%             ║
║  • Avg deals/user:      ___              ║
║                                          ║
║  GROWTH                                  ║
║  • Telegram:            ___ (+/-___)     ║
║  • Email subs:          ___ (+/-___)     ║
║  • Blog traffic:        ___ (+/-___)     ║
╚══════════════════════════════════════════╝
```

### Monthly Health (30 min)
```
╔══════════════════════════════════════════╗
║  THE HUB - MONTHLY HEALTH CHECK          ║
╠══════════════════════════════════════════╣
║  NORTH STAR PROGRESS                     ║
║  • MRR: $___  (Target: $___)      ✅/⚠️   ║
║  • WAU: ___   (Target: ___)       ✅/⚠️   ║
║  • Alert CTR: ___% (Target: ___%) ✅/⚠️   ║
║                                          ║
║  COHORT ANALYSIS                         ║
║  • Week 1 cohort retention: ___%         ║
║  • Week 2 cohort retention: ___%         ║
║  • Week 3 cohort retention: ___%         ║
║  • Week 4 cohort retention: ___%         ║
║                                          ║
║  FINANCIAL HEALTH                        ║
║  • Total revenue: $___                   ║
║  • ARPU: $___                            ║
║  • Estimated LTV: $___                   ║
║  • CAC (if any paid): $___               ║
║                                          ║
║  TOP PERFORMERS                          ║
║  • Best converting channel: ___          ║
║  • Most popular category: ___            ║
║  • Most clicked deals: ___               ║
╚══════════════════════════════════════════╝
```

---

## 🎯 Benchmark Goals

### Week 1 (Launch Week)
| Metric | Target | Stretch |
|--------|--------|---------|
| Signups | 25 | 50 |
| Telegram joins | 50 | 100 |
| Email subscribers | 20 | 50 |
| First paid subscriber | 1 | 5 |
| Deals in database | 500+ | 1000+ |

### Month 1
| Metric | Target | Stretch |
|--------|--------|---------|
| Total users | 100 | 250 |
| WAU | 50 | 100 |
| MRR | $100 | $250 |
| Telegram channel | 200 | 500 |
| Email list | 100 | 250 |
| Blog posts | 30+ | 50+ |
| Alert CTR | 10% | 20% |

### Month 3
| Metric | Target | Stretch |
|--------|--------|---------|
| Total users | 500 | 1000 |
| WAU | 200 | 400 |
| MRR | $500 | $1000 |
| Telegram channel | 1000 | 2500 |
| Email list | 500 | 1000 |
| DAU/MAU ratio | 15% | 25% |
| Trial→Paid conversion | 5% | 10% |

---

## 🔧 Tracking Implementation

### Required Tables in Supabase

```sql
-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  user_id UUID,
  session_id VARCHAR(100),
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_event_name ON analytics_events(event_name, created_at);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id, created_at);

-- Daily metrics snapshot
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  premium_users INTEGER DEFAULT 0,
  mrr DECIMAL(10,2) DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,
  deals_scraped INTEGER DEFAULT 0,
  blog_views INTEGER DEFAULT 0,
  telegram_members INTEGER DEFAULT 0,
  email_subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Event Names to Track

```javascript
// User events
'user.signup'
'user.login'
'user.upgraded'
'user.downgraded'
'user.churned'

// Engagement events
'deal.viewed'
'deal.clicked'
'deal.favorited'
'alert.created'
'alert.triggered'
'alert.clicked'
'search.performed'

// Content events
'blog.viewed'
'blog.shared'
'newsletter.subscribed'
'newsletter.opened'

// Channel events
'telegram.joined'
'telegram.message_sent'
'discord.joined'
```

---

## 📋 Daily Checklist

**Morning (5 min)**
- [ ] Check scraper status - are deals flowing?
- [ ] Check failed alerts count
- [ ] Review overnight signups
- [ ] Check MRR in Stripe

**Evening (5 min)**
- [ ] Record daily metrics
- [ ] Note any anomalies
- [ ] Check Telegram engagement
- [ ] Review hot deals performance

---

## 🚨 Alert Thresholds

Set up notifications for:

| Condition | Action |
|-----------|--------|
| Scraper down > 2 hours | Slack/Discord alert |
| Failed alerts > 10 | Investigate immediately |
| Daily signups = 0 | Check marketing channels |
| MRR drops > 20% | Review churn reasons |
| Alert CTR < 5% | Review alert quality |
| Error rate > 5% | Check server logs |

---

## 📁 File Structure

```
analytics/
├── METRICS_PLAYBOOK.md      # This file
├── scripts/
│   ├── pull-supabase.js     # Pull user/deal metrics
│   ├── pull-stripe.js       # Pull revenue metrics  
│   ├── pull-telegram.js     # Pull channel stats
│   ├── daily-snapshot.js    # Create daily metric record
│   └── generate-report.js   # Generate weekly/monthly reports
├── dashboards/
│   ├── daily.md             # Daily pulse template
│   ├── weekly.md            # Weekly review template
│   └── monthly.md           # Monthly health template
└── data/
    └── snapshots/           # Historical data (git-ignored)
```

---

## 🔑 Key Insights to Look For

1. **User Quality**: Which signup sources produce paying users?
2. **Activation**: What action predicts long-term retention?
3. **Value Moments**: What makes users say "aha!"?
4. **Churn Signals**: What behavior predicts cancellation?
5. **Growth Levers**: What drives organic signups?

---

*Last updated: 2025-02-05*
