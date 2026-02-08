/**
 * Instagram API Routes
 * Endpoints for Instagram automation control and monitoring
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { getScheduler } = require('../schedulers/instagramScheduler');

/**
 * GET /api/instagram/status
 * Get Instagram service status and stats
 */
router.get('/status', (req, res) => {
  try {
    const scheduler = getScheduler();
    
    if (!scheduler) {
      return res.json({
        configured: false,
        running: false,
        message: 'Instagram scheduler not initialized'
      });
    }

    const status = scheduler.getStatus();
    res.json(status);

  } catch (error) {
    logger.error('Instagram status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/instagram/post
 * Manually trigger a posting cycle
 */
router.post('/post', async (req, res) => {
  try {
    const scheduler = getScheduler();
    
    if (!scheduler) {
      return res.status(400).json({
        success: false,
        message: 'Instagram scheduler not initialized'
      });
    }

    if (!scheduler.poster.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Instagram not configured. Add credentials to .env'
      });
    }

    const dryRun = req.body.dryRun === true || req.query.dryRun === 'true';
    
    logger.info(`Manual Instagram post triggered ${dryRun ? '(dry run)' : ''}`);
    const result = await scheduler.triggerPost(dryRun);

    res.json({
      success: true,
      dryRun,
      result
    });

  } catch (error) {
    logger.error('Instagram post error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/instagram/queue
 * Get deals queued for Instagram posting
 */
router.get('/queue', async (req, res) => {
  try {
    const scheduler = getScheduler();
    
    if (!scheduler) {
      return res.status(400).json({
        success: false,
        message: 'Instagram scheduler not initialized'
      });
    }

    const { data: deals, error } = await scheduler.supabase.client
      .from('deals')
      .select('id, title, price, original_price, score, category, created_at')
      .gte('score', scheduler.poster.scoreThreshold)
      .is('instagram_posted_at', null)
      .order('score', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: deals?.length || 0,
      threshold: scheduler.poster.scoreThreshold,
      deals: deals || []
    });

  } catch (error) {
    logger.error('Instagram queue error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/instagram/recent
 * Get recently posted deals
 */
router.get('/recent', async (req, res) => {
  try {
    const scheduler = getScheduler();
    
    if (!scheduler) {
      return res.status(400).json({
        success: false,
        message: 'Instagram scheduler not initialized'
      });
    }

    const limit = parseInt(req.query.limit) || 10;

    const { data: deals, error } = await scheduler.supabase.client
      .from('deals')
      .select('id, title, price, original_price, score, category, instagram_posted_at, instagram_post_id')
      .not('instagram_posted_at', 'is', null)
      .order('instagram_posted_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: deals?.length || 0,
      deals: deals || []
    });

  } catch (error) {
    logger.error('Instagram recent error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/instagram/test-connection
 * Test Instagram Graph API connection
 */
router.post('/test-connection', async (req, res) => {
  try {
    const scheduler = getScheduler();
    
    if (!scheduler) {
      return res.status(400).json({
        success: false,
        message: 'Instagram scheduler not initialized'
      });
    }

    if (!scheduler.poster.isConfigured()) {
      return res.json({
        success: false,
        configured: false,
        message: 'Instagram credentials not configured'
      });
    }

    // Test API connection by fetching account info
    const axios = require('axios');
    const response = await axios.get(
      `${scheduler.poster.baseUrl}/${scheduler.poster.accountId}`,
      {
        params: {
          fields: 'id,username',
          access_token: scheduler.poster.accessToken
        }
      }
    );

    res.json({
      success: true,
      configured: true,
      account: response.data
    });

  } catch (error) {
    logger.error('Instagram connection test error:', error);
    res.status(500).json({ 
      success: false,
      configured: true,
      error: error.response?.data || error.message 
    });
  }
});

module.exports = router;
