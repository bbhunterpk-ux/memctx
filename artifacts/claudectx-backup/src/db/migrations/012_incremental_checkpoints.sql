-- Create session_checkpoints table
CREATE TABLE IF NOT EXISTS session_checkpoints (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  checkpoint_number INTEGER NOT NULL,
  turn_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  summary_title TEXT,
  summary_data TEXT,
  transcript_range TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(session_id, checkpoint_number)
);

CREATE INDEX idx_checkpoints_session ON session_checkpoints(session_id);
CREATE INDEX idx_checkpoints_project ON session_checkpoints(project_id);
CREATE INDEX idx_checkpoints_created ON session_checkpoints(created_at);

-- Add checkpoint tracking to sessions
ALTER TABLE sessions ADD COLUMN last_checkpoint_turn INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN last_checkpoint_time INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN checkpoint_count INTEGER DEFAULT 0;
