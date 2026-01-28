-- ============================================================================
-- SPORTS GAMES TABLE - 2026 SEASON DATA
-- NFL Playoffs, NBA Regular Season, NHL Regular Season
-- ============================================================================

-- Create sports_games table
CREATE TABLE IF NOT EXISTS sports_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league VARCHAR(20) NOT NULL CHECK (league IN ('nfl', 'nba', 'mlb', 'nhl', 'mls', 'epl', 'uefa', 'ncaa')),

  -- Teams
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  home_team_abbr VARCHAR(10),
  away_team_abbr VARCHAR(10),

  -- Game Info
  game_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'live', 'finished')),

  -- Scores
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,

  -- Live Game Info
  quarter VARCHAR(10),
  period VARCHAR(10),
  time_remaining VARCHAR(20),

  -- Betting Lines
  spread_home DECIMAL(4,1),
  spread_away DECIMAL(4,1),
  over_under DECIMAL(4,1),
  moneyline_home INTEGER,
  moneyline_away INTEGER,

  -- Opening Lines (for line movement tracking)
  opening_spread DECIMAL(4,1),
  opening_over_under DECIMAL(4,1),

  -- Metadata
  venue TEXT,
  tv_network VARCHAR(50),
  weather TEXT,
  attendance INTEGER,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sports_games_league ON sports_games(league);
CREATE INDEX idx_sports_games_status ON sports_games(status);
CREATE INDEX idx_sports_games_date ON sports_games(game_date DESC);
CREATE INDEX idx_sports_games_league_date ON sports_games(league, game_date DESC);

-- Auto-update timestamp
CREATE TRIGGER update_sports_games_updated_at
  BEFORE UPDATE ON sports_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT 2026 SEASON DATA
-- ============================================================================

-- NFL DIVISIONAL PLAYOFFS (January 18-19, 2026)
INSERT INTO sports_games (league, home_team, away_team, home_team_abbr, away_team_abbr, game_date, status, home_score, away_score, quarter, time_remaining, venue, tv_network, spread_home, over_under, moneyline_home, moneyline_away) VALUES
-- Live Game
('nfl', 'Kansas City Chiefs', 'Buffalo Bills', 'KC', 'BUF', '2026-01-25 21:30:00', 'live', 24, 21, 'Q3', '8:42', 'Arrowhead Stadium', 'CBS', -3.5, 52.5, -175, 145),

-- Upcoming Today
('nfl', 'San Francisco 49ers', 'Detroit Lions', 'SF', 'DET', '2026-01-26 01:00:00', 'scheduled', 0, 0, NULL, NULL, 'Levi''s Stadium', 'FOX', -6.5, 48.5, -280, 225),

-- Finished Earlier Today
('nfl', 'Baltimore Ravens', 'Houston Texans', 'BAL', 'HOU', '2026-01-25 17:00:00', 'finished', 34, 10, 'Final', NULL, 'M&T Bank Stadium', 'CBS', -9.5, 44.5, -425, 340),

-- Upcoming Tomorrow
('nfl', 'Tampa Bay Buccaneers', 'Philadelphia Eagles', 'TB', 'PHI', '2026-01-26 18:00:00', 'scheduled', 0, 0, NULL, NULL, 'Raymond James Stadium', 'NBC', 2.5, 46.5, 130, -155);

-- NBA REGULAR SEASON (January 25, 2026 - Game Night)
INSERT INTO sports_games (league, home_team, away_team, home_team_abbr, away_team_abbr, game_date, status, home_score, away_score, quarter, time_remaining, venue, tv_network, spread_home, over_under, moneyline_home, moneyline_away) VALUES
-- Live Games
('nba', 'Los Angeles Lakers', 'Golden State Warriors', 'LAL', 'GSW', '2026-01-25 20:00:00', 'live', 98, 105, 'Q3', '4:23', 'Crypto.com Arena', 'ESPN', -4.5, 228.5, -200, 165),
('nba', 'Boston Celtics', 'Milwaukee Bucks', 'BOS', 'MIL', '2026-01-25 19:30:00', 'live', 87, 82, 'Q4', '9:15', 'TD Garden', 'TNT', -7.5, 221.5, -325, 265),

-- Finished Games
('nba', 'Miami Heat', 'Brooklyn Nets', 'MIA', 'BKN', '2026-01-25 17:00:00', 'finished', 112, 98, 'Final', NULL, 'FTX Arena', 'NBA TV', -5.5, 215.5, -225, 185),
('nba', 'Phoenix Suns', 'Denver Nuggets', 'PHX', 'DEN', '2026-01-25 18:00:00', 'finished', 124, 131, 'Final', NULL, 'Footprint Center', 'ESPN', 1.5, 233.5, 105, -125),

-- Upcoming Games
('nba', 'Dallas Mavericks', 'Los Angeles Clippers', 'DAL', 'LAC', '2026-01-25 22:30:00', 'scheduled', 0, 0, NULL, NULL, 'American Airlines Center', 'ESPN', -3.5, 225.5, -165, 140),
('nba', 'Portland Trail Blazers', 'Sacramento Kings', 'POR', 'SAC', '2026-01-25 23:00:00', 'scheduled', 0, 0, NULL, NULL, 'Moda Center', 'NBA League Pass', 5.5, 219.5, 195, -235),

