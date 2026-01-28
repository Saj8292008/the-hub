/**
 * Sports Scores Scheduler
 * Periodically fetches live sports scores from ESPN and updates the database
 */

const cron = require('node-cron');
const ESPNService = require('../services/sports/espn');
const supabase = require('../db/supabase');
const logger = require('../utils/logger');

class SportsScoresScheduler {
  constructor(io) {
    this.io = io;
    this.espn = new ESPNService();
    this.task = null;
    this.isRunning = false;
    this.stats = {
      totalRuns: 0,
      lastRun: null,
      lastRunStats: null,
      totalGamesUpdated: 0
    };

    // Leagues to track
    this.leagues = ['nfl', 'nba', 'mlb', 'nhl'];
  }

  /**
   * Start the scheduler with a cron schedule
   * Default: Every 2 minutes during peak sports hours (10am-1am EST)
   * @param {string} schedule - Cron expression (default: every 2 minutes from 10am to 1am)
   */
  start(schedule = '*/2 10-1 * * *') {
    if (this.isRunning) {
      logger.warn('Sports scores scheduler is already running');
      return;
    }

    if (!supabase.isAvailable()) {
      logger.warn('Supabase not available - sports scores scheduler disabled');
      return;
    }

    logger.info(`Starting sports scores scheduler with schedule: ${schedule}`);

    this.task = cron.schedule(schedule, async () => {
      await this.updateScores();
    });

    this.isRunning = true;
    logger.info('Sports scores scheduler started successfully');

    // Emit status update
    if (this.io) {
      this.io.emit('sports-scheduler-status', this.getStatus());
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Sports scores scheduler is not running');
      return;
    }

    if (this.task) {
      this.task.stop();
      this.task = null;
    }

    this.isRunning = false;
    logger.info('Sports scores scheduler stopped');

    if (this.io) {
      this.io.emit('sports-scheduler-status', this.getStatus());
    }
  }

  /**
   * Force run the score updater immediately
   */
  async forceRun() {
    logger.info('Force running sports scores update');
    return this.updateScores();
  }

  /**
   * Main update function - fetches scores from ESPN and updates database
   */
  async updateScores() {
    const startTime = Date.now();
    logger.info('Starting sports scores update');

    try {
      let totalUpdated = 0;
      let totalInserted = 0;
      let totalFailed = 0;

      // Fetch scores for all leagues in parallel
      const leaguePromises = this.leagues.map(async (league) => {
        try {
          logger.info(`Fetching scores for ${league.toUpperCase()}`);
          const data = await this.espn.fetchScores(league);

          if (!data.games || data.games.length === 0) {
            logger.info(`No games found for ${league.toUpperCase()}`);
            return { league, updated: 0, inserted: 0, failed: 0 };
          }

          // Process each game
          let leagueUpdated = 0;
          let leagueInserted = 0;
          let leagueFailed = 0;

          for (const game of data.games) {
            try {
              await this.upsertGame(league, game);

              // Check if it's an update or insert by trying to find existing game
              const { data: existing } = await supabase.client
                .from('sports_games')
                .select('id')
                .eq('external_id', game.id)
                .single();

              if (existing) {
                leagueUpdated++;
              } else {
                leagueInserted++;
              }
            } catch (error) {
              logger.error(`Failed to upsert game ${game.id}:`, error);
              leagueFailed++;
            }
          }

          logger.info(`${league.toUpperCase()}: ${leagueUpdated} updated, ${leagueInserted} inserted, ${leagueFailed} failed`);

          return {
            league,
            updated: leagueUpdated,
            inserted: leagueInserted,
            failed: leagueFailed
          };
        } catch (error) {
          logger.error(`Error fetching ${league} scores:`, error);
          return { league, updated: 0, inserted: 0, failed: 0, error: error.message };
        }
      });

      const results = await Promise.all(leaguePromises);

      // Sum up totals
      results.forEach(result => {
        totalUpdated += result.updated;
        totalInserted += result.inserted;
        totalFailed += result.failed;
      });

      const duration = Date.now() - startTime;

      // Update stats
      this.stats.totalRuns++;
      this.stats.lastRun = new Date().toISOString();
      this.stats.totalGamesUpdated += totalUpdated + totalInserted;
      this.stats.lastRunStats = {
        updated: totalUpdated,
        inserted: totalInserted,
        failed: totalFailed,
        duration,
        leagues: results
      };

      logger.info(`Sports scores update completed in ${duration}ms: ${totalUpdated} updated, ${totalInserted} inserted, ${totalFailed} failed`);

      // Emit update event
      if (this.io) {
        this.io.emit('sports-scores-updated', {
          timestamp: new Date().toISOString(),
          stats: this.stats.lastRunStats
        });
      }

      return this.stats.lastRunStats;
    } catch (error) {
      logger.error('Sports scores update failed:', error);

      const duration = Date.now() - startTime;
      this.stats.lastRunStats = {
        error: error.message,
        duration
      };

      throw error;
    }
  }

  /**
   * Upsert a game into the database
   */
  async upsertGame(league, game) {
    const gameData = {
      external_id: game.id,
      league: league.toLowerCase(),
      home_team: game.homeTeam.name,
      away_team: game.awayTeam.name,
      home_score: parseInt(game.homeTeam.score) || 0,
      away_score: parseInt(game.awayTeam.score) || 0,
      game_date: game.date,
      status: this.normalizeStatus(game.status, game.completed),
      venue: null,
      updated_at: new Date().toISOString()
    };

    // Upsert (insert or update)
    const { error } = await supabase.client
      .from('sports_games')
      .upsert(gameData, {
        onConflict: 'external_id',
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Normalize ESPN status to our status format
   */
  normalizeStatus(espnStatus, isCompleted) {
    const statusLower = espnStatus.toLowerCase();

    if (isCompleted) {
      return 'finished';
    }

    if (statusLower.includes('final') || statusLower.includes('complete')) {
      return 'finished';
    }

    if (statusLower.includes('progress') ||
        statusLower.includes('live') ||
        statusLower.includes('halftime') ||
        statusLower.includes('quarter') ||
        statusLower.includes('period')) {
      return 'live';
    }

    if (statusLower.includes('scheduled') ||
        statusLower.includes('pre') ||
        statusLower === 'status_scheduled') {
      return 'scheduled';
    }

    // Default to scheduled for unknown statuses
    return 'scheduled';
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.stats.lastRun,
      nextRun: this.task ? this.getNextRunTime() : null,
      stats: {
        totalRuns: this.stats.totalRuns,
        totalGamesUpdated: this.stats.totalGamesUpdated,
        averagePerRun: this.stats.totalRuns > 0
          ? Math.round(this.stats.totalGamesUpdated / this.stats.totalRuns)
          : 0,
        lastRunStats: this.stats.lastRunStats
      }
    };
  }

  /**
   * Get next scheduled run time
   */
  getNextRunTime() {
    if (!this.task) return null;

    // Cron doesn't expose next run time directly
    // Return estimated next run (2 minutes from now for default schedule)
    const now = new Date();
    const next = new Date(now.getTime() + 2 * 60 * 1000);
    return next.toISOString();
  }

  /**
   * Get current statistics
   */
  getStats() {
    return this.stats;
  }
}

module.exports = SportsScoresScheduler;
