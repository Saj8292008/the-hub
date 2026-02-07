# Mission Control 🚀

**Real-time monitoring and management for The Hub**

Mission Control provides a comprehensive view of all Hub systems, with both a web dashboard and CLI tools for quick checks and actions.

## Overview

Mission Control tracks:
- ✅ Server health (uptime, memory, CPU)
- 🔍 Scraper activity (all sources, 24h stats)
- 📧 Newsletter subscribers & campaigns
- ✈️ Telegram bot & channel status
- 🔥 Hot deals & watchlists
- 📊 Recent activity feed
- ⚠️ Error monitoring

## Web Dashboard

### Access
```
http://localhost:3000/mission-control
```

### Features
- **Auto-refresh** - Updates every 30 seconds
- **Dark mode** - Clean, professional UI
- **Responsive** - Works on mobile & desktop
- **Real-time metrics** - Live server/scraper/newsletter stats
- **Activity feed** - See latest listings as they come in

### Metrics Cards
1. **Server** - Status, uptime, memory usage, CPU load
2. **Scrapers** - 24h activity, source breakdown, total listings
3. **Newsletter** - Subscriber count, last campaign details
4. **Telegram** - Bot status, channel ID, posts today
5. **Deals** - Hot deals found, active watchlists
6. **Activity** - Recent listings with price & source

## CLI Tools

### Quick Start

```bash
# Full system status
npm run mc

# Quick health check (fast)
npm run mc:quick

# Scraper details
npm run mc:scrapers

# Newsletter stats
npm run mc:newsletter

# Find hot deals
npm run mc:hotdeals

# Restart server
npm run mc:restart

# Health monitor (alerts)
npm run health
```

### Commands

#### `mc` (status)
Full dashboard view in your terminal
- Server stats
- Scraper activity by source
- Newsletter subscribers
- Telegram bot status
- Recent activity

```bash
npm run mc
# or
node scripts/mission-control-cli.js status
```

#### `mc:quick`
Lightning-fast health check
- Server up/down
- Uptime & memory
- Scrapers active?
- Subscriber count

```bash
npm run mc:quick
```

#### `mc:scrapers`
Detailed scraper breakdown
- Total listings in DB
- 24h activity
- Each source status
- Last run times

```bash
npm run mc:scrapers
```

#### `mc:newsletter`
Newsletter stats
- Total subscribers
- Confirmed vs unconfirmed
- Active subscriber list
- Send counts

```bash
npm run mc:newsletter
```

#### `mc:restart`
Safely restart server
- Stops running process
- Starts fresh instance
- Logs to `logs/server.log`

```bash
npm run mc:restart
```

#### `health`
Health monitor with alerts
- Checks server, scrapers, logs
- Sends Telegram alerts on issues
- Tracks consecutive failures
- Cooldown periods to avoid spam

```bash
npm run health
```

## Automated Monitoring

### Health Monitor Script

**File:** `scripts/health-monitor.js`

**What it checks:**
- Server reachability
- Scraper activity (0 listings = alert)
- Recent errors in logs

**Alert conditions:**
- Server down for 2+ consecutive checks → Alert
- Scrapers inactive (0 listings in 24h) for 4+ checks → Alert
- Errors in logs → Alert every hour max

**Setup cron job:**
```bash
# Run health check every 15 minutes
*/15 * * * * cd /Users/sydneyjackson/the-hub && node scripts/health-monitor.js >> logs/health-cron.log 2>&1
```

### Heartbeat Checks

Mission Control integrates with Jay's heartbeat system:
- Runs quick health check
- Updates `memory/heartbeat-state.json`
- Alerts Syd on Telegram for critical issues
- Works in background without interrupting

## API Endpoints

### Dashboard Status
```
GET /api/dashboard/status
```

Returns full system status JSON:
```json
{
  "server": { "status": "online", "uptime": "2d 14h", ... },
  "scrapers": { "last24h": 107, "sources": {...}, ... },
  "newsletter": { "subscribers": 7, ... },
  "telegram": { "botStatus": "active", ... },
  "deals": { "hotDealsToday": 0, ... },
  "activity": [...]
}
```

