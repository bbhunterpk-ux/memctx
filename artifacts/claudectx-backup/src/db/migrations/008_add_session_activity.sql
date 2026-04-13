-- Add activity tracking columns (skip if already exist)
-- SQLite will error if column exists, but migration system should handle this

-- Create index for worker queries
CREATE INDEX IF NOT EXISTS idx_sessions_activity
ON sessions(status, last_activity);

-- Backfill last_activity for existing sessions
UPDATE sessions
SET last_activity = COALESCE(ended_at, started_at)
WHERE last_activity IS NULL;
