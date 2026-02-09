const GameAnalyzer = require('./analyzer');
const SportsKnowledge = require('./knowledge');
const CommentaryGenerator = require('./commentary');
const logger = require('../../utils/logger');

class SportsExpertChat {
  constructor() {
    this.analyzer = new GameAnalyzer();
    this.knowledge = new SportsKnowledge();
    this.commentary = new CommentaryGenerator();
  }

  // Main chat handler - routes queries to appropriate method
  async handleQuery(query, context = {}) {
    try {
      const lowerQuery = query.toLowerCase();

      // Route to specific handlers based on query
      if (lowerQuery.includes('talking points') || lowerQuery.includes('smart about')) {
        return await this.handleTalkingPointsRequest(query, context);
      }

      if (lowerQuery.includes('tweet') || lowerQuery.includes('social') || lowerQuery.includes('thread')) {
        return await this.handleSocialContentRequest(query, context);
      }

      if (lowerQuery.includes('hot take') || lowerQuery.includes('spicy')) {
        return await this.handleHotTakeRequest(query, context);
      }

      if (lowerQuery.includes('podcast') || lowerQuery.includes('script')) {
        return await this.handlePodcastRequest(query, context);
      }

      if (lowerQuery.includes('what\'s happening') || lowerQuery.includes('game status') || lowerQuery.includes('score')) {
        return await this.handleGameStatusRequest(query, context);
      }

      if (lowerQuery.includes('today') || lowerQuery.includes('tonight')) {
        return await this.handleTodayRequest(query, context);
      }

      if (lowerQuery.includes('analyze') || lowerQuery.includes('breakdown')) {
        return await this.handleAnalysisRequest(query, context);
      }

      // Default: general query
      return await this.handleGeneralQuery(query, context);

    } catch (error) {
      logger.error('Error handling sports expert query:', error);
      return {
        success: false,
        error: error.message,
        response: 'Sorry, I encountered an error processing your request. Please try again.'
      };
    }
  }

  // Handle talking points requests
  async handleTalkingPointsRequest(query, context) {
    const game = await this.findGameFromQuery(query);
    
    if (!game) {
      const todaySummary = await this.analyzer.getTodaysSummary();
      return {
        success: false,
        response: `I couldn't find that specific game. Today's games:\n${this.formatGamesList(todaySummary.games)}\n\nTry asking about one of these games.`
      };
    }

    const talkingPoints = await this.analyzer.generateTalkingPoints(game.id, 5);
    const briefing = await this.commentary.generateSmartBriefing(game);

    return {
      success: true,
      game,
      talkingPoints,
      briefing,
      response: this.formatTalkingPointsResponse(game, talkingPoints, briefing)
    };
  }

  // Handle social content requests
  async handleSocialContentRequest(query, context) {
    const game = await this.findGameFromQuery(query);
    
    if (!game) {
      return {
        success: false,
        response: 'Please specify which game you want content about.'
      };
    }

    let content;
    if (query.toLowerCase().includes('thread')) {
      content = await this.commentary.generateSocialThread(game, 'twitter');
      return {
        success: true,
        game,
        contentType: 'thread',
        content,
        response: `Here's a Twitter thread for ${game.away_team_name} @ ${game.home_team_name}:\n\n${Array.isArray(content) ? content.join('\n\n---\n\n') : content}`
      };
    } else {
      content = await this.commentary.generateTweetInsight(game);
      return {
        success: true,
        game,
        contentType: 'tweet',
        content,
        response: `Tweet for ${game.away_team_name} @ ${game.home_team_name}:\n\n${content}`
      };
    }
  }

  // Handle hot take requests
  async handleHotTakeRequest(query, context) {
    const game = await this.findGameFromQuery(query);
    
    if (!game) {
      return {
        success: false,
        response: 'Please specify which game you want a hot take about.'
      };
    }

    const spicyLevel = query.includes('spicy') || query.includes('controversial') ? 'spicy' : 'medium';
    const hotTake = await this.commentary.generateHotTake(game, spicyLevel);

    return {
      success: true,
      game,
      hotTake,
      response: `🌶️ Hot Take on ${game.away_team_name} @ ${game.home_team_name}:\n\n${hotTake}`
    };
  }

  // Handle podcast script requests
  async handlePodcastRequest(query, context) {
    const game = await this.findGameFromQuery(query);
    
    if (!game) {
      return {
        success: false,
        response: 'Please specify which game you want podcast content about.'
      };
    }

    const duration = query.includes('long') ? 'long' : query.includes('short') ? 'short' : 'medium';
    const script = await this.commentary.generatePodcastScript(game, duration);

    return {
      success: true,
      game,
      script,
      response: `🎙️ Podcast Script (${duration}) for ${game.away_team_name} @ ${game.home_team_name}:\n\n${script}`
    };
  }

  // Handle game status requests
  async handleGameStatusRequest(query, context) {
    const game = await this.findGameFromQuery(query);
    
    if (!game) {
      return {
        success: false,
        response: 'I couldn\'t find that game. Try asking about a specific team or checking today\'s games.'
      };
    }

    const analysis = await this.analyzer.analyzeGame(game.id);
    const talkingPoints = await this.analyzer.generateTalkingPoints(game.id, 3);

    return {
      success: true,
      game,
      analysis,
      talkingPoints,
      response: this.formatGameStatusResponse(game, analysis, talkingPoints)
    };
  }

