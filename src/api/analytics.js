/**
 * Analytics API
 * 
 * Endpoints for price history, deal comparison, and market trends
 */

const express = require('express');
const router = express.Router();
const PriceHistoryService = require('../services/analytics/PriceHistoryService');
const DealComparisonService = require('../services/analytics/DealComparisonService');
const supabase = require('../db/supabase');

// Initialize services
const priceHistory = new PriceHistoryService(supabase.client);
const dealComparison = new DealComparisonService(supabase.client);

/**
 * GET /api/analytics/price-history/:type/:id
 * Get price history for an item
 */
router.get('/price-history/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const days = parseInt(req.query.days) || 30;
    
    const history = await priceHistory.getHistory(type, id, days);
    const stats = await priceHistory.getStats(type, id, days);
    const chartData = priceHistory.formatForChart(history);
    
    res.json({
      history,
      stats,
      chartData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/market-trends
 * Get market trends
 */
router.get('/market-trends', async (req, res) => {
  try {
    const type = req.query.type || 'watch';
    const days = parseInt(req.query.days) || 7;
    
    const trends = await priceHistory.getMarketTrends(type, days);
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/price-drops
 * Find recent price drops
 */
router.get('/price-drops', async (req, res) => {
  try {
    const type = req.query.type || 'watch';
    const threshold = parseInt(req.query.threshold) || 10;
    
    const drops = await priceHistory.findPriceDrops(type, threshold);
    
    res.json({ drops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/compare
 * Compare prices across sources
 */
router.get('/compare', async (req, res) => {
  try {
    const { brand, model } = req.query;
    
    if (!brand && !model) {
      return res.status(400).json({ error: 'Brand or model required' });
    }
    
    const comparison = await dealComparison.compareWatch(brand, model);
    
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/arbitrage
 * Find arbitrage opportunities
 */
router.get('/arbitrage', async (req, res) => {
  try {
    const minSpread = parseInt(req.query.minSpread) || 100;
    const minPercent = parseInt(req.query.minPercent) || 15;
    
    const opportunities = await dealComparison.findArbitrageOpportunities(minSpread, minPercent);
    
    res.json({
      count: opportunities.length,
      opportunities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/summary
 * Get comparison summary for dashboard
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await dealComparison.getComparisonSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
