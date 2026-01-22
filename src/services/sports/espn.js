const axios = require('axios');
const Bottleneck = require('bottleneck');
const logger = require('../../utils/logger');

class ESPNService {
  constructor() {
    this.baseURL = 'https://site.api.espn.com/apis/site/v2/sports';

    // Rate limiting: ESPN is generous, 1 request per 500ms
    this.limiter = new Bottleneck({
      minTime: 500,
      maxConcurrent: 5
    });

    this.axios = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    // League URL mappings
    this.leagueURLs = {
      'nba': '/basketball/nba',
      'nfl': '/football/nfl',
      'mlb': '/baseball/mlb',
      'nhl': '/hockey/nhl',
      'ncaaf': '/football/college-football',
      'ncaab': '/basketball/mens-college-basketball'
    };
  }

  /**
   * Get API endpoint for league
   */
  getLeagueEndpoint(league) {
    const leagueKey = league.toLowerCase();
    const leaguePath = this.leagueURLs[leagueKey];

    if (!leaguePath) {
      throw new Error(`Unsupported league: ${league}. Supported: ${Object.keys(this.leagueURLs).join(', ')}`);
    }

    return leaguePath;
  }

  /**
   * Fetch live scores for a league
   */
  async fetchScores(league = 'nba') {
    return this.limiter.schedule(async () => {
      try {
        logger.info(`Fetching ${league.toUpperCase()} scores from ESPN`);

        const leaguePath = this.getLeagueEndpoint(league);
        const url = `${this.baseURL}${leaguePath}/scoreboard`;

        const response = await this.axios.get(url);
        const data = response.data;

        if (!data.events || data.events.length === 0) {
          logger.info(`No ${league.toUpperCase()} games currently`);
          return {
            league: league.toUpperCase(),
            games: [],
            timestamp: new Date().toISOString()
          };
        }

        const games = data.events.map(event => {
          const competition = event.competitions[0];
          const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
          const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

          return {
            id: event.id,
            name: event.name,
            status: competition.status.type.description,
            homeTeam: {
              name: homeTeam.team.displayName,
              score: homeTeam.score,
              record: homeTeam.records?.[0]?.summary
            },
            awayTeam: {
              name: awayTeam.team.displayName,
              score: awayTeam.score,
              record: awayTeam.records?.[0]?.summary
            },
            date: event.date,
            completed: competition.status.type.completed
          };
        });

        logger.info(`Fetched ${games.length} ${league.toUpperCase()} games`);

        return {
          league: league.toUpperCase(),
          games,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error(`ESPN scores fetch error for ${league}: ${error.message}`);
        throw error;
      }
    });
  }

  /**
   * Fetch upcoming schedule for a league
   */
  async fetchSchedule(league = 'nba', limit = 10) {
    return this.limiter.schedule(async () => {
      try {
        logger.info(`Fetching ${league.toUpperCase()} schedule from ESPN`);

        const leaguePath = this.getLeagueEndpoint(league);
        const url = `${this.baseURL}${leaguePath}/scoreboard`;

        const response = await this.axios.get(url);
        const data = response.data;

        if (!data.events) {
          return {
            league: league.toUpperCase(),
            games: [],
            timestamp: new Date().toISOString()
          };
        }

        // Filter for upcoming games only
        const upcomingGames = data.events
          .filter(event => {
            const status = event.competitions[0].status.type;
            return status.state === 'pre' || status.name === 'STATUS_SCHEDULED';
          })
          .slice(0, limit)
          .map(event => {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

            return {
              id: event.id,
              name: event.name,
              homeTeam: homeTeam.team.displayName,
              awayTeam: awayTeam.team.displayName,
              date: event.date,
              venue: competition.venue?.fullName
            };
          });

        logger.info(`Fetched ${upcomingGames.length} upcoming ${league.toUpperCase()} games`);

        return {
          league: league.toUpperCase(),
          games: upcomingGames,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        logger.error(`ESPN schedule fetch error for ${league}: ${error.message}`);
        throw error;
      }
    });
  }

  /**
   * Fetch scores for multiple leagues
   */
  async fetchMultipleLeagues(leagues) {
    const results = [];

    for (const league of leagues) {
      try {
        const scores = await this.fetchScores(league);
        results.push({ league, scores, error: null });
      } catch (error) {
        results.push({ league, scores: null, error: error.message });
      }
    }

    return results;
  }

  /**
   * Filter games by tracked teams
   */
  filterGamesByTeams(games, trackedTeams) {
    if (!trackedTeams || trackedTeams.length === 0) {
      return games;
    }

    const teamNamesLower = trackedTeams.map(t => t.toLowerCase());

    return games.filter(game => {
      const homeTeamLower = game.homeTeam.name.toLowerCase();
      const awayTeamLower = game.awayTeam.name.toLowerCase();

      return teamNamesLower.some(team =>
        homeTeamLower.includes(team) || awayTeamLower.includes(team)
      );
    });
  }
}

module.exports = ESPNService;
