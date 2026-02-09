# Sports Broadcasting Expert Agent

## Overview

The Sports Broadcasting Expert transforms you into a professional sports analyst by providing instant expert-level insights, commentary, and analysis. Think Bill Simmons meets Zach Lowe - the perfect blend of wit and analytical depth.

## Features

### 1. Live Game Analysis Engine
**Location:** `/src/services/sports-expert/analyzer.js`

- Real-time game analysis pulling from the sports bot database
- Expert commentary generation for any live game
- Key stat highlights (player performance, team trends, historical context)
- Talking points generator (3-5 smart things to say about any game)
- Play-by-play insights
- Post-game analysis & hot takes

### 2. Expert Knowledge Base
**Location:** `/src/services/sports-expert/knowledge.js`

- Team history & rivalry context
- Player stats, storylines, career arcs
- Coaching strategies & tendencies
- League trends & analytics
- Historical comparisons
- Betting lines & odds context (for expert commentary)

### 3. Commentary Generator
**Location:** `/src/services/sports-expert/commentary.js`

- Broadcast-style play-by-play
- Halftime analysis
- Post-game wrap-ups
- Hot take generator (controversial but defensible opinions)
- Tweet-length insights (perfect for social media)
- Podcast-ready scripts

### 4. Interactive Chat Interface
**Location:** `/src/services/sports-expert/chat.js`

- Ask anything: "What should I know about tonight's Lakers game?"
- Get instant expert response with context, stats, storylines
- "Make me sound smart about [team/player/game]" mode
- Generate content: "Write me a tweet about this game"
- Real-time updates during games

### 5. Content Creation Tools
**Location:** `/src/services/sports-expert/content.js`

- Social media posts (Twitter, Instagram captions)
- Newsletter-ready analysis
- Video script outlines
- Podcast talking points
- Blog post drafts
- Hot take threads

### 6. Telegram Bot Integration
**Location:** `/src/services/sports-expert/telegram-bot.js`

- Text instant analysis: "Tell me about [game/player]"
- During games: Real-time commentary updates
- Ask for talking points before watching with friends
- Generate social posts on demand
- Voice note-ready scripts (for podcast/commentary practice)

## Installation

### Prerequisites

1. Node.js >= 18.0.0
2. SQLite3 (for sports bot database)
3. OpenRouter API key (for LLM-powered analysis)
4. Sports bot database at `/Users/sydneyjackson/sports-bot/data/sportsbot.db`

### Setup

1. Install dependencies:
```bash
cd /Users/sydneyjackson/the-hub
npm install sqlite3 --save
```

2. Configure environment variables in `.env`:
```env
# Sports Expert Agent
SPORTS_EXPERT_ENABLED=true
SPORTS_EXPERT_MODEL=anthropic/claude-3.5-sonnet
SPORTS_BOT_DB=/Users/sydneyjackson/sports-bot/data/sportsbot.db
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

3. Start The Hub:
```bash
npm start
```

## Usage

### Web Dashboard

Access the web dashboard at: `http://localhost:4003/api/expert/`

Features:
- Interactive chat interface
- Today's games overview
- Quick action buttons for common queries
- Real-time analysis

### Telegram Bot

**Commands:**

```
/expert [query] - Ask anything
  Example: /expert What's happening in the Lakers game?

/games - See today's schedule

/analyze [team/game] - Get expert breakdown
  Example: /analyze Celtics

/smart [team/game] - Quick briefing to sound smart
  Example: /smart Lakers vs Warriors

/hottake [team/game] - Spicy but smart take
  Example: /hottake tonight's game

/tweet [team/game] - Generate social content
  Example: /tweet Super Bowl

/podcast [team/game] - Podcast script
  Example: /podcast Celtics game

/experthelp - Show help message
```

**Natural Language Examples:**
- "Tell me about tonight's games"
- "Make me sound smart about the Celtics"
- "Write a tweet about the Lakers"
- "Give me a hot take on this game"

### API Endpoints

#### POST `/api/expert/analyze`
Analyze a game, player, or team

**Request:**
```json
{
  "query": "Lakers vs Celtics",
  "gameId": "optional-game-id",
  "teamId": "optional-team-id"
}
```

**Response:**
```json
{
  "success": true,
  "game": { /* game data */ },
  "analysis": { /* analysis data */ },
  "response": "Expert analysis text"
}
```

#### POST `/api/expert/commentary`
Generate commentary for a game

**Request:**
```json
{
  "gameId": "game-123",
  "type": "play-by-play" // or "halftime", "post-game", "hot-take"
}
```

**Response:**
```json
{
  "success": true,
  "game": { /* game data */ },
  "type": "play-by-play",
  "commentary": "Expert commentary text"
}
```

#### POST `/api/expert/content`
Create social media content

**Request:**
```json
{
  "gameId": "game-123",
  "platform": "twitter", // or "instagram"
  "style": "analysis" // or "thread", "hot-take"
}
```

**Response:**
```json
{
  "success": true,
  "game": { /* game data */ },
  "platform": "twitter",
  "content": "Social media content"
}
```

#### GET `/api/expert/talking-points?game=<id>&count=5`
Get talking points for a game

