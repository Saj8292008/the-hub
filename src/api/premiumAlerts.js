/**
 * Premium Alerts API
 * 
 * Endpoints for managing alert preferences, brand watchlists, and testing channels.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkLimit } = require('../middleware/tierLimits');
const PremiumAlertService = require('../services/alerts/PremiumAlertService');
const supabase = require('../db/supabase');
const logger = require('../utils/logger');

// Initialize service
const alertService = new PremiumAlertService(supabase.client);

// All routes require authentication
router.use(authenticateToken);

// ============================================================================
// ALERT PREFERENCES
// ============================================================================

/**
 * GET /api/premium-alerts/preferences
 * Get user's alert preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await alertService.getPreferences(userId);
    
    res.json({
      success: true,
      preferences: preferences || {
        // Return defaults if no preferences exist
        email_enabled: false,
        telegram_enabled: false,
        discord_enabled: false,
        custom_webhook_enabled: false,
        brands: [],
        categories: [],
        min_deal_score: 0,
        alert_delay_minutes: 15,
        tier: 'free'
      }
    });
  } catch (error) {
    logger.error(`Get preferences error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/premium-alerts/preferences
 * Update user's alert preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    // Validate fields
    const allowedFields = [
      'email_enabled', 'email_address',
      'telegram_enabled', 'telegram_chat_id', 'telegram_bot_token',
      'discord_enabled', 'discord_webhook_url',
      'custom_webhook_enabled', 'custom_webhook_url', 'custom_webhook_headers',
      'brands', 'categories', 'min_price', 'max_price',
      'min_deal_score', 'min_discount_percent',
      'quiet_hours_start', 'quiet_hours_end',
      'max_alerts_per_day', 'bundle_alerts', 'bundle_interval_minutes'
    ];
    
    const sanitized = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitized[field] = updates[field];
      }
    }

    // Validate webhook URLs
    if (sanitized.discord_webhook_url && !sanitized.discord_webhook_url.startsWith('https://discord.com/api/webhooks/')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Discord webhook URL' 
      });
    }

    if (sanitized.custom_webhook_url) {
      try {
        new URL(sanitized.custom_webhook_url);
      } catch {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid webhook URL' 
        });
      }
    }

    const preferences = await alertService.upsertPreferences(userId, sanitized);
    
    res.json({
      success: true,
      preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/premium-alerts/preferences/sync-tier
 * Sync alert delay with user's subscription tier
 */
router.post('/preferences/sync-tier', async (req, res) => {
  try {
    const userId = req.user.id;
    const tier = req.user.tier || 'free';
    
    const preferences = await alertService.updateTier(userId, tier);
    
    res.json({
      success: true,
      tier,
      alertDelay: preferences.alert_delay_minutes,
      message: `Alert delay set to ${preferences.alert_delay_minutes} minutes for ${tier} tier`
    });
  } catch (error) {
    logger.error(`Sync tier error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// BRAND WATCHLIST
// ============================================================================

/**
 * GET /api/premium-alerts/watchlist
 * Get user's brand watchlist
 */
router.get('/watchlist', async (req, res) => {
  try {
    const userId = req.user.id;
    const watchlist = await alertService.getBrandWatchlist(userId);
    
    res.json({
      success: true,
      watchlist
    });
  } catch (error) {
    logger.error(`Get watchlist error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/premium-alerts/watchlist
 * Add brand to watchlist
 */
router.post('/watchlist', checkLimit('tracks'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { brand, category, minDealScore, maxPrice, notifyAllDeals } = req.body;
    
    if (!brand || !category) {
      return res.status(400).json({
        success: false,
        error: 'Brand and category are required'
      });
    }

    const validCategories = ['watches', 'sneakers', 'cars'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const item = await alertService.addBrandToWatchlist(userId, brand, category, {
      minDealScore,
      maxPrice,
      notifyAllDeals
    });
    
    res.json({
      success: true,
      item,
      message: `Added ${brand} to your ${category} watchlist`
    });
  } catch (error) {
    logger.error(`Add to watchlist error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/premium-alerts/watchlist/:brand/:category
 * Remove brand from watchlist
 */
router.delete('/watchlist/:brand/:category', async (req, res) => {
  try {
    const userId = req.user.id;
    const { brand, category } = req.params;
    
    await alertService.removeBrandFromWatchlist(userId, brand, category);
    
    res.json({
      success: true,
      message: `Removed ${brand} from your ${category} watchlist`
    });
  } catch (error) {
    logger.error(`Remove from watchlist error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CHANNEL TESTING
// ============================================================================

/**
 * POST /api/premium-alerts/test/:channel
 * Send a test alert to verify channel configuration
 */
router.post('/test/:channel', async (req, res) => {
  try {
    const userId = req.user.id;
    const { channel } = req.params;
    
    const validChannels = ['email', 'telegram', 'discord', 'webhook'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`
      });
    }

    const result = await alertService.testChannel(userId, channel, req.body.testData);
    
    res.json({
      success: true,
      channel,
      result,
      message: `Test alert sent to ${channel} successfully`
    });
  } catch (error) {
    logger.error(`Test channel error: ${error.message}`);
    res.status(400).json({ 
      success: false, 
      error: error.message,
      hint: getChannelHint(req.params.channel)
    });
  }
});

function getChannelHint(channel) {
  const hints = {
    email: 'Make sure email_address is set in preferences',
    telegram: 'Make sure telegram_chat_id is set. Start a chat with the bot and send /start to get your chat ID',
    discord: 'Make sure discord_webhook_url is a valid Discord webhook URL',
    webhook: 'Make sure custom_webhook_url is accessible and accepts POST requests'
  };
  return hints[channel] || '';
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * GET /api/premium-alerts/stats
 * Get user's alert statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await alertService.getUserStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error(`Get stats error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/premium-alerts/history
 * Get recent alert delivery history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const { data: history, error } = await supabase.client
      .from('alert_delivery_log')
      .select('*')
      .eq('user_id', userId)
      .order('delivered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    res.json({
      success: true,
      history: history || []
    });
  } catch (error) {
    logger.error(`Get history error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/premium-alerts/pending
 * Get pending alerts in queue
 */
router.get('/pending', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: pending, error } = await supabase.client
      .from('alert_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('delivery_status', 'pending')
      .order('scheduled_at', { ascending: true })
      .limit(20);

    if (error) throw error;
    
    res.json({
      success: true,
      pending: pending || []
    });
  } catch (error) {
    logger.error(`Get pending error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ADMIN / INTERNAL ENDPOINTS
// ============================================================================

/**
 * POST /api/premium-alerts/process-deal
 * Process a deal and queue alerts for matching users (internal use)
 */
router.post('/process-deal', async (req, res) => {
  try {
    // This should be called internally when new deals are discovered
    // Add API key check for security in production
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const deal = req.body;
    if (!deal || !deal.id) {
      return res.status(400).json({ success: false, error: 'Deal data required' });
    }

    const result = await alertService.processDeal(deal);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Process deal error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/premium-alerts/process-queue
 * Manually trigger queue processing (admin only)
 */
router.post('/process-queue', async (req, res) => {
  try {
    const result = await alertService.processQueue();
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Process queue error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export both router and service
module.exports = {
  router,
  alertService
};
