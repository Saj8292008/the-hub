/**
 * Content API
 * Endpoints for content atomization, posting, and management
 */

const express = require('express');
const router = express.Router();
const ContentAtomizer = require('../services/content/ContentAtomizer');
const ContentPoster = require('../services/content/ContentPoster');
const { getScheduler } = require('../schedulers/contentScheduler');

const atomizer = new ContentAtomizer();
const poster = new ContentPoster();

/**
 * POST /api/content/atomize
 * Atomize a blog post into social content
 */
router.post('/atomize', async (req, res) => {
  try {
    const { title, body, category, keyPoints } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'title and body are required'
      });
    }

    const result = await atomizer.atomizeBlogPost({
      title,
      body,
      category: category || 'general',
      keyPoints: keyPoints || []
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Atomize error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/atomize-deal
 * Atomize a deal into social content
 */
router.post('/atomize-deal', async (req, res) => {
  try {
    const deal = req.body;

    if (!deal.title || !deal.price) {
      return res.status(400).json({
        success: false,
        error: 'title and price are required'
      });
    }

    const result = await atomizer.atomizeDeal(deal);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Atomize deal error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/quick
 * Quick atomize an insight
 */
router.post('/quick', async (req, res) => {
  try {
    const { insight } = req.body;

    if (!insight) {
      return res.status(400).json({
        success: false,
        error: 'insight is required'
      });
    }

    const result = await atomizer.quickAtomize(insight);

    res.json({
      success: true,
      content: result
    });
  } catch (error) {
    console.error('Quick atomize error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/calendar
 * Generate a content calendar from blog posts
 */
router.post('/calendar', async (req, res) => {
  try {
    const { posts, days = 7 } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'posts array is required'
      });
    }

    const result = await atomizer.generateContentCalendar(posts, days);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// POSTING ENDPOINTS
// ============================================================================

/**
 * POST /api/content/post/telegram
 * Post content to Telegram
 */
router.post('/post/telegram', async (req, res) => {
  try {
    const { content, channelId, parseMode } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'content is required' });
    }

    const result = await poster.postToTelegram(content, { channelId, parseMode });
    res.json(result);
  } catch (error) {
    console.error('Post to Telegram error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/content/post/discord
 * Post content to Discord
 */
router.post('/post/discord', async (req, res) => {
  try {
    const { content, webhookUrl, username } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'content is required' });
    }

    const result = await poster.postToDiscord(content, { webhookUrl, username });
    res.json(result);
  } catch (error) {
    console.error('Post to Discord error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/content/distribute
 * Distribute atomized content to multiple platforms
 */
router.post('/distribute', async (req, res) => {
  try {
    const { atomized, platforms } = req.body;

    if (!atomized || !atomized.pieces) {
      return res.status(400).json({ success: false, error: 'atomized content is required' });
    }

    const results = await poster.distributeContent(atomized, { platforms });
    res.json({ success: true, results });
  } catch (error) {
    console.error('Distribute error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/content/post/deal
 * Post a deal alert to all channels
 */
router.post('/post/deal', async (req, res) => {
  try {
    const { deal } = req.body;

    if (!deal || !deal.title || !deal.price) {
      return res.status(400).json({ success: false, error: 'deal with title and price is required' });
    }

    // First atomize the deal
    const atomized = await atomizer.atomizeDeal(deal);
    
    // Then post to all channels
    const results = await poster.postDealAlert(deal, atomized);

    res.json({
      success: true,
      atomized,
      postResults: results
    });
  } catch (error) {
    console.error('Post deal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/content/schedule
 * Schedule content for later posting
 */
router.post('/schedule', async (req, res) => {
  try {
    const { content, platform, scheduledTime } = req.body;

    if (!content || !platform || !scheduledTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'content, platform, and scheduledTime are required' 
      });
    }

    const post = poster.schedulePost(content, platform, scheduledTime);
    res.json({ success: true, post });
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/content/scheduled
 * Get scheduled posts
 */
router.get('/scheduled', (req, res) => {
  const posts = poster.getScheduledPosts();
  res.json({ success: true, posts });
});

/**
 * POST /api/content/process-scheduled
 * Process all due scheduled posts
 */
router.post('/process-scheduled', async (req, res) => {
  try {
    const results = await poster.processScheduledPosts();
    res.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Process scheduled error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/content/history
 * Get post history
 */
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const history = poster.getPostHistory(limit);
  res.json({ success: true, history });
});

// ============================================================================
// CONTENT SCHEDULER
// ============================================================================

/**
 * GET /api/content/scheduler/status
 * Get content scheduler status
 */
router.get('/scheduler/status', (req, res) => {
  try {
    const scheduler = getScheduler();
    res.json({ success: true, ...scheduler.getStatus() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/content/scheduler/trigger/:type
 * Manually trigger a scheduled post
 */
router.post('/scheduler/trigger/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['morning', 'deal', 'engagement', 'evening'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid type. Use: ${validTypes.join(', ')}` 
      });
    }

    const scheduler = getScheduler();
    await scheduler.triggerPost(type);
    
    res.json({ success: true, triggered: type });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * GET /api/content/templates
 * Get content templates for different platforms
 */
router.get('/templates', (req, res) => {
  res.json({
    success: true,
    templates: {
      twitter: {
        deal_alert: '🚨 DEAL ALERT\n\n{title}\n\n💰 ${price} (Market: ${market_price})\n📉 Save ${savings} ({percent}% off)\n\n⚡ These go fast\n\n{link}',
        hot_take: '🔥 Hot take:\n\n{take}\n\nAgree or disagree?',
        thread_hook: '{hook}\n\n🧵 Thread 👇',
        stat: '📊 {stat}\n\n{context}\n\n{cta}'
      },
      telegram: {
        deal: '🔥 *{title}*\n\n💵 Price: ${price}\n📈 Market: ${market_price}\n💰 Save: ${savings} ({percent}% off)\n\n🔗 {link}',
        daily_digest: '📰 *Daily Digest - {date}*\n\n{content}\n\n👉 More at thehub.deals'
      },
      linkedin: {
        insight: '{hook}\n\n{body}\n\n{cta}\n\n#watches #sneakers #reselling #deals'
      }
    }
  });
});

module.exports = router;
