const logger = require('../../utils/logger');

class SportsKnowledge {
  constructor() {
    // Team nicknames and common references
    this.teamAliases = {
      'Lakers': ['LAL', 'Los Angeles Lakers', 'LA Lakers', 'Lake Show'],
      'Celtics': ['BOS', 'Boston Celtics', 'Cs'],
      'Warriors': ['GSW', 'Golden State Warriors', 'Dubs'],
      'Heat': ['MIA', 'Miami Heat'],
      'Bulls': ['CHI', 'Chicago Bulls'],
      'Knicks': ['NYK', 'New York Knicks', 'NY Knicks'],
      // Add more as needed
    };

    // Famous rivalries
    this.rivalries = {
      'Lakers-Celtics': {
        history: 'The most storied rivalry in NBA history with 12 Finals matchups',
        intensity: 'legendary',
        notable: 'Magic vs Bird era, Kobe vs Pierce/Garnett'
      },
      'Yankees-Red Sox': {
        history: 'Baseball\'s greatest rivalry spanning over 100 years',
        intensity: 'intense',
        notable: '2004 ALCS comeback, Babe Ruth curse'
      },
      'Cowboys-Eagles': {
        history: 'NFC East rivalry with decades of playoff implications',
        intensity: 'heated',
        notable: 'Division dominance battles'
      }
    };

    // Coaching styles and tendencies
    this.coachingStyles = {
      'offensive-minded': ['high tempo', 'three-point heavy', 'run and gun'],
      'defensive-focused': ['grind it out', 'physical play', 'low scoring'],
      'balanced': ['adaptable', 'situational basketball', 'versatile rotations']
    };

    // Common analytics terms
    this.analyticsTerms = {
      'PER': 'Player Efficiency Rating',
      'TS%': 'True Shooting Percentage',
      'VORP': 'Value Over Replacement Player',
      'BPM': 'Box Plus/Minus',
      'WS': 'Win Shares',
      'USG%': 'Usage Rate',
      'ORtg': 'Offensive Rating',
      'DRtg': 'Defensive Rating'
    };
  }

  // Get rivalry context
  getRivalryContext(team1, team2) {
    const key1 = `${team1}-${team2}`;
    const key2 = `${team2}-${team1}`;
    
    return this.rivalries[key1] || this.rivalries[key2] || null;
  }

  // Get historical context for a matchup
  getMatchupHistory(team1, team2, sport) {
    const rivalry = this.getRivalryContext(team1, team2);
    
    if (rivalry) {
      return {
        hasRivalry: true,
        context: rivalry,
        talkingPoint: `Classic ${team1}-${team2} matchup - ${rivalry.history}`
      };
    }

    return {
      hasRivalry: false,
      talkingPoint: `${team1} vs ${team2} - always a competitive matchup`
    };
  }

  // Generate player storylines
  generatePlayerStoryline(player, stats = {}) {
    const storylines = [];

    // Hot streak detection
    if (stats.recent_ppg && stats.recent_ppg > 30) {
      storylines.push(`${player} is on fire - averaging ${stats.recent_ppg} PPG in last 5 games`);
    }

    // Slump detection
    if (stats.fg_percentage && stats.fg_percentage < 35) {
      storylines.push(`${player} struggling with efficiency - shooting just ${stats.fg_percentage}%`);
    }

    // Milestone watch
    if (stats.career_points && stats.career_points >= 29000 && stats.career_points < 30000) {
      const needed = 30000 - stats.career_points;
      storylines.push(`${player} closing in on 30K career points - needs ${needed} more`);
    }

    // Injury return
    if (stats.games_since_injury && stats.games_since_injury <= 3) {
      storylines.push(`${player} recently returned from injury - watch for any rust`);
    }

    return storylines;
  }

  // Generate team trend analysis
  getTeamTrends(team, recentGames = []) {
    const trends = {
      streak: null,
      momentum: 'neutral',
      strengths: [],
      weaknesses: [],
      narrative: ''
    };

    if (recentGames.length === 0) return trends;

    // Calculate win streak
    let streak = 0;
    let streakType = null;
    
    for (let i = recentGames.length - 1; i >= 0; i--) {
      const game = recentGames[i];
      const won = game.win;
      
      if (streakType === null) {
        streakType = won ? 'W' : 'L';
        streak = 1;
      } else if ((won && streakType === 'W') || (!won && streakType === 'L')) {
        streak++;
      } else {
        break;
      }
    }

    trends.streak = { count: streak, type: streakType };

    // Momentum assessment
    const recentRecord = recentGames.slice(-5);
    const wins = recentRecord.filter(g => g.win).length;
    
    if (wins >= 4) trends.momentum = 'hot';
    else if (wins <= 1) trends.momentum = 'cold';
    else trends.momentum = 'neutral';

    // Generate narrative
    if (streak >= 3) {
      trends.narrative = `${team} is ${streakType === 'W' ? 'surging' : 'struggling'} with ${streak} straight ${streakType === 'W' ? 'wins' : 'losses'}`;
    } else if (trends.momentum === 'hot') {
      trends.narrative = `${team} playing well - won ${wins} of last 5`;
    } else if (trends.momentum === 'cold') {
      trends.narrative = `${team} struggling - only ${wins} wins in last 5 games`;
    }

    return trends;
  }

