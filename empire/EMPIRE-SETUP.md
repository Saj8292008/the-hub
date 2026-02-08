# 🏛️ The Hub Empire - Setup Guide

Multi-agent system inspired by Alex Finn's AI team structure.

## What This Is

The Hub Empire is a **multi-agent coordination system** where specialized AI agents handle different aspects of running The Hub business:

- 💼 **Deal Hunter** - Finds and scores hot deals
- ✍️ **Content Manager** - Creates social media posts
- 📊 **Data Analyst** - Tracks metrics and insights
- 🚀 **Growth Lead** - Develops marketing strategies
- 🛠️ **Dev Agent** - Builds features and fixes bugs

Each agent is a separate Clawdbot session with its own personality, model, and tasks.

## Architecture

```
🔥 JAY (CEO) - Main Clawdbot instance
    |
    ├─ 💼 Deal Hunter (Claude Sonnet 4.5)
    ├─ ✍️ Content Manager (GPT-4 Turbo)
    ├─ 📊 Data Analyst (o1-preview)
    ├─ 🚀 Growth Lead (Claude Opus 4)
    └─ 🛠️ Dev Agent (Claude Sonnet 4.5)
```

## Files Created

### Core System
- `src/agents/definitions.js` - Agent configs (roles, models, tasks)
- `src/agents/empireController.js` - Agent management logic
- `src/agents/empireBot.js` - Telegram interface
- `src/agents/clawdbotBridge.js` - Integration with Clawdbot sessions

### Tools
- `scripts/empire-cli.js` - Command-line interface
- `empire/dashboard.html` - Visual org chart

### Data
- `empire/state.json` - Active agents state
- `empire/reports/` - Agent reports
- `empire/spawn-requests/` - Pending agent spawns

## Quick Start

### 1. Test the CLI

```bash
cd /Users/sydneyjackson/the-hub

# See available agents
node scripts/empire-cli.js list

# Show status
node scripts/empire-cli.js status

# Spawn an agent
node scripts/empire-cli.js spawn deal-hunter

# Stop an agent
node scripts/empire-cli.js stop deal-hunter
```

### 2. View Dashboard

Open `empire/dashboard.html` in a browser to see the visual org chart.

```bash
open empire/dashboard.html
```

### 3. Telegram Integration (Coming Soon)

To use via @thehubempire channel:

```bash
# In Telegram
/empire status
/empire spawn deal-hunter
/empire spawn content-manager Create 3 Twitter posts
/empire list
```

## How It Works

### Agent Lifecycle

1. **Spawn**: Agent session created with specific role/task
2. **Execute**: Agent performs work (find deals, create content, etc.)
3. **Report**: Agent saves report to `empire/reports/`
4. **Complete**: Session ends, report available

### Agent Coordination

Agents don't talk to each other directly - they all report to Jay (you/main bot):

```
Deal Hunter finds hot deal
    ↓
Reports to Jay
    ↓
Jay spawns Content Manager
    ↓
Content Manager creates post
    ↓
Reports back to Jay
```

### Scheduling

Agents can run:
- **On-demand**: `/empire spawn deal-hunter`
- **Scheduled**: Via cron (every 30 min, daily, weekly)
- **Triggered**: When specific events occur

## Agent Details

### 💼 Deal Hunter
- **When**: Every 30 minutes
- **What**: Scans deals, scores them, flags hot items (score >12)
- **Output**: List of hot deals to post

### ✍️ Content Manager
- **When**: 3x daily (8am, 2pm, 7pm)
- **What**: Creates Instagram/Twitter/Telegram content
- **Output**: Posts ready to publish

### 📊 Data Analyst
- **When**: Daily at 7am
- **What**: Generates analytics report
- **Output**: Growth metrics, insights, recommendations

### 🚀 Growth Lead
- **When**: Weekly on Monday
- **What**: Reviews performance, proposes experiments
- **Output**: Strategy document

### 🛠️ Dev Agent
- **When**: Nightly at 2am or on-demand
- **What**: Fixes bugs, builds features
- **Output**: Code commits, deploy status

## Integration with Clawdbot

Each agent spawns as a Clawdbot sub-agent session:

```javascript
sessions_spawn({
  label: 'Deal Hunter',
  model: 'anthropic/claude-sonnet-4-5',
  task: 'Find hot deals and report back...',
  cleanup: 'delete'
})
```

The agent executes, saves its report, and the session ends.

## Next Steps

### Phase 1: Manual Control ✅
- [x] Agent definitions
- [x] Empire controller
- [x] CLI tool
- [x] Dashboard

### Phase 2: Clawdbot Integration (In Progress)
- [ ] Hook into sessions_spawn
- [ ] Auto-spawn from empire-cli
- [ ] Report parsing and storage
- [ ] Telegram bot commands

### Phase 3: Automation
- [ ] Scheduled agent runs
- [ ] Event-triggered spawning
- [ ] Agent chaining (one agent triggers another)
- [ ] Performance monitoring

### Phase 4: Intelligence
- [ ] Agents learn from past reports
- [ ] Cross-agent coordination
- [ ] Self-improvement loops
- [ ] Autonomous operation

## Usage Examples

### Morning Routine
```bash
# Jay wakes up, spawns morning agents
node scripts/empire-cli.js spawn data-analyst
node scripts/empire-cli.js spawn deal-hunter
node scripts/empire-cli.js spawn content-manager
```

### Ad-Hoc Tasks
```bash
# Need a quick market analysis
node scripts/empire-cli.js spawn growth-lead "Analyze TikTok opportunity"

# Need Instagram posts
node scripts/empire-cli.js spawn content-manager "Create 5 Instagram stories"

# Fix a bug
node scripts/empire-cli.js spawn dev-agent "Fix Supabase API key issue"
```

### Monitoring
```bash
# Check what agents are active
node scripts/empire-cli.js status

# Get latest reports
node scripts/empire-cli.js report
```

## Customization

### Add New Agents

Edit `src/agents/definitions.js`:

```javascript
customerSupport: {
  id: 'customer-support',
  label: 'Customer Support',
  title: 'Head of Support',
  emoji: '💬',
  model: 'anthropic/claude-sonnet-4-5',
  systemPrompt: 'You handle customer questions...',
  defaultTask: 'Check inbox and respond to customers'
}
```

### Change Agent Models

```javascript
// Use o1 for more reasoning
dataAnalyst: {
  model: 'openai/o1'  // Instead of o1-preview
}
```

### Adjust Schedules

```javascript
dealHunter: {
  schedule: {
    interval: 'every 15 minutes'  // Run more frequently
  }
}
```

## Troubleshooting

### Agent Not Spawning
- Check `empire/spawn-requests/` for stuck requests
- Verify Clawdbot session_spawn is available
- Check empire-cli.js logs

### Reports Not Saving
- Ensure `empire/reports/` exists
- Check agent has write permissions
- Verify report format in agent prompt

### Dashboard Not Updating
- Refresh the page
- Check browser console for errors
- API endpoint might not be running

## Security

- Agents have **limited permissions** based on role
- Dev Agent has code access, but others don't
- All agent actions logged
- Can kill any agent instantly

## Future Ideas

- **Agent personalities**: Give each agent a distinct voice
- **Agent learning**: Agents remember past successes
- **Agent voting**: Multiple agents weigh in on decisions
- **Agent marketplace**: Share agent configs with others
- **Visual programming**: Drag-drop agent workflows

---

Built by Jay for The Hub Empire 🏛️
Inspired by Alex Finn's multi-agent system
