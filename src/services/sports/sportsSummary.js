/**
 * Sports Summary Service
 * Generates formatted sports summaries for morning briefs and notifications
 */

const supabase = require('../../db/supabase');
const logger = require('../../utils/logger');

class SportsSummaryService {
  constructor() {
    // Teams to exclude from summaries (e.g., Dallas Cowboys)
    this.excludedTeams = ['Dallas Cowboys'];
  }

  /**
   * Set teams to exclude from summaries
   */
  setExcludedTeams(teams) {
    this.excludedTeams = teams;
  }

  /**
   * Check if a game involves an excluded team
   */
  isExcluded(game) {
    return this.excludedTeams.some(team => 
      game.home_team?.toLowerCase().includes(team.toLowerCase()) ||
      game.away_team?.toLowerCase().includes(team.toLowerCase())
    );
  }

  /**
   * Get yesterday's results
   */
  async getYesterdayResults() {
    if (!supabase.isAvailable()) {
      return { games: [], error: 'Database not available' };
    }

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = yesterday.toISOString().split('T')[0] + 'T00:00:00Z';
      const yesterdayEnd = yesterday.toISOString().split('T')[0] + 'T23:59:59Z';

      const { data: games, error } = await supabase.client
        .from('sports_games')
        .select('*')
        .eq('status', 'finished')
        .gte('game_date', yesterdayStart)
        .lte('game_date', yesterdayEnd)
        .order('league', { ascending: true })
        .order('game_date', { ascending: true });

      if (error) throw error;

      // Filter out excluded teams
      const filteredGames = games.filter(game => !this.isExcluded(game));

      return { games: filteredGames, error: null };
    } catch (error) {
      logger.error('Error fetching yesterday results:', error);
      return { games: [], error: error.message };
    }
  }

  /**
   * Get today's scheduled games
   */
  async getTodaySchedule() {
    if (!supabase.isAvailable()) {
      return { games: [], error: 'Database not available' };
    }

    try {
      const today = new Date();
      const todayStart = today.toISOString().split('T')[0] + 'T00:00:00Z';
      const todayEnd = today.toISOString().split('T')[0] + 'T23:59:59Z';

      const { data: games, error } = await supabase.client
        .from('sports_games')
        .select('*')
        .eq('status', 'scheduled')
        .gte('game_date', todayStart)
        .lte('game_date', todayEnd)
        .order('league', { ascending: true })
        .order('game_date', { ascending: true });

      if (error) throw error;

      // Filter out excluded teams
      const filteredGames = games.filter(game => !this.isExcluded(game));

      return { games: filteredGames, error: null };
    } catch (error) {
      logger.error('Error fetching today schedule:', error);
      return { games: [], error: error.message };
    }
  }

  /**
   * Get live games right now
   */
  async getLiveGames() {
    if (!supabase.isAvailable()) {
      return { games: [], error: 'Database not available' };
    }

    try {
      const { data: games, error } = await supabase.client
        .from('sports_games')
        .select('*')
        .eq('status', 'live')
        .order('league', { ascending: true });

      if (error) throw error;

      // Filter out excluded teams
      const filteredGames = games.filter(game => !this.isExcluded(game));

      return { games: filteredGames, error: null };
    } catch (error) {
      logger.error('Error fetching live games:', error);
      return { games: [], error: error.message };
    }
  }

  /**
   * Format a single game result for text display
   */
  formatGameResult(game) {
    const homeWon = game.home_score > game.away_score;
    const winner = homeWon ? game.home_team : game.away_team;
    const loser = homeWon ? game.away_team : game.home_team;
    const winScore = homeWon ? game.home_score : game.away_score;
    const loseScore = homeWon ? game.away_score : game.home_score;
    
    // Check for overtime
    const overtime = game.quarter?.toLowerCase().includes('ot') ? ' (OT)' : '';
    
    return `${winner} ${winScore}, ${loser} ${loseScore}${overtime}`;
  }

  /**
   * Format scheduled game for text display
   */
  formatScheduledGame(game) {
    const gameTime = new Date(game.game_date);
    const timeStr = gameTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/Chicago'
    });
    
    return `${game.away_team} @ ${game.home_team} (${timeStr})`;
  }

  /**
   * Get league emoji
   */
  getLeagueEmoji(league) {
    const emojis = {
      'nfl': '🏈',
      'nba': '🏀',
      'mlb': '⚾',
      'nhl': '🏒',
      'epl': '⚽',
      'mls': '⚽',
      'ncaaf': '🏈',
      'ncaab': '🏀'
    };
    return emojis[league.toLowerCase()] || '🏆';
  }

  /**
   * Generate morning brief sports section
   */
  async generateMorningBrief(options = {}) {
    const { 
      includeYesterday = true, 
      includeToday = true,
      maxGamesPerLeague = 5,
      format = 'text' // 'text' or 'markdown'
    } = options;

    const sections = [];

    // Yesterday's results
    if (includeYesterday) {
      const { games: yesterdayGames } = await this.getYesterdayResults();
      
      if (yesterdayGames.length > 0) {
        const groupedByLeague = this.groupByLeague(yesterdayGames);
        
        let yesterdaySection = format === 'markdown' ? '**📊 Yesterday\'s Scores**\n' : '📊 Yesterday\'s Scores\n';
        
        for (const [league, games] of Object.entries(groupedByLeague)) {
          const emoji = this.getLeagueEmoji(league);
          const limitedGames = games.slice(0, maxGamesPerLeague);
          
          yesterdaySection += `${emoji} ${league.toUpperCase()}\n`;
          limitedGames.forEach(game => {
            yesterdaySection += `• ${this.formatGameResult(game)}\n`;
          });
          
          if (games.length > maxGamesPerLeague) {
            yesterdaySection += `  (+${games.length - maxGamesPerLeague} more)\n`;
          }
        }
        
        sections.push(yesterdaySection);
      }
    }

    // Today's schedule
    if (includeToday) {
      const { games: todayGames } = await this.getTodaySchedule();
      
      if (todayGames.length > 0) {
        const groupedByLeague = this.groupByLeague(todayGames);
        
        let todaySection = format === 'markdown' ? '\n**📅 Today\'s Games**\n' : '\n📅 Today\'s Games\n';
        
        for (const [league, games] of Object.entries(groupedByLeague)) {
          const emoji = this.getLeagueEmoji(league);
          const limitedGames = games.slice(0, maxGamesPerLeague);
          
          todaySection += `${emoji} ${league.toUpperCase()}\n`;
          limitedGames.forEach(game => {
            todaySection += `• ${this.formatScheduledGame(game)}\n`;
          });
          
          if (games.length > maxGamesPerLeague) {
            todaySection += `  (+${games.length - maxGamesPerLeague} more)\n`;
          }
        }
        
        sections.push(todaySection);
      }
    }

    // Check for live games
    const { games: liveGames } = await this.getLiveGames();
    if (liveGames.length > 0) {
      let liveSection = format === 'markdown' ? '\n**🔴 LIVE NOW**\n' : '\n🔴 LIVE NOW\n';
      liveGames.forEach(game => {
        const emoji = this.getLeagueEmoji(game.league);
        liveSection += `${emoji} ${game.away_team} ${game.away_score} @ ${game.home_team} ${game.home_score}\n`;
      });
      sections.unshift(liveSection); // Put live games first
    }

    if (sections.length === 0) {
      return 'No sports updates available.';
    }

    return sections.join('\n').trim();
  }

  /**
   * Group games by league
   */
  groupByLeague(games) {
    return games.reduce((acc, game) => {
      const league = game.league.toLowerCase();
      if (!acc[league]) acc[league] = [];
      acc[league].push(game);
      return acc;
    }, {});
  }

  /**
   * Generate quick score summary (for notifications)
   */
  async generateQuickSummary() {
    const { games: liveGames } = await this.getLiveGames();
    const { games: recentGames } = await this.getYesterdayResults();
    
    let summary = '';
    
    if (liveGames.length > 0) {
      summary += `🔴 ${liveGames.length} live game(s)\n`;
    }
    
    if (recentGames.length > 0) {
      // Count by league
      const leagueCounts = this.groupByLeague(recentGames);
      const countStr = Object.entries(leagueCounts)
        .map(([league, games]) => `${games.length} ${league.toUpperCase()}`)
        .join(', ');
      summary += `📊 Yesterday: ${countStr}`;
    }
    
    return summary || 'No recent sports activity.';
  }
}

module.exports = SportsSummaryService;
