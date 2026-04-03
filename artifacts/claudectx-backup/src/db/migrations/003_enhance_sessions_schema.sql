-- Migration 003: Enhance Sessions Schema for v2.0
-- Adds 7 new columns for enhanced summarization and 5 performance indexes

-- Add new columns to sessions table
ALTER TABLE sessions ADD COLUMN summary_mood TEXT;
ALTER TABLE sessions ADD COLUMN summary_complexity TEXT;
ALTER TABLE sessions ADD COLUMN summary_blockers TEXT;
ALTER TABLE sessions ADD COLUMN summary_resolved TEXT;
ALTER TABLE sessions ADD COLUMN summary_key_insight TEXT;
ALTER TABLE sessions ADD COLUMN duration_seconds INTEGER;
ALTER TABLE sessions ADD COLUMN embedding_summary TEXT;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_sessions_project_ended
  ON sessions(project_id, ended_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_status_project
  ON sessions(status, project_id);

CREATE INDEX IF NOT EXISTS idx_sessions_started
  ON sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_observations_session_type
  ON observations(session_id, event_type);

CREATE INDEX IF NOT EXISTS idx_observations_project_created
  ON observations(project_id, created_at DESC);
