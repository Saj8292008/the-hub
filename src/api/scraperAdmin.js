const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * Scraper Admin API Routes
 * Control and monitor the scraper system
 *
 * All routes are under /admin/scraper/
 */

let scraperCoordinator = null;

// Inject coordinator (set by server.js)
function setCoordinator(coordinator) {
  scraperCoordinator = coordinator;
}

// Middleware to check if coordinator is available
function ensureCoordinator(req, res, next) {
  if (!scraperCoordinator) {
    return res.status(503).json({
      error: 'Scraper coordinator not available',
      message: 'The scraper system is not initialized'
    });
  }
  next();
}

/**
 * GET /admin/scraper/status
 * Get comprehensive status of scraper system
 */
router.get('/status', ensureCoordinator, (req, res) => {
  try {
    const status = scraperCoordinator.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error(`Error getting scraper status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /admin/scraper/stats
 * Get detailed statistics
 */
router.get('/stats', ensureCoordinator, (req, res) => {
  try {
    const stats = scraperCoordinator.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Error getting scraper stats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/scraper/pause
 * Pause all scraping
 */
router.post('/pause', ensureCoordinator, (req, res) => {
  try {
    scraperCoordinator.pause();
    logger.info('Admin: Paused all scraping');

    res.json({
      success: true,
      message: 'All scraping paused'
    });
  } catch (error) {
    logger.error(`Error pausing scraper: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/scraper/resume
 * Resume scraping
 */
router.post('/resume', ensureCoordinator, (req, res) => {
  try {
    scraperCoordinator.resume();
    logger.info('Admin: Resumed scraping');

    res.json({
      success: true,
      message: 'Scraping resumed'
    });
  } catch (error) {
    logger.error(`Error resuming scraper: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/scraper/run/:source
 * Manually trigger a specific source
 * Example: POST /admin/scraper/run/reddit
 */
router.post('/run/:source', ensureCoordinator, async (req, res) => {
  const { source } = req.params;

  try {
    logger.info(`Admin: Manually triggering ${source}`);

    const result = await scraperCoordinator.triggerSource(source);

    res.json({
      success: true,
      message: `Triggered ${source} scraper`,
      data: result
    });
  } catch (error) {
    logger.error(`Error running ${source}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/scraper/run
 * Run all scrapers immediately
 */
router.post('/run', ensureCoordinator, async (req, res) => {
  try {
    logger.info('Admin: Running all scrapers');

    const results = await scraperCoordinator.runAll();

    res.json({
      success: true,
      message: 'All scrapers triggered',
      data: results
    });
  } catch (error) {
    logger.error(`Error running all scrapers: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/scraper/enable/:source
 * Re-enable a disabled source
 */
router.post('/enable/:source', ensureCoordinator, (req, res) => {
  const { source } = req.params;

  try {
    const success = scraperCoordinator.enableSource(source);

    if (success) {
      logger.info(`Admin: Re-enabled source ${source}`);
      res.json({
        success: true,
        message: `Source ${source} re-enabled`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Source ${source} not found`
      });
    }
  } catch (error) {
    logger.error(`Error enabling ${source}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /admin/scraper/health
 * Health check endpoint for monitoring services
 */
router.get('/health', ensureCoordinator, (req, res) => {
  try {
    const status = scraperCoordinator.getStatus();
    const isHealthy = status.scheduler.totalExecutions > 0 &&
                     status.scheduler.successRate > 50;

    res.status(isHealthy ? 200 : 503).json({
      healthy: isHealthy,
      scheduler: {
        isPaused: status.scheduler.isPaused,
        activeJobs: status.scheduler.activeJobs,
        successRate: status.scheduler.successRate
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(503).json({
      healthy: false,
      error: error.message
    });
  }
});

/**
 * POST /admin/scraper/schedule
 * Update schedules dynamically (without redeployment)
 * Body: { source: 'reddit', schedule: 'cron expression' }
 * Example schedule: '* /5 * * * *' (every 5 minutes, remove space after *)
 */
router.post('/schedule', ensureCoordinator, (req, res) => {
  const { source, schedule } = req.body;

  if (!source || !schedule) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: source, schedule'
    });
  }

  try {
    // TODO: Implement dynamic schedule update
    // This would require stopping and re-registering the job

    logger.info(`Admin: Schedule update requested for ${source}: ${schedule}`);

    res.json({
      success: false,
      message: 'Dynamic schedule updates not yet implemented',
      note: 'Set via environment variables for now'
    });
  } catch (error) {
    logger.error(`Error updating schedule: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = { router, setCoordinator };
