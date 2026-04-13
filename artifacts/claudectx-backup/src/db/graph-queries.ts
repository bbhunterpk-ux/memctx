import { getDB } from './client';

export interface GraphNode {
  id: string;
  projectId: string;
  label: string;
  type: string;
  confidence: string;
  metadata: string | null;
  createdAt: number;
}

export interface GraphEdge {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  confidence: string;
  weight: number;
  metadata: string | null;
  createdAt: number;
}

export function insertGraphNodes(
  projectId: string,
  nodes: Array<Omit<GraphNode, 'projectId' | 'createdAt'>>
): void {
  const db = getDB();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO graph_nodes (id, projectId, label, type, confidence, metadata, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((nodes) => {
    for (const node of nodes) {
      stmt.run(
        node.id,
        projectId,
        node.label,
        node.type,
        node.confidence,
        node.metadata || null,
        now
      );
    }
  });

  insertMany(nodes);
}

export function insertGraphEdges(
  projectId: string,
  edges: Array<Omit<GraphEdge, 'projectId' | 'createdAt'>>
): void {
  const db = getDB();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO graph_edges (id, projectId, sourceId, targetId, relationship, confidence, weight, metadata, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((edges) => {
    for (const edge of edges) {
      stmt.run(
        edge.id,
        projectId,
        edge.sourceId,
        edge.targetId,
        edge.relationship,
        edge.confidence,
        edge.weight || 1.0,
        edge.metadata || null,
        now
      );
    }
  });

  insertMany(edges);
}

export function getGraphForProject(projectId: string): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const db = getDB();

  const nodes = db
    .prepare('SELECT * FROM graph_nodes WHERE projectId = ?')
    .all(projectId) as GraphNode[];

  const edges = db
    .prepare('SELECT * FROM graph_edges WHERE projectId = ?')
    .all(projectId) as GraphEdge[];

  return { nodes, edges };
}

export function searchGraphNodes(
  projectId: string,
  query: string
): GraphNode[] {
  const db = getDB();
  const lowerQuery = query.toLowerCase();

  const allNodes = db
    .prepare('SELECT * FROM graph_nodes WHERE projectId = ?')
    .all(projectId) as GraphNode[];

  // Simple text search (can be improved with FTS)
  return allNodes.filter(
    (node) =>
      node.label.toLowerCase().includes(lowerQuery) ||
      node.type.toLowerCase().includes(lowerQuery)
  );
}

export function deleteGraphForProject(projectId: string): void {
  const db = getDB();

  const deleteTransaction = db.transaction(() => {
    db.prepare('DELETE FROM graph_edges WHERE projectId = ?').run(projectId);
    db.prepare('DELETE FROM graph_nodes WHERE projectId = ?').run(projectId);
  });

  deleteTransaction();
}
