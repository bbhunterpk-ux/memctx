-- Add tags table and session_tags junction table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  color TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS session_tags (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (session_id, tag_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tags_project ON tags(project_id);
CREATE INDEX IF NOT EXISTS idx_session_tags_session ON session_tags(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tags_tag ON session_tags(tag_id);
