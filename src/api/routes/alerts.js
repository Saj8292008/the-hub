/**
 * Price Alert API Routes
 * /api/alerts
 */

const express = require('express');
const router = express.Router();
const PriceAlertService = require('../../services/alerts/PriceAlertService');

const alertService = new PriceAlertService();

/**
 * POST /api/alerts
 * Create a new price alert
 */
router.post('/', async (req, res) => {
  try {
    const { userId, brand, model, targetPrice, channel } = req.body;

    if (!userId || !targetPrice) {
      return res.status(400).json({ 
        error: 'userId and targetPrice are required' 
      });
    }

    if (targetPrice < 50 || targetPrice > 100000) {
      return res.status(400).json({ 
        error: 'targetPrice must be between $50 and $100,000' 
      });
    }

    const alert = await alertService.createAlert({
      userId,
      brand: brand || null,
      model: model || null,
      targetPrice,
      channel: channel || 'telegram'
    });

    res.status(201).json({
      success: true,
      alert,
      message: `Alert created! You'll be notified when ${brand || 'any watch'} is listed under $${targetPrice}`
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

/**
 * GET /api/alerts/:userId
 * Get user's active alerts
 */
router.get('/:userId', async (req, res) => {
  try {
    const alerts = await alertService.getUserAlerts(req.params.userId);
    
    res.json({
      alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * DELETE /api/alerts/:alertId
 * Deactivate an alert
 */
router.delete('/:alertId', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    await alertService.deactivateAlert(req.params.alertId, userId);
    
    res.json({
      success: true,
      message: 'Alert deactivated'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await alertService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
