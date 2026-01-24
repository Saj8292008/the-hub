# Automated Scraper Scheduler Documentation

## Overview

The Hub now includes a production-grade automated scheduler system that runs scraping jobs in the background without manual triggering. The system includes smart scheduling, error handling with exponential backoff, rate limiting, health monitoring, and admin control APIs.

## Architecture

### Components

1. **EnhancedScheduler** (`src/scheduler/EnhancedScheduler.js`)
   - Core job scheduler infrastructure
   - Handles retries with exponential backoff
   - Rate limiting per job
   - Job queue to prevent overlaps
   - Execution history tracking
   - Event emitter for monitoring

2. **ScraperCoordinator** (`src/scheduler/ScraperCoordinator.js`)
   - Manages all scraping jobs
   - Smart scheduling logic (skip recent scrapes, low-traffic hours)
   - Per-source health tracking
   - Integrates with database and WebSocket
   - Alert checking and notifications

3. **Admin API** (`src/api/scraperAdmin.js`)
   - REST endpoints for controlling scrapers
   - Pause/resume all scraping
   - Manually trigger specific sources
   - Get status and statistics
   - Health check endpoint

## Features

### Smart Scheduling

- **Skip Recent Scrapes**: Checks database and memory cache to avoid scraping too frequently
- **Low-Traffic Hours**: Skips non-urgent scraping during 2am-6am
- **Random Delays**: 2-5 second jitter between requests for anti-ban
- **Priority Queue**: Higher priority jobs execute first

### Error Handling

- **Exponential Backoff**: Retries failed jobs with increasing delays (5s, 10s, 20s)
- **Max Retries**: 3 attempts per job by default
- **Source Health Tracking**: Disables sources after 5 consecutive failures
- **Admin Alerts**: Sends alerts when critical scrapers fail

### Rate Limiting

Per-source rate limits to avoid IP bans:

| Source | Schedule | Rate Limit | Min Interval |
|--------|----------|------------|--------------|
| Reddit | Every 15 min | 4 per hour | 15 minutes |
| eBay | Every 30 min | 2 per hour | 30 minutes |
| WatchUSeek | Every hour | 1 per hour | 60 minutes |

### Monitoring

- Real-time WebSocket events: `scraper:success`, `scraper:failure`, `scraper:newListings`
- Execution history (last 100 runs per job)
- Success rate tracking
- Average response time
- Active jobs counter

### Graceful Shutdown

- Stops accepting new jobs on SIGINT/SIGTERM
- Waits up to 30 seconds for active jobs to finish
- Force exits if timeout exceeded

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Enable scheduler (set to 'true' to activate)
ENABLE_SCRAPER_SCHEDULER=true

# Run all scrapers on startup (optional, default: false)
SCRAPER_RUN_ON_START=false

# Retry configuration
SCRAPER_MAX_RETRIES=3
SCRAPER_RETRY_DELAY=5000

# Rate limits (milliseconds between requests)
SCRAPER_MIN_TIME_CHRONO24=3000
SCRAPER_MIN_TIME_AUTOTRADER=2000
SCRAPER_MIN_TIME_STOCKX=4000

# Logging
LOG_LEVEL=info
NODE_ENV=production

# Admin chat ID for alerts (optional)
TELEGRAM_ADMIN_CHAT_ID=your_chat_id_here
```

### Customizing Schedules

Edit `src/scheduler/ScraperCoordinator.js` to modify source configurations:

```javascript
this.sourceConfig = {
  reddit: {
    schedule: '*/15 * * * *', // Cron expression
    rateLimit: { max: 4, window: 3600000 }, // 4 per hour
    minInterval: 900000, // 15 minutes minimum
    priority: 8, // 1-10, higher = more important
    enabled: true
  },
  // ... other sources
};
```

### Cron Expression Examples

```
*/5 * * * *    # Every 5 minutes
*/15 * * * *   # Every 15 minutes
*/30 * * * *   # Every 30 minutes
0 * * * *      # Every hour at minute 0
0 */2 * * *    # Every 2 hours
0 0 * * *      # Every day at midnight
```

## API Endpoints

### Admin Control

Base path: `/admin/scraper`

#### Get Status
```bash
GET /admin/scraper/status

# Response:
{
  "success": true,
  "data": {
    "scheduler": {
      "totalExecutions": 45,
      "successfulExecutions": 42,
      "failedExecutions": 3,
      "activeJobs": 1,
      "queuedJobs": 0,
      "isPaused": false,
      "registeredJobs": 3,
      "successRate": "93.33"
    },
    "sources": {
      "reddit": {
        "enabled": true,
        "consecutiveFailures": 0,
        "lastSuccess": "2024-01-20T15:30:00Z",
        "avgResponseTime": 2345,
        "totalRequests": 15,
        "schedule": "*/15 * * * *",
        "lastScrape": 1705763400000
      }
    }
  }
}
```

#### Get Statistics
```bash
GET /admin/scraper/stats

