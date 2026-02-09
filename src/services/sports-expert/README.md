# Sports Broadcasting Expert

Your personal AI sports analyst. Transform into a professional sports commentator instantly.

## Quick Start

### 1. Configuration

Add to your `.env`:
```env
SPORTS_EXPERT_ENABLED=true
SPORTS_EXPERT_MODEL=anthropic/claude-3.5-sonnet
SPORTS_BOT_DB=/Users/sydneyjackson/sports-bot/data/sportsbot.db
OPENROUTER_API_KEY=your_key_here
```

### 2. Start The Hub

```bash
npm start
```

### 3. Access

- **Web Dashboard:** http://localhost:4003/api/expert/
- **Telegram:** Message your bot with `/expert` or `/experthelp`
- **API:** http://localhost:4003/api/expert/*

## Example Queries

### Via Web or API

```javascript
// General query
POST /api/expert/query
{
  "query": "What's happening in the Lakers game?"
}

// Get talking points
GET /api/expert/talking-points?game=123

// Generate commentary
POST /api/expert/commentary
{
  "gameId": "123",
  "type": "halftime"
}

// Create social content
POST /api/expert/content
{
  "gameId": "123",
  "platform": "twitter",
  "style": "hot-take"
}
```

### Via Telegram

```
/expert What's happening in the Celtics game?
/games
/analyze Lakers
/smart Lakers vs Warriors
/hottake tonight's game
/tweet Super Bowl
/podcast Celtics game
```

## Natural Language Examples

The chat interface understands natural language:

- "Tell me about tonight's games"
- "What should I know about the Lakers?"
- "Make me sound smart about the Celtics"
- "Write a tweet about the Super Bowl"
- "Give me a hot take on this game"
- "What's the score of the Warriors game?"
- "Generate podcast talking points"
- "Create Instagram content"

## Features

### 🎯 Instant Analysis
Get expert-level game analysis in seconds. Perfect for pre-game prep or live commentary.

### 🔥 Hot Takes
Generate spicy but defensible takes backed by stats. Sound confident without sounding wrong.

### 📱 Social Content
Create tweet-ready insights, Instagram captions, or full Twitter threads about any game.

### 🎙️ Podcast Scripts
Get ready-to-read podcast outlines with all the key talking points and storylines.

### 🎓 Smart Briefings
Get 5-7 bullet points that make you sound like you've been following the sport all season.

### 📊 Real-Time Updates
During live games, get instant updates on score changes, key plays, and momentum shifts.

## API Integration

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Query the sports expert
async function askExpert(query) {
  const response = await axios.post('http://localhost:4003/api/expert/query', {
    query: query
  });
  return response.data;
}

// Get today's games
async function getTodaysGames() {
  const response = await axios.get('http://localhost:4003/api/expert/today');
  return response.data;
}

// Generate content
async function generateTweet(gameId) {
  const response = await axios.post('http://localhost:4003/api/expert/content', {
    gameId: gameId,
    platform: 'twitter',
    style: 'analysis'
  });
  return response.data;
}
```

### Python

```python
import requests

# Query the sports expert
def ask_expert(query):
    response = requests.post(
        'http://localhost:4003/api/expert/query',
        json={'query': query}
    )
    return response.json()

# Get today's games
def get_todays_games():
    response = requests.get('http://localhost:4003/api/expert/today')
    return response.json()

# Generate content
def generate_tweet(game_id):
    response = requests.post(
        'http://localhost:4003/api/expert/content',
        json={
            'gameId': game_id,
            'platform': 'twitter',
            'style': 'analysis'
        }
    )
    return response.json()
```

## Personality

The Sports Expert sounds like:
- **Bill Simmons** - Pop culture references, storytelling, hot takes
- **Zach Lowe** - Deep analytics, Xs and Os, nuanced takes
- **ESPN analyst** - Professional, confident, authoritative
- **The Ringer** - Accessible advanced stats, fun but smart

## Components

- **`analyzer.js`** - Connects to sports bot database, analyzes games
- **`knowledge.js`** - Sports knowledge base, rivalries, trends
- **`commentary.js`** - LLM-powered expert commentary generation
- **`chat.js`** - Natural language query handler
- **`content.js`** - Social media and content creation
- **`telegram-bot.js`** - Telegram bot integration

## Database

Uses the sports bot SQLite database:
- Games (live scores, schedules)
- Teams (records, standings)
- Players (stats, injuries)
- Betting lines (spreads, over/unders)
- News (breaking stories)

## Tips for Best Results

### For Analysis
- Be specific: "Lakers vs Celtics" works better than just "tonight's game"
- Include context: "Tell me about the Lakers game and why it matters"
- Ask follow-ups: "What about the Lakers defense?" after initial analysis

### For Content Creation
- Specify platform: "Write an Instagram caption" vs "Write a tweet"
- Set the tone: "Give me a spicy hot take" vs "Give me a balanced analysis"
- Request formats: "Make this a thread" or "Keep it to 280 characters"

### For Briefings
- Ask for specifics: "What do I need to know before watching?"
- Request depth: "Give me 3 talking points" or "Give me a deep dive"
- Time context: "What happened in the first half?" or "Recap the game"

## Troubleshooting

### "Game not found"
- Check game ID is correct
- Try team name instead: "Lakers" vs game ID
- Verify game is in database (use `/games` command)

### "Database connection failed"
- Verify `SPORTS_BOT_DB` path in `.env`
- Check database file exists and is readable
- Ensure sports bot is running and updating data

### "LLM error"
- Verify `OPENROUTER_API_KEY` is set
- Check API quota/limits
- Try simpler query or different model

### Telegram bot not responding
- Verify `SPORTS_EXPERT_ENABLED=true`
- Check Telegram bot token is valid
- Restart The Hub: `npm start`

## Advanced Usage

### Custom Queries

```javascript
// Multi-game analysis
const games = await getTodaysGames();
for (const game of games.games.slice(0, 3)) {
  const analysis = await askExpert(`Analyze ${game.id}`);
  console.log(analysis);
}

// Compare teams
const comparison = await askExpert('Compare Lakers vs Celtics this season');

// Trend analysis
const trends = await askExpert('What are the top trends in the NBA right now?');
```

### Batch Content Generation

```javascript
// Generate content for multiple platforms
const response = await axios.post(
  'http://localhost:4003/api/expert/multi-content',
  {
    gameId: '123',
    platforms: ['twitter', 'instagram', 'blog']
  }
);

console.log(response.data.content.twitter);  // Tweet
console.log(response.data.content.instagram); // Caption
console.log(response.data.content.blog);      // Blog post
```

## Support

For issues or feature requests:
1. Check `/Users/sydneyjackson/the-hub/docs/SPORTS_EXPERT.md`
2. Review logs: `logs/nohup-4003.log`
3. Test database connection: `sqlite3 path/to/sportsbot.db ".tables"`

## What's Next?

- Voice responses (TTS integration)
- Live game notifications
- Fantasy sports insights
- Video content scripts
- Multi-language support
- Historical game analysis

---

**Make every sports conversation your best.** 🏀
