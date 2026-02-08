# 🏛️ The Hub Empire - Demo

Quick demonstration of the multi-agent system.

## Visual Org Chart

```
         🔥 JAY
   CEO / Chief Operating Officer
              |
    ┌────┬────┼────┬────┐
    |    |    |    |    |
    
   💼 🟢        ✍️ ⚪       📊 ⚪       🚀 ⚪       🛠️ ⚪
Deal Hunter  Content   Data      Growth    Dev
            Manager   Analyst    Lead      Agent
```

## Example Usage

### Morning Routine

```bash
# 7:00 AM - Morning reports
node scripts/empire-cli.js spawn data-analyst

# Output:
📊 Analytics Report
📈 Growth: +12 subscribers (+15% vs last week)
🔥 Hot channel: Telegram (45% engagement)
🎯 Recommendation: Double down on Telegram content
```

### Find Hot Deals

```bash
node scripts/empire-cli.js spawn deal-hunter
```

Agent scans all scraped deals and reports:

```
🔍 Deal Hunter Report
- Deals scanned: 156
- Hot deals found: 8 (score >12)
- Top deal: Seiko SKX007 at $180 (score: 18)
  Originally $350, 49% off
- Action needed: Post to Telegram immediately
```

### Create Content

```bash
node scripts/empire-cli.js spawn content-manager "Create 3 Instagram posts for today's deals"
```

Agent generates:

```
📝 Content Report
- Posts created: 3

Post 1 (8am):
🌅 Morning Deal Alert!
Seiko SKX007 - $180 (was $350)
49% OFF 🔥
[Image: deal-card-1.png]
#watchdeals #seiko

Post 2 (2pm):
⌚ Afternoon Watch Drop
Citizen Eco-Drive - $220
Limited stock!
[Image: deal-card-2.png]

Post 3 (7pm):
🌙 Evening Roundup
Top 5 deals today - swipe for all
[Carousel: 5 deal cards]
```

### Growth Strategy

```bash
node scripts/empire-cli.js spawn growth-lead
```

Agent analyzes and proposes:

```
🚀 Growth Strategy

📌 Current focus: Growing Telegram to 1000 members

🧪 Tests to run:
1. TikTok experiment - post deal videos 2x/day
2. Discord server - create dedicated community
3. Referral program - give 10% off for referrals

📈 Expected impact:
- TikTok: +200 followers/week if viral
- Discord: +50 engaged members
- Referrals: 20% conversion rate

💡 Priority: Start with TikTok - lowest effort, high upside
```

### Fix Bugs

```bash
node scripts/empire-cli.js spawn dev-agent "Fix the Supabase API key issue"
```

Agent works:

```
🛠️ Dev Report
✅ Fixed: Supabase API key issue
   - Added SUPABASE_SERVICE_ROLE_KEY to .env
   - Updated all imports to use correct key
   - Tested connection - working

🚀 Deployed: No deployment needed (config only)

🐛 Found: Server still showing as down in health check
   - Investigating port mismatch (3000 vs 3001)

⚡ Status: All systems functional except health endpoint
```

## Agent Coordination

Agents work together through Jay (CEO):

### Example Flow: New Deal → Posted

```
1. Deal Hunter finds hot deal (score 18)
   ↓
2. Reports to Jay: "Found hot deal - needs immediate post"
   ↓
3. Jay spawns Content Manager: "Create Instagram post for this deal"
   ↓
4. Content Manager creates post with image and caption
   ↓
5. Reports back with post ready
   ↓
6. Jay posts to Instagram (or queues for manual review)
```

### Example Flow: Weekly Strategy

```
1. Monday 9am: Growth Lead spawns automatically
   ↓
2. Reviews last week's metrics from Data Analyst
   ↓
3. Proposes 3 growth experiments
   ↓
4. Jay reviews and approves
   ↓
5. Dev Agent spawned to build necessary features
   ↓
6. Content Manager updates messaging
```

## Real Commands You Can Run Now

```bash
cd /Users/sydneyjackson/the-hub

# See the empire
node scripts/empire-cli.js status

# List all agents
node scripts/empire-cli.js list

# Spawn Deal Hunter
node scripts/empire-cli.js spawn deal-hunter

# Spawn Content Manager with custom task
node scripts/empire-cli.js spawn content-manager "Create 5 tweets about today's hot deals"

# Spawn Growth Lead
node scripts/empire-cli.js spawn growth-lead "Analyze TikTok opportunity"

# Spawn Dev Agent
node scripts/empire-cli.js spawn dev-agent "Build Instagram auto-poster"

# Stop an agent
node scripts/empire-cli.js stop deal-hunter

# Check status again
node scripts/empire-cli.js status
```

## Watch It Work

1. Open `empire/dashboard.html` in browser
2. Run `node scripts/empire-cli.js spawn deal-hunter` in terminal
3. Watch status change from ⚪ to 🟢
4. Agent executes and reports back
5. Status returns to ⚪ when done

## What's Next

### Phase 1: Manual Control ✅
You spawn agents via CLI when needed

### Phase 2: Automation (Next)
Agents spawn on schedule:
- Deal Hunter every 30 min
- Content Manager 3x daily
- Data Analyst daily at 7am
- Growth Lead weekly on Monday
- Dev Agent nightly at 2am

### Phase 3: Intelligence (Future)
Agents learn and coordinate:
- Deal Hunter learns what sells well
- Content Manager optimizes based on engagement
- Agents trigger each other automatically
- Self-improving system

---

**The empire is yours to command.** 🏛️
