-- Migration 010: Normalize graph edges with content-hash IDs and unique constraint
-- Strategy: Clean slate - wipe existing graph data, recreate with new schema

-- Drop existing graph tables (if they exist)
DROP TABLE IF EXISTS graph_edges;
DROP TABLE IF EXISTS graph_nodes;

-- Recreate graph_nodes with same schema
CREATE TABLE graph_nodes (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  confidence TEXT NOT NULL,
  metadata TEXT,
  createdAt INTEGER NOT NULL
);

-- Recreate graph_edges with new unique constraint
CREATE TABLE graph_edges (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  sourceId TEXT NOT NULL,
  targetId TEXT NOT NULL,
  relationship TEXT NOT NULL,
  confidence TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  metadata TEXT,
  createdAt INTEGER NOT NULL,
  UNIQUE(projectId, sourceId, targetId, relationship)
);

-- Indexes for performance
CREATE INDEX idx_graph_nodes_project ON graph_nodes(projectId);
CREATE INDEX idx_graph_nodes_type ON graph_nodes(projectId, type);
CREATE INDEX idx_graph_edges_project ON graph_edges(projectId);
CREATE INDEX idx_graph_edges_source ON graph_edges(sourceId);
CREATE INDEX idx_graph_edges_target ON graph_edges(targetId);
