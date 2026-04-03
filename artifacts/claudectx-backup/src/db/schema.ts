export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  root_path   TEXT NOT NULL UNIQUE,
  git_remote  TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  started_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  ended_at        INTEGER,
  transcript_path TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  summary_title   TEXT,
  summary_status  TEXT,
  summary_what_we_did    TEXT,
  summary_decisions      TEXT,
  summary_files_changed  TEXT,
  summary_next_steps     TEXT,
  summary_gotchas        TEXT,
  summary_tech_notes     TEXT,
  summary_mood           TEXT,
  summary_complexity     TEXT,
  summary_blockers       TEXT,
  summary_resolved       TEXT,
  summary_key_insight    TEXT,
  duration_seconds       INTEGER,
  embedding_summary      TEXT,
  total_turns     INTEGER DEFAULT 0,
  total_tool_calls INTEGER DEFAULT 0,
  files_touched   TEXT,
  tools_used      TEXT,
  estimated_tokens INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS observations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions(id),
  project_id  TEXT NOT NULL REFERENCES projects(id),
  event_type  TEXT NOT NULL,
  tool_name   TEXT,
  file_path   TEXT,
  content     TEXT,
  metadata    TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE VIRTUAL TABLE IF NOT EXISTS obs_fts USING fts5(
  content,
  event_type,
  session_id UNINDEXED,
  project_id UNINDEXED,
  tokenize = 'porter ascii'
);

CREATE TRIGGER IF NOT EXISTS obs_ai AFTER INSERT ON observations BEGIN
  INSERT INTO obs_fts(rowid, content, event_type, session_id, project_id)
  VALUES (new.id, new.content, new.event_type, new.session_id, new.project_id);
END;

CREATE TRIGGER IF NOT EXISTS obs_ad AFTER DELETE ON observations BEGIN
  DELETE FROM obs_fts WHERE rowid = old.id;
END;

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings VALUES ('context_sessions', '3');
INSERT OR IGNORE INTO settings VALUES ('api_key_set', 'false');
INSERT OR IGNORE INTO settings VALUES ('summaries_enabled', 'true');
`
