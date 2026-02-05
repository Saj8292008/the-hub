/**
 * Deal Scoring Scheduler v2.0
 * Automatically scores all listings across categories on a schedule
 * 
 * Features:
 * - Multi-category support (watches, sneakers, cars)
 * - Deal of the Day selection
 * - Score distribution tracking
 * - Real-time updates via Socket.IO
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
    this.enabledCategories = ['watch']; // Categories to score
    
    this.stats = {
      totalRuns: 0,
      totalScored: 0,
      totalErrors: 0,
      lastRunStats: null,
      dealsOfTheDay: {}
    };
  }

  /**
   * Start the scheduler
   * @param {number} intervalMs - Interval in milliseconds (default: 1 hour)
   * @param {string[]} categories - Categories to score (default: ['watch'])
   */
  start(intervalMs = 60 * 60 * 1000, categories = ['watch']) {
    if (this.isRunning) {
      console.log('⚠️  Deal scoring scheduler already running');
      return;
    }

    this.intervalMs = intervalMs;
    this.enabledCategories = categories;
    this.isRunning = true;

    console.log('🚀 Starting deal scoring scheduler v2.0');
    console.log(`⏰ Interval: ${this.intervalMs / 1000 / 60} minutes`);
    console.log(`📦 Categories: ${this.enabledCategories.join(', ')}`);

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
   * Run scoring for all enabled categories
   */
  async runScoring() {
    console.log('\n🔄 Starting deal scoring run v2.0...');
    const startTime = Date.now();

    const runStats = {
      startTime: new Date().toISOString(),
      categories: {},
      totalScored: 0,
      totalErrors: 0,
      duration: 0,
      dealsOfTheDay: {}
    };

    try {
      // Score each enabled category
      for (const category of this.enabledCategories) {
        console.log(`\n📦 Scoring ${category} listings...`);
        
        try {
          const categoryStats = await this.scoreCategoryListings(category);
          runStats.categories[category] = categoryStats;
          runStats.totalScored += categoryStats.scored;
          runStats.totalErrors += categoryStats.errors;

          // Get Deal of the Day for this category
          const dotd = await dealScorer.getDealOfTheDay(category);
          if (dotd) {
            runStats.dealsOfTheDay[category] = {
              id: dotd.listing?.id,
              title: dotd.listing?.title,
              score: dotd.score,
              grade: dotd.grade,
              reason: dotd.reason
            };
          }
        } catch (error) {
          console.error(`❌ Error scoring ${category}:`, error.message);
          runStats.categories[category] = { total: 0, scored: 0, errors: 1, error: error.message };
        }
      }

      // Calculate totals
      const duration = Date.now() - startTime;
      runStats.duration = duration;

      // Update stats
      this.stats.totalRuns++;
      this.stats.totalScored += runStats.totalScored;
      this.stats.totalErrors += runStats.totalErrors;
      this.stats.lastRunStats = runStats;
      this.stats.dealsOfTheDay = runStats.dealsOfTheDay;
      this.lastRun = new Date().toISOString();

      // Log summary
      console.log('\n✅ Scoring run complete!');
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`📊 Total scored: ${runStats.totalScored}`);
      console.log(`❌ Total errors: ${runStats.totalErrors}`);
      
      // Log category breakdown
      for (const [cat, stats] of Object.entries(runStats.categories)) {
        console.log(`   ${cat}: ${stats.scored}/${stats.total} scored`);
        if (stats.distribution) {
          console.log(`      Hot deals: ${stats.distribution.hotDeals}, Great: ${stats.distribution.greatDeals}, Good: ${stats.distribution.goodDeals}`);
        }
      }

      // Log Deals of the Day
      console.log('\n🏆 Deals of the Day:');
      for (const [cat, dotd] of Object.entries(runStats.dealsOfTheDay)) {
        console.log(`   ${cat}: "${dotd.title}" - ${dotd.grade} (${dotd.score})`);
      }

      // Emit real-time update via Socket.IO
      if (this.io) {
        this.io.emit('deal-scoring-complete', {
          runStats,
          timestamp: new Date().toISOString()
        });

        // Emit Deal of the Day updates
        for (const [category, dotd] of Object.entries(runStats.dealsOfTheDay)) {
          this.io.emit('deal-of-the-day', { category, deal: dotd });
        }
      }

      return runStats;
    } catch (error) {
      console.error('❌ Fatal error in scoring run:', error);
      this.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Score all listings in a category
   */
  async scoreCategoryListings(category) {
    const stats = { 
      total: 0, 
      scored: 0, 
      errors: 0,
      distribution: {
        hotDeals: 0,
        greatDeals: 0,
        goodDeals: 0,
        fair: 0,
        belowMarket: 0
      }
    };

    try {
      const config = dealScorer.getConfig(category);
      const thresholds = config.thresholds;
      const tableName = `${category}_listings`;

      // Get all listings
      let listings;
      if (supabase.isAvailable()) {
        const { data } = await supabase.client
          .from(tableName)
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10000);
        listings = data || [];
      } else if (category === 'watch') {
        // Fallback for watches only
        const result = await localWatchListings.getWatchListings({ limit: 10000 });
        listings = result.data || [];
      } else {
        listings = [];
      }

      stats.total = listings.length;

      if (listings.length === 0) {
        console.log(`   No ${category} listings to score`);
        return stats;
      }

      console.log(`   Found ${listings.length} ${category} listings`);

      // Score each listing
      const scores = [];
      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];

        try {
          // Score the listing
          const result = await dealScorer.scoreListing(listing, category);
          scores.push(result.score);

          // Update in database
          if (supabase.isAvailable()) {
            await supabase.client
              .from(tableName)
              .update({
                deal_score: result.score,
                score_breakdown: result.breakdown,
                profit_potential: result.profitPotential,
                scored_at: new Date().toISOString()
              })
              .eq('id', listing.id);
          } else if (category === 'watch') {
            await localWatchListings.updateWatchListing(listing.id, {
              deal_score: result.score,
              score_breakdown: result.breakdown
            });
          }

          stats.scored++;

          // Log progress every 25 listings
          if ((i + 1) % 25 === 0) {
            console.log(`   Progress: ${i + 1}/${listings.length} (${((i + 1) / listings.length * 100).toFixed(1)}%)`);
          }
        } catch (error) {
          console.error(`   Error scoring ${category} listing ${listing.id}:`, error.message);
          stats.errors++;
        }
      }

      // Calculate distribution
      stats.distribution = {
        hotDeals: scores.filter(s => s >= thresholds.hotDeal).length,
        greatDeals: scores.filter(s => s >= thresholds.greatDeal && s < thresholds.hotDeal).length,
        goodDeals: scores.filter(s => s >= thresholds.goodDeal && s < thresholds.greatDeal).length,
        fair: scores.filter(s => s >= thresholds.fair && s < thresholds.goodDeal).length,
        belowMarket: scores.filter(s => s < thresholds.fair).length
      };

      stats.averageScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0;

      console.log(`   ✅ Scored ${stats.scored}/${stats.total} ${category} listings`);
      console.log(`   📊 Average score: ${stats.averageScore}`);
      if (stats.errors > 0) {
        console.log(`   ⚠️  ${stats.errors} errors`);
      }

      return stats;
    } catch (error) {
      console.error(`   ❌ Error in ${category} listing scoring:`, error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      intervalMinutes: this.intervalMs / 1000 / 60,
      enabledCategories: this.enabledCategories,
      lastRun: this.lastRun,
      nextRun: this.isRunning && this.lastRun
        ? new Date(new Date(this.lastRun).getTime() + this.intervalMs).toISOString()
        : null,
      stats: this.stats,
      dealsOfTheDay: this.stats.dealsOfTheDay,
      uptime: this.isRunning && this.lastRun 
        ? Date.now() - new Date(this.lastRun).getTime() 
        : 0
    };
  }

  /**
   * Force run scoring now (manual trigger)
   */
  async forceRun() {
    console.log('⚡ Manual scoring run triggered');
    return await this.runScoring();
  }

  /**
   * Set categories to score
   */
  setCategories(categories) {
    this.enabledCategories = categories;
    console.log(`📦 Updated categories: ${categories.join(', ')}`);
  }
}

module.exports = DealScoringScheduler;
