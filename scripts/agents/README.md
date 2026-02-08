# 🏰 The Hub Empire AI - Autonomous Agent System

**Status:** 🟢 Active  
**Version:** 1.0.0  
**Coordinator:** Empire AI

## Overview

The Hub is managed by a fleet of specialized AI agents that run 24/7, automating deal discovery, content creation, analytics, and growth.

## Agent Fleet

### 🏰 Empire AI (Coordinator)
**File:** `empire-ai.js`  
**Role:** Master coordinator - schedules and monitors all agents  
**Runs:** Continuous (5min check intervals)  
**Status:** ✅ Implemented

**What it does:**
- Delegates tasks to specialized agents
- Monitors agent health and performance
- Maintains empire state in `empire-state.json`
- Auto-recovers from failures

### 🔍 Deal Hunter
**File:** `deal-hunter.js`  
**Role:** Finds and auto-posts hot deals  
**Runs:** Every 10 minutes  
**Status:** ✅ Implemented

**What it does:**
- Scans database for deals with score >= 12
- Auto-posts to Telegram channel
- Tracks posted deals to avoid duplicates
- Learns from engagement metrics

### 📝 Content Factory
**File:** `content-factory.js` (via Empire AI)  
**Role:** Auto-generates content from deals  
**Runs:** Every 6 hours  
**Status:** ✅ Basic implementation

**What it does:**
- Creates daily digest posts
- Generates social media content
- Writes newsletter snippets
- Saves to `/content/YYYY-MM-DD/`

### 📊 Analytics Agent
**File:** Built into Empire AI  
**Role:** Tracks metrics and generates reports  
**Runs:** Every hour  
**Status:** ✅ Implemented

**What it does:**
- Counts listings, subscribers, growth
- Identifies trending categories
- Reports anomalies
- Logs performance metrics

### 🛡️ Quality Control
**File:** Built into Empire AI  
**Role:** Maintains data quality  
**Runs:** Every 30 minutes  
**Status:** ✅ Implemented

**What it does:**
- Removes expired deals (>30 days)
- Flags spam/fake listings
- Validates data completeness
- Improves deal metadata

### 💰 Growth Agent
**File:** `growth-agent.js` (TODO)  
**Role:** Finds new opportunities and sources  
**Runs:** Daily  
**Status:** 🚧 Planned

**Will do:**
- Discovers new subreddits to monitor
- Finds competitor channels
- Tests new content formats
- A/B tests posting strategies

## Running the Empire

### Start the Empire
```bash
# Start the autonomous coordinator
node scripts/agents/empire-ai.js

# Or run in background with PM2
pm2 start scripts/agents/empire-ai.js --name "empire-ai"
pm2 save
```

### Run Individual Agents
```bash
# Deal Hunter (one-time run)
node scripts/agents/deal-hunter.js

# With custom threshold
HOT_DEAL_THRESHOLD=10 node scripts/agents/deal-hunter.js
```

### Monitor Status
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs empire-ai

# Check agent state
cat scripts/agents/empire-state.json
```

### Stop the Empire
```bash
pm2 stop empire-ai
# or
pm2 delete empire-ai
```

## Agent State

The Empire AI maintains state in `empire-state.json`:

```json
{
  "lastRun": 1707401234567,
  "agents": {
    "dealHunter": {
      "lastRun": 1707401234567,
      "status": "success",
      "stats": { "dealsPosted": 42 }
    },
    "contentFactory": {
      "lastRun": 1707395000000,
      "status": "success",
      "stats": { "contentCreated": 12 }
    }
  }
}
```

## Performance Metrics

Track in `/content/metrics/`:
- Deals posted per day
- Content generated
- Subscriber growth
- Channel engagement
- Agent uptime

## Future Enhancements

### Phase 2 (Next Week)
- [ ] Growth Agent implementation
- [ ] Community Manager agent (DM responses)
- [ ] Advanced ML scoring (learn from engagement)
- [ ] Multi-channel posting (Twitter, Discord)

### Phase 3 (Future)
- [ ] Competitor monitoring
- [ ] Price tracking & alerts
- [ ] Personalized deal recommendations
- [ ] Automated A/B testing

## Troubleshooting

**Empire AI not running?**
```bash
pm2 restart empire-ai
pm2 logs empire-ai --lines 50
```

**Deals not posting?**
- Check Telegram bot token
- Verify Supabase connection
- Check deal scores in DB

**State file corrupted?**
```bash
rm scripts/agents/empire-state.json
# Restart empire-ai (will recreate)
```

## Architecture

```
Empire AI (Coordinator)
├── Deal Hunter → Telegram
├── Content Factory → /content/
├── Analytics → Metrics
├── Quality Control → Database
└── Growth Agent → New Sources
```

---

**Built by Jay 🔥**  
*Co-CEO, The Hub*
