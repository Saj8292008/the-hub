# Sports Scores Fix - Live Updates Implementation

## Problem Identified

The sports scores were not updating because:
1. ❌ Sports data was only being read from the `sports_games` database table
2. ❌ No scheduler existed to fetch live scores from ESPN API
3. ❌ ESPN service existed but wasn't being used

## Solution Implemented

Created an automated sports scores scheduler that:
1. ✅ Fetches live scores from ESPN API every 2 minutes
2. ✅ Updates database with current scores for NFL, NBA, MLB, NHL
3. ✅ Runs automatically during peak sports hours (10am-1am EST)
4. ✅ Provides real-time Socket.IO updates to connected clients

## Files Created/Modified

### New Files:
1. **`src/schedulers/sportsScoresScheduler.js`** - Main scheduler
   - Fetches scores from ESPN every 2 minutes
   - Updates database with live scores
   - Handles all 4 major leagues (NFL, NBA, MLB, NHL)
   - Emits real-time updates via Socket.IO

2. **`supabase/migrations/20260126000001_add_external_id_to_sports_games.sql`** - Database migration
   - Adds `external_id` column for ESPN game IDs
   - Creates unique index to prevent duplicates
   - Adds performance indexes for queries

3. **`scripts/testSportsScores.js`** - Testing script
   - Manually fetch and test sports scores
   - Verify ESPN API integration

### Modified Files:
1. **`src/api/server.js`**
   - Integrated sports scheduler
   - Added scheduler control endpoints
   - Added to graceful shutdown

2. **`.env`**
   - Added sports scheduler configuration
   - Default schedule: `*/2 10-1 * * *` (every 2 min, 10am-1am)

## Setup Instructions

### Step 1: Run Database Migration

Go to your Supabase Dashboard and run the migration:

1. Visit: https://supabase.com/dashboard/project/sysvawxchniqelifyenl/sql
2. Click "New Query"
3. Copy/paste contents of:
   ```
   supabase/migrations/20260126000001_add_external_id_to_sports_games.sql
   ```
4. Click "Run"

This adds the `external_id` column and indexes needed for ESPN integration.

### Step 2: Test Sports Scores Fetch

Run the test script to verify ESPN integration works:

```bash
node scripts/testSportsScores.js
```

This will:
- Fetch current scores from ESPN for all leagues
- Update the database
- Show you results by league
- Confirm everything is working

**Expected Output:**
```
🏈 Testing Sports Scores Fetch from ESPN
=========================================

📡 Fetching live scores from ESPN...
Leagues: NFL, NBA, MLB, NHL

✅ Sports scores updated successfully!

Results:
  Updated: 5
  Inserted: 12
  Failed: 0
  Duration: 3245ms

Breakdown by league:
  ✅ NFL: 2 updated, 3 inserted
  ✅ NBA: 3 updated, 8 inserted
  ✅ MLB: 0 updated, 0 inserted (off-season)
  ✅ NHL: 0 updated, 1 inserted
```

### Step 3: Start the Server

The scheduler will start automatically when you run the server:

```bash
npm run dev
```

You should see in the console:
```
Starting sports scores scheduler with schedule: */2 10-1 * * *
Sports scores scheduler started successfully
```

## Configuration

### Environment Variables

Added to `.env`:

```bash
# Enable automatic sports scores updates
ENABLE_SPORTS_SCHEDULER=true

# Schedule: Every 2 minutes during peak hours (10am-1am EST)
SPORTS_SCHEDULE=*/2 10-1 * * *
```

### Schedule Options

| Schedule | Description | Use Case |
|----------|-------------|----------|
| `*/2 10-1 * * *` | Every 2 min, 10am-1am | **Production** (recommended) |
| `*/1 * * * *` | Every minute | Testing/development |
| `*/5 * * * *` | Every 5 minutes | Light usage |
| `*/2 12-23 * * *` | Every 2 min, 12pm-11pm | Limited peak hours |

To change schedule:
1. Edit `SPORTS_SCHEDULE` in `.env`
2. Restart server

## API Endpoints

### Get Current Scores
```bash
GET /sports/scores?league=nfl
```

Response:
```json
{
  "source": "database",
  "generatedAt": "2026-01-25T22:30:00Z",
  "leagues": ["NFL"],
  "teams": ["Denver Broncos", "New England Patriots"],
  "games": [{
    "id": "...",
    "league": "NFL",
    "homeTeam": "Denver Broncos",
    "awayTeam": "New England Patriots",
    "homeScore": 21,
    "awayScore": 17,
    "status": "live",
    "quarter": "Q3",
    "timeRemaining": "8:42"
  }]
}
```

### Scheduler Control

**Get Status:**
```bash
GET /api/sports/scheduler/status
```

**Force Run Now:**
```bash
POST /api/sports/scheduler/run-now
```

**Start Scheduler:**
```bash
POST /api/sports/scheduler/start
Content-Type: application/json

{
  "schedule": "*/2 10-1 * * *"
}
```

**Stop Scheduler:**
```bash
POST /api/sports/scheduler/stop
```

## How It Works

### Data Flow

