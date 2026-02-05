/**
 * Sequence Processor Scheduler
 * Runs periodically to process due drip sequence emails
 */

const sequenceService = require('../services/sequences/sequenceService');

class SequenceProcessor {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalProcessed: 0,
      totalErrors: 0,
      runs: 0
    };
  }

  /**
   * Start the scheduler
   * @param {number} intervalMinutes - How often to check (default: 30 minutes)
   */
  start(intervalMinutes = 30) {
    if (this.intervalId) {
      console.log('⚠️  Sequence processor already running');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`\n🚀 Starting sequence processor (interval: ${intervalMinutes} minutes)`);

    // Run immediately on start
    this.process();

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.process();
    }, intervalMs);

    console.log('✅ Sequence processor started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Sequence processor stopped');
    }
  }

  /**
   * Process due emails
   */
  async process() {
    if (this.isRunning) {
      console.log('⚠️  Sequence processor already running, skipping');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    this.stats.runs++;

    console.log(`\n⏰ [${this.lastRun.toISOString()}] Running sequence processor...`);

    try {
      const result = await sequenceService.processDueEmails();

      this.stats.totalProcessed += result.processed;
      this.stats.totalErrors += result.errors.length;

      if (result.processed > 0 || result.errors.length > 0) {
        console.log(`   📊 Processed: ${result.processed}, Errors: ${result.errors.length}`);
      }
    } catch (error) {
      console.error('❌ Sequence processor error:', error.message);
      this.stats.totalErrors++;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      running: !!this.intervalId,
      processing: this.isRunning,
      lastRun: this.lastRun,
      stats: this.stats
    };
  }
}

// Export singleton instance
module.exports = new SequenceProcessor();
