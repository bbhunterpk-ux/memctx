-- Migration 011: Add session_id to graph tables for provenance tracking

ALTER TABLE graph_nodes ADD COLUMN session_id TEXT;
ALTER TABLE graph_edges ADD COLUMN session_id TEXT;

-- Index for querying by session
CREATE INDEX idx_graph_nodes_session ON graph_nodes(session_id);
CREATE INDEX idx_graph_edges_session ON graph_edges(session_id);
