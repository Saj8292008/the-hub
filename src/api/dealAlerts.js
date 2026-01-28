/**
 * Deal Alerts API
 * 
 * Endpoints for managing and monitoring deal alerts
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { getScheduler } = require('../schedulers/dealAlertScheduler');
const DealAlertService = require('../services/alerts/DealAlertService');

/**
 * GET /api/alerts/status
 * Get deal alert scheduler status
 */
router.get('/status', (req, res) => {
  const scheduler = getScheduler();
  
  if (!scheduler) {
    return res.json({
      status: 'not_initialized',
      message: 'Deal alert scheduler not yet initialized'
    });
  }
  
  res.json({
    status: 'ok',
    ...scheduler.getStatus()
  });
});

/**
 * POST /api/alerts/check
 * Manually trigger a deal check
 */
router.post('/check', async (req, res) => {
  const scheduler = getScheduler();
  
  if (!scheduler) {
    return res.status(503).json({
      error: 'Deal alert scheduler not initialized'
    });
  }
  
  try {
    const result = await scheduler.triggerCheck(req.body.chatId);
    res.json(result);
  } catch (error) {
    logger.error('Error triggering deal check:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/deals
 * Get current deals without sending alerts (preview mode)
 */
router.get('/deals', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const alertService = new DealAlertService(supabase);
    const deals = await alertService.findWatchDeals();
    
    res.json({
      count: deals.length,
      deals: deals.map(d => ({
        title: d.listing.title || `${d.listing.brand} ${d.listing.model}`,
        price: d.listing.price,
        targetPrice: d.watchlistItem.target_price,
        savings: d.savings,
        savingsPercent: d.savingsPercent,
        score: d.score,
        source: d.listing.source,
        url: d.listing.url,
        listedAt: d.listing.created_at
      }))
    });
  } catch (error) {
    logger.error('Error fetching deals:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/history
 * Get recent alert history
 */
router.get('/history', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const limit = parseInt(req.query.limit) || 50;
    
    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { data, error } = await supabase
      .from('deal_alerts')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      count: data.length,
      alerts: data
    });
  } catch (error) {
    logger.error('Error fetching alert history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/alerts/test
 * Send a test alert to verify configuration
 */
router.post('/test', async (req, res) => {
  const scheduler = getScheduler();
  
  if (!scheduler || !scheduler.bot) {
    return res.status(503).json({
      error: 'Telegram bot not configured for deal alerts'
    });
  }
  
  const chatId = req.body.chatId || scheduler.defaultChatId;
  
  if (!chatId) {
    return res.status(400).json({
      error: 'No chat ID provided and no default configured'
    });
  }
  
  try {
    await scheduler.bot.sendMessage(chatId, 
      '🔔 **Deal Alert Test**\n\n' +
      'If you see this, deal alerts are working!\n\n' +
      `Scheduler status: ${scheduler.isRunning ? '✅ Running' : '⏸️ Stopped'}\n` +
      `Total alerts sent: ${scheduler.stats.totalAlertsSent}`,
      { parse_mode: 'Markdown' }
    );
    
    res.json({ success: true, message: 'Test alert sent' });
  } catch (error) {
    logger.error('Error sending test alert:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
