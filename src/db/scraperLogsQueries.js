/**
 * Scraper Logs Database Queries
 * CRUD operations for scraper_logs table
 * Uses Supabase client instead of raw pg pool
 */

const supabase = require('./supabase');
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
    if (!supabase.isAvailable()) {
      // Silently skip if Supabase not available
      return { success: false, error: 'Supabase not available' };
    }
    
    const { data, error } = await supabase.client.from('scraper_logs').insert([{
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
    }]).select();
    
    if (error) {
      logger.warn(`Failed to log scraper run: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data?.[0] };
  } catch (error) {
    logger.warn(`Failed to log scraper run: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent scraper logs
 */
async function getRecentLogs(limit = 50, filters = {}) {
  try {
    if (!supabase.isAvailable()) {
      return { success: false, error: 'Supabase not available' };
    }
    
    let query = supabase.client
      .from('scraper_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.since) {
      query = query.gte('timestamp', filters.since);
    }

    const { data, error } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    logger.error('Failed to get scraper logs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get scraper statistics (simplified version without raw SQL)
 */
async function getScraperStats(category = null, hours = 24) {
  try {
    if (!supabase.isAvailable()) {
      return { success: false, error: 'Supabase not available' };
    }
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    let query = supabase.client
      .from('scraper_logs')
      .select('*')
      .gte('timestamp', since);
      
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Aggregate stats in JS
    const stats = {};
    for (const log of data || []) {
      const key = `${log.category}:${log.source}`;
      if (!stats[key]) {
        stats[key] = {
          category: log.category,
          source: log.source,
          total_runs: 0,
          successful_runs: 0,
          failed_runs: 0,
          total_items_found: 0,
          total_items_new: 0,
          avg_duration_ms: 0,
          last_run_at: null
        };
      }
      stats[key].total_runs++;
      if (log.status === 'success') stats[key].successful_runs++;
      if (log.status === 'error') stats[key].failed_runs++;
      stats[key].total_items_found += log.items_found || 0;
      stats[key].total_items_new += log.items_new || 0;
      stats[key].avg_duration_ms += log.duration_ms || 0;
      if (!stats[key].last_run_at || log.timestamp > stats[key].last_run_at) {
        stats[key].last_run_at = log.timestamp;
      }
    }
    
    // Calculate averages
    for (const key in stats) {
      if (stats[key].total_runs > 0) {
        stats[key].avg_duration_ms = Math.round(stats[key].avg_duration_ms / stats[key].total_runs);
      }
    }
    
    return { success: true, data: Object.values(stats) };
  } catch (error) {
    logger.error('Failed to get scraper stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recent errors
 */
async function getRecentErrors(limit = 20) {
  try {
    if (!supabase.isAvailable()) {
      return { success: false, error: 'Supabase not available' };
    }
    
    const { data, error } = await supabase.client
      .from('scraper_logs')
      .select('*')
      .eq('status', 'error')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    logger.error('Failed to get recent errors:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get last successful run time for each source
 */
async function getLastRunTimes() {
  try {
    if (!supabase.isAvailable()) {
      return { success: false, error: 'Supabase not available' };
    }
    
    const { data, error } = await supabase.client
      .from('scraper_logs')
      .select('*')
      .eq('status', 'success')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Get most recent per source
    const lastRuns = {};
    for (const log of data || []) {
      const key = `${log.category}:${log.source}`;
      if (!lastRuns[key]) {
        lastRuns[key] = log;
      }
    }
    
    return { success: true, data: Object.values(lastRuns) };
  } catch (error) {
    logger.error('Failed to get last run times:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get success rate for a source
 */
async function getSuccessRate(source, hours = 24) {
  try {
    const statsResult = await getScraperStats(null, hours);
    if (!statsResult.success) {
      return statsResult;
    }
    
    const sourceStats = statsResult.data.find(s => s.source === source);
    if (!sourceStats) {
      return { success: true, data: { total_runs: 0, successful_runs: 0, success_rate: 0 } };
    }
    
    const successRate = sourceStats.total_runs > 0 
      ? ((sourceStats.successful_runs / sourceStats.total_runs) * 100).toFixed(2)
      : 0;
    
    return { 
      success: true, 
      data: { 
        total_runs: sourceStats.total_runs, 
        successful_runs: sourceStats.successful_runs, 
        success_rate: parseFloat(successRate)
      } 
    };
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
    if (!supabase.isAvailable()) {
      return { success: false, error: 'Supabase not available' };
    }
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase.client
      .from('scraper_logs')
      .delete()
      .lt('timestamp', thirtyDaysAgo)
      .select('id');
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    const deletedCount = data?.length || 0;
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
    const statsResult = await getScraperStats(null, 24);
    if (!statsResult.success) {
      return statsResult;
    }

    const errorsResult = await getRecentErrors(10);
    const lastRunResult = await getLastRunTimes();

    const stats = statsResult.data || [];
    const totalRuns = stats.reduce((sum, s) => sum + s.total_runs, 0);
    const successfulRuns = stats.reduce((sum, s) => sum + s.successful_runs, 0);
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
        recentErrors: errorsResult.data || [],
        lastRuns: lastRunResult.data || []
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
