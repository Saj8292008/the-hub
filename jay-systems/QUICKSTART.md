# Jay's Autonomous Systems - Quick Start

Get Jay working autonomously in 5 minutes.

## 1. Initialize

```bash
cd /Users/sydneyjackson/the-hub
node jay-systems/tools/init.js
```

This creates:
- `data/` - Task queue and memory storage
- `logs/` - Activity logs
- `state.json` - Brain state
- Initial configuration

## 2. Test the Brain

```bash
node jay-systems/core/brain.js
```

You should see:
```
🧠 Initializing Jay's Brain...
✅ Config loaded (Autonomy Level: 2)
📝 Starting with fresh state
🧠 Brain is online
```

The brain will make a test decision and show you its learning process. Press Ctrl+C to stop.

## 3. Test the Task Queue

```bash
node jay-systems/tasks/queue.js
```

This adds example tasks and processes one. You'll see:
- Tasks being queued with priorities
- Next task selection
- Task execution simulation

## 4. Test Health Monitoring

```bash
node jay-systems/monitors/health.js
```

Checks:
- Hub server (port 3001)
- Mission Control (port 4001)
- Clawdbot gateway
- Disk space

Reports any issues found.

## 5. Check Overall Status

```bash
node jay-systems/tools/status.js
```

Shows:
- Current autonomy level
- Brain activity
- Task queue status
- Memory/learning stats

## Understanding Autonomy Levels

### Level 2 (Default - Supervised)
**What Jay does:**
- Monitors systems automatically
- Fixes common errors (restarts services)
- Runs scheduled tasks
- Creates PRs for features
- Sends you notifications

**What requires approval:**
- Deploying to production
- Changing configuration
- Sending emails to users

### Change Autonomy Level

```bash
# Set to Level 1 (Assisted - safer, more approvals)
node jay-systems/tools/set-autonomy.js 1

# Set to Level 3 (More autonomous)
node jay-systems/tools/set-autonomy.js 3
```

## Real-World Usage

### Scenario 1: Hub Server Crashes

**Without Jay:**
1. You notice server is down
2. SSH into machine
3. Check logs
4. Restart service
5. Verify it's back up

**With Jay (Autonomy Level 2+):**
1. Jay detects server down
2. Jay decides to restart (low risk)
3. Jay executes restart
4. Jay verifies success
5. Jay notifies you it was handled
6. Jay learns from the outcome

### Scenario 2: Hot Deal Found

**Without Jay:**
1. Deal Hunter finds hot deal (score 18)
2. Waits for you to notice
3. You manually post to Telegram
4. Hope you didn't miss the window

**With Jay (Autonomy Level 2+):**
1. Deal Hunter finds hot deal
2. Jay evaluates deal quality
3. Jay decides to post (high value)
4. Jay posts to Telegram automatically
5. Jay tracks engagement
6. Jay learns what deals work best

### Scenario 3: Morning Routine

**Without Jay:**
1. You wake up
2. Check system health manually
3. Review overnight work
4. Prioritize tasks for today
5. Start working

**With Jay (Autonomy Level 2+):**
1. Jay wakes at 6am
2. Jay checks all systems
3. Jay reviews overnight work
4. Jay prioritizes tasks
5. Jay sends you morning brief
6. You wake to organized inbox

## Integration with Empire

Jay's Brain coordinates the Empire agents:

```
Morning (7am):
  ├─ Brain: "Time for morning routine"
  ├─ Brain spawns: Data Analyst
  │  └─ Data Analyst generates report
  ├─ Brain spawns: Deal Hunter
  │  └─ Deal Hunter checks for hot deals
  └─ Brain: Compiles and sends morning brief
```

## Configuration

Edit `jay-systems/config.json`:

```json
{
  "autonomyLevel": 2,
  "workHours": {
    "start": "06:00",  // Jay starts working
    "end": "23:00"     // Jay goes to sleep
  },
  "capabilities": {
    "autoFix": true,      // Auto-fix known issues
    "autoRestart": true,  // Auto-restart services
    "autoDeploy": false,  // Deploy to production (careful!)
    "autoCommit": true,   // Commit work to git
    "autoPR": true        // Create pull requests
  }
}
```

## Monitoring Jay

### Mission Control Dashboard
http://localhost:4001

Shows:
- Jay's current activity
- Active agents
- Task queue
- Recent decisions

### Logs
```bash
# View brain decisions
tail -f jay-systems/logs/brain.log

# View task execution
tail -f jay-systems/logs/tasks.log
```

### Notifications
Jay sends Telegram notifications for:
- Important decisions
- Issues detected
- Work completed
- Approval needed

## Safety Features

1. **Rollback** - All actions can be undone
2. **Dry Run** - Test without executing
3. **Rate Limiting** - Max 20 tasks/hour
4. **Kill Switch** - Emergency stop
5. **Audit Log** - Every action recorded

## Emergency Stop

If Jay goes rogue:

```bash
# Stop the brain
pkill -f "jay-systems/core/brain"

# Set autonomy to manual
node jay-systems/tools/set-autonomy.js 0

# Check what it did
node jay-systems/tools/status.js
```

## Next Steps

1. **Let Jay run overnight** - See what it builds
2. **Review morning brief** - Check its decisions
3. **Adjust autonomy** - Based on trust level
4. **Train Jay** - Give feedback on decisions
5. **Expand capabilities** - Add more monitors and tasks

## Philosophy

**"A good co-founder works while you sleep."**

Jay should:
- Find and fix problems before you notice
- Make smart decisions based on learned patterns
- Take initiative on routine tasks
- Only bother you with important decisions
- Get better every day

## Support

Questions? Check:
- `jay-systems/README.md` - Full documentation
- Mission Control dashboard - Live status
- Daily memory files - What Jay did

---

Built by Jay, for Jay & Syd 🤖
