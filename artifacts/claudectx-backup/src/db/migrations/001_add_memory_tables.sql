-- Migration: Add Memory System Tables
-- Date: 2026-04-03
-- Description: Extends ClaudeContext with preferences, knowledge, patterns, tasks, and contacts

-- User preferences
CREATE TABLE IF NOT EXISTS preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,  -- communication_style, coding, workflow, testing
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,  -- 0-1 confidence score
  source_session_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(category, key),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_preferences_category ON preferences(category);
CREATE INDEX IF NOT EXISTS idx_preferences_updated ON preferences(updated_at DESC);

-- Relationships/Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- person, team, organization
  role TEXT,
  email TEXT,
  metadata TEXT,  -- JSON for additional fields
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- Interaction history
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL,
  session_id TEXT,
  interaction_type TEXT,  -- mentioned, collaborated, discussed, reviewed
  context TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);

-- Domain knowledge
CREATE TABLE IF NOT EXISTS knowledge_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,  -- technology, business, architecture, debugging
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,  -- 0-1 confidence score
  source_session_id TEXT,
  last_accessed_at INTEGER,
  access_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_items(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_topic ON knowledge_items(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_confidence ON knowledge_items(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_accessed ON knowledge_items(last_accessed_at DESC);

-- Full-text search for knowledge
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
  topic, content,
  content=knowledge_items,
  content_rowid=rowid
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS knowledge_fts_insert AFTER INSERT ON knowledge_items BEGIN
  INSERT INTO knowledge_fts(rowid, topic, content) VALUES (new.rowid, new.topic, new.content);
END;

CREATE TRIGGER IF NOT EXISTS knowledge_fts_delete AFTER DELETE ON knowledge_items BEGIN
  DELETE FROM knowledge_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS knowledge_fts_update AFTER UPDATE ON knowledge_items BEGIN
  DELETE FROM knowledge_fts WHERE rowid = old.rowid;
  INSERT INTO knowledge_fts(rowid, topic, content) VALUES (new.rowid, new.topic, new.content);
END;

-- Learned patterns
CREATE TABLE IF NOT EXISTS learned_patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL,  -- debugging, problem_solving, code_pattern, workflow
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  example TEXT,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_used_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_patterns_type ON learned_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_success ON learned_patterns(success_count DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_used ON learned_patterns(last_used_at DESC);

-- Pending tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed, blocked, cancelled
  priority TEXT DEFAULT 'medium',  -- low, medium, high, urgent
  project_id TEXT,
  tags TEXT,  -- JSON array
  created_session_id TEXT,
  completed_session_id TEXT,
  due_date INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);

-- Memory metadata (for tracking memory health)
CREATE TABLE IF NOT EXISTS memory_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Insert initial metadata
INSERT OR IGNORE INTO memory_metadata (key, value) VALUES
  ('schema_version', '1'),
  ('memory_enabled', 'true'),
  ('last_consolidation', '0'),
  ('total_memories', '0');
