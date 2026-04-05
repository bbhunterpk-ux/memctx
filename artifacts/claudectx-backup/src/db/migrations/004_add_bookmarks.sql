-- Add is_bookmarked column to sessions table
ALTER TABLE sessions ADD COLUMN is_bookmarked INTEGER DEFAULT 0;

-- Create index for faster bookmark queries
CREATE INDEX IF NOT EXISTS idx_sessions_bookmarked ON sessions(is_bookmarked, project_id);
