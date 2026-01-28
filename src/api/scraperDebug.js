/**
 * Scraper Debug Admin API
 * Endpoints for monitoring and debugging scrapers
 */

const express = require('express');
const router = express.Router();
const {
  getRecentLogs,
  getScraperStats,
  getLastRunTimes,
  getRecentErrors,
  getSuccessRate,
  getHealthSummary
} = require('../db/scraperLogsQueries');
const logger = require('../utils/logger');

// Note: In production, add authenticateToken middleware to protect these routes

/**
 * GET /api/scraper-debug/logs
 * Get recent scraper logs with optional filters
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const filters = {
      category: req.query.category,
      source: req.query.source,
      status: req.query.status,
      since: req.query.since
    };

    const result = await getRecentLogs(limit, filters);

    if (result.success) {
      res.json({
        success: true,
        logs: result.data,
        count: result.data.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching scraper logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraper-debug/stats
 * Get scraper statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const category = req.query.category;
    const hours = parseInt(req.query.hours) || 24;

    const result = await getScraperStats(category, hours);

    if (result.success) {
      res.json({
        success: true,
        stats: result.data,
        period: `${hours} hours`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching scraper stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraper-debug/last-runs
 * Get last successful run time for each source
 */
router.get('/last-runs', async (req, res) => {
  try {
    const result = await getLastRunTimes();

    if (result.success) {
      res.json({
        success: true,
        lastRuns: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching last run times:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraper-debug/errors
 * Get recent errors
 */
router.get('/errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await getRecentErrors(limit);

    if (result.success) {
      res.json({
        success: true,
        errors: result.data,
        count: result.data.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching recent errors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraper-debug/success-rate/:source
 * Get success rate for a specific source
 */
router.get('/success-rate/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    const result = await getSuccessRate(source, hours);

    if (result.success) {
      res.json({
        success: true,
        source,
        ...result.data,
        period: `${hours} hours`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching success rate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraper-debug/health
 * Get comprehensive health summary
 */
router.get('/health', async (req, res) => {
  try {
    const result = await getHealthSummary();

    if (result.success) {
      res.json({
        success: true,
        health: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error fetching health summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scraper-debug/trigger/:source
 * Manually trigger a specific scraper
 */
router.post('/trigger/:source', async (req, res) => {
  try {
    const { source } = req.params;

    // Import scheduler (will be set by server.js)
    if (!global.scraperScheduler) {
      return res.status(503).json({
        success: false,
        error: 'Scraper scheduler not initialized'
      });
    }

    logger.info(`Manual trigger requested for ${source} scraper`);

    // Run the scraper
    const result = await global.scraperScheduler.runSource(source);

    res.json({
      success: result.success,
      source,
      itemsFound: result.count,
      duration: result.duration,
      error: result.error || null
    });
  } catch (error) {
    logger.error('Error triggering scraper:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scraper-debug/trigger-all
 * Manually trigger all scrapers
 */
router.post('/trigger-all', async (req, res) => {
  try {
    if (!global.scraperScheduler) {
      return res.status(503).json({
        success: false,
        error: 'Scraper scheduler not initialized'
      });
    }

    logger.info('Manual trigger requested for all scrapers');

    const results = await global.scraperScheduler.runAll();

    res.json({
      success: true,
      results,
      totalItems: results.reduce((sum, r) => sum + (r.count || 0), 0)
    });
  } catch (error) {
    logger.error('Error triggering all scrapers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraper-debug/scheduler/status
 * Get scheduler status
 */
router.get('/scheduler/status', async (req, res) => {
  try {
    if (!global.scraperScheduler) {
      return res.json({
        success: true,
        scheduler: {
          isRunning: false,
          error: 'Scheduler not initialized'
        }
      });
    }

    const status = global.scraperScheduler.getStatus();

    res.json({
      success: true,
      scheduler: status
    });
  } catch (error) {
    logger.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scraper-debug/scheduler/restart
 * Restart the scheduler
 */
router.post('/scheduler/restart', async (req, res) => {
  try {
    if (!global.scraperScheduler) {
      return res.status(503).json({
        success: false,
        error: 'Scraper scheduler not initialized'
      });
    }

    logger.info('Restarting scraper scheduler');

    // Stop and restart
    global.scraperScheduler.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    global.scraperScheduler.start();

    const status = global.scraperScheduler.getStatus();

    res.json({
      success: true,
      message: 'Scheduler restarted',
      scheduler: status
    });
  } catch (error) {
    logger.error('Error restarting scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
