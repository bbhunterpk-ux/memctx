-- Add activity tracking columns
ALTER TABLE sessions ADD COLUMN last_activity INTEGER;
ALTER TABLE sessions ADD COLUMN auto_ended INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN summary_requested_at INTEGER;

-- Create index for worker queries
CREATE INDEX IF NOT EXISTS idx_sessions_activity
ON sessions(status, last_activity);

-- Backfill last_activity for existing sessions
UPDATE sessions
SET last_activity = COALESCE(ended_at, started_at)
WHERE last_activity IS NULL;
