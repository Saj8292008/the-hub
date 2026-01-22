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
  async getScores() {
    const config = readConfig();
    ensureTrackedItems(config);

    return {
      source: 'local',
      generatedAt: new Date().toISOString(),
      leagues: config.trackedItems.sports.leagues,
      teams: config.trackedItems.sports.teams,
      scores: []
    };
  }

  async getSchedule() {
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