**Response:**
```json
{
  "success": true,
  "game": { /* game data */ },
  "talkingPoints": [
    "Point 1",
    "Point 2",
    "Point 3"
  ],
  "briefing": [
    "Brief point 1",
    "Brief point 2"
  ]
}
```

#### GET `/api/expert/games?sport=NBA&limit=20`
Get today's games

**Response:**
```json
{
  "success": true,
  "count": 10,
  "games": [ /* array of games */ ]
}
```

#### GET `/api/expert/today`
Get today's games summary

**Response:**
```json
{
  "success": true,
  "total": 10,
  "live": 3,
  "upcoming": 7,
  "games": [ /* array of games */ ],
  "bySport": {
    "NBA": [ /* NBA games */ ],
    "NFL": [ /* NFL games */ ]
  }
}
```

#### POST `/api/expert/query`
Natural language query

**Request:**
```json
{
  "query": "What's happening in the Lakers game?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Expert analysis response",
  "game": { /* optional game data */ }
}
```

## Use Cases

### Scenario 1: Watching Game with Friends
```
You: "/expert What's happening in Celtics vs Lakers?"
Agent: "Celtics up 10 in Q3. Tatum's having a statement game (32pts, 8reb). 
Lakers missing LeBron (load management). Key: Celtics shooting 45% from 3 vs 
Lakers' 28%. Talk about: Tatum's MVP case, Lakers' depth issues without LeBron, 
this is the 3rd straight Celtics win vs West contenders."
```

### Scenario 2: Creating Social Content
```
You: "/expert Write me a tweet about the Super Bowl"
Agent: "🏈 SUPER BOWL ANALYSIS [generates expert thread with stats, storylines, 
predictions]"
```

### Scenario 3: Post-Game Hot Take
```
You: "/expert Give me a spicy but smart take on tonight's game"
Agent: "[Generates defensible hot take with stats to back it up]"
```

## Personality & Voice

The Sports Expert embodies:
- **Pro analyst style** (think ESPN, The Ringer)
- **Balance** between stats and storytelling
- **Confident but not arrogant**
- **Mix** of advanced analytics with accessible language
- **Spicy takes** that are defensible with data

## Success Metrics

- ✅ Hold your own in any sports conversation
- ✅ Generate expert-level content in <30 seconds
- ✅ Sound like you've been watching sports for 20 years
- ✅ Create shareable, engagement-worthy social content

## Architecture

```
src/services/sports-expert/
├── analyzer.js          # Game analysis engine
├── knowledge.js         # Sports knowledge base
├── commentary.js        # LLM-powered commentary
├── chat.js             # Chat interface handler
├── content.js          # Content creation tools
└── telegram-bot.js     # Telegram integration

src/api/
└── sports-expert.js    # API routes

src/views/expert/
└── index.html          # Web dashboard

src/bot/
└── telegram.js         # Main bot integration
```

## Database Schema

The Sports Expert connects to the sports bot database:

**Games Table:**
- `id`, `sport`, `league`, `home_team`, `away_team`
- `home_score`, `away_score`, `status`, `game_time`
- `venue`, `broadcast`, `period`, `time_remaining`, `last_play`
- `odds_home`, `odds_away`

**Teams Table:**
- `id`, `name`, `short_name`, `sport`, `league`
- `wins`, `losses`, `ties`, `win_percentage`
- `conference`, `division`

**Players Table:**
- `id`, `name`, `team_id`, `sport`, `position`
- `injury_status`, `injury_description`

**Betting Lines Table:**
- `game_id`, `bookmaker`, `home_odds`, `away_odds`
- `over_under`, `spread_home`, `spread_away`

**News Table:**
- `id`, `sport`, `title`, `description`, `url`
- `published_at`, `is_breaking`

## Troubleshooting

### Database Connection Issues
```javascript
// Check database path
const dbPath = process.env.SPORTS_BOT_DB;
console.log('Database path:', dbPath);

// Verify database exists
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  console.error('Database not found!');
}
```

### LLM API Issues
```javascript
// Verify OpenRouter API key
if (!process.env.OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY not set!');
}

// Check model availability
const model = process.env.SPORTS_EXPERT_MODEL;
console.log('Using model:', model);
```

### Telegram Bot Not Responding
1. Check `SPORTS_EXPERT_ENABLED=true` in `.env`
2. Verify Telegram bot token is valid
3. Check bot logs for errors

## Future Enhancements

- [ ] Voice note support (use TTS for audio responses)
- [ ] Live game push notifications
- [ ] Multi-game analysis (compare multiple games)
- [ ] Player comparison tools
- [ ] Fantasy sports integration
- [ ] Betting predictions (with disclaimers)
- [ ] Video content generation
- [ ] Multi-language support
- [ ] Custom team/player tracking
- [ ] Historical game lookups

## Contributing

To add new features:

1. Update the appropriate service file
2. Add API endpoints in `sports-expert.js`
3. Update Telegram commands if needed
4. Update this documentation
5. Test with real game data

## License

Internal use only - The Hub project

---

**Built with ❤️ for sports fans who want to sound like experts** 🏀🏈⚾⚽
