/**
 * Scraper Logs Database Queries
 * CRUD operations for scraper_logs table
 */

const { pool } = require('./supabase');
const logger = require('../utils/logger');

/**
 * Log a scraper run
 */
async function logScraperRun({
  category,
  source,
  status,
  items_found = 0,
  items_new = 0,
  items_updated = 0,
  duration_ms = 0,
  error_message = null,
  retry_count = 0,
  metadata = null
}) {
  try {
    const result = await pool.query(
      `INSERT INTO scraper_logs (
        category,
        source,
        status,
        items_found,
        items_new,
        items_updated,
        duration_ms,
        error_message,
        retry_count,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        category,
        source,
        status,
        items_found,
        items_new,
        items_updated,
        duration_ms,
        error_message,
        retry_count,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return { success: true, data: result.rows[0] };
  } catch (error) {
    logger.error('Failed to log scraper run:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent scraper logs
 */
async function getRecentLogs(limit = 50, filters = {}) {
  try {
    let query = 'SELECT * FROM scraper_logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.source) {
      query += ` AND source = $${paramIndex++}`;
      params.push(filters.source);
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.since) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(filters.since);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    logger.error('Failed to get scraper logs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get scraper statistics
 */
async function getScraperStats(category = null, hours = 24) {
  try {
    let query = `
      SELECT
        category,
        source,
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
        COUNT(*) FILTER (WHERE status = 'error') as failed_runs,
        SUM(items_found) as total_items_found,
        SUM(items_new) as total_items_new,
        SUM(items_updated) as total_items_updated,
        AVG(duration_ms) as avg_duration_ms,
        MAX(timestamp) as last_run_at,
        MIN(timestamp) as first_run_at
      FROM scraper_logs
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
    `;

    const params = [];
    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }

    query += ' GROUP BY category, source ORDER BY last_run_at DESC';

    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    logger.error('Failed to get scraper stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get last successful run time for each source
 */
async function getLastRunTimes() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (category, source)
        category,
        source,
        timestamp as last_run_at,
        status,
        items_found,
        duration_ms
      FROM scraper_logs
      WHERE status = 'success'
      ORDER BY category, source, timestamp DESC
    `);

    return { success: true, data: result.rows };
  } catch (error) {
    logger.error('Failed to get last run times:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent errors
 */
async function getRecentErrors(limit = 20) {
  try {
    const result = await pool.query(
      `SELECT
        timestamp,
        category,
        source,
        error_message,
        retry_count,
        duration_ms,
        metadata
      FROM scraper_logs
      WHERE status = 'error'
      ORDER BY timestamp DESC
      LIMIT $1`,
      [limit]
    );

    return { success: true, data: result.rows };
  } catch (error) {
    logger.error('Failed to get recent errors:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get success rate for a source
 */
async function getSuccessRate(source, hours = 24) {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
        ROUND(
          (COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*)) * 100,
          2
        ) as success_rate
      FROM scraper_logs
      WHERE source = $1
        AND timestamp > NOW() - INTERVAL '${hours} hours'`,
      [source]
    );

    return { success: true, data: result.rows[0] };
  } catch (error) {
    logger.error('Failed to get success rate:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean up old logs (older than 30 days)
 */
async function cleanupOldLogs() {
  try {
    const result = await pool.query(
      `DELETE FROM scraper_logs
       WHERE timestamp < NOW() - INTERVAL '30 days'
       RETURNING id`
    );

    const deletedCount = result.rows.length;
    logger.info(`Cleaned up ${deletedCount} old scraper logs`);
    return { success: true, deletedCount };
  } catch (error) {
    logger.error('Failed to cleanup old logs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get scraper health summary
 */
async function getHealthSummary() {
  try {
    // Get stats for last 24 hours
    const statsResult = await getScraperStats(null, 24);
    if (!statsResult.success) {
      throw new Error(statsResult.error);
    }

    // Get recent errors
    const errorsResult = await getRecentErrors(10);
    if (!errorsResult.success) {
      throw new Error(errorsResult.error);
    }

    // Get last run times
    const lastRunResult = await getLastRunTimes();
    if (!lastRunResult.success) {
      throw new Error(lastRunResult.error);
    }

    // Calculate overall health
    const stats = statsResult.data;
    const totalRuns = stats.reduce((sum, s) => sum + parseInt(s.total_runs), 0);
    const successfulRuns = stats.reduce((sum, s) => sum + parseInt(s.successful_runs), 0);
    const overallSuccessRate = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(2) : 0;

    return {
      success: true,
      data: {
        overall: {
          totalRuns,
          successfulRuns,
          successRate: parseFloat(overallSuccessRate),
          lastHours: 24
        },
        bySource: stats,
        recentErrors: errorsResult.data,
        lastRuns: lastRunResult.data
      }
    };
  } catch (error) {
    logger.error('Failed to get health summary:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  logScraperRun,
  getRecentLogs,
  getScraperStats,
  getLastRunTimes,
  getRecentErrors,
  getSuccessRate,
  cleanupOldLogs,
  getHealthSummary
};
