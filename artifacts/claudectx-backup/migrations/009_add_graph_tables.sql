-- Graph nodes table
CREATE TABLE IF NOT EXISTS graph_nodes (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL, -- 'file', 'function', 'class', 'concept', etc.
  confidence TEXT NOT NULL, -- 'EXTRACTED', 'INFERRED', 'AMBIGUOUS'
  metadata TEXT, -- JSON: {source_location, description, etc.}
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

-- Graph edges table
CREATE TABLE IF NOT EXISTS graph_edges (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  sourceId TEXT NOT NULL,
  targetId TEXT NOT NULL,
  relationship TEXT NOT NULL, -- 'imports', 'calls', 'extends', 'related_to', etc.
  confidence TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  metadata TEXT, -- JSON: {line_number, context, etc.}
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (sourceId) REFERENCES graph_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (targetId) REFERENCES graph_nodes(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_graph_nodes_project ON graph_nodes(projectId);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_project ON graph_edges(projectId);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(sourceId);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(targetId);