# Response:
{
  "success": true,
  "data": {
    "totalExecutions": 45,
    "successfulExecutions": 42,
    "failedExecutions": 3,
    "activeJobs": 1,
    "queuedJobs": 0,
    "isPaused": false,
    "registeredJobs": 3,
    "disabledJobs": 0,
    "jobs": [
      {
        "name": "scrape:reddit",
        "schedule": "*/15 * * * *",
        "isRunning": false,
        "disabled": false,
        "lastExecution": {
          "timestamp": "2024-01-20T15:30:00Z",
          "success": true,
          "duration": 2345
        },
        "consecutiveFailures": 0,
        "successRate": "95.00",
        "recentHistory": [...]
      }
    ]
  }
}
```

#### Pause All Scraping
```bash
POST /admin/scraper/pause

# Response:
{
  "success": true,
  "message": "All scraping paused"
}
```

#### Resume Scraping
```bash
POST /admin/scraper/resume

# Response:
{
  "success": true,
  "message": "Scraping resumed"
}
```

#### Manually Trigger Source
```bash
POST /admin/scraper/run/reddit

# Response:
{
  "success": true,
  "message": "Triggered reddit scraper",
  "data": {
    "success": true,
    "source": "reddit",
    "count": 50,
    "saved": 47,
    "timestamp": "2024-01-20T15:45:00Z"
  }
}
```

#### Run All Scrapers
```bash
POST /admin/scraper/run

# Response:
{
  "success": true,
  "message": "All scrapers triggered",
  "data": [
    {
      "source": "reddit",
      "success": true,
      "count": 50,
      "saved": 47
    },
    {
      "source": "ebay",
      "success": true,
      "count": 30,
      "saved": 28
    }
  ]
}
```

#### Re-enable Disabled Source
```bash
POST /admin/scraper/enable/reddit

# Response:
{
  "success": true,
  "message": "Source reddit re-enabled"
}
```

#### Health Check
```bash
GET /admin/scraper/health

# Response (healthy):
{
  "healthy": true,
  "scheduler": {
    "isPaused": false,
    "activeJobs": 0,
    "successRate": 95.5
  },
  "timestamp": "2024-01-20T15:50:00Z"
}

# Response (unhealthy):
HTTP 503
{
  "healthy": false,
  "scheduler": {
    "isPaused": true,
    "activeJobs": 0,
    "successRate": 45.2
  },
  "timestamp": "2024-01-20T15:50:00Z"
}
```

## Testing

### Local Testing

1. **Start the server with scheduler enabled:**
```bash
ENABLE_SCRAPER_SCHEDULER=true npm start
```

2. **Watch the logs:**
```bash
tail -f logs/combined.log
```

Expected log output:
```
info: ✅ Registered scraper: reddit (*/15 * * * *)
info: ✅ Registered scraper: ebay (*/30 * * * *)
info: ✅ Registered scraper: watchuseek (0 * * * *)
info: 🚀 Starting Scraper Coordinator...
info: ✅ Scheduler started with 3 jobs
info: 🔍 Scraper Coordinator: Active
```

3. **Manually trigger a scrape:**
```bash
curl -X POST http://localhost:3000/admin/scraper/run/reddit
```

4. **Check status:**
```bash
curl http://localhost:3000/admin/scraper/status
```

5. **Monitor WebSocket events:**
```javascript
// In browser console or client app
const socket = io('http://localhost:3000');

socket.on('scraper:success', (data) => {
  console.log('Scraper success:', data);
});

socket.on('scraper:failure', (data) => {
  console.log('Scraper failure:', data);
});

socket.on('scraper:newListings', (data) => {
  console.log('New listings:', data);
});
```

### Testing Error Handling

1. **Test exponential backoff:**
```javascript
// Temporarily break a scraper to test retries
// Watch logs for retry delays: 5s, 10s, 20s
```

2. **Test source disabling:**
```bash
# Cause 5+ consecutive failures
# Source should be disabled automatically
# Check logs for: "🚫 Disabling source reddit due to 5 consecutive failures"
```

3. **Test re-enabling:**
```bash
curl -X POST http://localhost:3000/admin/scraper/enable/reddit
```

### Integration Testing

Run the full test suite:

```bash
# 1. Add watch with low target price
curl -X POST http://localhost:3000/watches \
  -H "Content-Type: application/json" \
  -d '{"brand": "Rolex", "model": "Submariner", "targetPrice": 1}'

# 2. Trigger scraper
curl -X POST http://localhost:3000/admin/scraper/run

# 3. Check if prices updated
curl http://localhost:3000/watches

# 4. Verify alert sent (check Telegram or logs)
grep "Alert" logs/combined.log