  // Handle today's games requests
  async handleTodayRequest(query, context) {
    const summary = await this.analyzer.getTodaysSummary();
    
    if (summary.total === 0) {
      return {
        success: true,
        summary,
        response: 'No games scheduled for today.'
      };
    }

    return {
      success: true,
      summary,
      response: this.formatTodaySummary(summary)
    };
  }

  // Handle analysis/breakdown requests
  async handleAnalysisRequest(query, context) {
    const game = await this.findGameFromQuery(query);
    
    if (!game) {
      return {
        success: false,
        response: 'Please specify which game you want analyzed.'
      };
    }

    const analysis = await this.analyzer.analyzeGame(game.id);
    const commentary = game.status === 'live' || game.status === 'in_progress' 
      ? await this.commentary.generatePlayByPlay(game)
      : await this.commentary.generatePostGameWrapup(game);

    return {
      success: true,
      game,
      analysis,
      commentary,
      response: this.formatAnalysisResponse(game, analysis, commentary)
    };
  }

  // Handle general queries
  async handleGeneralQuery(query, context) {
    // Try to find relevant game first
    const game = await this.findGameFromQuery(query);
    
    if (game) {
      // If we found a game, give a comprehensive response
      return await this.handleGameStatusRequest(query, context);
    }

    // Otherwise, show today's games
    const summary = await this.analyzer.getTodaysSummary();
    
    return {
      success: true,
      summary,
      response: `Not sure what you're looking for. Here's what's happening today:\n\n${this.formatTodaySummary(summary)}\n\nTry asking about a specific game or team!`
    };
  }

  // Helper: Find game from natural language query
  async findGameFromQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Get recent games
    const games = await this.analyzer.getLiveGames(null, 50);
    
    // Try to find game by team name
    for (const game of games) {
      const homeTeam = game.home_team_name?.toLowerCase() || '';
      const awayTeam = game.away_team_name?.toLowerCase() || '';
      
      // Check if query mentions either team
      if (lowerQuery.includes(homeTeam.toLowerCase()) || lowerQuery.includes(awayTeam.toLowerCase())) {
        return game;
      }

      // Check short names/common abbreviations
      const homeWords = homeTeam.split(' ');
      const awayWords = awayTeam.split(' ');
      
      for (const word of [...homeWords, ...awayWords]) {
        if (word.length > 3 && lowerQuery.includes(word)) {
          return game;
        }
      }
    }

    // If no match, return first live game or first upcoming game
    const liveGame = games.find(g => g.status === 'live' || g.status === 'in_progress');
    return liveGame || games[0] || null;
  }

  // Formatting helpers
  formatGamesList(games) {
    return games.slice(0, 5).map(g => 
      `• ${g.away_team_name} @ ${g.home_team_name} - ${g.status === 'live' ? `LIVE: ${g.away_score}-${g.home_score}` : g.game_time}`
    ).join('\n');
  }

  formatTalkingPointsResponse(game, talkingPoints, briefing) {
    return `
📊 Smart Talking Points: ${game.away_team_name} @ ${game.home_team_name}

${game.status === 'live' ? `🔴 LIVE: ${game.away_score}-${game.home_score} (${game.period || ''})` : `⏰ ${game.game_time}`}

Quick Brief:
${briefing.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Key Points to Mention:
${talkingPoints.map((p, i) => `• ${p}`).join('\n')}

You're now ready to sound like an expert! 🏀
    `.trim();
  }

  formatGameStatusResponse(game, analysis, talkingPoints) {
    const status = game.status === 'live' || game.status === 'in_progress' 
      ? `🔴 LIVE: ${game.away_score}-${game.home_score} (${game.period || ''})`
      : game.status === 'scheduled'
      ? `⏰ Starts: ${game.game_time}`
      : `Final: ${game.away_score}-${game.home_score}`;

    return `
${game.away_team_name} @ ${game.home_team_name}
${status}

📊 Quick Breakdown:
${talkingPoints.map(p => `• ${p}`).join('\n')}

${analysis.betting ? `\n💰 Betting Context:\nSpread: ${analysis.betting.spread_home > 0 ? '+' : ''}${analysis.betting.spread_home}\nO/U: ${analysis.betting.over_under}` : ''}
    `.trim();
  }

  formatTodaySummary(summary) {
    const bySport = Object.entries(summary.bySport).map(([sport, games]) => {
      return `\n${sport.toUpperCase()}:\n${games.slice(0, 3).map(g => 
        `• ${g.away_team_name} @ ${g.home_team_name} - ${g.status === 'live' ? `LIVE: ${g.away_score}-${g.home_score}` : g.game_time}`
      ).join('\n')}`;
    }).join('\n');

    return `
Today's Games (${summary.total} total, ${summary.live} live):
${bySport}

Ask me about any game for expert analysis!
    `.trim();
  }

  formatAnalysisResponse(game, analysis, commentary) {
    return `
${game.away_team_name} @ ${game.home_team_name}
${game.status === 'live' ? `🔴 LIVE: ${game.away_score}-${game.home_score}` : `Final: ${game.away_score}-${game.home_score}`}

Expert Analysis:
${commentary}

Records: ${analysis.teams.away.name} (${analysis.teams.away.wins}-${analysis.teams.away.losses}) vs ${analysis.teams.home.name} (${analysis.teams.home.wins}-${analysis.teams.home.losses})
    `.trim();
  }

  // Cleanup
  close() {
    this.analyzer.close();
    this.commentary.close();
  }
}

module.exports = SportsExpertChat;
