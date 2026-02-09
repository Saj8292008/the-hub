const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../../utils/logger');

class GameAnalyzer {
  constructor(dbPath = null) {
    this.dbPath = dbPath || process.env.SPORTS_BOT_DB || path.join(__dirname, '../../../../sports-bot/data/sportsbot.db');
    this.db = null;
  }

  // Initialize database connection
  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          logger.error('Failed to connect to sports database:', err);
          reject(err);
        } else {
          logger.info('Connected to sports database');
          resolve();
        }
      });
    });
  }

  // Get live/upcoming games
  async getLiveGames(sport = null, limit = 10) {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      let query = `
        SELECT g.*, 
               home.name as home_team_name, home.wins as home_wins, home.losses as home_losses,
               away.name as away_team_name, away.wins as away_wins, away.losses as away_losses
        FROM games g
        LEFT JOIN teams home ON g.home_team = home.id
        LEFT JOIN teams away ON g.away_team = away.id
        WHERE g.status IN ('live', 'in_progress', 'scheduled')
      `;
      
      const params = [];
      if (sport) {
        query += ' AND g.sport = ?';
        params.push(sport);
      }
      
      query += ' ORDER BY g.game_time ASC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get specific game by ID
  async getGame(gameId) {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      const query = `
        SELECT g.*, 
               home.name as home_team_name, home.wins as home_wins, home.losses as home_losses,
               away.name as away_team_name, away.wins as away_wins, away.losses as away_losses
        FROM games g
        LEFT JOIN teams home ON g.home_team = home.id
        LEFT JOIN teams away ON g.away_team = away.id
        WHERE g.id = ?
      `;

      this.db.get(query, [gameId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get team info and stats
  async getTeam(teamId) {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM teams WHERE id = ?', [teamId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get players for a team
  async getTeamPlayers(teamId) {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM players WHERE team_id = ?', [teamId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get recent news
  async getRecentNews(sport = null, limit = 5) {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM news WHERE 1=1';
      const params = [];
      
      if (sport) {
        query += ' AND sport = ?';
        params.push(sport);
      }
      
      query += ' ORDER BY published_at DESC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get betting lines for a game
  async getBettingLines(gameId) {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM betting_lines WHERE game_id = ? ORDER BY timestamp DESC';
      this.db.all(query, [gameId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Generate game analysis summary
  async analyzeGame(gameId) {
    try {
      const game = await this.getGame(gameId);
      if (!game) return null;

      const bettingLines = await this.getBettingLines(gameId);
      const homeTeam = await this.getTeam(game.home_team);
      const awayTeam = await this.getTeam(game.away_team);

      // Calculate key stats
      const analysis = {
        game,
        teams: {
          home: homeTeam,
          away: awayTeam
        },
        betting: bettingLines.length > 0 ? bettingLines[0] : null,
        insights: this._generateInsights(game, homeTeam, awayTeam, bettingLines)
      };

      return analysis;
    } catch (error) {
      logger.error('Error analyzing game:', error);
      throw error;
    }
  }

  // Generate talking points for a game
  async generateTalkingPoints(gameId, count = 5) {
    const analysis = await this.analyzeGame(gameId);
    if (!analysis) return [];

    const { game, teams, betting } = analysis;
    const points = [];

    // Game status talking point
    if (game.status === 'live' || game.status === 'in_progress') {
      if (game.home_score > game.away_score) {
        const diff = game.home_score - game.away_score;
        points.push(`${teams.home.name} leading by ${diff} in ${game.period || 'the game'}`);
      } else if (game.away_score > game.home_score) {
        const diff = game.away_score - game.home_score;
        points.push(`${teams.away.name} up by ${diff} in ${game.period || 'the game'}`);
      } else {
        points.push(`Tied game between ${teams.home.name} and ${teams.away.name}`);
      }
    }

    // Record comparison
    if (teams.home.wins !== undefined && teams.away.wins !== undefined) {
      points.push(
        `Record matchup: ${teams.home.name} (${teams.home.wins}-${teams.home.losses}) vs ${teams.away.name} (${teams.away.wins}-${teams.away.losses})`
      );
    }

    // Betting context
    if (betting) {
      if (betting.spread_home) {
        const favorite = betting.spread_home < 0 ? teams.home.name : teams.away.name;
        const spread = Math.abs(betting.spread_home);
        points.push(`${favorite} favored by ${spread} points`);
      }
      if (betting.over_under) {
        points.push(`Over/Under set at ${betting.over_under}`);
      }
    }

    // Last play context
    if (game.last_play) {
      points.push(`Recent action: ${game.last_play}`);
    }

    // Venue/broadcast info
    if (game.venue || game.broadcast) {
      const info = [];
      if (game.venue) info.push(`at ${game.venue}`);
      if (game.broadcast) info.push(`on ${game.broadcast}`);
      points.push(info.join(', '));
    }

    return points.slice(0, count);
  }

  // Internal helper to generate insights
  _generateInsights(game, homeTeam, awayTeam, bettingLines) {
    const insights = [];

    // Close game insight
    if (game.status === 'live' && Math.abs(game.home_score - game.away_score) <= 3) {
      insights.push({
        type: 'close_game',
        text: 'This is a nail-biter - single possession game'
      });
    }

    // Blowout insight
    if (game.status === 'live' && Math.abs(game.home_score - game.away_score) >= 20) {
      insights.push({
        type: 'blowout',
        text: 'One-sided affair - dominant performance'
      });
    }

    // Record-based insights
    if (homeTeam && awayTeam) {
      const homeWinPct = homeTeam.wins / (homeTeam.wins + homeTeam.losses) || 0;
      const awayWinPct = awayTeam.wins / (awayTeam.wins + awayTeam.losses) || 0;

      if (homeWinPct > 0.7 && awayWinPct < 0.3) {
        insights.push({
          type: 'mismatch',
          text: 'David vs Goliath matchup - big underdog story potential'
        });
      }
    }

    // Betting insights
    if (bettingLines.length > 0) {
      const line = bettingLines[0];
      if (line.spread_home && Math.abs(line.spread_home) >= 10) {
        insights.push({
          type: 'betting',
          text: 'Large spread - clear favorite in this matchup'
        });
      }
    }

    return insights;
  }

  // Get today's games summary
  async getTodaysSummary() {
    const games = await this.getLiveGames(null, 20);
    const today = new Date().toISOString().split('T')[0];
    
    const todaysGames = games.filter(g => {
      const gameDate = g.game_time.split('T')[0];
      return gameDate === today;
    });

    const summary = {
      total: todaysGames.length,
      live: todaysGames.filter(g => g.status === 'live' || g.status === 'in_progress').length,
      upcoming: todaysGames.filter(g => g.status === 'scheduled').length,
      games: todaysGames,
      bySport: {}
    };

    // Group by sport
    todaysGames.forEach(game => {
      if (!summary.bySport[game.sport]) {
        summary.bySport[game.sport] = [];
      }
      summary.bySport[game.sport].push(game);
    });

    return summary;
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = GameAnalyzer;