### Quick Health
```
GET /api/dashboard/health
```

Fast health check:
```json
{
  "status": "ok",
  "uptime": 225317,
  "memory": { "used": 92, "total": 101 }
}
```

### Memory Files (Jay's Notes)
```
GET /api/dashboard/memory
GET /api/dashboard/memory/:date
POST /api/dashboard/memory/note
```

Access Jay's daily memory files and add quick notes.

## Usage Examples

### Morning Check
```bash
# Quick status before coffee
npm run mc:quick
```

### Deep Dive
```bash
# Full system audit
npm run mc

# Check scrapers individually
npm run mc:scrapers

# Review newsletter growth
npm run mc:newsletter
```

### Troubleshooting
```bash
# Server acting up?
npm run mc:restart

# Check logs for errors
npm run health

# View recent activity
npm run mc
```

### Automation
```bash
# Add to cron (every 30 min)
*/30 * * * * cd /Users/sydneyjackson/the-hub && npm run health

# Or use HEARTBEAT.md for periodic checks
```

## Alerts & Notifications

### Telegram Alerts

Health monitor sends alerts to Syd's Telegram when:
- 🔴 Server is down
- ⚠️ Scrapers are inactive
- ⚠️ Errors detected in logs

**Setup:**
1. Set `TELEGRAM_BOT_TOKEN` in `.env`
2. Set `TELEGRAM_OWNER_ID` (Syd's chat ID)
3. Health monitor auto-sends alerts

### Alert Thresholds

- **Server down**: 2 consecutive failures (alert every 30 min max)
- **Scrapers dead**: 4 consecutive checks with 0 activity (alert every 2h max)
- **Log errors**: New errors found (alert every 1h max)

## Dashboard Development

### Files
- `public/mission-control.html` - Web dashboard UI
- `src/api/dashboard.js` - Dashboard API endpoints
- `scripts/mission-control-cli.js` - CLI tool
- `scripts/health-monitor.js` - Automated monitoring

### Extending

**Add new metric:**
1. Update `src/api/dashboard.js` → add data to status endpoint
2. Update `public/mission-control.html` → add card/stat
3. Update CLI → add to display

**Add new command:**
1. Add function to `mission-control-cli.js`
2. Add to COMMANDS array
3. Add case in main() switch
4. Add npm script in package.json

## Troubleshooting

### Dashboard won't load
```bash
# Check server is running
curl http://localhost:3000/health

# If not, start it
npm start

# Or restart
npm run mc:restart
```

### CLI shows "Server not running"
```bash
# Start server first
npm start

# Then try CLI
npm run mc:quick
```

### Health monitor not sending alerts
1. Check Telegram credentials in `.env`
2. Verify bot token is valid
3. Check logs: `cat logs/health-monitor.log`

### No scraper activity
```bash
# Check scrapers
npm run mc:scrapers

# Manually run test scrape
npm run test:scrapers

# Check scheduler config
grep ENABLE_SCRAPER logs/server.log
```

## Performance

- **Dashboard:** ~500ms load time, 30s refresh
- **CLI Quick:** <1s response time
- **CLI Full:** ~2s for complete status
- **Health Monitor:** <5s for full check

## Security

- **Local only:** Dashboard serves on localhost (no external access)
- **No auth (yet):** Assumes local trusted environment
- **Log sanitization:** Errors logged without sensitive data
- **Telegram secure:** Bot token in env, not committed

## Future Enhancements

- [ ] Hot deals viewer in dashboard
- [ ] Jay's memory file browser
- [ ] Alert threshold configuration
- [ ] Historical metrics & charts
- [ ] Database query tool
- [ ] Scraper trigger buttons
- [ ] Newsletter send preview
- [ ] Keyboard shortcuts (r = refresh, etc.)
- [ ] Mobile app (push notifications)
- [ ] Authentication (if exposed publicly)

---

**Built by Jay** - Mission Control for The Hub  
*"Know everything. Control everything. Build everything."*
