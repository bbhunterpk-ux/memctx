# Local Testing Setup - Knowledge Graph Feature

## Overview

This guide shows how to test the new knowledge graph features locally on port 3333 while your production memctx package continues running on port 9999.

## Quick Start

```bash
# 1. Create feature branch
git checkout -b feature/knowledge-graph

# 2. Make your changes (add graph features)

# 3. Build locally
pnpm run build

# 4. Run on port 3333 (production stays on 9999)
PORT=3333 node dist/src/index.js

# 5. Test at http://localhost:3333
# Production still works at http://localhost:9999
```

## Step-by-Step Implementation

### Phase 1: Database Schema (Day 1)

**1. Create migration file:**

```bash
touch artifacts/claudectx-backup/migrations/009_add_graph_tables.sql
```

**2. Add schema:**

```sql
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
```

### Phase 2: Basic Extractor (Day 2-3)

**1. Create extractor service:**

```bash
touch artifacts/claudectx-backup/src/services/graph-extractor.ts
```

**2. Add basic extraction logic:**

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
  metadata?: Record<string, any>;
}

interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
  weight?: number;
  metadata?: Record<string, any>;
}

interface ExtractionResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphExtractor {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async extractFromTranscript(
    sessionId: string,
    transcript: string
  ): Promise<ExtractionResult> {
    const prompt = `Extract a knowledge graph from this AI coding session transcript.

Identify:
1. Files mentioned (type: 'file')
2. Functions/classes discussed (type: 'function', 'class')
3. Concepts explained (type: 'concept')
4. Problems solved (type: 'problem')
5. Decisions made (type: 'decision')

For each entity, provide:
- id: unique identifier (e.g., "file:src/index.ts", "concept:authentication")
- label: human-readable name
- type: entity type
- confidence: EXTRACTED (explicitly mentioned), INFERRED (implied), or AMBIGUOUS (unclear)

Also identify relationships:
- imports: file A imports file B
- calls: function A calls function B
- implements: class A implements concept B
- solves: solution A solves problem B
- related_to: general relationship

Return JSON:
{
  "nodes": [{"id": "...", "label": "...", "type": "...", "confidence": "..."}],
  "edges": [{"sourceId": "...", "targetId": "...", "relationship": "...", "confidence": "..."}]
}

Transcript:
${transcript}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as ExtractionResult;

    // Add unique IDs to edges
    result.edges = result.edges.map((edge, idx) => ({
      ...edge,
      id: `${sessionId}_edge_${idx}`,
    }));

    return result;
  }
}
```

### Phase 3: Database Integration (Day 3-4)

**1. Create graph queries:**

```bash
touch artifacts/claudectx-backup/src/db/graph-queries.ts
```

**2. Add query functions:**

```typescript
import { db } from './index.js';
import { graphNodes, graphEdges } from './schema.js';
import { eq, and } from 'drizzle-orm';

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

export async function insertGraphNodes(
  projectId: string,
  nodes: Array<Omit<GraphNode, 'projectId' | 'createdAt'>>
): Promise<void> {
  const now = Date.now();
  await db.insert(graphNodes).values(
    nodes.map((node) => ({
      ...node,
      projectId,
      createdAt: now,
    }))
  );
}

export async function insertGraphEdges(
  projectId: string,
  edges: Array<Omit<GraphEdge, 'projectId' | 'createdAt'>>
): Promise<void> {
  const now = Date.now();
  await db.insert(graphEdges).values(
    edges.map((edge) => ({
      ...edge,
      projectId,
      createdAt: now,
    }))
  );
}

export async function getGraphForProject(projectId: string): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
}> {
  const nodes = await db
    .select()
    .from(graphNodes)
    .where(eq(graphNodes.projectId, projectId));

  const edges = await db
    .select()
    .from(graphEdges)
    .where(eq(graphEdges.projectId, projectId));

  return { nodes, edges };
}

export async function searchGraphNodes(
  projectId: string,
  query: string
): Promise<GraphNode[]> {
  const allNodes = await db
    .select()
    .from(graphNodes)
    .where(eq(graphNodes.projectId, projectId));

  // Simple text search (can be improved with FTS)
  return allNodes.filter(
    (node) =>
      node.label.toLowerCase().includes(query.toLowerCase()) ||
      node.type.toLowerCase().includes(query.toLowerCase())
  );
}

export async function deleteGraphForProject(projectId: string): Promise<void> {
  await db.delete(graphEdges).where(eq(graphEdges.projectId, projectId));
  await db.delete(graphNodes).where(eq(graphNodes.projectId, projectId));
}
```

**3. Update schema file:**

```bash
# Add to artifacts/claudectx-backup/src/db/schema.ts
```

```typescript
// Add these table definitions
export const graphNodes = sqliteTable('graph_nodes', {
  id: text('id').primaryKey(),
  projectId: text('projectId').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  type: text('type').notNull(),
  confidence: text('confidence').notNull(),
  metadata: text('metadata'),
  createdAt: integer('createdAt').notNull(),
});

export const graphEdges = sqliteTable('graph_edges', {
  id: text('id').primaryKey(),
  projectId: text('projectId').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sourceId: text('sourceId').notNull().references(() => graphNodes.id, { onDelete: 'cascade' }),
  targetId: text('targetId').notNull().references(() => graphNodes.id, { onDelete: 'cascade' }),
  relationship: text('relationship').notNull(),
  confidence: text('confidence').notNull(),
  weight: real('weight').default(1.0),
  metadata: text('metadata'),
  createdAt: integer('createdAt').notNull(),
});
```

### Phase 4: API Endpoints (Day 4-5)

**1. Create graph routes:**

```bash
touch artifacts/claudectx-backup/src/routes/graph.ts
```

**2. Add API endpoints:**

```typescript
import { Router } from 'express';
import { GraphExtractor } from '../services/graph-extractor.js';
import {
  getGraphForProject,
  insertGraphNodes,
  insertGraphEdges,
  searchGraphNodes,
  deleteGraphForProject,
} from '../db/graph-queries.js';
import { getSessionById } from '../db/queries.js';

const router = Router();

// GET /api/graph/:projectId - Get full graph for project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const graph = await getGraphForProject(projectId);
    res.json({ success: true, data: graph });
  } catch (error) {
    console.error('Error fetching graph:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch graph' });
  }
});

// POST /api/graph/:projectId/extract/:sessionId - Extract graph from session
router.post('/:projectId/extract/:sessionId', async (req, res) => {
  try {
    const { projectId, sessionId } = req.params;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'ANTHROPIC_API_KEY not configured',
      });
    }

    // Get session transcript
    const session = await getSessionById(sessionId);
    if (!session || session.projectId !== projectId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Extract graph
    const extractor = new GraphExtractor(apiKey);
    const result = await extractor.extractFromTranscript(
      sessionId,
      session.transcript || ''
    );

    // Save to database
    await insertGraphNodes(projectId, result.nodes);
    await insertGraphEdges(projectId, result.edges);

    res.json({
      success: true,
      data: {
        nodesAdded: result.nodes.length,
        edgesAdded: result.edges.length,
      },
    });
  } catch (error) {
    console.error('Error extracting graph:', error);
    res.status(500).json({ success: false, error: 'Failed to extract graph' });
  }
});

// GET /api/graph/:projectId/search?q=query - Search graph nodes
router.get('/:projectId/search', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    const nodes = await searchGraphNodes(projectId, q);
    res.json({ success: true, data: nodes });
  } catch (error) {
    console.error('Error searching graph:', error);
    res.status(500).json({ success: false, error: 'Failed to search graph' });
  }
});

// DELETE /api/graph/:projectId - Delete entire graph for project
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    await deleteGraphForProject(projectId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting graph:', error);
    res.status(500).json({ success: false, error: 'Failed to delete graph' });
  }
});

export default router;
```

**3. Register routes in main app:**

```typescript
// In artifacts/claudectx-backup/src/index.ts
import graphRoutes from './routes/graph.js';

// Add after other routes
app.use('/api/graph', graphRoutes);
```

### Phase 5: Frontend Visualization (Day 5-7)

**1. Install vis-network:**

```bash
cd artifacts/claudectx-backup/dashboard
pnpm add vis-network vis-data
pnpm add -D @types/vis-network
```

**2. Create graph viewer component:**

```bash
touch artifacts/claudectx-backup/dashboard/src/components/GraphViewer.tsx
```

**3. Add visualization component:**

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  confidence: string;
  metadata?: string;
}

interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  confidence: string;
  weight: number;
}

