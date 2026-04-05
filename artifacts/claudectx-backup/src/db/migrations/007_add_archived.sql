-- Add is_archived column to sessions table
ALTER TABLE sessions ADD COLUMN is_archived INTEGER DEFAULT 0;