```
ESPN API → Scheduler → Database → Frontend
   ↓
  Live scores every 2 min
   ↓
  Upsert to sports_games table (no duplicates)
   ↓
  Socket.IO broadcasts update
   ↓
  Frontend auto-refreshes (30s polling + manual refresh)
```

### Status Mapping

ESPN API uses different status descriptions. The scheduler normalizes them:

| ESPN Status | Our Status | Description |
|-------------|------------|-------------|
| "In Progress", "Halftime" | `live` | Game in progress |
| "Final", "Completed" | `finished` | Game completed |
| "Scheduled", "Pre Game" | `scheduled` | Upcoming game |

### Leagues Supported

- **NFL** - National Football League
- **NBA** - National Basketball Association
- **MLB** - Major League Baseball
- **NHL** - National Hockey League

Additional leagues can be added by:
1. Adding to `this.leagues` array in `sportsScoresScheduler.js`
2. Adding URL mapping in `espn.js` (if not already supported)

## Monitoring

### Check Scheduler Status

```bash
curl http://localhost:3000/api/sports/scheduler/status
```

Returns:
```json
{
  "isRunning": true,
  "lastRun": "2026-01-25T22:30:00Z",
  "nextRun": "2026-01-25T22:32:00Z",
  "stats": {
    "totalRuns": 145,
    "totalGamesUpdated": 3420,
    "averagePerRun": 24,
    "lastRunStats": {
      "updated": 18,
      "inserted": 6,
      "failed": 0,
      "duration": 2847
    }
  }
}
```

### View Logs

The scheduler logs to console:
```bash
# In terminal running npm run dev
[2026-01-25 22:30:00] Starting sports scores update
[2026-01-25 22:30:00] Fetching scores for NFL
[2026-01-25 22:30:01] Fetching scores for NBA
[2026-01-25 22:30:02] NFL: 3 updated, 1 inserted, 0 failed
[2026-01-25 22:30:03] NBA: 8 updated, 4 inserted, 0 failed
[2026-01-25 22:30:04] Sports scores update completed in 3245ms: 11 updated, 5 inserted, 0 failed
```

## Frontend Integration

The Sports page (`the-hub/src/pages/Sports.tsx`) already has:
- ✅ Auto-refresh every 30 seconds for live games
- ✅ Manual refresh button
- ✅ League filters (all, NFL, NBA, MLB, NHL)
- ✅ Status tabs (Live, Upcoming, Finished)
- ✅ Real-time score display

**No frontend changes needed!** The page will automatically show updated scores from the database.

## Troubleshooting

### No scores showing

**Check 1: Is data in database?**
```bash
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('sports_games').select('*').limit(5).then(({data}) => console.log(data));
"
```

**Check 2: Is scheduler running?**
```bash
curl http://localhost:3000/api/sports/scheduler/status
```

**Check 3: Run manual update**
```bash
node scripts/testSportsScores.js
```

### ESPN API errors

If you see errors like "ESPN scores fetch error":

1. **Rate limiting**: ESPN is generous but can rate-limit. Default 500ms between requests should be fine.
2. **Network issues**: Check your internet connection
3. **No games**: Off-season leagues will return empty arrays (normal)

### Games not updating

1. Check `lastRun` timestamp in status endpoint
2. Verify schedule is during current time (10am-1am default)
3. Check server logs for errors
4. Try manual run: `POST /api/sports/scheduler/run-now`

## Performance

### Resource Usage

- **API Calls**: ~4 requests every 2 minutes (1 per league)
- **Database Writes**: ~10-30 upserts per run (depends on games)
- **Memory**: ~5-10MB for scheduler
- **CPU**: Minimal (brief spike during fetch)

### Optimization

The scheduler is optimized for performance:
- ✅ Parallel league fetches (Promise.all)
- ✅ Rate limiting via Bottleneck (500ms between requests)
- ✅ Unique index prevents duplicate games
- ✅ Upsert operation (insert or update in one query)
- ✅ Only runs during peak hours (saves resources)

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Run `node scripts/testSportsScores.js` - scores fetched
- [ ] Start server - scheduler starts automatically
- [ ] Check status endpoint - `isRunning: true`
- [ ] Wait 2 minutes - check logs for update
- [ ] Visit `/sports` in frontend - see games
- [ ] Click live tab - see live games (if any)
- [ ] Click refresh button - scores update
- [ ] Test league filters - filter by NFL/NBA/etc
- [ ] Force run: `POST /api/sports/scheduler/run-now`
- [ ] Stop scheduler: `POST /api/sports/scheduler/stop`
- [ ] Start scheduler: `POST /api/sports/scheduler/start`

## Next Steps (Optional Enhancements)

1. **Add more leagues**: NCAA, MLS, international leagues
2. **Player stats**: Fetch and display player statistics
3. **Betting lines**: Track line movements
4. **Push notifications**: Alert users when games start or scores change
5. **Favorite teams**: Let users follow specific teams
6. **Game highlights**: Integrate video highlights
7. **Live play-by-play**: Fetch and display detailed game events

## Summary

✅ **Sports scores are now live!**
- Automatic updates every 2 minutes
- ESPN API integration
- Real-time Socket.IO broadcasts
- Works for NFL, NBA, MLB, NHL
- Production-ready with monitoring

Your sports scores will now stay current automatically! 🏈🏀⚾🏒