interface GraphViewerProps {
  projectId: string;
}

export function GraphViewer({ projectId }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    loadGraph();
  }, [projectId]);

  async function loadGraph() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/graph/${projectId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load graph');
      }

      const { nodes, edges } = result.data;
      setStats({ nodes: nodes.length, edges: edges.length });

      if (!containerRef.current) return;

      // Color mapping by node type
      const typeColors: Record<string, string> = {
        file: '#3b82f6',
        function: '#10b981',
        class: '#8b5cf6',
        concept: '#f59e0b',
        problem: '#ef4444',
        decision: '#06b6d4',
      };

      // Convert to vis-network format
      const visNodes = new DataSet(
        nodes.map((node: GraphNode) => ({
          id: node.id,
          label: node.label,
          title: `Type: ${node.type}\nConfidence: ${node.confidence}`,
          color: typeColors[node.type] || '#6b7280',
          shape: node.type === 'file' ? 'box' : 'dot',
          font: { color: '#ffffff' },
        }))
      );

      const visEdges = new DataSet(
        edges.map((edge: GraphEdge) => ({
          id: edge.id,
          from: edge.sourceId,
          to: edge.targetId,
          label: edge.relationship,
          arrows: 'to',
          width: edge.weight,
          color: {
            color: edge.confidence === 'EXTRACTED' ? '#10b981' : '#6b7280',
            opacity: edge.confidence === 'AMBIGUOUS' ? 0.3 : 0.7,
          },
        }))
      );

      // Network options
      const options = {
        nodes: {
          borderWidth: 2,
          borderWidthSelected: 4,
          size: 25,
        },
        edges: {
          smooth: {
            type: 'continuous',
          },
        },
        physics: {
          stabilization: {
            iterations: 200,
          },
          barnesHut: {
            gravitationalConstant: -8000,
            springConstant: 0.04,
            springLength: 95,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
        },
      };

      // Create network
      networkRef.current = new Network(
        containerRef.current,
        { nodes: visNodes, edges: visEdges },
        options
      );

      // Add click handler
      networkRef.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          console.log('Clicked node:', nodeId);
          // TODO: Show node details in sidebar
        }
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading graph:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  async function extractGraph() {
    try {
      setLoading(true);
      // TODO: Get session ID from UI
      const sessionId = 'latest'; // placeholder
      
      const response = await fetch(
        `/api/graph/${projectId}/extract/${sessionId}`,
        { method: 'POST' }
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to extract graph');
      }

      // Reload graph
      await loadGraph();
    } catch (err) {
      console.error('Error extracting graph:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-red-400">Error: {error}</div>
        <button
          onClick={loadGraph}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex gap-4 text-sm text-gray-400">
          <span>{stats.nodes} nodes</span>
          <span>{stats.edges} edges</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={extractGraph}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Extract from Session
          </button>
          <button
            onClick={loadGraph}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 bg-gray-900" />
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            File
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Function
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            Class
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            Concept
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Problem
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
            Decision
          </span>
        </div>
      </div>
    </div>
  );
}
```

**4. Add graph page to router:**

```typescript
// In artifacts/claudectx-backup/dashboard/src/App.tsx
import { GraphViewer } from './components/GraphViewer';

// Add route
<Route path="/graph/:projectId" element={<GraphViewer projectId={projectId} />} />
```

**5. Add navigation link:**

```typescript
// In your navigation component
<Link to={`/graph/${projectId}`}>
  Knowledge Graph
</Link>
```

## Testing Workflow

### 1. Start Development Server

```bash
# Terminal 1: Build and run on port 3333
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context
git checkout -b feature/knowledge-graph
pnpm run build
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js
```

### 2. Verify Both Servers Running

```bash
# Production (installed package)
curl http://localhost:9999/api/health
# Should return: {"status":"ok"}

# Development (local build)
curl http://localhost:3333/api/health
# Should return: {"status":"ok"}
```

### 3. Test Graph Extraction

```bash
# Get a session ID from your project
curl http://localhost:3333/api/sessions?projectId=YOUR_PROJECT_ID

# Extract graph from session
curl -X POST http://localhost:3333/api/graph/YOUR_PROJECT_ID/extract/SESSION_ID

# View graph
curl http://localhost:3333/api/graph/YOUR_PROJECT_ID
```

### 4. Test in Browser

1. Open production: http://localhost:9999
2. Open development: http://localhost:3333
3. Navigate to graph page: http://localhost:3333/graph/YOUR_PROJECT_ID
4. Click "Extract from Session" button
5. Verify graph visualization appears

### 5. Iterate and Test

```bash
# Make changes to code
# Rebuild
pnpm run build

# Restart dev server (Ctrl+C then)
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js

# Test again
```

## Common Issues

### Port Already in Use

```bash
# Find process using port 3333
lsof -i :3333

# Kill it
kill -9 <PID>
```

### Database Migration Not Applied

```bash
# Check if migration ran
sqlite3 /tmp/memctx.db "SELECT name FROM sqlite_master WHERE type='table' AND name='graph_nodes';"

# If empty, manually run migration
sqlite3 /tmp/memctx.db < artifacts/claudectx-backup/migrations/009_add_graph_tables.sql
```

### ANTHROPIC_API_KEY Not Set

```bash
# Set for current session
export ANTHROPIC_API_KEY=sk-ant-...

# Or pass inline
ANTHROPIC_API_KEY=sk-ant-... PORT=3333 node artifacts/claudectx-backup/dist/src/index.js
```

### Build Errors

```bash
# Clean and rebuild
rm -rf artifacts/claudectx-backup/dist
pnpm run build

# Check for TypeScript errors
cd artifacts/claudectx-backup
pnpm run type-check
```

## When Ready to Publish

### 1. Merge to Main

```bash
# Ensure all tests pass
pnpm test

# Commit all changes
git add .
git commit -m "feat: add knowledge graph visualization"

# Switch to main and merge
git checkout main
git merge feature/knowledge-graph

# Push to GitHub
git push origin main
```

### 2. Bump Version

```bash
# In artifacts/claudectx-backup/package.json
# Change version: "1.0.7" -> "1.0.8"

# Commit version bump
git add artifacts/claudectx-backup/package.json
git commit -m "chore: bump version to 1.0.8"
```

### 3. Build and Publish

```bash
# Build production
pnpm run build

# Publish to npm
cd artifacts/claudectx-backup
npm publish
```

### 4. Install New Version

```bash
# Uninstall old version
npm uninstall -g memctx

# Install new version
npm install -g memctx@1.0.8

# Verify
memctx --version
# Should show: 1.0.8

# Start on port 9999 (default)
memctx
```

## Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 1 day | Database schema, migration |
| Phase 2 | 2 days | Graph extractor service |
| Phase 3 | 2 days | Database integration, queries |
| Phase 4 | 2 days | API endpoints |
| Phase 5 | 3 days | Frontend visualization |
| Testing | 2 days | Local testing, bug fixes |
| **Total** | **12 days** | **Complete feature** |

## Next Steps

1. Create feature branch: `git checkout -b feature/knowledge-graph`
2. Add database migration (Phase 1)
3. Implement graph extractor (Phase 2)
4. Test extraction on port 3333
5. Add visualization (Phase 5)
6. Test full workflow
7. Merge and publish when ready

## Questions?

- Production stays on 9999 (installed package)
- Development runs on 3333 (local build)
- No feature flags needed - just different ports
- Test everything locally before npm publish
- Merge to main only when fully tested
