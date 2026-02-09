const axios = require('axios');
const GameAnalyzer = require('./analyzer');
const SportsKnowledge = require('./knowledge');
const logger = require('../../utils/logger');

class CommentaryGenerator {
  constructor() {
    this.analyzer = new GameAnalyzer();
    this.knowledge = new SportsKnowledge();
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.SPORTS_EXPERT_MODEL || 'anthropic/claude-3.5-sonnet';
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
  }

  // Generate LLM-powered commentary
  async generateWithLLM(prompt, temperature = 0.7, maxTokens = 500) {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a professional sports analyst with the wit of Bill Simmons and the analytical depth of Zach Lowe. 
              You provide expert commentary that:
              - Balances advanced stats with storytelling
              - Uses insider knowledge and historical context
              - Is confident but not arrogant
              - Makes complex analytics accessible
              - Generates spicy but defensible hot takes
              Keep responses concise and engaging.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://thehub.com',
            'X-Title': 'The Hub Sports Expert'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Error generating LLM commentary:', error.message);
      throw error;
    }
  }

  // Generate play-by-play commentary
  async generatePlayByPlay(game) {
    const analysis = await this.analyzer.analyzeGame(game.id);
    if (!analysis) return 'Game analysis not available.';

    const context = `
Game: ${analysis.teams.away.name} @ ${analysis.teams.home.name}
Status: ${game.status}
Score: ${game.away_score} - ${game.home_score}
Period: ${game.period || 'N/A'}
${game.last_play ? `Last Play: ${game.last_play}` : ''}
${game.time_remaining ? `Time Remaining: ${game.time_remaining}` : ''}
    `;

    const prompt = `Generate a short, exciting play-by-play commentary for this moment in the game:\n${context}\n\nMake it broadcast-ready and exciting.`;

    return await this.generateWithLLM(prompt, 0.8, 150);
  }

  // Generate halftime analysis
  async generateHalftimeAnalysis(game) {
    const analysis = await this.analyzer.analyzeGame(game.id);
    const talkingPoints = await this.analyzer.generateTalkingPoints(game.id);

    const context = `
Game: ${analysis.teams.away.name} @ ${analysis.teams.home.name}
Halftime Score: ${game.away_score} - ${game.home_score}
Records: ${analysis.teams.away.name} (${analysis.teams.away.wins}-${analysis.teams.away.losses}), ${analysis.teams.home.name} (${analysis.teams.home.wins}-${analysis.teams.home.losses})

Key Points:
${talkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
    `;

    const prompt = `Generate a concise halftime analysis with 3 key storylines to watch in the second half:\n${context}`;

    return await this.generateWithLLM(prompt, 0.7, 300);
  }

  // Generate post-game wrap-up
  async generatePostGameWrapup(game) {
    const analysis = await this.analyzer.analyzeGame(game.id);
    
    const winner = game.home_score > game.away_score ? analysis.teams.home.name : analysis.teams.away.name;
    const loser = game.home_score > game.away_score ? analysis.teams.away.name : analysis.teams.home.name;
    const margin = Math.abs(game.home_score - game.away_score);

    const context = `
Final Score: ${analysis.teams.away.name} ${game.away_score}, ${analysis.teams.home.name} ${game.home_score}
Winner: ${winner} by ${margin}
${game.venue ? `Venue: ${game.venue}` : ''}

Write a post-game summary that includes:
1. The decisive moment or turning point
2. Star performances
3. What this means for both teams going forward
    `;

    return await this.generateWithLLM(context, 0.7, 400);
  }

  // Generate hot take
  async generateHotTake(game, spicyLevel = 'medium') {
    const analysis = await this.analyzer.analyzeGame(game.id);
    const knowledge = this.knowledge.generateHotTake(game, analysis);

    const spicyLevels = {
      mild: 'a thoughtful but slightly contrarian opinion',
      medium: 'a bold take that will generate debate',
      spicy: 'a scorching hot take that sounds crazy but has merit'
    };

    const context = `
Game: ${analysis.teams.away.name} vs ${analysis.teams.home.name}
Status: ${game.status}
Current Score: ${game.away_score} - ${game.home_score}

Generate ${spicyLevels[spicyLevel]} about this game. Back it up with at least one stat or trend. Keep it to 2-3 sentences.
    `;

    return await this.generateWithLLM(context, 0.9, 150);
  }

  // Generate tweet-length insight
  async generateTweetInsight(game) {
    const analysis = await this.analyzer.analyzeGame(game.id);
    const talkingPoints = await this.analyzer.generateTalkingPoints(game.id, 2);

    const context = `
Game: ${analysis.teams.away.name} @ ${analysis.teams.home.name}
Score: ${game.away_score} - ${game.home_score}
Key Point: ${talkingPoints[0]}

Write a single tweet (max 280 characters) with expert insight about this game. Make it engaging and shareable. Include relevant emojis.
    `;

    return await this.generateWithLLM(context, 0.8, 100);
  }

  // Generate podcast talking points
  async generatePodcastScript(game, duration = 'short') {
    const analysis = await this.analyzer.analyzeGame(game.id);
    const talkingPoints = await this.analyzer.generateTalkingPoints(game.id, 5);
    const rivalry = this.knowledge.getMatchupHistory(
      analysis.teams.home.short_name || analysis.teams.home.name,
      analysis.teams.away.short_name || analysis.teams.away.name,
      game.sport
    );

    const durations = {
      short: '2-3 minute',
      medium: '5-7 minute',
      long: '10-15 minute'
    };

    const context = `
Game: ${analysis.teams.away.name} @ ${analysis.teams.home.name}
Records: ${analysis.teams.away.wins}-${analysis.teams.away.losses} vs ${analysis.teams.home.wins}-${analysis.teams.home.losses}
Current Status: ${game.status}
Score: ${game.away_score} - ${game.home_score}

Rivalry Context: ${rivalry.talkingPoint}

Key Points to Cover:
${talkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Generate a ${durations[duration]} podcast script/outline about this game. Include:
- Opening hook
- 3-5 main discussion points with analysis
- Hot take segment
- Predictions/implications
Make it conversational and engaging for audio.
    `;

    return await this.generateWithLLM(context, 0.7, duration === 'long' ? 800 : duration === 'medium' ? 500 : 300);
  }

  // Generate content for social media thread
  async generateSocialThread(game, platform = 'twitter') {
    const analysis = await this.analyzer.analyzeGame(game.id);
    const talkingPoints = await this.analyzer.generateTalkingPoints(game.id, 4);

    const context = `
Game: ${analysis.teams.away.name} @ ${analysis.teams.home.name}
Score: ${game.away_score} - ${game.home_score}
Status: ${game.status}

Talking Points:
${talkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Create a ${platform === 'twitter' ? 'Twitter/X thread (5-7 tweets)' : 'Instagram carousel post script (5 slides)'} breaking down this game.
Each tweet/slide should be punchy and standalone while building a narrative.
Include relevant emojis and make it shareable.
    `;

    const content = await this.generateWithLLM(context, 0.8, 600);
    
    // Format as array of tweets if Twitter
    if (platform === 'twitter') {
      return content.split('\n\n').filter(t => t.trim().length > 0);
    }
    
    return content;
  }

  // Generate "make me sound smart" briefing
  async generateSmartBriefing(game) {
    const analysis = await this.analyzer.analyzeGame(game.id);
    const talkingPoints = await this.analyzer.generateTalkingPoints(game.id, 5);
    const leagueTrends = this.knowledge.getLeagueTrends(game.sport);

    const context = `
Game: ${analysis.teams.away.name} @ ${analysis.teams.home.name}
Records: ${analysis.teams.away.wins}-${analysis.teams.away.losses} vs ${analysis.teams.home.wins}-${analysis.teams.home.losses}
Current Score: ${game.away_score} - ${game.home_score}

Key Points:
${talkingPoints.join('\n')}

Relevant League Trends:
${leagueTrends.slice(0, 2).join('\n')}

Generate a quick briefing (5-7 bullet points) that makes someone sound like an expert when discussing this game with friends.
Include:
- 2-3 key stats or storylines
- 1-2 deeper analytical points
- 1 hot take or prediction
Keep each point concise and conversational.
    `;

    const briefing = await this.generateWithLLM(context, 0.7, 400);
    
    // Format as bullet points
    return briefing.split('\n').filter(line => line.trim().length > 0);
  }

  // Generate newsletter-style analysis
  async generateNewsletterAnalysis(games, sport = null) {
    const summaries = await Promise.all(
      games.slice(0, 5).map(async (game) => {
        const analysis = await this.analyzer.analyzeGame(game.id);
        return {
          game,
          analysis,
          talkingPoints: await this.analyzer.generateTalkingPoints(game.id, 3)
        };
      })
    );

    const gamesContext = summaries.map((s, i) => `
Game ${i + 1}: ${s.analysis.teams.away.name} @ ${s.analysis.teams.home.name}
Score: ${s.game.away_score} - ${s.game.home_score}
Key Points: ${s.talkingPoints.join('; ')}
    `).join('\n');

    const prompt = `
Write a newsletter-style recap of today's top ${sport || 'sports'} games:

${gamesContext}

Format as:
- Engaging headline
- Brief intro paragraph
- 2-3 sentence summary for each game highlighting the most interesting angle
- Closing thoughts on the night's action

Make it engaging, informative, and shareable. Target length: 300-400 words.
    `;

    return await this.generateWithLLM(prompt, 0.7, 600);
  }

  // Close analyzer connection
  close() {
    this.analyzer.close();
  }
}

module.exports = CommentaryGenerator;
