#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSportsData() {
  console.log('🔄 Updating sports data with real current season games...\n');

  try {
    // Delete existing data
    console.log('1. Clearing existing sports games...');
    const { error: deleteError } = await supabase
      .from('sports_games')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Error deleting:', deleteError);
      throw deleteError;
    }
    console.log('✅ Existing data cleared\n');

    // Insert NFL Conference Championships
    console.log('2. Inserting NFL Conference Championships...');
    const nflGames = [
      {
        league: 'nfl',
        home_team: 'Denver Broncos',
        away_team: 'New England Patriots',
        home_team_abbr: 'DEN',
        away_team_abbr: 'NE',
        game_date: '2026-01-25T20:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Empower Field at Mile High',
        tv_network: 'CBS',
        spread_home: 1.5,
        over_under: 45.5,
        moneyline_home: 105,
        moneyline_away: -125
      },
      {
        league: 'nfl',
        home_team: 'Seattle Seahawks',
        away_team: 'Los Angeles Rams',
        home_team_abbr: 'SEA',
        away_team_abbr: 'LAR',
        game_date: '2026-01-25T23:30:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Lumen Field',
        tv_network: 'FOX',
        spread_home: -3.5,
        over_under: 48.5,
        moneyline_home: -175,
        moneyline_away: 145
      },
      // Divisional Round Results
      {
        league: 'nfl',
        home_team: 'Denver Broncos',
        away_team: 'Buffalo Bills',
        home_team_abbr: 'DEN',
        away_team_abbr: 'BUF',
        game_date: '2026-01-17T21:30:00Z',
        status: 'finished',
        home_score: 33,
        away_score: 30,
        quarter: 'Final/OT',
        venue: 'Empower Field at Mile High',
        tv_network: 'CBS',
        spread_home: -2.5,
        over_under: 47.5
      },
      {
        league: 'nfl',
        home_team: 'Seattle Seahawks',
        away_team: 'San Francisco 49ers',
        home_team_abbr: 'SEA',
        away_team_abbr: 'SF',
        game_date: '2026-01-18T01:00:00Z',
        status: 'finished',
        home_score: 41,
        away_score: 6,
        quarter: 'Final',
        venue: 'Lumen Field',
        tv_network: 'FOX'
      },
      {
        league: 'nfl',
        home_team: 'New England Patriots',
        away_team: 'Houston Texans',
        home_team_abbr: 'NE',
        away_team_abbr: 'HOU',
        game_date: '2026-01-18T20:00:00Z',
        status: 'finished',
        home_score: 28,
        away_score: 16,
        quarter: 'Final',
        venue: 'Gillette Stadium',
        tv_network: 'ESPN/ABC'
      },
      {
        league: 'nfl',
        home_team: 'Los Angeles Rams',
        away_team: 'Chicago Bears',
        home_team_abbr: 'LAR',
        away_team_abbr: 'CHI',
        game_date: '2026-01-18T20:00:00Z',
        status: 'finished',
        home_score: 20,
        away_score: 17,
        quarter: 'Final/OT',
        venue: 'Soldier Field',
        tv_network: 'FOX'
      }
    ];

    const { error: nflError } = await supabase
      .from('sports_games')
      .insert(nflGames);

    if (nflError) throw nflError;
    console.log(`✅ Inserted ${nflGames.length} NFL games\n`);

    // Insert NBA games
    console.log('3. Inserting NBA games...');
    const nbaGames = [
      {
        league: 'nba',
        home_team: 'Minnesota Timberwolves',
        away_team: 'Golden State Warriors',
        home_team_abbr: 'MIN',
        away_team_abbr: 'GSW',
        game_date: '2026-01-25T22:30:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Target Center',
        tv_network: 'NBA TV',
        spread_home: -5.5,
        over_under: 225.5
      },
      {
        league: 'nba',
        home_team: 'Milwaukee Bucks',
        away_team: 'Dallas Mavericks',
        home_team_abbr: 'MIL',
        away_team_abbr: 'DAL',
        game_date: '2026-01-25T20:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Fiserv Forum',
        tv_network: 'NBA TV',
        spread_home: -1.5,
        over_under: 219.5
      },
      {
        league: 'nba',
        home_team: 'Oklahoma City Thunder',
        away_team: 'Toronto Raptors',
        home_team_abbr: 'OKC',
        away_team_abbr: 'TOR',
        game_date: '2026-01-26T00:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Paycom Center',
        tv_network: 'League Pass',
        spread_home: -11.5,
        over_under: 224.5
      },
      {
        league: 'nba',
        home_team: 'San Antonio Spurs',
        away_team: 'New Orleans Pelicans',
        home_team_abbr: 'SA',
        away_team_abbr: 'NOP',
        game_date: '2026-01-26T01:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Frost Bank Center',
        tv_network: 'League Pass',
        spread_home: -11.5,
        over_under: 238.5
      }
    ];

    const { error: nbaError } = await supabase
      .from('sports_games')
      .insert(nbaGames);

    if (nbaError) throw nbaError;
    console.log(`✅ Inserted ${nbaGames.length} NBA games\n`);

    // Insert NHL games
    console.log('4. Inserting NHL games...');
    const nhlGames = [
      {
        league: 'nhl',
        home_team: 'Toronto Maple Leafs',
        away_team: 'Colorado Avalanche',
        home_team_abbr: 'TOR',
        away_team_abbr: 'COL',
        game_date: '2026-01-25T18:30:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Scotiabank Arena',
        tv_network: 'ESPN+',
        spread_home: -1.5,
        over_under: 6.5
      },
      {
        league: 'nhl',
        home_team: 'Seattle Kraken',
        away_team: 'New Jersey Devils',
        home_team_abbr: 'SEA',
        away_team_abbr: 'NJD',
        game_date: '2026-01-25T21:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Climate Pledge Arena',
        tv_network: 'ROOT Sports',
        spread_home: 1.5,
        over_under: 6.5
      },
      {
        league: 'nhl',
        home_team: 'Ottawa Senators',
        away_team: 'Vegas Golden Knights',
        home_team_abbr: 'OTT',
        away_team_abbr: 'VGK',
        game_date: '2026-01-25T22:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Canadian Tire Centre',
        tv_network: 'TSN',
        spread_home: 1.5,
        over_under: 6.5
      },
      {
        league: 'nhl',
        home_team: 'Vancouver Canucks',
        away_team: 'Pittsburgh Penguins',
        home_team_abbr: 'VAN',
        away_team_abbr: 'PIT',
        game_date: '2026-01-26T00:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Rogers Arena',
        tv_network: 'Sportsnet',
        spread_home: -1.5,
        over_under: 6.5
      },
      {
        league: 'nhl',
        home_team: 'Chicago Blackhawks',
        away_team: 'Florida Panthers',
        home_team_abbr: 'CHI',
        away_team_abbr: 'FLA',
        game_date: '2026-01-26T00:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'United Center',
        tv_network: 'ESPN+',
        spread_home: 1.5,
        over_under: 6.5
      },
      {
        league: 'nhl',
        home_team: 'Calgary Flames',
        away_team: 'Anaheim Ducks',
        home_team_abbr: 'CGY',
        away_team_abbr: 'ANA',
        game_date: '2026-01-26T01:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Scotiabank Saddledome',
        tv_network: 'Sportsnet',
        spread_home: -1.5,
        over_under: 6.5
      }
    ];

    const { error: nhlError } = await supabase
      .from('sports_games')
      .insert(nhlGames);

    if (nhlError) throw nhlError;
    console.log(`✅ Inserted ${nhlGames.length} NHL games\n`);

    // Insert EPL games
    console.log('5. Inserting Premier League games...');
    const eplGames = [
      {
        league: 'epl',
        home_team: 'Brentford',
        away_team: 'Nottingham Forest',
        home_team_abbr: 'BRE',
        away_team_abbr: 'NFO',
        game_date: '2026-01-25T19:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Gtech Community Stadium',
        tv_network: 'Sky Sports',
        over_under: 2.5,
        moneyline_home: 105,
        moneyline_away: 240
      },
      {
        league: 'epl',
        home_team: 'Crystal Palace',
        away_team: 'Chelsea',
        home_team_abbr: 'CRY',
        away_team_abbr: 'CHE',
        game_date: '2026-01-25T19:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Selhurst Park',
        tv_network: 'Sky Sports',
        over_under: 3.5,
        moneyline_home: 235,
        moneyline_away: 125
      },
      {
        league: 'epl',
        home_team: 'Newcastle United',
        away_team: 'Aston Villa',
        home_team_abbr: 'NEW',
        away_team_abbr: 'AVL',
        game_date: '2026-01-25T19:00:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'St James\' Park',
        tv_network: 'Sky Sports',
        over_under: 2.5,
        moneyline_home: -145,
        moneyline_away: 320
      },
      {
        league: 'epl',
        home_team: 'Arsenal',
        away_team: 'Manchester United',
        home_team_abbr: 'ARS',
        away_team_abbr: 'MUN',
        game_date: '2026-01-25T21:30:00Z',
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        venue: 'Emirates Stadium',
        tv_network: 'Sky Sports',
        over_under: 3.5,
        moneyline_home: -175,
        moneyline_away: 425
      }
    ];

    const { error: eplError } = await supabase
      .from('sports_games')
      .insert(eplGames);

    if (eplError) throw eplError;
    console.log(`✅ Inserted ${eplGames.length} EPL games\n`);

    // Verify total count
    const { count, error: countError } = await supabase
      .from('sports_games')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Sports Data Updated Successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`NFL Games:   ${nflGames.length} (2 Conference Championships + 4 Divisional Results)`);
    console.log(`NBA Games:   ${nbaGames.length} (All scheduled for today)`);
    console.log(`NHL Games:   ${nhlGames.length} (All scheduled for today)`);
    console.log(`EPL Games:   ${eplGames.length} (All scheduled for today)`);
    console.log('───────────────────────────────────────────────────────');
    console.log(`Total Games: ${count}`);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🏈 NFL: Conference Championships TODAY');
    console.log('   • AFC: Patriots @ Broncos (3:00 PM ET, CBS)');
    console.log('   • NFC: Rams @ Seahawks (6:30 PM ET, FOX)\n');
    console.log('🏀 NBA: 4 Games Scheduled Today');
    console.log('   • Warriors @ Timberwolves (5:30 PM ET)');
    console.log('   • Raptors @ Thunder (7:00 PM ET)\n');
    console.log('🏒 NHL: 6 Games Scheduled Today');
    console.log('   • Avalanche @ Maple Leafs (1:30 PM ET)');
    console.log('   • Ducks @ Flames (8:00 PM ET)\n');
    console.log('⚽ EPL: 4 Fixtures Today');
    console.log('   • Arsenal vs Man Utd (4:30 PM ET)');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error updating sports data:', error);
    process.exit(1);
  }
}

updateSportsData();
