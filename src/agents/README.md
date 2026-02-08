# The Hub Empire - Multi-Agent System

**Inspired by Alex Finn's agent org chart**

## Architecture

Each agent is a specialized sub-session with:
- **Role**: Specific job function (Deal Hunter, Content Manager, etc.)
- **Model**: Best AI model for the task
- **Tools**: Permissions and capabilities
- **Channel**: Reports to @thehubempire

## Agents

### 🔥 Jay - CEO / Chief Operating Officer
- **You + Main Clawdbot instance**
- Oversees all operations
- Makes executive decisions
- Coordinates other agents

### 💼 Deal Hunter - Chief Sourcing Officer
- **Model**: Claude Sonnet 4.5
- **Jobs**: 
  - Monitor scrapers for hot deals
  - Score and filter deals
  - Alert on score >15 items
  - Update deal database
- **Tools**: Database access, web scraping
- **Schedule**: Runs every 30 min

### ✍️ Content Manager - Chief Marketing Officer
- **Model**: GPT-4 Turbo
- **Jobs**:
  - Write Instagram captions
  - Create Twitter threads
  - Generate Telegram posts
  - Design graphics strategy
- **Tools**: Image generation, social APIs
- **Schedule**: 3x daily (8am, 2pm, 7pm)

### 📊 Data Analyst - Chief Analytics Officer
- **Model**: o1-preview
- **Jobs**:
  - Track KPIs (signups, engagement, revenue)
  - Generate weekly reports
  - Identify trends
  - Recommend optimizations
- **Tools**: Database queries, analytics
- **Schedule**: Daily morning report

### 🚀 Growth Lead - Chief Growth Officer
- **Model**: Claude Opus 4
- **Jobs**:
  - Develop marketing strategies
  - Test new channels
  - Optimize funnels
  - Plan campaigns
- **Tools**: Web research, analytics access
- **Schedule**: Weekly strategy sessions

### 🛠️ Dev Agent - Chief Technology Officer
- **Model**: Claude Sonnet 4.5
- **Jobs**:
  - Fix bugs
  - Build features
  - Deploy code
  - Monitor systems
- **Tools**: Full code access, exec, git
- **Schedule**: On-demand + nightly builds

## Command Center

All agents report to **@thehubempire** Telegram channel.

### Commands

- `/empire status` - Show all agent statuses
- `/empire spawn <role>` - Start an agent
- `/empire task <role> <task>` - Assign work
- `/empire report` - Get status from all agents
- `/empire kill <role>` - Stop an agent

## Implementation

- Built on Clawdbot sessions_spawn
- Each agent = isolated session with label
- Empire bot monitors and coordinates
- Persistent state in `/the-hub/empire/`

---

**Status**: 🏗️ Building now...
