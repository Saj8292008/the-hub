const express = require('express');
const router = express.Router();
const path = require('path');
const SportsExpertChat = require('../services/sports-expert/chat');
const ContentCreator = require('../services/sports-expert/content');
const GameAnalyzer = require('../services/sports-expert/analyzer');
const logger = require('../utils/logger');

// Initialize services
const chat = new SportsExpertChat();
const content = new ContentCreator();
const analyzer = new GameAnalyzer();

// Serve web dashboard
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/expert/index.html'));
});

// POST /api/expert/analyze - Analyze game/player/team
router.post('/analyze', async (req, res) => {
  try {
    const { query, gameId, teamId } = req.body;

    if (!query && !gameId && !teamId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Must provide query, gameId, or teamId' 
      });
    }

    let result;

    if (gameId) {
      const game = await analyzer.getGame(gameId);
      if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
      }
      result = await analyzer.analyzeGame(gameId);
    } else if (teamId) {
      const team = await analyzer.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }
      result = { team };
    } else {
      result = await chat.handleQuery(query);
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error in /analyze endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/expert/commentary - Generate commentary
router.post('/commentary', async (req, res) => {
  try {
    const { gameId, type = 'play-by-play' } = req.body;

    if (!gameId) {
      return res.status(400).json({ 
        success: false, 
        error: 'gameId required' 
      });
    }

    const game = await analyzer.getGame(gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    let commentary;

    switch (type) {
      case 'play-by-play':
        commentary = await content.commentary.generatePlayByPlay(game);
        break;
      case 'halftime':
        commentary = await content.commentary.generateHalftimeAnalysis(game);
        break;
      case 'post-game':
        commentary = await content.commentary.generatePostGameWrapup(game);
        break;
      case 'hot-take':
        commentary = await content.commentary.generateHotTake(game, 'medium');
        break;
      default:
        commentary = await content.commentary.generatePlayByPlay(game);
    }

    res.json({
      success: true,
      game,
      type,
      commentary
    });
  } catch (error) {
    logger.error('Error in /commentary endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/expert/content - Create social content
router.post('/content', async (req, res) => {
  try {
    const { gameId, platform = 'twitter', style = 'analysis' } = req.body;

    if (!gameId) {
      return res.status(400).json({ 
        success: false, 
        error: 'gameId required' 
      });
    }

    const game = await analyzer.getGame(gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const contentResult = await content.generateSocialPost(game, platform, style);

    res.json({
      success: true,
      game,
      platform,
      style,
      content: contentResult
    });
  } catch (error) {
    logger.error('Error in /content endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/expert/talking-points?game=<id>
router.get('/talking-points', async (req, res) => {
  try {
    const { game: gameId, count = 5 } = req.query;

    if (!gameId) {
      return res.status(400).json({ 
        success: false, 
        error: 'game parameter required' 
      });
    }

    const game = await analyzer.getGame(gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const talkingPoints = await analyzer.generateTalkingPoints(gameId, parseInt(count));
    const briefing = await content.commentary.generateSmartBriefing(game);

    res.json({
      success: true,
      game,
      talkingPoints,
      briefing
    });
  } catch (error) {
    logger.error('Error in /talking-points endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/expert/games - Get today's games
router.get('/games', async (req, res) => {
  try {
    const { sport, limit = 20 } = req.query;

    const games = await analyzer.getLiveGames(sport || null, parseInt(limit));

    res.json({
      success: true,
      count: games.length,
      games
    });
  } catch (error) {
    logger.error('Error in /games endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/expert/today - Get today's summary
router.get('/today', async (req, res) => {
  try {
    const summary = await analyzer.getTodaysSummary();

    res.json({
      success: true,
      ...summary
    });
  } catch (error) {
    logger.error('Error in /today endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/expert/query - Natural language query
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'query required' 
      });
    }

    const result = await chat.handleQuery(query);

    res.json(result);
  } catch (error) {
    logger.error('Error in /query endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/expert/multi-content - Generate content for multiple platforms
router.post('/multi-content', async (req, res) => {
  try {
    const { gameId, platforms = ['twitter', 'instagram'] } = req.body;

    if (!gameId) {
      return res.status(400).json({ 
        success: false, 
        error: 'gameId required' 
      });
    }

    const game = await analyzer.getGame(gameId);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const results = await content.generateMultiPlatformContent(game, platforms);

    res.json({
      success: true,
      game,
      platforms,
      content: results
    });
  } catch (error) {
    logger.error('Error in /multi-content endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/expert/news - Get recent sports news
router.get('/news', async (req, res) => {
  try {
    const { sport, limit = 10 } = req.query;

    const news = await analyzer.getRecentNews(sport || null, parseInt(limit));

    res.json({
      success: true,
      count: news.length,
      news
    });
  } catch (error) {
    logger.error('Error in /news endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    service: 'Sports Expert',
    status: 'operational'
  });
});

module.exports = router;
