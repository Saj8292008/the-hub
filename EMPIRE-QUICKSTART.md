# 🏰 The Hub Empire AI - Quick Start

## What Is This?

Your business now runs itself. The Hub Empire AI is a fleet of autonomous agents that:

- 🔍 **Hunts deals 24/7** - Finds and posts hot deals automatically
- 📝 **Creates content** - Writes blog posts, social media, newsletters
- 📊 **Tracks metrics** - Monitors growth, engagement, performance  
- 🛡️ **Maintains quality** - Cleans data, removes spam, improves listings
- 💰 **Finds opportunities** - Discovers new sources, tests strategies

## Launch in 30 Seconds

```bash
cd /Users/sydneyjackson/the-hub
./scripts/agents/launch-empire.sh
```

That's it! The empire is now running.

## Check Status

```bash
# See all agents
pm2 status

# View live logs
pm2 logs empire-ai

# Check agent performance
cat scripts/agents/empire-state.json
```

## What's Running?

### Empire AI (Coordinator)
- Runs every 5 minutes
- Delegates work to specialized agents
- Auto-recovers from failures
- Logs everything

### Active Agents

**Deal Hunter** (every 10 min)
- Scans for deals with score >= 12
- Auto-posts to Telegram
- Tracks posted deals (no duplicates)

**Content Factory** (every 6 hours)
- Generates daily digest
- Creates social posts
- Writes newsletter content
- Saves to `/content/`

**Analytics** (every hour)
- Counts listings, subscribers
- Tracks growth trends
- Logs metrics

**Quality Control** (every 30 min)
- Removes old deals (>30 days)
- Validates data quality
- Cleans up spam

## Stop the Empire

```bash
pm2 stop empire-ai
```

## Restart

```bash
pm2 restart empire-ai
```

## View Logs

```bash
# Live tail
pm2 logs empire-ai

# Last 100 lines
pm2 logs empire-ai --lines 100

# Error logs only
pm2 logs empire-ai --err
```

## Customize

Edit agent schedules in `scripts/agents/empire-ai.js`:

```javascript
// Deal Hunter - change from 10 to 5 minutes
if (now - lastRun > 5 * 60 * 1000) {
  await this.runDealHunter();
}
```

## Troubleshooting

**Empire not starting?**
- Check PM2 is installed: `npm install -g pm2`
- Verify .env has all keys
- Check logs: `pm2 logs empire-ai --lines 50`

**Deals not posting?**
- Verify `TELEGRAM_BOT_TOKEN` in .env
- Check `TELEGRAM_CHANNEL_ID` is correct
- Test manually: `node scripts/agents/deal-hunter.js`

**State file corrupted?**
```bash
rm scripts/agents/empire-state.json
pm2 restart empire-ai
```

## Performance

The empire uses minimal resources:
- CPU: <5% (idle most of the time)
- Memory: ~50MB per agent
- Network: Bursts during scraping/posting

## Next Steps

1. **Monitor for 24 hours** - Let it run, watch the logs
2. **Review posted deals** - Check Telegram channel
3. **Adjust thresholds** - Tune scores, timing, content
4. **Add more agents** - Growth agent, community manager

---

**You're now running an autonomous business.** 🚀

Go to sleep. Wake up to progress.

*Built by Jay 🔥*
