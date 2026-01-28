/**
 * Weekly Digest Scheduler
 * Sends personalized weekly roundups of tracked items
 * Runs every Sunday at 10am
 */

const cron = require('node-cron');
const weeklyDigestService = require('../services/email/weeklyDigest');

class WeeklyDigestScheduler {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.job = null;
    this.lastRun = null;
    
    this.stats = {
      totalRuns: 0,
      totalSent: 0,
      totalSkipped: 0,
      totalFailed: 0,
      lastRunStats: null
    };
  }

  /**
   * Start the weekly digest scheduler
   * @param {string} schedule - Cron expression (default: Sundays 10am EST)
   */
  start(schedule = '0 10 * * 0') {
    if (this.isRunning) {
      console.log('⚠️  Weekly digest scheduler already running');
      return;
    }

    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron schedule: ${schedule}`);
    }

    console.log(`\n📬 Starting Weekly Digest Scheduler`);
    console.log(`   Schedule: ${schedule} (${this.cronToHuman(schedule)})`);

    this.job = cron.schedule(schedule, async () => {
      await this.runDigest();
    }, {
      timezone: "America/Chicago"
    });

    this.isRunning = true;
    console.log('✅ Weekly digest scheduler started\n');

    if (this.io) {
      this.io.emit('digest-scheduler-started', {
        schedule,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Weekly digest scheduler not running');
      return;
    }

    if (this.job) {
      this.job.stop();
      this.job = null;
    }

    this.isRunning = false;
    console.log('🛑 Weekly digest scheduler stopped');

    if (this.io) {
      this.io.emit('digest-scheduler-stopped', {
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Run the digest process
   */
  async runDigest() {
    console.log('\n' + '='.repeat(60));
    console.log('📬 WEEKLY DIGEST RUN STARTED');
    console.log('='.repeat(60));

    const startTime = Date.now();
    
    try {
      const results = await weeklyDigestService.sendAllDigests();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      this.stats.totalRuns++;
      this.stats.totalSent += results.sent;
      this.stats.totalSkipped += results.skipped;
      this.stats.totalFailed += results.failed;
      this.stats.lastRunStats = {
        ...results,
        duration: `${duration}s`,
        timestamp: new Date().toISOString()
      };
      
      this.lastRun = new Date().toISOString();

      console.log('\n📬 DIGEST RUN COMPLETE');
      console.log(`   Duration: ${duration}s`);
      console.log(`   Sent: ${results.sent}`);
      console.log(`   Skipped: ${results.skipped}`);
      console.log(`   Failed: ${results.failed}`);
      console.log('='.repeat(60) + '\n');

      if (this.io) {
        this.io.emit('digest-run-complete', this.stats.lastRunStats);
      }

      return results;

    } catch (error) {
      console.error('❌ Digest run failed:', error);
      this.stats.totalFailed++;
      
      if (this.io) {
        this.io.emit('digest-run-error', { error: error.message });
      }
      
      throw error;
    }
  }

  /**
   * Manually trigger a digest run
   */
  async forceRun() {
    console.log('🔧 Force running weekly digest...');
    return await this.runDigest();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      stats: this.stats,
      nextRun: this.getNextRunTime()
    };
  }

  /**
   * Get next scheduled run time
   */
  getNextRunTime() {
    if (!this.isRunning) return null;
    
    // Calculate next Sunday 10am
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(10, 0, 0, 0);
    
    if (nextSunday <= now) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }
    
    return nextSunday.toISOString();
  }

  /**
   * Convert cron to human readable
   */
  cronToHuman(cronExpr) {
    const parts = cronExpr.split(' ');
    if (parts.length !== 5) return cronExpr;
    
    const [min, hour, , , dayOfWeek] = parts;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    
    const dayName = days[parseInt(dayOfWeek)] || 'Every day';
    
    return `${dayName}s at ${hour12}:${min.padStart(2, '0')} ${ampm}`;
  }
}

// Export singleton and factory
let schedulerInstance = null;

function createScheduler(io) {
  if (!schedulerInstance) {
    schedulerInstance = new WeeklyDigestScheduler(io);
  }
  return schedulerInstance;
}

function getScheduler() {
  return schedulerInstance;
}

module.exports = {
  WeeklyDigestScheduler,
  createScheduler,
  getScheduler
};