-- Tomorrow's Games
('nba', 'New York Knicks', 'Philadelphia 76ers', 'NYK', 'PHI', '2026-01-26 19:30:00', 'scheduled', 0, 0, NULL, NULL, 'Madison Square Garden', 'ESPN', -2.5, 217.5, -135, 115),
('nba', 'Atlanta Hawks', 'Chicago Bulls', 'ATL', 'CHI', '2026-01-26 19:30:00', 'scheduled', 0, 0, NULL, NULL, 'State Farm Arena', 'NBA TV', -4.5, 229.5, -195, 165);

-- NHL REGULAR SEASON (January 25, 2026)
INSERT INTO sports_games (league, home_team, away_team, home_team_abbr, away_team_abbr, game_date, status, home_score, away_score, period, time_remaining, venue, tv_network, spread_home, over_under, moneyline_home, moneyline_away) VALUES
-- Live Games
('nhl', 'Toronto Maple Leafs', 'Montreal Canadiens', 'TOR', 'MTL', '2026-01-25 19:00:00', 'live', 3, 2, 'P2', '12:34', 'Scotiabank Arena', 'ESPN', -1.5, 6.5, -185, 155),
('nhl', 'Vegas Golden Knights', 'Colorado Avalanche', 'VGK', 'COL', '2026-01-25 21:00:00', 'live', 2, 2, 'P2', '3:21', 'T-Mobile Arena', 'TNT', -1.5, 6.5, -165, 140),

-- Finished Games
('nhl', 'New York Rangers', 'New Jersey Devils', 'NYR', 'NJD', '2026-01-25 17:00:00', 'finished', 4, 3, 'Final/OT', NULL, 'Madison Square Garden', 'MSG', -1.5, 6.5, -175, 150),
('nhl', 'Tampa Bay Lightning', 'Florida Panthers', 'TBL', 'FLA', '2026-01-25 17:30:00', 'finished', 2, 5, 'Final', NULL, 'Amalie Arena', 'Bally Sports', 1.5, 6.5, 125, -145),

-- Upcoming Games
('nhl', 'Edmonton Oilers', 'Calgary Flames', 'EDM', 'CGY', '2026-01-25 22:00:00', 'scheduled', 0, 0, NULL, NULL, 'Rogers Place', 'Sportsnet', -1.5, 6.5, -195, 165),
('nhl', 'Seattle Kraken', 'Anaheim Ducks', 'SEA', 'ANA', '2026-01-25 23:00:00', 'scheduled', 0, 0, NULL, NULL, 'Climate Pledge Arena', 'ROOT Sports', -1.5, 5.5, -245, 200),

-- Tomorrow's Games
('nhl', 'Boston Bruins', 'Pittsburgh Penguins', 'BOS', 'PIT', '2026-01-26 19:00:00', 'scheduled', 0, 0, NULL, NULL, 'TD Garden', 'NESN', -1.5, 6.5, -205, 170),
('nhl', 'Washington Capitals', 'Carolina Hurricanes', 'WSH', 'CAR', '2026-01-26 19:00:00', 'scheduled', 0, 0, NULL, NULL, 'Capital One Arena', 'NBC Sports', 1.5, 6.5, 140, -165);

-- PREMIER LEAGUE (EPL) - Weekend Fixtures (January 25-26, 2026)
INSERT INTO sports_games (league, home_team, away_team, home_team_abbr, away_team_abbr, game_date, status, home_score, away_score, quarter, time_remaining, venue, tv_network, spread_home, over_under, moneyline_home, moneyline_away) VALUES
-- Finished Today
('epl', 'Manchester City', 'Liverpool', 'MCI', 'LIV', '2026-01-25 17:30:00', 'finished', 2, 1, 'FT', NULL, 'Etihad Stadium', 'Peacock', NULL, 3.5, -120, 280),
('epl', 'Arsenal', 'Chelsea', 'ARS', 'CHE', '2026-01-25 15:00:00', 'finished', 3, 3, 'FT', NULL, 'Emirates Stadium', 'USA Network', NULL, 3.5, 115, 220),

-- Upcoming Tomorrow
('epl', 'Manchester United', 'Tottenham Hotspur', 'MUN', 'TOT', '2026-01-26 16:30:00', 'scheduled', 0, 0, NULL, NULL, 'Old Trafford', 'NBC', NULL, 3.5, 105, 195),
('epl', 'Newcastle United', 'Aston Villa', 'NEW', 'AVL', '2026-01-26 14:00:00', 'scheduled', 0, 0, NULL, NULL, 'St James'' Park', 'Peacock', NULL, 2.5, -145, 320);

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Check inserted data
DO $$
DECLARE
  nfl_count INT;
  nba_count INT;
  nhl_count INT;
  epl_count INT;
  live_count INT;
BEGIN
  SELECT COUNT(*) INTO nfl_count FROM sports_games WHERE league = 'nfl';
  SELECT COUNT(*) INTO nba_count FROM sports_games WHERE league = 'nba';
  SELECT COUNT(*) INTO nhl_count FROM sports_games WHERE league = 'nhl';
  SELECT COUNT(*) INTO epl_count FROM sports_games WHERE league = 'epl';
  SELECT COUNT(*) INTO live_count FROM sports_games WHERE status = 'live';

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Sports Games Data Inserted';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE 'NFL Games:   %', nfl_count;
  RAISE NOTICE 'NBA Games:   %', nba_count;
  RAISE NOTICE 'NHL Games:   %', nhl_count;
  RAISE NOTICE 'EPL Games:   %', epl_count;
  RAISE NOTICE 'Live Games:  %', live_count;
  RAISE NOTICE '════════════════════════════════════════════════════';
END $$;
