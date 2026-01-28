-- Add external_id column to sports_games for ESPN game IDs
-- This prevents duplicates when updating scores from ESPN API

-- Add external_id column if it doesn't exist
ALTER TABLE sports_games
ADD COLUMN IF NOT EXISTS external_id VARCHAR(50);

-- Create unique index on external_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_sports_games_external_id
ON sports_games(external_id);

-- Add index on status for filtering live/scheduled/finished games
CREATE INDEX IF NOT EXISTS idx_sports_games_status
ON sports_games(status);

-- Add index on game_date for sorting by date
CREATE INDEX IF NOT EXISTS idx_sports_games_date
ON sports_games(game_date DESC);

-- Add composite index for league + status queries
CREATE INDEX IF NOT EXISTS idx_sports_games_league_status
ON sports_games(league, status, game_date DESC);

-- Update existing rows to have external_id (use id as fallback)
UPDATE sports_games
SET external_id = id::text
WHERE external_id IS NULL;

-- Comment
COMMENT ON COLUMN sports_games.external_id IS 'External API game ID (e.g., ESPN game ID) for preventing duplicates';