  // Get betting context and explanation
  getBettingContext(odds) {
    if (!odds) return null;

    const context = {
      spread: null,
      overUnder: null,
      moneyline: null,
      explanation: []
    };

    // Spread explanation
    if (odds.spread_home) {
      context.spread = {
        value: odds.spread_home,
        favorite: odds.spread_home < 0 ? 'home' : 'away'
      };
      
      const spread = Math.abs(odds.spread_home);
      if (spread >= 10) {
        context.explanation.push(`Large ${spread}-point spread indicates heavy favorite`);
      } else if (spread <= 3) {
        context.explanation.push(`Tight ${spread}-point spread - expected to be close`);
      }
    }

    // Over/Under explanation
    if (odds.over_under) {
      context.overUnder = odds.over_under;
      
      if (odds.over_under >= 230) { // NBA context
        context.explanation.push('High O/U suggests fast-paced, high-scoring affair');
      } else if (odds.over_under <= 200) {
        context.explanation.push('Low O/U indicates defensive battle expected');
      }
    }

    return context;
  }

  // Generate hot take (controversial but defensible)
  generateHotTake(game, analysis) {
    const takes = [];

    // Upset alert
    if (analysis.betting && Math.abs(analysis.betting.spread_home || 0) >= 10) {
      const underdog = analysis.betting.spread_home < 0 ? analysis.teams.away.name : analysis.teams.home.name;
      takes.push(`Don't sleep on ${underdog} - trap game potential`);
    }

    // Overreaction to recent performance
    if (analysis.teams.home.wins >= 8 && analysis.teams.home.losses <= 2) {
      takes.push(`${analysis.teams.home.name} might be due for a letdown - can't stay this hot forever`);
    }

    // Bold prediction based on matchup
    const scoreDiff = Math.abs(game.home_score - game.away_score);
    if (game.status === 'live' && scoreDiff <= 5 && game.period && game.period.includes('4')) {
      takes.push('This game is going down to the wire - whoever has the ball last wins');
    }

    return takes[Math.floor(Math.random() * takes.length)] || 'This matchup has playoff implications written all over it';
  }

  // Get league-wide trends
  getLeagueTrends(sport) {
    const trends = {
      NBA: [
        'Three-point shooting at all-time high',
        'Pace of play continues to accelerate',
        'Load management impacting regular season',
        'Versatile two-way players are most valuable'
      ],
      NFL: [
        'Pass-heavy offenses dominating',
        'Running QBs changing the game',
        'Defensive backs are premium positions',
        'Analytics driving 4th down decisions'
      ],
      MLB: [
        'Launch angle revolution in full swing',
        'Bullpen usage becoming more specialized',
        'Shift restrictions changing hitting approach',
        'Pitch clock speeding up game'
      ],
      NHL: [
        'Speed and skill trumping size',
        'Analytics revolution changing roster construction',
        'Goaltending more unpredictable than ever',
        'Power play success at decade high'
      ]
    };

    return trends[sport] || [];
  }

  // Get context for time of season
  getSeasonContext(sport, date = new Date()) {
    const month = date.getMonth() + 1; // JS months are 0-indexed
    
    const context = {
      NBA: month >= 10 || month <= 4 ? 'regular season grind' : 'offseason',
      NFL: month >= 9 && month <= 12 ? 'regular season' : month === 1 ? 'playoffs' : 'offseason',
      MLB: month >= 4 && month <= 9 ? 'regular season' : 'offseason',
      NHL: month >= 10 || month <= 4 ? 'regular season' : 'offseason'
    };

    return context[sport] || 'season';
  }

  // Generate expert-level comparison
  generateComparison(player1, player2) {
    return {
      statistical: 'Breaking down the numbers...',
      intangibles: 'Looking beyond the stat sheet...',
      impact: 'Who makes their team better?',
      clutch: 'Who do you want with the game on the line?'
    };
  }
}

module.exports = SportsKnowledge;
