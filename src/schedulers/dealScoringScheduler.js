/**
 * Deal Scoring Scheduler
 * Automatically scores all listings on a schedule
 */

const dealScorer = require('../services/ai/dealScorer');
const supabase = require('../db/supabase');
const localWatchListings = require('../db/localWatchListings');

class DealScoringScheduler {
  constructor(io) {
    this.io = io; // Socket.IO for real-time updates
    this.isRunning = false;
    this.interval = null;
    this.intervalMs = 60 * 60 * 1000; // 1 hour default
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      totalScored: 0,
      totalErrors: 0,
      lastRunStats: null
    };
  }

  /**
   * Start the scheduler
   * @param {number} intervalMs - Interval in milliseconds (default: 1 hour)
   */
  start(intervalMs = 60 * 60 * 1000) {
    if (this.isRunning) {
      console.log('⚠️  Deal scoring scheduler already running');
      return;
    }

    this.intervalMs = intervalMs;
    this.isRunning = true;

    console.log('🚀 Starting deal scoring scheduler');
    console.log(`⏰ Interval: ${this.intervalMs / 1000 / 60} minutes`);

    // Run immediately on start
    this.runScoring().catch(err => {
      console.error('❌ Error in initial scoring run:', err);
    });

    // Then run on interval
    this.interval = setInterval(() => {
      this.runScoring().catch(err => {
        console.error('❌ Error in scheduled scoring run:', err);
      });
    }, this.intervalMs);

    console.log('✅ Deal scoring scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Deal scoring scheduler not running');
      return;
    }

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log('🛑 Deal scoring scheduler stopped');
  }

  /**
   * Run scoring for all listings
   */
  async runScoring() {
    console.log('\n🔄 Starting deal scoring run...');
    const startTime = Date.now();

    const runStats = {
      startTime: new Date().toISOString(),
      watches: { total: 0, scored: 0, errors: 0 },
      cars: { total: 0, scored: 0, errors: 0 },
      sneakers: { total: 0, scored: 0, errors: 0 },
      duration: 0
    };

    try {
      // Score watch listings
      console.log('⌚ Scoring watch listings...');
      const watchStats = await this.scoreWatchListings();
      runStats.watches = watchStats;

      // Score car listings (if implemented)
      // console.log('🚗 Scoring car listings...');
      // const carStats = await this.scoreCarListings();
      // runStats.cars = carStats;

      // Score sneaker listings (if implemented)
      // console.log('👟 Scoring sneaker listings...');
      // const sneakerStats = await this.scoreSneakerListings();
      // runStats.sneakers = sneakerStats;

      // Calculate totals
      const duration = Date.now() - startTime;
      runStats.duration = duration;

      const totalScored = runStats.watches.scored + runStats.cars.scored + runStats.sneakers.scored;
      const totalErrors = runStats.watches.errors + runStats.cars.errors + runStats.sneakers.errors;

      // Update stats
      this.stats.totalRuns++;
      this.stats.totalScored += totalScored;
      this.stats.totalErrors += totalErrors;
      this.stats.lastRunStats = runStats;
      this.lastRun = new Date().toISOString();

      // Log summary
      console.log('\n✅ Scoring run complete!');
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`📊 Total scored: ${totalScored}`);
      console.log(`❌ Total errors: ${totalErrors}`);
      console.log(`⌚ Watches: ${runStats.watches.scored}/${runStats.watches.total}`);

      // Emit real-time update via Socket.IO
      if (this.io) {
        this.io.emit('deal-scoring-complete', {
          runStats,
          timestamp: new Date().toISOString()
        });
      }

      return runStats;
    } catch (error) {
      console.error('❌ Fatal error in scoring run:', error);
      this.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Score all watch listings
   */
  async scoreWatchListings() {
    const stats = { total: 0, scored: 0, errors: 0 };

    try {
      // Get all watch listings
      let listings;
      if (supabase.isAvailable()) {
        const result = await supabase.getWatchListings({ limit: 10000 });
        listings = result.data || [];
      } else {
        const result = await localWatchListings.getWatchListings({ limit: 10000 });
        listings = result.data || [];
      }

      stats.total = listings.length;

      if (listings.length === 0) {
        console.log('   No watch listings to score');
        return stats;
      }

      console.log(`   Found ${listings.length} watch listings`);

      // Score each listing
      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];

        try {
          // Score the listing
          const { score, breakdown } = await dealScorer.scoreWatchListing(listing);

          // Update in database
          if (supabase.isAvailable()) {
            await supabase.client
              .from('watch_listings')
              .update({
                deal_score: score,
                score_breakdown: breakdown,
                scored_at: new Date().toISOString()
              })
              .eq('id', listing.id);
          } else {
            await localWatchListings.updateWatchListing(listing.id, {
              deal_score: score,
              score_breakdown: breakdown
            });
          }

          stats.scored++;

          // Log progress every 10 listings
          if ((i + 1) % 10 === 0) {
            console.log(`   Progress: ${i + 1}/${listings.length} (${((i + 1) / listings.length * 100).toFixed(1)}%)`);
          }
        } catch (error) {
          console.error(`   Error scoring listing ${listing.id}:`, error.message);
          stats.errors++;
        }
      }

      console.log(`   ✅ Scored ${stats.scored}/${stats.total} watch listings`);
      if (stats.errors > 0) {
        console.log(`   ⚠️  ${stats.errors} errors`);
      }

      return stats;
    } catch (error) {
      console.error('   ❌ Error in watch listing scoring:', error);
      throw error;
    }
  }

  /**
   * Score car listings (placeholder)
   */
  async scoreCarListings() {
    // TODO: Implement when car listings are available
    return { total: 0, scored: 0, errors: 0 };
  }

  /**
   * Score sneaker listings (placeholder)
   */
  async scoreSneakerListings() {
    // TODO: Implement when sneaker listings are available
    return { total: 0, scored: 0, errors: 0 };
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      intervalMinutes: this.intervalMs / 1000 / 60,
      lastRun: this.lastRun,
      nextRun: this.isRunning && this.lastRun
        ? new Date(new Date(this.lastRun).getTime() + this.intervalMs).toISOString()
        : null,
      stats: this.stats,
      uptime: this.isRunning ? Date.now() - new Date(this.lastRun || Date.now()).getTime() : 0
    };
  }

  /**
   * Force run scoring now (manual trigger)
   */
  async forceRun() {
    console.log('⚡ Manual scoring run triggered');
    return await this.runScoring();
  }
}

module.exports = DealScoringScheduler;
