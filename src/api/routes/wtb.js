const express = require('express');
const router = express.Router();
const WTBMonitor = require('../../services/reddit/WTBMonitor');
const logger = require('../../utils/logger');

const wtbMonitor = new WTBMonitor();

/**
 * GET /api/wtb/scan
 * Scan the current WTB thread and return all requests
 */
router.get('/scan', async (req, res) => {
  try {
    logger.info('🔍 WTB scan requested via API');
    const result = await wtbMonitor.scan();
    
    res.json({
      success: true,
      thread: result.thread,
      totalRequests: result.requests.length,
      requests: result.requests,
      scannedAt: result.scannedAt
    });
  } catch (error) {
    logger.error(`WTB scan failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/wtb/search
 * Search WTB requests for specific brands/models
 * Query params: brand, model, minTransactions
 */
router.get('/search', async (req, res) => {
  try {
    const { brand, model, minTransactions = 0 } = req.query;
    
    logger.info(`🔍 WTB search: brand=${brand}, model=${model}`);
    
    const result = await wtbMonitor.scan();
    
    let filtered = result.requests;
    
    if (brand) {
      filtered = filtered.filter(r => 
        r.brand.toLowerCase().includes(brand.toLowerCase()) ||
        r.body.toLowerCase().includes(brand.toLowerCase())
      );
    }
    
    if (model) {
      filtered = filtered.filter(r =>
        r.models.some(m => m.toLowerCase().includes(model.toLowerCase())) ||
        r.body.toLowerCase().includes(model.toLowerCase())
      );
    }
    
    if (minTransactions > 0) {
      filtered = filtered.filter(r => r.transactions >= parseInt(minTransactions));
    }
    
    res.json({
      success: true,
      query: { brand, model, minTransactions },
      totalMatches: filtered.length,
      requests: filtered
    });
  } catch (error) {
    logger.error(`WTB search failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/wtb/match
 * Match WTB requests against provided deals
 * Body: { deals: [...] }
 */
router.post('/match', async (req, res) => {
  try {
    const { deals } = req.body;
    
    if (!deals || !Array.isArray(deals)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide deals array in request body'
      });
    }
    
    logger.info(`🔍 WTB match requested with ${deals.length} deals`);
    
    const result = await wtbMonitor.scan();
    const matches = wtbMonitor.matchWithDeals(result.requests, deals);
    
    res.json({
      success: true,
      thread: result.thread,
      totalRequests: result.requests.length,
      totalMatches: matches.length,
      matches: matches
    });
  } catch (error) {
    logger.error(`WTB match failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/wtb/opportunities
 * Get high-value outreach opportunities
 * Returns WTB requests from users with transaction history
 */
router.get('/opportunities', async (req, res) => {
  try {
    const { minTransactions = 5, limit = 20 } = req.query;
    
    logger.info(`🎯 Getting WTB opportunities (min ${minTransactions} transactions)`);
    
    const result = await wtbMonitor.scan();
    
    // Filter for users with transaction history (more likely to actually buy)
    const opportunities = result.requests
      .filter(r => r.transactions >= parseInt(minTransactions))
      .slice(0, parseInt(limit))
      .map(r => ({
        author: r.author,
        transactions: r.transactions,
        brand: r.brand,
        models: r.models,
        priceRange: r.priceRange,
        url: r.url,
        searchTerms: r.searchTerms,
        timestamp: r.timestamp
      }));
    
    res.json({
      success: true,
      thread: {
        title: result.thread.title,
        url: result.thread.url,
        numComments: result.thread.numComments
      },
      totalRequests: result.requests.length,
      opportunities: opportunities,
      scannedAt: result.scannedAt
    });
  } catch (error) {
    logger.error(`WTB opportunities failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
