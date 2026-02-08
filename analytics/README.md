# The Hub Analytics

Track metrics, find insights, measure growth.

## Quick Start

```bash
# See all metrics at once
node analytics/scripts/all-metrics.js

# Quick summary
node analytics/scripts/all-metrics.js --quick

# Create daily snapshot
node analytics/scripts/daily-snapshot.js
```

## Scripts

| Script | Description |
|--------|-------------|
| `all-metrics.js` | Combined dashboard from all sources |
| `pull-supabase.js` | User, deal, alert, content metrics |
| `pull-stripe.js` | Revenue, MRR, subscribers, churn |
| `pull-telegram.js` | Channel stats, member count |
| `daily-snapshot.js` | Save daily metrics snapshot |

All scripts support:
- `--quick` - Brief summary
- `--json` - JSON output for piping

## Dashboards

Pre-made templates for tracking:

- `dashboards/daily.md` - 5-minute daily check
- `dashboards/weekly.md` - 15-minute weekly review
- `dashboards/monthly.md` - 30-minute monthly health check

## Database Setup

Run `setup.sql` in Supabase SQL Editor to create:
- `daily_metrics` table
- `analytics_events` table
- Useful views and functions

## Directory Structure

```
analytics/
├── README.md           # This file
├── METRICS_PLAYBOOK.md # What to track and why
├── setup.sql           # Database schema
├── scripts/
│   ├── all-metrics.js      # Combined dashboard
│   ├── pull-supabase.js    # Supabase metrics
│   ├── pull-stripe.js      # Stripe revenue
│   ├── pull-telegram.js    # Telegram stats
│   └── daily-snapshot.js   # Daily snapshot
├── dashboards/
│   ├── daily.md        # Daily pulse template
│   ├── weekly.md       # Weekly review template
│   └── monthly.md      # Monthly health template
└── data/
    └── snapshots/      # JSON snapshots (gitignored)
```

## Metrics Quick Reference

### North Star Metrics
- **MRR** - Monthly Recurring Revenue
- **WAU** - Weekly Active Users  
- **Alert CTR** - Click-through rate on alerts

### Key Numbers
- Users → Supabase `user_alert_preferences`
- Revenue → Stripe subscriptions
- Deals → Supabase `watch_listings`
- Alerts → Supabase `alert_delivery_log`
- Content → Supabase `blog_posts`, `blog_post_views`
- Telegram → Bot API `getChatMemberCount`
- Email → Supabase `blog_subscribers`

## Adding to package.json

```json
{
  "scripts": {
    "metrics": "node analytics/scripts/all-metrics.js",
    "metrics:quick": "node analytics/scripts/all-metrics.js --quick",
    "metrics:supabase": "node analytics/scripts/pull-supabase.js",
    "metrics:stripe": "node analytics/scripts/pull-stripe.js",
    "metrics:telegram": "node analytics/scripts/pull-telegram.js",
    "metrics:snapshot": "node analytics/scripts/daily-snapshot.js --save"
  }
}
```

## Cron Setup (Optional)

Add to your scheduler to auto-collect metrics:

```bash
# Daily snapshot at midnight
0 0 * * * cd /path/to/the-hub && node analytics/scripts/daily-snapshot.js --save
```

## Tips

1. **Start simple** - Focus on North Star metrics first
2. **Track trends** - Absolute numbers matter less than direction
3. **Weekly reviews** - Set a recurring calendar event
4. **Act on data** - Metrics without action are vanity

See `METRICS_PLAYBOOK.md` for the full guide.
