const cron = require('node-cron');
const logger = require('../utils/logger');
const { EventEmitter } = require('events');

/**
 * Enhanced Job Scheduler with Smart Logic
 *
 * Features:
 * - Adaptive scheduling based on activity
 * - Error handling with exponential backoff
 * - Rate limiting per source
 * - Job queue to prevent overlaps
 * - Monitoring and metrics
 * - Graceful shutdown
 */
class EnhancedScheduler extends EventEmitter {
  constructor(options = {}) {
    super();

    this.jobs = new Map();
    this.jobQueue = [];
    this.isProcessingQueue = false;
    this.isPaused = false;

    // Job execution history (for monitoring)
    this.executionHistory = new Map(); // jobName -> array of executions
    this.failureCount = new Map(); // jobName -> consecutive failures
    this.lastExecution = new Map(); // jobName -> timestamp

    // Rate limiting
    this.rateLimits = new Map(); // jobName -> { count, resetTime }

    // Configuration
    this.config = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000,
      maxConcurrent: options.maxConcurrent || 3,
      queueEnabled: options.queueEnabled !== false,
      ...options
    };

    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      activeJobs: 0,
      queuedJobs: 0
    };
  }

  /**
   * Register a new scheduled job
   */
  registerJob(jobName, schedule, handler, options = {}) {
    if (this.jobs.has(jobName)) {
      logger.warn(`Job ${jobName} already registered, skipping`);
      return false;
    }

    // Validate cron schedule
    if (!cron.validate(schedule)) {
      logger.error(`Invalid cron schedule for ${jobName}: ${schedule}`);
      return false;
    }

    const job = {
      name: jobName,
      schedule,
      handler,
      options: {
        retries: options.retries || this.config.maxRetries,
        timeout: options.timeout || 300000, // 5 minutes default
        rateLimit: options.rateLimit || null,
        minInterval: options.minInterval || 60000, // Don't run more than once per minute
        priority: options.priority || 5, // 1-10, higher = more important
        adaptiveScheduling: options.adaptiveScheduling !== false,
        ...options
      },
      cronJob: null,
      isRunning: false,
      disabled: false
    };

    // Create cron job
    job.cronJob = cron.schedule(schedule, async () => {
      await this.executeJob(jobName);
    }, {
      scheduled: false // Don't start immediately
    });

    this.jobs.set(jobName, job);
    this.executionHistory.set(jobName, []);
    this.failureCount.set(jobName, 0);

    logger.info(`✅ Registered job: ${jobName} (schedule: ${schedule})`);
    return true;
  }

  /**
   * Execute a job with error handling and retries
   */
  async executeJob(jobName, isManual = false) {
    const job = this.jobs.get(jobName);

    if (!job) {
      logger.error(`Job ${jobName} not found`);
      return { success: false, error: 'Job not found' };
    }

    // Check if paused
    if (this.isPaused && !isManual) {
      logger.debug(`Scheduler is paused, skipping ${jobName}`);
      return { success: false, error: 'Scheduler paused' };
    }

    // Check if disabled due to failures
    if (job.disabled) {
      logger.warn(`Job ${jobName} is disabled due to consecutive failures`);
      return { success: false, error: 'Job disabled' };
    }

    // Check if already running
    if (job.isRunning) {
      logger.warn(`Job ${jobName} is already running, queuing...`);
      if (this.config.queueEnabled) {
        this.jobQueue.push({ jobName, isManual });
      }
      return { success: false, error: 'Already running' };
    }

    // Check minimum interval
    const lastRun = this.lastExecution.get(jobName);
    if (lastRun && !isManual) {
      const timeSinceLastRun = Date.now() - lastRun;
      if (timeSinceLastRun < job.options.minInterval) {
        logger.debug(`Job ${jobName} ran ${timeSinceLastRun}ms ago, skipping (min interval: ${job.options.minInterval}ms)`);
        return { success: false, error: 'Too soon since last run' };
      }
    }

    // Check rate limits
    if (job.options.rateLimit && !this.checkRateLimit(jobName, job.options.rateLimit)) {
      logger.warn(`Rate limit exceeded for ${jobName}`);
      return { success: false, error: 'Rate limit exceeded' };
    }

    // Execute with retries
    job.isRunning = true;
    this.stats.activeJobs++;

    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;

    while (attempt < job.options.retries) {
      attempt++;

      try {
        logger.info(`🚀 Executing job: ${jobName} (attempt ${attempt}/${job.options.retries})`);

        // Execute with timeout
        const result = await Promise.race([
          job.handler(),
          this.timeout(job.options.timeout, `Job ${jobName} timed out after ${job.options.timeout}ms`)
        ]);

        // Success
        const duration = Date.now() - startTime;
        this.recordSuccess(jobName, duration, result);

        job.isRunning = false;
        this.stats.activeJobs--;
        this.lastExecution.set(jobName, Date.now());

        logger.info(`✅ Job ${jobName} completed in ${duration}ms`);
        this.emit('job:success', { jobName, duration, result, attempt });

        // Process queue
        this.processQueue();

        return { success: true, duration, result, attempt };

      } catch (error) {
        lastError = error;
        logger.error(`❌ Job ${jobName} failed (attempt ${attempt}/${job.options.retries}): ${error.message}`);

        // If not last attempt, wait with exponential backoff
        if (attempt < job.options.retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          logger.info(`Retrying ${jobName} in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    const duration = Date.now() - startTime;
    this.recordFailure(jobName, duration, lastError);

    job.isRunning = false;
    this.stats.activeJobs--;

    logger.error(`💥 Job ${jobName} failed after ${job.options.retries} attempts`);
    this.emit('job:failure', { jobName, duration, error: lastError, attempts: job.options.retries });

    // Check if should disable job
    const consecutiveFailures = this.failureCount.get(jobName) || 0;
    if (consecutiveFailures >= 5) {
      logger.error(`🚫 Disabling job ${jobName} due to ${consecutiveFailures} consecutive failures`);
      job.disabled = true;
      this.emit('job:disabled', { jobName, consecutiveFailures });
    }

    // Process queue
    this.processQueue();

    return { success: false, duration, error: lastError.message, attempts: job.options.retries };
  }

  /**
   * Record successful execution
   */
  recordSuccess(jobName, duration, result) {
    this.stats.totalExecutions++;
    this.stats.successfulExecutions++;

    const history = this.executionHistory.get(jobName) || [];
    history.push({
      timestamp: new Date(),
      success: true,
      duration,
      result: this.summarizeResult(result)
    });

    // Keep last 100 executions
    if (history.length > 100) {
      history.shift();
    }

    this.executionHistory.set(jobName, history);
    this.failureCount.set(jobName, 0); // Reset failure count
  }

  /**
   * Record failed execution
   */
  recordFailure(jobName, duration, error) {
    this.stats.totalExecutions++;
    this.stats.failedExecutions++;

    const history = this.executionHistory.get(jobName) || [];
    history.push({
      timestamp: new Date(),
      success: false,
      duration,
      error: error.message,
      stack: error.stack
    });

    // Keep last 100 executions
    if (history.length > 100) {
      history.shift();
    }

    this.executionHistory.set(jobName, history);

    // Increment failure count
    const failures = (this.failureCount.get(jobName) || 0) + 1;
    this.failureCount.set(jobName, failures);
  }

  /**
   * Check rate limit for a job
   */
  checkRateLimit(jobName, limit) {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(jobName);

    if (!rateLimit || rateLimit.resetTime < now) {
      // Reset rate limit
      this.rateLimits.set(jobName, {
        count: 1,
        resetTime: now + limit.window
      });
      return true;
    }

    if (rateLimit.count >= limit.max) {
      return false; // Rate limit exceeded
    }

    rateLimit.count++;
    return true;
  }

  /**
   * Process job queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    this.stats.queuedJobs = this.jobQueue.length;

    while (this.jobQueue.length > 0 && this.stats.activeJobs < this.config.maxConcurrent) {
      const { jobName, isManual } = this.jobQueue.shift();
      await this.executeJob(jobName, isManual);
    }

    this.isProcessingQueue = false;
    this.stats.queuedJobs = this.jobQueue.length;
  }

  /**
   * Start all registered jobs
   */
  start() {
    logger.info('Starting enhanced scheduler...');

    for (const [jobName, job] of this.jobs) {
      if (!job.disabled && job.cronJob) {
        job.cronJob.start();
        logger.info(`✅ Started cron job: ${jobName}`);
      }
    }

    this.isPaused = false;
    logger.info(`✅ Scheduler started with ${this.jobs.size} jobs`);
  }

  /**
   * Stop all jobs
   */
  stop() {
    logger.info('Stopping scheduler...');

    for (const [jobName, job] of this.jobs) {
      if (job.cronJob) {
        job.cronJob.stop();
      }
    }

    this.isPaused = true;
    logger.info('✅ Scheduler stopped');
  }

  /**
   * Pause scheduler (stop accepting new jobs)
   */
  pause() {
    this.isPaused = true;
    logger.info('Scheduler paused');
  }

  /**
   * Resume scheduler
   */
  resume() {
    this.isPaused = false;
    logger.info('Scheduler resumed');
  }

  /**
   * Manually trigger a job
   */
  async trigger(jobName) {
    logger.info(`Manual trigger: ${jobName}`);
    return await this.executeJob(jobName, true);
  }

  /**
   * Re-enable a disabled job
   */
  enableJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.disabled = false;
      this.failureCount.set(jobName, 0);
      logger.info(`Re-enabled job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Get job status
   */
  getJobStatus(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) return null;

    const history = this.executionHistory.get(jobName) || [];
    const recentHistory = history.slice(-10);
    const lastExecution = history[history.length - 1];

    const successRate = history.length > 0
      ? (history.filter(h => h.success).length / history.length) * 100
      : 0;

    return {
      name: jobName,
      schedule: job.schedule,
      isRunning: job.isRunning,
      disabled: job.disabled,
      lastExecution: lastExecution ? {
        timestamp: lastExecution.timestamp,
        success: lastExecution.success,
        duration: lastExecution.duration
      } : null,
      consecutiveFailures: this.failureCount.get(jobName) || 0,
      successRate: successRate.toFixed(2),
      recentHistory
    };
  }

  /**
   * Get scheduler stats
   */
  getStats() {
    return {
      ...this.stats,
      isPaused: this.isPaused,
      registeredJobs: this.jobs.size,
      disabledJobs: Array.from(this.jobs.values()).filter(j => j.disabled).length,
      jobs: Array.from(this.jobs.keys()).map(jobName => this.getJobStatus(jobName))
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Graceful shutdown initiated...');

    this.stop();

    // Wait for active jobs to finish
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.stats.activeJobs > 0 && (Date.now() - startTime) < maxWait) {
      logger.info(`Waiting for ${this.stats.activeJobs} active jobs to finish...`);
      await this.sleep(1000);
    }

    if (this.stats.activeJobs > 0) {
      logger.warn(`Forced shutdown with ${this.stats.activeJobs} jobs still active`);
    } else {
      logger.info('All jobs completed successfully');
    }

    logger.info('✅ Scheduler shutdown complete');
  }

  // Utility methods

  timeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  summarizeResult(result) {
    if (!result) return null;
    if (typeof result === 'object') {
      // Summarize object to avoid storing huge payloads
      return {
        type: result.constructor.name,
        keys: Object.keys(result).slice(0, 10)
      };
    }
    return String(result).substring(0, 100);
  }
}

module.exports = EnhancedScheduler;
