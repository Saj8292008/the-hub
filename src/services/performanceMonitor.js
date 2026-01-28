/**
 * Performance Monitoring Service
 * Tracks API performance metrics and slow queries
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowQueryThreshold = 1000; // 1 second
    this.maxMetrics = 1000;
  }

  /**
   * Middleware to track request performance
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const path = req.route ? req.route.path : req.path;
      const method = req.method;

      // Track response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        this.recordMetric({
          method,
          path,
          duration,
          statusCode,
          timestamp: new Date().toISOString()
        });

        // Log slow queries
        if (duration > this.slowQueryThreshold) {
          console.warn(`⚠️ Slow request: ${method} ${path} took ${duration}ms`);
        }
      });

      next();
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric) {
    const key = `${metric.method}:${metric.path}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        path: metric.path,
        method: metric.method,
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        errors: 0,
        lastCalled: null
      });
    }

    const stats = this.metrics.get(key);

    // Update stats
    stats.count++;
    stats.totalDuration += metric.duration;
    stats.minDuration = Math.min(stats.minDuration, metric.duration);
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
    stats.avgDuration = Math.round(stats.totalDuration / stats.count);
    stats.lastCalled = metric.timestamp;

    if (metric.statusCode >= 400) {
      stats.errors++;
    }

    // Enforce max size
    if (this.metrics.size > this.maxMetrics) {
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Get slow endpoints (avg > threshold)
   */
  getSlowEndpoints(threshold = this.slowQueryThreshold) {
    return Array.from(this.metrics.values())
      .filter(m => m.avgDuration > threshold)
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Get error-prone endpoints
   */
  getErrorProneEndpoints() {
    return Array.from(this.metrics.values())
      .filter(m => m.errors > 0)
      .sort((a, b) => (b.errors / b.count) - (a.errors / a.count));
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const metrics = this.getMetrics();

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        slowestEndpoint: null,
        fastestEndpoint: null,
        errorRate: 0
      };
    }

    const totalRequests = metrics.reduce((sum, m) => sum + m.count, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0);
    const avgResponseTime = Math.round(
      metrics.reduce((sum, m) => sum + m.avgDuration * m.count, 0) / totalRequests
    );

    return {
      totalRequests,
      avgResponseTime,
      slowestEndpoint: metrics[0],
      fastestEndpoint: metrics[metrics.length - 1],
      errorRate: ((totalErrors / totalRequests) * 100).toFixed(2) + '%',
      uniqueEndpoints: metrics.length
    };
  }

  /**
   * Get metrics for specific endpoint
   */
  getEndpointMetrics(method, path) {
    const key = `${method}:${path}`;
    return this.metrics.get(key) || null;
  }

  /**
   * Clear all metrics
   */
  clear() {
    const count = this.metrics.size;
    this.metrics.clear();
    return { cleared: count };
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
      metrics: this.getMetrics(),
      slowEndpoints: this.getSlowEndpoints(),
      errorProneEndpoints: this.getErrorProneEndpoints()
    };
  }

  /**
   * Track custom operation
   */
  async trackOperation(name, operation) {
    const startTime = Date.now();
    let error = null;

    try {
      const result = await operation();
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const duration = Date.now() - startTime;

      this.recordMetric({
        method: 'CUSTOM',
        path: name,
        duration,
        statusCode: error ? 500 : 200,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
