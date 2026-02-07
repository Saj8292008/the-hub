/**
 * Twitter API Endpoints
 * Manual posting, stats, and control
 */

const express = require('express');
const router = express.Router();
const { getBot } = require('../bot/twitter');
const { getPoster } = require('../automations/twitterPoster');
const logger = require('../utils/logger');

/**
 * GET /api/twitter/status
 * Get Twitter bot status and stats
 */
router.get('/status', async (req, res) => {
  try {
    const bot = getBot();
    const poster = getPoster();
    
    const stats = await bot.getStats();
    const posterStatus = poster.getStatus();

    res.json({
      bot: stats,
      autoPoster: posterStatus
    });
  } catch (error) {
    logger.error('Twitter status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twitter/tweet
 * Post a single tweet
 */
router.post('/tweet', async (req, res) => {
  try {
    const { text, dealId } = req.body;

    if (!text || text.length === 0) {
      return res.status(400).json({ error: 'Tweet text required' });
    }

    if (text.length > 280) {
      return res.status(400).json({ error: 'Tweet too long (max 280 characters)' });
    }

    const bot = getBot();
    const result = await bot.tweet(text);

    // If posting a deal, mark it
    if (dealId && result.success) {
      const poster = getPoster();
      await poster.markDealAsPosted(dealId, result.tweet.id);
    }

    res.json(result);
  } catch (error) {
    logger.error('Tweet post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twitter/thread
 * Post a thread
 */
router.post('/thread', async (req, res) => {
  try {
    const { tweets, dealIds } = req.body;

    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return res.status(400).json({ error: 'Thread tweets array required' });
    }

    for (const tweet of tweets) {
      if (tweet.length > 280) {
        return res.status(400).json({ error: `Tweet too long: "${tweet.substring(0, 50)}..."` });
      }
    }

    const bot = getBot();
    const result = await bot.thread(tweets);

    // If posting deals, mark them
    if (dealIds && Array.isArray(dealIds) && result.success) {
      const poster = getPoster();
      for (const dealId of dealIds) {
        await poster.markDealAsPosted(dealId, result.thread[0].id);
      }
    }

    res.json(result);
  } catch (error) {
    logger.error('Thread post error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twitter/hot-deals-thread
 * Post a hot deals thread (auto-formatted)
 */
router.post('/hot-deals-thread', async (req, res) => {
  try {
    const { dealIds } = req.body;
    
    const poster = getPoster();
    const result = await poster.postHotDealsThread(dealIds);

    res.json(result);
  } catch (error) {
    logger.error('Hot deals thread error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twitter/format-deal
 * Preview how a deal will look as a tweet
 */
router.post('/format-deal', async (req, res) => {
  try {
    const { deal } = req.body;

    if (!deal) {
      return res.status(400).json({ error: 'Deal object required' });
    }

    const bot = getBot();
    const formatted = bot.formatDeal(deal);

    res.json({
      text: formatted,
      length: formatted.length,
      valid: formatted.length <= 280
    });
  } catch (error) {
    logger.error('Format deal error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twitter/recent
 * Get recent tweets
 */
router.get('/recent', async (req, res) => {
  try {
    const count = parseInt(req.query.count || '10', 10);
    
    const bot = getBot();
    const result = await bot.getRecentTweets(count);

    res.json(result);
  } catch (error) {
    logger.error('Recent tweets error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/twitter/queue
 * Get deals queued for posting
 */
router.get('/queue', async (req, res) => {
  try {
    const poster = getPoster();
    const hotDeals = await poster.getHotDealsToPost();

    res.json({
      count: hotDeals.length,
      deals: hotDeals
    });
  } catch (error) {
    logger.error('Twitter queue error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/twitter/check-now
 * Manually trigger auto-poster check
 */
router.post('/check-now', async (req, res) => {
  try {
    const poster = getPoster();
    
    // Trigger check asynchronously
    poster.checkAndPost().catch(err => {
      logger.error('Manual check error:', err);
    });

    res.json({ success: true, message: 'Check triggered' });
  } catch (error) {
    logger.error('Twitter check-now error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
