const supabase = require('../../db/supabase');
const {
  readConfig,
  writeConfig,
  ensureTrackedItems
} = require('../utils/config');

const normalizeTeamInput = (input) => {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return {
      league: input.league || null,
      name: input.name || null,
      teamKey: input.teamKey || null,
      city: input.city || null,
      conference: input.conference || null,
      division: input.division || null
    };
  }

  return {
    league: null,
    name: input || null,
    teamKey: null,
    city: null,
    conference: null,
    division: null
  };
};

class SportsTracker {
  async getScores(query = {}) {
    const { league } = query;

    // Fetch from database if available
    if (supabase.isAvailable()) {
      try {
        let gamesQuery = supabase.client
          .from('sports_games')
          .select('*')
          .order('game_date', { ascending: true });

        // Filter by league if specified
        if (league && league !== 'all') {
          gamesQuery = gamesQuery.eq('league', league.toLowerCase());
        }

        const { data: games, error } = await gamesQuery;

        if (error) {
          console.error('Error fetching sports games:', error);
          return this._getEmptyResponse();
        }

        // Transform to frontend format
        const scores = games.map(game => ({
          id: game.id,
          league: game.league.toUpperCase(),
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          homeScore: game.home_score || 0,
          awayScore: game.away_score || 0,
          status: game.status,
          startTime: game.game_date,
          quarter: game.quarter || game.period,
          timeRemaining: game.time_remaining,
          spread: game.spread_home,
          overUnder: game.over_under,
          moneyline: {
            home: game.moneyline_home,
            away: game.moneyline_away
          },
          venue: game.venue,
          tvNetwork: game.tv_network
        }));

        // Get unique leagues and teams
        const leagues = [...new Set(games.map(g => g.league.toUpperCase()))];
        const teams = [...new Set([
          ...games.map(g => g.home_team),
          ...games.map(g => g.away_team)
        ])];

        return {
          source: 'database',
          generatedAt: new Date().toISOString(),
          leagues,
          teams,
          games: scores
        };
      } catch (error) {
        console.error('Error in getScores:', error);
        return this._getEmptyResponse();
      }
    }

    return this._getEmptyResponse();
  }

  async getSchedule(query = {}) {
    const { league } = query;

    // For schedule, get only upcoming and finished games
    if (supabase.isAvailable()) {
      try {
        let gamesQuery = supabase.client
          .from('sports_games')
          .select('*')
          .in('status', ['scheduled', 'finished'])
          .order('game_date', { ascending: true })
          .limit(50);

        if (league && league !== 'all') {
          gamesQuery = gamesQuery.eq('league', league.toLowerCase());
        }

        const { data: games, error } = await gamesQuery;

        if (error) {
          console.error('Error fetching schedule:', error);
          return this._getEmptyResponse();
        }

        const schedule = games.map(game => ({
          id: game.id,
          league: game.league.toUpperCase(),
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          homeScore: game.home_score || 0,
          awayScore: game.away_score || 0,
          status: game.status,
          startTime: game.game_date,
          venue: game.venue,
          tvNetwork: game.tv_network,
          spread: game.spread_home,
          overUnder: game.over_under
        }));

        const leagues = [...new Set(games.map(g => g.league.toUpperCase()))];
        const teams = [...new Set([
          ...games.map(g => g.home_team),
          ...games.map(g => g.away_team)
        ])];

        return {
          source: 'database',
          generatedAt: new Date().toISOString(),
          leagues,
          teams,
          games: schedule
        };
      } catch (error) {
        console.error('Error in getSchedule:', error);
        return this._getEmptyResponse();
      }
    }

    return this._getEmptyResponse();
  }

  _getEmptyResponse() {
    const config = readConfig();
    ensureTrackedItems(config);

    return {
      source: 'local',
      generatedAt: new Date().toISOString(),
      leagues: config.trackedItems.sports.leagues,
      teams: config.trackedItems.sports.teams,
      games: []
    };
  }

  async addTeam(input) {
    const team = normalizeTeamInput(input);

    if (supabase.isAvailable()) {
      const result = await supabase.addTeam(team);
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);

    if (team.name && !config.trackedItems.sports.teams.includes(team.name)) {
      config.trackedItems.sports.teams.push(team.name);
    }
    if (team.league && !config.trackedItems.sports.leagues.includes(team.league)) {
      config.trackedItems.sports.leagues.push(team.league);
    }

    writeConfig(config);

    return team;
  }
}

module.exports = SportsTracker;