# 5. Check price history
curl http://localhost:3000/watch/{id}/history
```

## Deployment

### Render.com Deployment

The `render.yaml` file is already configured with all necessary environment variables.

1. **Push to GitHub:**
```bash
git add .
git commit -m "Add automated scheduler system"
git push origin main
```

2. **Deploy on Render.com:**
   - Navigate to your Render dashboard
   - Click "Manual Deploy" or wait for auto-deploy
   - Verify environment variables are set correctly

3. **Verify scheduler is running:**
```bash
curl https://your-app.onrender.com/admin/scraper/status
```

4. **Monitor logs:**
   - Go to Render dashboard → Your service → Logs
   - Look for: "🔍 Scraper Coordinator: Active"

### Important Notes for Render.com

**Free Tier Limitations:**
- Service spins down after 15 minutes of inactivity
- Scheduler stops when service is sleeping
- Consider upgrading to paid tier for 24/7 operation

**Workarounds:**
1. Use Render Cron Jobs to wake up service periodically
2. Use external uptime monitoring (UptimeRobot, etc.)
3. Upgrade to paid tier for continuous background jobs

### Health Monitoring

Set up monitoring with these endpoints:

- **Status Check**: `GET /health`
- **Scraper Health**: `GET /admin/scraper/health`
- **Full Status**: `GET /admin/scraper/status`

Example UptimeRobot config:
- Monitor Type: HTTP(s)
- URL: https://your-app.onrender.com/admin/scraper/health
- Interval: 5 minutes
- Expected Status Code: 200

## Troubleshooting

### Scheduler Not Starting

**Problem:** Logs show "Scraper Coordinator: Disabled"

**Solution:**
```bash
# Check environment variable
echo $ENABLE_SCRAPER_SCHEDULER

# Should be 'true', not 'false' or empty
# Update .env file:
ENABLE_SCRAPER_SCHEDULER=true
```

### Jobs Not Executing

**Problem:** Scheduler starts but jobs never run

**Check:**
1. Verify cron expressions are valid
2. Check if jobs are paused: `curl /admin/scraper/status`
3. Look for errors in logs: `grep "ERROR" logs/error.log`
4. Check if source is disabled due to failures

**Solution:**
```bash
# Resume if paused
curl -X POST http://localhost:3000/admin/scraper/resume

# Re-enable disabled source
curl -X POST http://localhost:3000/admin/scraper/enable/reddit

# Manually trigger to test
curl -X POST http://localhost:3000/admin/scraper/run/reddit
```

### High Failure Rate

**Problem:** Success rate below 50%

**Check:**
1. Rate limits being exceeded
2. Network issues
3. Source website changes (HTML structure)
4. IP being blocked

**Solution:**
1. Increase `minInterval` to reduce frequency
2. Add delays between requests
3. Update scraper selectors
4. Use proxies (future enhancement)

### Memory Leaks

**Problem:** Memory usage increasing over time

**Check:**
1. Execution history size (limited to 100 per job)
2. Job queue size
3. WebSocket connections not closing

**Solution:**
- Restart service periodically
- Monitor with `GET /admin/scraper/stats`
- Set up memory alerts in Render

### Database Connection Issues

**Problem:** "Database unavailable" errors

**Check:**
1. Supabase credentials in `.env`
2. Database connection limits
3. Network connectivity

**Solution:**
- Falls back to local storage automatically
- Check Supabase dashboard for issues
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`

## Performance Optimization

### Batch Operations

The system already uses batch inserts:

```javascript
// Instead of:
for (const listing of listings) {
  await db.insert(listing); // Slow!
}

// Uses:
await db.insertBatch(listings); // Fast!
```

### Concurrent Jobs

Maximum concurrent jobs is configurable:

```javascript
// In EnhancedScheduler constructor
this.config = {
  maxConcurrent: 2 // Adjust based on server resources
};
```

### Rate Limit Tuning

Adjust per-source in `ScraperCoordinator.js`:

```javascript
this.sourceConfig = {
  reddit: {
    rateLimit: { max: 4, window: 3600000 }, // 4 per hour
    // Increase max or window based on source tolerance
  }
};
```

## Future Enhancements

Planned improvements:

1. **Dynamic Schedule Updates** - Update schedules via API without redeployment
2. **Distributed Scraping** - Use Bull queue with Redis for multi-worker setup
3. **Proxy Rotation** - Avoid IP bans with rotating proxies
4. **ML-Based Scheduling** - Learn optimal scrape times based on historical data
5. **Webhook Support** - Get notified by sources instead of polling
6. **Advanced Analytics** - Dashboard with charts and trends
7. **Multi-User Alerts** - Send notifications to multiple users
8. **Price Prediction** - ML model to predict price changes

## Support

For issues or questions:

1. Check logs: `logs/combined.log` and `logs/error.log`
2. Review this documentation
3. Check status endpoint: `/admin/scraper/status`
4. Create GitHub issue with logs and error details

## Summary

The automated scheduler system provides:

✅ Background scraping without manual triggering
✅ Smart scheduling with rate limiting
✅ Production-grade error handling
✅ Real-time monitoring via WebSocket
✅ Admin control API
✅ Graceful shutdown
✅ Database integration with batch operations
✅ Source health tracking
✅ Ready for Render.com deployment

The system is production-ready and can be deployed immediately to Render.com or any Node.js hosting platform.
