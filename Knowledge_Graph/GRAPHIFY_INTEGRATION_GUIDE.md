# Graphify Integration Guide

Building a Knowledge Graph System for Your Application

---

**Document Status:** In Progress
**Created:** 2026-04-13
**Target Application:** MemCTX / ClaudeContext

---

## Table of Contents

1. [What is Graphify?](#what-is-graphify)
2. [Core Concepts](#core-concepts)
3. [Architecture Overview](#architecture-overview)
4. [Integration Strategy](#integration-strategy)
5. [Implementation Phases](#implementation-phases)
6. [Technical Stack](#technical-stack)
7. [Database Schema](#database-schema)
8. [API Design](#api-design)
9. [Frontend Components](#frontend-components)
10. [Security Considerations](#security-considerations)

---


## 1. What is Graphify?

**Graphify** is an AI coding assistant skill that transforms any folder of files (code, docs, papers, images, videos) into a navigable knowledge graph with:

### Key Features

- **Multi-modal Input**: Code (23 languages), markdown, PDFs, images, videos, audio
- **Persistent Knowledge Graph**: Relationships stored in JSON, queryable across sessions
- **Community Detection**: Leiden algorithm finds clusters of related concepts
- **Honest Audit Trail**: Every edge tagged as EXTRACTED, INFERRED, or AMBIGUOUS
- **71.5x Token Reduction**: Query the graph instead of reading raw files
- **Interactive Visualization**: HTML graph with search, filtering, community highlighting

### What Makes It Powerful

1. **AST-based Code Extraction** (no LLM needed for structure)
   - Classes, functions, imports, call graphs
   - Docstrings and rationale comments
   - Zero-cost re-runs on unchanged files (SHA256 cache)

2. **Semantic Extraction** (Claude/GPT for docs/images)
   - Concepts and relationships from documentation
   - Design rationale from papers
   - Visual diagrams and screenshots

3. **Cross-Document Connections**
   - Finds surprising links between unrelated files
   - Semantic similarity edges (no embeddings needed)
   - Hyperedges for multi-node relationships

### Use Cases

- **Codebase Understanding**: New developers understand architecture in minutes
- **Research Corpus**: Papers + notes + code → one queryable graph
- **Session Memory**: Your use case - connect Claude sessions into knowledge graph
- **Documentation**: Auto-generate architecture docs from code + comments

---


## 2. Core Concepts

### 2.1 Knowledge Graph Structure

A knowledge graph consists of:

**Nodes** - Entities/concepts with attributes:
```json
{
  "id": "unique_identifier",
  "label": "Human-readable name",
  "type": "function|class|concept|document",
  "source_file": "path/to/file.py",
  "source_location": "L42",
  "community": 3
}
```

**Edges** - Relationships between nodes:
```json
{
  "source": "node_a_id",
  "target": "node_b_id",
  "relation": "calls|imports|uses|semantically_similar_to",
  "confidence": "EXTRACTED|INFERRED|AMBIGUOUS",
  "confidence_score": 0.85,
  "weight": 1.0
}
```

**Hyperedges** - Multi-node relationships:
```json
{
  "nodes": ["auth_module", "database", "session_manager"],
  "relation": "authentication_flow",
  "description": "Complete auth pipeline"
}
```

### 2.2 Confidence Levels

| Level | Meaning | Example |
|-------|---------|---------|
| **EXTRACTED** | Found directly in source | `import requests` → imports edge |
| **INFERRED** | Reasonable deduction | Function calls same variable → related |
| **AMBIGUOUS** | Uncertain, needs review | Similar names, unclear relationship |

### 2.3 Community Detection

Uses **Leiden algorithm** (graph topology, not embeddings):
- Groups densely connected nodes
- Finds architectural modules
- Reveals hidden structure
- No vector database needed

### 2.4 Three-Pass Pipeline

```
Pass 1: AST Extraction (deterministic, no LLM)
  ↓
Pass 2: Transcription (Whisper for audio/video)
  ↓
Pass 3: Semantic Extraction (Claude for docs/images)
  ↓
Merge → Cluster → Analyze → Export
```

---


## 3. Architecture Overview

### 3.1 Graphify's Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Input Layer                              │
│  Code │ Docs │ PDFs │ Images │ Videos │ Audio │ URLs        │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼──────┐
    │   AST    │          │  Semantic  │
    │ Extract  │          │  Extract   │
    │(tree-    │          │  (Claude/  │
    │ sitter)  │          │   GPT)     │
    └────┬─────┘          └─────┬──────┘
         │                      │
         └──────────┬───────────┘
                    │
              ┌─────▼──────┐
              │   Cache    │
              │  (SHA256)  │
              └─────┬──────┘
                    │
              ┌─────▼──────┐
              │   Build    │
              │   Graph    │
              │ (NetworkX) │
              └─────┬──────┘
                    │
              ┌─────▼──────┐
              │  Cluster   │
              │  (Leiden)  │
              └─────┬──────┘
                    │
              ┌─────▼──────┐
              │  Analyze   │
              │ (God nodes,│
              │ surprises) │
              └─────┬──────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐        ┌─────▼──────┐
    │  Report  │        │   Export   │
    │   .md    │        │ JSON│HTML  │
    └──────────┘        │ SVG │Neo4j │
                        └────────────┘
```

### 3.2 Module Responsibilities

| Module | Function | Input → Output |
|--------|----------|----------------|
| `detect.py` | File discovery | directory → filtered file list |
| `extract.py` | Content extraction | file → {nodes, edges} |
| `cache.py` | SHA256 caching | files → (cached, new) split |
| `build.py` | Graph assembly | extractions → NetworkX graph |
| `cluster.py` | Community detection | graph → graph with communities |
| `analyze.py` | Pattern finding | graph → god nodes, surprises |
| `report.py` | Report generation | graph → GRAPH_REPORT.md |
| `export.py` | Multi-format export | graph → JSON/HTML/SVG/Neo4j |
| `serve.py` | MCP server | graph → stdio API |
| `watch.py` | File watching | directory → auto-rebuild |

---


## 4. Integration Strategy for MemCTX

### 4.1 Why Integrate Knowledge Graphs?

Your current MemCTX system tracks **sessions linearly**. Adding knowledge graphs enables:

1. **Cross-Session Connections**: Link related concepts across different sessions
2. **Concept Evolution**: Track how ideas develop over time
3. **Automatic Documentation**: Generate architecture docs from session history
4. **Smart Search**: Query by concept, not just keywords
5. **Context Compression**: 71x fewer tokens when querying past work

### 4.2 Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    MemCTX Current                            │
│                                                              │
│  Session → Transcript → Summary → Database                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ ADD GRAPH LAYER
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  MemCTX + Knowledge Graph                    │
│                                                              │
│  Session → Transcript → Summary → Database                  │
│              │                        │                      │
│              └────► Extract ──────────┤                      │
│                       │               │                      │
│                       ▼               ▼                      │
│                   Graph Build    Store Graph                 │
│                       │               │                      │
│                       ▼               ▼                      │
│                   Cluster        Query API                   │
│                       │               │                      │
│                       ▼               ▼                      │
│                   Analyze       Dashboard UI                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 What to Extract from Sessions

**From Transcripts:**
- Tool calls (Read, Write, Edit, Bash commands)
- File paths mentioned
- Concepts discussed
- Problems solved
- Decisions made

**From Summaries:**
- Key accomplishments
- Technologies used
- Architectural decisions
- Blockers encountered
- Next steps

**From Code Changes:**
- Files modified
- Functions added/changed
- Dependencies introduced
- Patterns used

### 4.4 Graph Schema for Sessions

**Node Types:**
```typescript
type SessionNode = {
  id: string
  label: string
  type: 'session' | 'concept' | 'file' | 'tool' | 'decision'
  session_id?: string
  timestamp: number
  project_id: string
  community?: number
}
```

**Edge Types:**
```typescript
type SessionEdge = {
  source: string
  target: string
  relation: 'discusses' | 'modifies' | 'uses' | 'leads_to' | 'blocks'
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS'
  weight: number
  timestamp: number
}
```

---


## 5. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic graph extraction from existing sessions

**Tasks:**
1. Install dependencies
   ```bash
   npm install networkx-js d3 vis-network
   pip install networkx graspologic
   ```

2. Create graph database schema
   ```sql
   CREATE TABLE graph_nodes (
     id TEXT PRIMARY KEY,
     label TEXT NOT NULL,
     type TEXT NOT NULL,
     session_id TEXT,
     project_id TEXT NOT NULL,
     metadata JSON,
     created_at INTEGER NOT NULL,
     FOREIGN KEY (session_id) REFERENCES sessions(id),
     FOREIGN KEY (project_id) REFERENCES projects(id)
   );

   CREATE TABLE graph_edges (
     id TEXT PRIMARY KEY,
     source_id TEXT NOT NULL,
     target_id TEXT NOT NULL,
     relation TEXT NOT NULL,
     confidence TEXT NOT NULL,
     weight REAL DEFAULT 1.0,
     metadata JSON,
     created_at INTEGER NOT NULL,
     FOREIGN KEY (source_id) REFERENCES graph_nodes(id),
     FOREIGN KEY (target_id) REFERENCES graph_nodes(id)
   );

   CREATE INDEX idx_edges_source ON graph_edges(source_id);
   CREATE INDEX idx_edges_target ON graph_edges(target_id);
   CREATE INDEX idx_nodes_session ON graph_nodes(session_id);
   CREATE INDEX idx_nodes_project ON graph_nodes(project_id);
   ```

3. Build extraction service
   ```typescript
   // src/services/graph-extractor.ts
   export class GraphExtractor {
     extractFromTranscript(transcript: string): {nodes: Node[], edges: Edge[]}
     extractFromSummary(summary: string): {nodes: Node[], edges: Edge[]}
     extractFromToolCalls(toolCalls: ToolCall[]): {nodes: Node[], edges: Edge[]}
   }
   ```

**Deliverables:**
- Database schema migrated
- Basic extraction working
- Nodes/edges stored in SQLite

---

### Phase 2: Graph Building (Week 3-4)

**Goal**: Build and cluster the knowledge graph

**Tasks:**
1. Implement graph builder
   ```typescript
   // src/services/graph-builder.ts
   export class GraphBuilder {
     buildGraph(nodes: Node[], edges: Edge[]): Graph
     mergeGraphs(graphs: Graph[]): Graph
     deduplicateNodes(graph: Graph): Graph
   }
   ```

2. Add community detection
   ```python
   # scripts/cluster_graph.py
   import networkx as nx
   from graspologic.partition import leiden

   def cluster_graph(graph_json):
       G = nx.node_link_graph(graph_json)
       communities = leiden(G)
       return communities
   ```

3. Create graph API endpoints
   ```typescript
   // src/api/graph.ts
   router.get('/api/graph/:projectId', getProjectGraph)
   router.get('/api/graph/:projectId/query', queryGraph)
   router.get('/api/graph/:projectId/path', findPath)
   router.get('/api/graph/:projectId/node/:nodeId', getNode)
   router.post('/api/graph/:projectId/rebuild', rebuildGraph)
   ```

**Deliverables:**
- Graph building pipeline
- Community detection working
- REST API for graph queries

---

### Phase 3: Visualization (Week 5-6)

**Goal**: Interactive graph visualization in dashboard

**Tasks:**
1. Create graph visualization component
   ```typescript
   // dashboard/src/components/GraphView.tsx
   export function GraphView({ projectId }: { projectId: string }) {
     // Use vis-network or d3-force for rendering
     // Click nodes to see details
     // Filter by community
     // Search nodes
   }
   ```

2. Add graph page to dashboard
   ```typescript
   // dashboard/src/pages/GraphPage.tsx
   - Left sidebar: Community list, filters
   - Center: Interactive graph canvas
   - Right sidebar: Selected node details
   ```

3. Implement graph queries UI
   ```typescript
   // dashboard/src/components/GraphQuery.tsx
   - Natural language query input
   - BFS/DFS toggle
   - Token budget slider
   - Results display with paths highlighted
   ```

**Deliverables:**
- Interactive graph visualization
- Graph query interface
- Community filtering

---

### Phase 4: Auto-Extraction (Week 7-8)

**Goal**: Automatic graph updates on session close

**Tasks:**
1. Hook into session lifecycle
   ```typescript
   // src/services/session-graph-sync.ts
   export class SessionGraphSync {
     async onSessionEnd(sessionId: string) {
       const transcript = await readTranscript(sessionId)
       const summary = await getSummary(sessionId)
       
       const extraction = await graphExtractor.extract({
         transcript,
         summary,
         sessionId
       })
       
       await graphBuilder.addToGraph(extraction)
       await clusterGraph(projectId)
     }
   }
   ```

2. Add background worker
   ```typescript
   // src/services/graph-worker.ts
   export class GraphWorker {
     async processQueue() {
       // Process pending graph updates
       // Rebuild communities periodically
       // Clean up orphaned nodes
     }
   }
   ```

3. Implement incremental updates
   ```typescript
   // Only re-cluster when significant changes
   if (newNodesCount > threshold) {
     await recluster()
   }
   ```

**Deliverables:**
- Automatic extraction on session end
- Background graph maintenance
- Incremental updates

---


## 6. Technical Stack

### 6.1 Backend Stack

**Core Libraries:**
```json
{
  "dependencies": {
    "networkx": "^3.2",           // Python graph library
    "graspologic": "^3.3.0",      // Leiden clustering
    "better-sqlite3": "^12.8.0",  // Already using
    "express": "^5.2.1",          // Already using
    "@anthropic-ai/sdk": "^0.82.0" // Already using
  }
}
```

**Python Bridge** (for clustering):
```typescript
// src/services/python-bridge.ts
import { spawn } from 'child_process'

export async function runPythonScript(
  script: string, 
  args: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [script, ...args])
    let output = ''
    python.stdout.on('data', (data) => output += data)
    python.on('close', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`Python script failed: ${code}`))
    })
  })
}
```

### 6.2 Frontend Stack

**Visualization Libraries:**
```json
{
  "dependencies": {
    "vis-network": "^9.1.9",      // Interactive graph rendering
    "d3": "^7.9.0",                // Data visualization
    "cytoscape": "^3.28.1",        // Alternative graph library
    "@tanstack/react-query": "^5.0.0" // Already using
  }
}
```

**Graph Component Example:**
```typescript
import { Network } from 'vis-network'

export function GraphCanvas({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const network = new Network(
      containerRef.current,
      {
        nodes: data.nodes.map(n => ({
          id: n.id,
          label: n.label,
          color: getCommunityColor(n.community),
          title: n.metadata
        })),
        edges: data.edges.map(e => ({
          from: e.source,
          to: e.target,
          label: e.relation,
          color: getConfidenceColor(e.confidence)
        }))
      },
      {
        physics: {
          stabilization: true,
          barnesHut: { gravitationalConstant: -2000 }
        }
      }
    )
    
    return () => network.destroy()
  }, [data])
  
  return <div ref={containerRef} style={{ height: '100%' }} />
}
```

### 6.3 Database Schema (SQLite)

**Complete Schema:**
```sql
-- Nodes table
CREATE TABLE graph_nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('session', 'concept', 'file', 'tool', 'decision', 'technology')),
  session_id TEXT,
  project_id TEXT NOT NULL,
  community INTEGER,
  degree INTEGER DEFAULT 0,
  metadata JSON,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Edges table
CREATE TABLE graph_edges (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK(confidence IN ('EXTRACTED', 'INFERRED', 'AMBIGUOUS')),
  confidence_score REAL DEFAULT 1.0,
  weight REAL DEFAULT 1.0,
  metadata JSON,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (source_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES graph_nodes(id) ON DELETE CASCADE
);

-- Communities table
CREATE TABLE graph_communities (
  id INTEGER PRIMARY KEY,
  project_id TEXT NOT NULL,
  label TEXT,
  description TEXT,
  node_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Hyperedges table (optional, for multi-node relationships)
CREATE TABLE graph_hyperedges (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  description TEXT,
  node_ids JSON NOT NULL, -- Array of node IDs
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_nodes_project ON graph_nodes(project_id);
CREATE INDEX idx_nodes_session ON graph_nodes(session_id);
CREATE INDEX idx_nodes_community ON graph_nodes(community);
CREATE INDEX idx_nodes_type ON graph_nodes(type);
CREATE INDEX idx_edges_source ON graph_edges(source_id);
CREATE INDEX idx_edges_target ON graph_edges(target_id);
CREATE INDEX idx_edges_relation ON graph_edges(relation);
CREATE INDEX idx_communities_project ON graph_communities(project_id);
```

---


## 7. API Design

### 7.1 Graph Endpoints

**Get Project Graph**
```typescript
GET /api/graph/:projectId

Response:
{
  "nodes": [
    {
      "id": "session_abc123",
      "label": "Fixed authentication bug",
      "type": "session",
      "community": 2,
      "degree": 5,
      "metadata": {
        "timestamp": 1713012532,
        "duration": 3600
      }
    }
  ],
  "edges": [
    {
      "source": "session_abc123",
      "target": "file_auth_ts",
      "relation": "modifies",
      "confidence": "EXTRACTED",
      "weight": 1.0
    }
  ],
  "communities": [
    {
      "id": 0,
      "label": "Authentication System",
      "nodeCount": 12
    }
  ],
  "stats": {
    "totalNodes": 156,
    "totalEdges": 423,
    "communities": 8,
    "godNodes": ["auth_module", "database", "api_client"]
  }
}
```

**Query Graph**
```typescript
POST /api/graph/:projectId/query

Request:
{
  "query": "what connects authentication to database?",
  "mode": "bfs" | "dfs",
  "budget": 1500,  // max tokens
  "filters": {
    "nodeTypes": ["session", "file"],
    "communities": [0, 2],
    "dateRange": {
      "start": 1713000000,
      "end": 1713100000
    }
  }
}

Response:
{
  "paths": [
    {
      "nodes": ["auth_module", "session_manager", "database"],
      "edges": [
        { "relation": "uses", "confidence": "EXTRACTED" },
        { "relation": "queries", "confidence": "EXTRACTED" }
      ],
      "explanation": "Authentication module uses session manager which queries the database for user credentials"
    }
  ],
  "subgraph": {
    "nodes": [...],
    "edges": [...]
  },
  "tokenCount": 847
}
```

**Find Shortest Path**
```typescript
GET /api/graph/:projectId/path?from=node_a&to=node_b

Response:
{
  "path": ["node_a", "intermediate", "node_b"],
  "edges": [
    { "relation": "calls", "confidence": "EXTRACTED" },
    { "relation": "imports", "confidence": "EXTRACTED" }
  ],
  "length": 2,
  "explanation": "node_a calls intermediate which imports node_b"
}
```

**Get Node Details**
```typescript
GET /api/graph/:projectId/node/:nodeId

Response:
{
  "node": {
    "id": "session_abc123",
    "label": "Fixed authentication bug",
    "type": "session",
    "community": 2,
    "degree": 5
  },
  "neighbors": [
    {
      "id": "file_auth_ts",
      "label": "auth.ts",
      "relation": "modifies",
      "confidence": "EXTRACTED"
    }
  ],
  "sessions": [
    {
      "id": "abc123",
      "title": "Fixed authentication bug",
      "timestamp": 1713012532
    }
  ]
}
```

**Rebuild Graph**
```typescript
POST /api/graph/:projectId/rebuild

Request:
{
  "mode": "full" | "incremental",
  "sessionIds": ["abc123", "def456"]  // optional, for incremental
}

Response:
{
  "status": "processing",
  "jobId": "rebuild_xyz789",
  "estimatedTime": 120  // seconds
}

// Check status
GET /api/graph/jobs/:jobId

Response:
{
  "status": "completed" | "processing" | "failed",
  "progress": 85,
  "result": {
    "nodesAdded": 23,
    "edgesAdded": 67,
    "communitiesFound": 3
  }
}
```

### 7.2 Database Queries

**Get Graph Data:**
```typescript
// src/db/graph-queries.ts

export const graphQueries = {
  // Get all nodes for a project
  getProjectNodes(projectId: string) {
    return db.prepare(`
      SELECT * FROM graph_nodes 
      WHERE project_id = ? 
      ORDER BY degree DESC
    `).all(projectId)
  },

  // Get edges between nodes
  getEdges(nodeIds: string[]) {
    return db.prepare(`
      SELECT * FROM graph_edges 
      WHERE source_id IN (${nodeIds.map(() => '?').join(',')})
         OR target_id IN (${nodeIds.map(() => '?').join(',')})
    `).all(...nodeIds, ...nodeIds)
  },

  // Get neighbors of a node
  getNeighbors(nodeId: string) {
    return db.prepare(`
      SELECT n.*, e.relation, e.confidence
      FROM graph_nodes n
      JOIN graph_edges e ON (e.source_id = ? AND e.target_id = n.id)
                         OR (e.target_id = ? AND e.source_id = n.id)
    `).all(nodeId, nodeId)
  },

  // Get god nodes (highest degree)
  getGodNodes(projectId: string, limit: number = 10) {
    return db.prepare(`
      SELECT * FROM graph_nodes 
      WHERE project_id = ? 
      ORDER BY degree DESC 
      LIMIT ?
    `).all(projectId, limit)
  },

  // Get community nodes
  getCommunityNodes(projectId: string, communityId: number) {
    return db.prepare(`
      SELECT * FROM graph_nodes 
      WHERE project_id = ? AND community = ?
    `).all(projectId, communityId)
  },

  // Insert node
  insertNode(node: GraphNode) {
    return db.prepare(`
      INSERT INTO graph_nodes (id, label, type, session_id, project_id, community, degree, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      node.id, node.label, node.type, node.session_id, 
      node.project_id, node.community, node.degree, 
      JSON.stringify(node.metadata), node.created_at, node.updated_at
    )
  },

  // Insert edge
  insertEdge(edge: GraphEdge) {
    return db.prepare(`
      INSERT INTO graph_edges (id, source_id, target_id, relation, confidence, confidence_score, weight, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      edge.id, edge.source_id, edge.target_id, edge.relation,
      edge.confidence, edge.confidence_score, edge.weight,
      JSON.stringify(edge.metadata), edge.created_at
    )
  },

  // Update node degree
  updateNodeDegree(nodeId: string) {
    return db.prepare(`
      UPDATE graph_nodes 
      SET degree = (
        SELECT COUNT(*) FROM graph_edges 
        WHERE source_id = ? OR target_id = ?
      )
      WHERE id = ?
    `).run(nodeId, nodeId, nodeId)
  }
}
```

---


## 8. Frontend Components

### 8.1 Graph Visualization Component

**GraphView.tsx** - Main graph canvas
```typescript
// dashboard/src/components/GraphView.tsx
import { useEffect, useRef, useState } from 'react'
import { Network } from 'vis-network'
import type { GraphData, GraphNode, GraphEdge } from '../types/graph'

interface GraphViewProps {
  projectId: string
  filters?: {
    nodeTypes?: string[]
    communities?: number[]
    dateRange?: { start: number; end: number }
  }
  onNodeClick?: (node: GraphNode) => void
  onEdgeClick?: (edge: GraphEdge) => void
}

export function GraphView({ projectId, filters, onNodeClick, onEdgeClick }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    // Fetch graph data
    fetch(`/api/graph/${projectId}`)
      .then(res => res.json())
      .then((data: GraphData) => {
        const nodes = data.nodes.map(n => ({
          id: n.id,
          label: n.label,
          color: getCommunityColor(n.community),
          size: Math.log(n.degree + 1) * 10,
          title: `${n.label}\nType: ${n.type}\nDegree: ${n.degree}`,
          font: { size: 14 }
        }))

        const edges = data.edges.map(e => ({
          from: e.source,
          to: e.target,
          label: e.relation,
          color: getConfidenceColor(e.confidence),
          width: e.weight,
          arrows: 'to',
          title: `${e.relation} (${e.confidence})`
        }))

        const network = new Network(
          containerRef.current!,
          { nodes, edges },
          {
            physics: {
              stabilization: { iterations: 200 },
              barnesHut: {
                gravitationalConstant: -2000,
                springLength: 200,
                springConstant: 0.05
              }
            },
            interaction: {
              hover: true,
              tooltipDelay: 100
            }
          }
        )

        network.on('click', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0]
            const node = data.nodes.find(n => n.id === nodeId)
            if (node && onNodeClick) onNodeClick(node)
          }
          if (params.edges.length > 0) {
            const edgeId = params.edges[0]
            const edge = data.edges.find(e => e.id === edgeId)
            if (edge && onEdgeClick) onEdgeClick(edge)
          }
        })

        networkRef.current = network
        setLoading(false)
      })

    return () => {
      networkRef.current?.destroy()
    }
  }, [projectId, filters])

  return (
    <div className="graph-view">
      {loading && <div className="loading">Loading graph...</div>}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

function getCommunityColor(community?: number): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ]
  return community !== undefined ? colors[community % colors.length] : '#999'
}

function getConfidenceColor(confidence: string): string {
  switch (confidence) {
    case 'EXTRACTED': return '#2ECC71'
    case 'INFERRED': return '#F39C12'
    case 'AMBIGUOUS': return '#E74C3C'
    default: return '#95A5A6'
  }
}
```

### 8.2 Graph Query Component

**GraphQuery.tsx** - Natural language queries
```typescript
// dashboard/src/components/GraphQuery.tsx
import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

interface GraphQueryProps {
  projectId: string
  onResult: (result: QueryResult) => void
}

export function GraphQuery({ projectId, onResult }: GraphQueryProps) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'bfs' | 'dfs'>('bfs')
  const [budget, setBudget] = useState(1500)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/graph/${projectId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode, budget })
      })
      const result = await res.json()
      onResult(result)
    } catch (error) {
      console.error('Query failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="graph-query">
      <form onSubmit={handleSubmit}>
        <div className="query-input">
          <Search size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about connections... (e.g., 'what connects auth to database?')"
            disabled={loading}
          />
        </div>

        <div className="query-options">
          <label>
            <input
              type="radio"
              value="bfs"
              checked={mode === 'bfs'}
              onChange={(e) => setMode(e.target.value as 'bfs')}
            />
            BFS (broad context)
          </label>
          <label>
            <input
              type="radio"
              value="dfs"
              checked={mode === 'dfs'}
              onChange={(e) => setMode(e.target.value as 'dfs')}
            />
            DFS (specific path)
          </label>

          <label>
            Token budget: {budget}
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </label>
        </div>

        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : 'Query Graph'}
        </button>
      </form>
    </div>
  )
}
```

### 8.3 Community Sidebar

**CommunitySidebar.tsx** - Filter by communities
```typescript
// dashboard/src/components/CommunitySidebar.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface CommunitySidebarProps {
  projectId: string
  onCommunitySelect: (communityId: number) => void
}

export function CommunitySidebar({ projectId, onCommunitySelect }: CommunitySidebarProps) {
  const [selected, setSelected] = useState<number | null>(null)

  const { data: communities } = useQuery({
    queryKey: ['communities', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/graph/${projectId}`)
      const data = await res.json()
      return data.communities
    }
  })

  const handleSelect = (id: number) => {
    setSelected(id === selected ? null : id)
    onCommunitySelect(id)
  }

  return (
    <div className="community-sidebar">
      <h3>Communities</h3>
      <div className="community-list">
        {communities?.map((community) => (
          <div
            key={community.id}
            className={`community-item ${selected === community.id ? 'selected' : ''}`}
            onClick={() => handleSelect(community.id)}
          >
            <div
              className="community-color"
              style={{ backgroundColor: getCommunityColor(community.id) }}
            />
            <div className="community-info">
              <div className="community-label">{community.label}</div>
              <div className="community-count">{community.nodeCount} nodes</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 8.4 Node Details Panel

**NodeDetailsPanel.tsx** - Show node information
```typescript
// dashboard/src/components/NodeDetailsPanel.tsx
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Calendar, Tag } from 'lucide-react'

interface NodeDetailsPanelProps {
  projectId: string
  nodeId: string | null
  onClose: () => void
}

export function NodeDetailsPanel({ projectId, nodeId, onClose }: NodeDetailsPanelProps) {
  const { data: node } = useQuery({
    queryKey: ['node', projectId, nodeId],
    queryFn: async () => {
      if (!nodeId) return null
      const res = await fetch(`/api/graph/${projectId}/node/${nodeId}`)
      return res.json()
    },
    enabled: !!nodeId
  })

  if (!nodeId || !node) return null

  return (
    <div className="node-details-panel">
      <div className="panel-header">
        <h3>{node.node.label}</h3>
        <button onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        <div className="node-meta">
          <div className="meta-item">
            <Tag size={16} />
            <span>Type: {node.node.type}</span>
          </div>
          <div className="meta-item">
            <Calendar size={16} />
            <span>Created: {new Date(node.node.created_at * 1000).toLocaleDateString()}</span>
          </div>
          <div className="meta-item">
            <span>Community: {node.node.community}</span>
          </div>
          <div className="meta-item">
            <span>Degree: {node.node.degree}</span>
          </div>
        </div>

        <div className="neighbors">
          <h4>Connected Nodes ({node.neighbors.length})</h4>
          <div className="neighbor-list">
            {node.neighbors.map((neighbor) => (
              <div key={neighbor.id} className="neighbor-item">
                <div className="neighbor-label">{neighbor.label}</div>
                <div className="neighbor-relation">
                  {neighbor.relation}
                  <span className={`confidence ${neighbor.confidence.toLowerCase()}`}>
                    {neighbor.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {node.sessions && node.sessions.length > 0 && (
          <div className="related-sessions">
            <h4>Related Sessions</h4>
            {node.sessions.map((session) => (
              <a
                key={session.id}
                href={`/sessions/${session.id}`}
                className="session-link"
              >
                <ExternalLink size={14} />
                {session.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---


## 9. Extraction Service Implementation

### 9.1 Graph Extractor

**graph-extractor.ts** - Extract nodes and edges from sessions
```typescript
// src/services/graph-extractor.ts
import Anthropic from '@anthropic-ai/sdk'
import { logger } from './logger'

export interface ExtractionResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  hyperedges?: Hyperedge[]
}

export class GraphExtractor {
  private anthropic: Anthropic

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey })
  }

  async extractFromSession(sessionId: string, transcript: string, summary: string): Promise<ExtractionResult> {
    logger.info('GraphExtractor', `Extracting graph from session ${sessionId}`)

    const prompt = `
You are a knowledge graph extraction specialist. Analyze this Claude Code session and extract:

1. **Nodes** - Key concepts, files, tools, decisions, technologies
2. **Edges** - Relationships between nodes
3. **Confidence** - Tag each edge as EXTRACTED (explicit), INFERRED (reasonable), or AMBIGUOUS (uncertain)

Session Summary:
${summary}

Session Transcript (first 5000 chars):
${transcript.slice(0, 5000)}

Return JSON in this exact format:
{
  "nodes": [
    {
      "id": "unique_id",
      "label": "Human readable name",
      "type": "session|concept|file|tool|decision|technology",
      "metadata": {}
    }
  ],
  "edges": [
    {
      "source": "node_id_1",
      "target": "node_id_2",
      "relation": "discusses|modifies|uses|leads_to|blocks|implements",
      "confidence": "EXTRACTED|INFERRED|AMBIGUOUS",
      "confidence_score": 0.85
    }
  ]
}

Rules:
- Use snake_case for IDs
- Be conservative with INFERRED edges
- Flag uncertain relationships as AMBIGUOUS
- Include file paths as nodes if files were modified
- Include technologies/libraries as nodes
- Include key decisions as nodes
`

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const extraction = JSON.parse(content.text)
      
      // Add session_id to all nodes
      extraction.nodes = extraction.nodes.map(node => ({
        ...node,
        session_id: sessionId,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000)
      }))

      // Add metadata to edges
      extraction.edges = extraction.edges.map(edge => ({
        ...edge,
        id: `${edge.source}_${edge.target}_${edge.relation}`,
        weight: edge.confidence === 'EXTRACTED' ? 1.0 : edge.confidence_score || 0.5,
        created_at: Math.floor(Date.now() / 1000)
      }))

      logger.info('GraphExtractor', `Extracted ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`)
      
      return extraction
    } catch (error) {
      logger.error('GraphExtractor', 'Extraction failed', { error: error.message })
      throw error
    }
  }

  async extractFromToolCalls(toolCalls: ToolCall[]): Promise<ExtractionResult> {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    // Extract file nodes from Read/Write/Edit calls
    const fileTools = toolCalls.filter(t => ['Read', 'Write', 'Edit'].includes(t.tool))
    
    for (const tool of fileTools) {
      const filePath = tool.parameters.file_path
      if (!filePath) continue

      const fileId = this.makeId(filePath)
      nodes.push({
        id: fileId,
        label: filePath.split('/').pop() || filePath,
        type: 'file',
        metadata: { path: filePath },
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000)
      })

      // Create edge from session to file
      edges.push({
        id: `session_${tool.session_id}_${fileId}`,
        source: `session_${tool.session_id}`,
        target: fileId,
        relation: tool.tool === 'Read' ? 'reads' : 'modifies',
        confidence: 'EXTRACTED',
        confidence_score: 1.0,
        weight: 1.0,
        created_at: Math.floor(Date.now() / 1000)
      })
    }

    // Extract bash commands as tool nodes
    const bashCalls = toolCalls.filter(t => t.tool === 'Bash')
    for (const bash of bashCalls) {
      const command = bash.parameters.command
      if (!command) continue

      // Extract npm/pnpm/git commands
      const match = command.match(/^(npm|pnpm|git|python|node)\s+/)
      if (match) {
        const toolId = this.makeId(match[1])
        nodes.push({
          id: toolId,
          label: match[1],
          type: 'tool',
          metadata: { command },
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000)
        })

        edges.push({
          id: `session_${bash.session_id}_${toolId}`,
          source: `session_${bash.session_id}`,
          target: toolId,
          relation: 'uses',
          confidence: 'EXTRACTED',
          confidence_score: 1.0,
          weight: 1.0,
          created_at: Math.floor(Date.now() / 1000)
        })
      }
    }

    return { nodes, edges }
  }

  private makeId(...parts: string[]): string {
    return parts
      .join('_')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }
}
```

### 9.2 Graph Builder

**graph-builder.ts** - Build and merge graphs
```typescript
// src/services/graph-builder.ts
import { db } from '../db/client'
import { graphQueries } from '../db/graph-queries'
import { logger } from './logger'

export class GraphBuilder {
  async addExtraction(projectId: string, extraction: ExtractionResult): Promise<void> {
    logger.info('GraphBuilder', `Adding extraction to project ${projectId}`)

    const tx = db.transaction(() => {
      // Insert nodes (or update if exists)
      for (const node of extraction.nodes) {
        const existing = graphQueries.getNode(node.id)
        
        if (existing) {
          // Update existing node
          graphQueries.updateNode(node.id, {
            ...node,
            project_id: projectId,
            updated_at: Math.floor(Date.now() / 1000)
          })
        } else {
          // Insert new node
          graphQueries.insertNode({
            ...node,
            project_id: projectId,
            degree: 0
          })
        }
      }

      // Insert edges (skip duplicates)
      for (const edge of extraction.edges) {
        const existing = graphQueries.getEdge(edge.id)
        
        if (!existing) {
          graphQueries.insertEdge({
            ...edge,
            metadata: edge.metadata || {}
          })

          // Update node degrees
          graphQueries.updateNodeDegree(edge.source)
          graphQueries.updateNodeDegree(edge.target)
        }
      }
    })

    tx()
    logger.info('GraphBuilder', `Added ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`)
  }

  async exportToNetworkX(projectId: string): Promise<string> {
    const nodes = graphQueries.getProjectNodes(projectId)
    const edges = graphQueries.getProjectEdges(projectId)

    const graph = {
      directed: false,
      multigraph: false,
      graph: {},
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        community: n.community,
        degree: n.degree
      })),
      links: edges.map(e => ({
        source: e.source_id,
        target: e.target_id,
        relation: e.relation,
        confidence: e.confidence,
        weight: e.weight
      }))
    }

    return JSON.stringify(graph, null, 2)
  }

  async deduplicateNodes(projectId: string): Promise<number> {
    // Find nodes with similar labels
    const nodes = graphQueries.getProjectNodes(projectId)
    const duplicates = new Map<string, string[]>()

    for (const node of nodes) {
      const normalized = node.label.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!duplicates.has(normalized)) {
        duplicates.set(normalized, [])
      }
      duplicates.get(normalized)!.push(node.id)
    }

    let merged = 0
    for (const [_, ids] of duplicates) {
      if (ids.length > 1) {
        // Keep first, merge others
        const keepId = ids[0]
        for (let i = 1; i < ids.length; i++) {
          graphQueries.mergeNodes(keepId, ids[i])
          merged++
        }
      }
    }

    logger.info('GraphBuilder', `Merged ${merged} duplicate nodes`)
    return merged
  }
}
```

---


## 10. Clustering and Analysis

### 10.1 Python Clustering Script

**cluster_graph.py** - Leiden community detection
```python
#!/usr/bin/env python3
"""
Cluster a knowledge graph using Leiden algorithm
Usage: python cluster_graph.py <graph.json> <output.json>
"""
import sys
import json
import networkx as nx
from graspologic.partition import leiden

def cluster_graph(graph_path: str, output_path: str):
    # Load graph
    with open(graph_path, 'r') as f:
        data = json.load(f)
    
    # Build NetworkX graph
    G = nx.Graph()
    
    for node in data['nodes']:
        G.add_node(node['id'], **node)
    
    for edge in data['links']:
        G.add_edge(
            edge['source'],
            edge['target'],
            weight=edge.get('weight', 1.0),
            **{k: v for k, v in edge.items() if k not in ('source', 'target')}
        )
    
    # Run Leiden clustering
    communities = leiden(G, resolution=1.0)
    
    # Add community to nodes
    for node_id, community_id in communities.items():
        if node_id in G.nodes:
            G.nodes[node_id]['community'] = int(community_id)
    
    # Convert back to JSON
    result = {
        'nodes': [
            {'id': n, **G.nodes[n]}
            for n in G.nodes()
        ],
        'links': [
            {
                'source': u,
                'target': v,
                **G.edges[u, v]
            }
            for u, v in G.edges()
        ],
        'communities': {}
    }
    
    # Count nodes per community
    for node in result['nodes']:
        comm = node.get('community', -1)
        if comm not in result['communities']:
            result['communities'][comm] = 0
        result['communities'][comm] += 1
    
    # Write output
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"Clustered {len(result['nodes'])} nodes into {len(result['communities'])} communities")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python cluster_graph.py <input.json> <output.json>")
        sys.exit(1)
    
    cluster_graph(sys.argv[1], sys.argv[2])
```

### 10.2 Graph Analyzer

**graph-analyzer.ts** - Find patterns and insights
```typescript
// src/services/graph-analyzer.ts
import { graphQueries } from '../db/graph-queries'
import { logger } from './logger'

export interface GraphAnalysis {
  godNodes: GodNode[]
  surprisingConnections: SurprisingConnection[]
  communities: CommunityInfo[]
  suggestedQuestions: string[]
  stats: GraphStats
}

export class GraphAnalyzer {
  async analyze(projectId: string): Promise<GraphAnalysis> {
    logger.info('GraphAnalyzer', `Analyzing graph for project ${projectId}`)

    const godNodes = await this.findGodNodes(projectId)
    const surprisingConnections = await this.findSurprisingConnections(projectId)
    const communities = await this.analyzeCommunities(projectId)
    const suggestedQuestions = this.generateQuestions(godNodes, communities)
    const stats = await this.calculateStats(projectId)

    return {
      godNodes,
      surprisingConnections,
      communities,
      suggestedQuestions,
      stats
    }
  }

  private async findGodNodes(projectId: string): Promise<GodNode[]> {
    const nodes = graphQueries.getGodNodes(projectId, 10)
    
    return nodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      degree: node.degree,
      community: node.community,
      explanation: `Central hub connecting ${node.degree} other concepts`
    }))
  }

  private async findSurprisingConnections(projectId: string): Promise<SurprisingConnection[]> {
    // Find edges connecting different communities
    const edges = graphQueries.getProjectEdges(projectId)
    const nodes = graphQueries.getProjectNodes(projectId)
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    const surprising: SurprisingConnection[] = []

    for (const edge of edges) {
      const source = nodeMap.get(edge.source_id)
      const target = nodeMap.get(edge.target_id)

      if (!source || !target) continue

      // Cross-community connections are surprising
      if (source.community !== target.community) {
        const score = this.calculateSurpriseScore(edge, source, target)
        
        surprising.push({
          source: { id: source.id, label: source.label, community: source.community },
          target: { id: target.id, label: target.label, community: target.community },
          relation: edge.relation,
          confidence: edge.confidence,
          score,
          explanation: this.explainConnection(edge, source, target)
        })
      }
    }

    // Sort by surprise score
    return surprising.sort((a, b) => b.score - a.score).slice(0, 20)
  }

  private calculateSurpriseScore(edge: any, source: any, target: any): number {
    let score = 0

    // Cross-community bonus
    if (source.community !== target.community) score += 0.3

    // Cross-type bonus (e.g., session → file)
    if (source.type !== target.type) score += 0.2

    // INFERRED edges are more surprising than EXTRACTED
    if (edge.confidence === 'INFERRED') score += 0.3
    if (edge.confidence === 'AMBIGUOUS') score += 0.2

    // Low-degree nodes connecting is surprising
    if (source.degree < 5 && target.degree < 5) score += 0.2

    return Math.min(score, 1.0)
  }

  private explainConnection(edge: any, source: any, target: any): string {
    const reasons = []

    if (source.community !== target.community) {
      reasons.push('bridges different architectural modules')
    }

    if (edge.confidence === 'INFERRED') {
      reasons.push('inferred relationship not explicitly stated')
    }

    if (source.type === 'session' && target.type === 'file') {
      reasons.push('session modified this file')
    }

    return reasons.join(', ') || 'unexpected connection'
  }

  private async analyzeCommunities(projectId: string): Promise<CommunityInfo[]> {
    const nodes = graphQueries.getProjectNodes(projectId)
    const communities = new Map<number, any[]>()

    for (const node of nodes) {
      if (node.community === null || node.community === undefined) continue
      
      if (!communities.has(node.community)) {
        communities.set(node.community, [])
      }
      communities.get(node.community)!.push(node)
    }

    const result: CommunityInfo[] = []

    for (const [id, members] of communities) {
      // Find most common type in community
      const typeCounts = new Map<string, number>()
      for (const node of members) {
        typeCounts.set(node.type, (typeCounts.get(node.type) || 0) + 1)
      }
      const dominantType = Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed'

      // Generate label from top nodes
      const topNodes = members
        .sort((a, b) => b.degree - a.degree)
        .slice(0, 3)
        .map(n => n.label)
        .join(', ')

      result.push({
        id,
        label: this.generateCommunityLabel(members),
        nodeCount: members.length,
        dominantType,
        topNodes,
        description: `Community of ${members.length} nodes focused on ${dominantType}`
      })
    }

    return result.sort((a, b) => b.nodeCount - a.nodeCount)
  }

  private generateCommunityLabel(members: any[]): string {
    // Use most common words in node labels
    const words = new Map<string, number>()
    
    for (const node of members) {
      const nodeWords = node.label.toLowerCase().split(/\s+/)
      for (const word of nodeWords) {
        if (word.length > 3) {
          words.set(word, (words.get(word) || 0) + 1)
        }
      }
    }

    const topWords = Array.from(words.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([word]) => word)

    return topWords.length > 0 
      ? topWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Unnamed Community'
  }

  private generateQuestions(godNodes: GodNode[], communities: CommunityInfo[]): string[] {
    const questions: string[] = []

    if (godNodes.length >= 2) {
      questions.push(`What connects ${godNodes[0].label} to ${godNodes[1].label}?`)
    }

    if (communities.length >= 2) {
      questions.push(`How do the ${communities[0].label} and ${communities[1].label} modules interact?`)
    }

    if (godNodes.length > 0) {
      questions.push(`What depends on ${godNodes[0].label}?`)
      questions.push(`Show the architecture around ${godNodes[0].label}`)
    }

    questions.push('What are the most surprising connections in this project?')

    return questions.slice(0, 5)
  }

  private async calculateStats(projectId: string): Promise<GraphStats> {
    const nodes = graphQueries.getProjectNodes(projectId)
    const edges = graphQueries.getProjectEdges(projectId)

    const communities = new Set(nodes.map(n => n.community).filter(c => c !== null))
    const types = new Map<string, number>()
    
    for (const node of nodes) {
      types.set(node.type, (types.get(node.type) || 0) + 1)
    }

    const confidenceCounts = {
      EXTRACTED: edges.filter(e => e.confidence === 'EXTRACTED').length,
      INFERRED: edges.filter(e => e.confidence === 'INFERRED').length,
      AMBIGUOUS: edges.filter(e => e.confidence === 'AMBIGUOUS').length
    }

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      communities: communities.size,
      nodeTypes: Object.fromEntries(types),
      confidenceCounts,
      avgDegree: nodes.reduce((sum, n) => sum + n.degree, 0) / nodes.length
    }
  }
}
```

---


## 11. Security Considerations

### 11.1 Input Validation

**Sanitize all graph inputs:**
```typescript
// src/services/graph-security.ts
export class GraphSecurity {
  static sanitizeNodeId(id: string): string {
    // Only allow alphanumeric, underscore, hyphen
    return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256)
  }

  static sanitizeLabel(label: string): string {
    // Strip control characters, limit length
    return label
      .replace(/[\x00-\x1F\x7F]/g, '')
      .slice(0, 256)
  }

  static validateConfidence(confidence: string): boolean {
    return ['EXTRACTED', 'INFERRED', 'AMBIGUOUS'].includes(confidence)
  }

  static validateNodeType(type: string): boolean {
    return ['session', 'concept', 'file', 'tool', 'decision', 'technology'].includes(type)
  }

  static validateRelation(relation: string): boolean {
    const allowed = [
      'discusses', 'modifies', 'uses', 'leads_to', 'blocks',
      'implements', 'calls', 'imports', 'depends_on'
    ]
    return allowed.includes(relation)
  }
}
```

### 11.2 Rate Limiting

**Protect extraction endpoints:**
```typescript
// src/middleware/graph-rate-limit.ts
import { rateLimit } from './rate-limit'

export const graphExtractionLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 extractions per hour
  message: 'Too many graph extractions, please try again later.'
})

export const graphQueryLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 queries per 15 minutes
  message: 'Too many graph queries, please try again later.'
})

// Apply to routes
app.post('/api/graph/:projectId/extract', graphExtractionLimit, extractHandler)
app.post('/api/graph/:projectId/query', graphQueryLimit, queryHandler)
```

### 11.3 Access Control

**Ensure users can only access their own graphs:**
```typescript
// src/middleware/graph-auth.ts
export async function validateGraphAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { projectId } = req.params
  const userId = req.user?.id // Assuming auth middleware sets this

  // Check if user owns this project
  const project = await db.prepare(
    'SELECT * FROM projects WHERE id = ? AND user_id = ?'
  ).get(projectId, userId)

  if (!project) {
    return res.status(403).json({ error: 'Access denied' })
  }

  next()
}

// Apply to all graph routes
app.use('/api/graph/:projectId', validateGraphAccess)
```

### 11.4 Data Privacy

**Sensitive data handling:**
```typescript
// src/services/graph-privacy.ts
export class GraphPrivacy {
  static redactSensitiveData(text: string): string {
    // Redact API keys, tokens, passwords
    return text
      .replace(/sk-[a-zA-Z0-9]{48}/g, '[REDACTED_API_KEY]')
      .replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/password["\s:=]+[^\s"]+/gi, 'password=[REDACTED]')
      .replace(/token["\s:=]+[^\s"]+/gi, 'token=[REDACTED]')
  }

  static shouldExcludeFile(path: string): boolean {
    const excluded = [
      '.env',
      '.env.local',
      'credentials.json',
      'secrets.yaml',
      'private_key.pem'
    ]
    return excluded.some(pattern => path.includes(pattern))
  }

  static filterSensitiveNodes(nodes: GraphNode[]): GraphNode[] {
    return nodes.filter(node => {
      if (node.type === 'file' && node.metadata?.path) {
        return !this.shouldExcludeFile(node.metadata.path)
      }
      return true
    })
  }
}
```

### 11.5 LLM API Safety

**Protect against prompt injection:**
```typescript
// src/services/graph-extractor.ts (updated)
export class GraphExtractor {
  private sanitizePromptInput(text: string): string {
    // Remove potential prompt injection attempts
    const dangerous = [
      'ignore previous instructions',
      'disregard all',
      'new instructions:',
      'system:',
      'assistant:'
    ]

    let sanitized = text
    for (const pattern of dangerous) {
      sanitized = sanitized.replace(new RegExp(pattern, 'gi'), '[FILTERED]')
    }

    return sanitized.slice(0, 10000) // Limit length
  }

  async extractFromSession(sessionId: string, transcript: string, summary: string) {
    // Sanitize inputs before sending to LLM
    const cleanTranscript = this.sanitizePromptInput(transcript)
    const cleanSummary = this.sanitizePromptInput(summary)

    // ... rest of extraction
  }
}
```

---

## 12. Quick Start Guide

### 12.1 Minimal Implementation (1 Day)

**Step 1: Add database tables**
```bash
cd artifacts/claudectx-backup
sqlite3 ~/.memctx/db.sqlite < migrations/009_add_graph_tables.sql
```

**Step 2: Install dependencies**
```bash
npm install vis-network
pip3 install networkx graspologic
```

**Step 3: Create basic extraction**
```typescript
// src/services/simple-graph-extractor.ts
export async function extractSimpleGraph(sessionId: string) {
  const session = await getSession(sessionId)
  const transcript = await readTranscript(session.transcript_path)
  
  // Simple extraction: files mentioned
  const fileRegex = /(?:Read|Write|Edit).*?file_path["\s:]+([^\s"]+)/g
  const files = [...transcript.matchAll(fileRegex)].map(m => m[1])
  
  const nodes = files.map(file => ({
    id: file.replace(/[^a-z0-9]/gi, '_'),
    label: file.split('/').pop(),
    type: 'file'
  }))
  
  const edges = files.map(file => ({
    source: `session_${sessionId}`,
    target: file.replace(/[^a-z0-9]/gi, '_'),
    relation: 'modifies',
    confidence: 'EXTRACTED'
  }))
  
  return { nodes, edges }
}
```

**Step 4: Add API endpoint**
```typescript
// src/api/graph.ts
router.get('/api/graph/:projectId', async (req, res) => {
  const nodes = graphQueries.getProjectNodes(req.params.projectId)
  const edges = graphQueries.getProjectEdges(req.params.projectId)
  res.json({ nodes, edges })
})
```

**Step 5: Add basic visualization**
```typescript
// dashboard/src/pages/GraphPage.tsx
import { Network } from 'vis-network'

export function GraphPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    fetch('/api/graph/current-project')
      .then(r => r.json())
      .then(data => {
        new Network(containerRef.current!, data, {})
      })
  }, [])
  
  return <div ref={containerRef} style={{ height: '600px' }} />
}
```

### 12.2 Testing the Integration

**Test extraction:**
```bash
# Extract graph from a session
curl -X POST http://localhost:9999/api/graph/test-project/extract \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "abc123"}'

# Query the graph
curl -X POST http://localhost:9999/api/graph/test-project/query \
  -H "Content-Type: application/json" \
  -d '{"query": "what files were modified?"}'

# Get graph data
curl http://localhost:9999/api/graph/test-project
```

**Test visualization:**
```bash
# Start dashboard
cd dashboard && npm run dev

# Open http://localhost:5173/graph
```

---

## 13. Advanced Features (Optional)

### 13.1 Real-time Graph Updates

**WebSocket broadcasting:**
```typescript
// src/services/graph-sync.ts
import { broadcast } from '../ws/broadcast'

export class GraphSync {
  async notifyGraphUpdate(projectId: string, update: GraphUpdate) {
    broadcast({
      type: 'graph:update',
      projectId,
      data: update
    })
  }
}

// dashboard/src/hooks/useGraphUpdates.ts
export function useGraphUpdates(projectId: string) {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9999')
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'graph:update' && msg.projectId === projectId) {
        // Refresh graph
        queryClient.invalidateQueries(['graph', projectId])
      }
    }
    
    return () => ws.close()
  }, [projectId])
}
```

### 13.2 Export Formats

**Export to Neo4j:**
```typescript
// src/services/graph-export.ts
export class GraphExporter {
  async exportToNeo4j(projectId: string): Promise<string> {
    const nodes = graphQueries.getProjectNodes(projectId)
    const edges = graphQueries.getProjectEdges(projectId)
    
    let cypher = '// Nodes\n'
    for (const node of nodes) {
      cypher += `CREATE (n${node.id}:${node.type} {id: "${node.id}", label: "${node.label}"})\n`
    }
    
    cypher += '\n// Edges\n'
    for (const edge of edges) {
      cypher += `MATCH (a {id: "${edge.source_id}"}), (b {id: "${edge.target_id}"})\n`
      cypher += `CREATE (a)-[:${edge.relation.toUpperCase()} {confidence: "${edge.confidence}"}]->(b)\n`
    }
    
    return cypher
  }

  async exportToGraphML(projectId: string): Promise<string> {
    // GraphML XML format for Gephi, yEd
    // Implementation similar to Neo4j export
  }
}
```

### 13.3 Graph Diff

**Compare graphs across time:**
```typescript
// src/services/graph-diff.ts
export class GraphDiff {
  async compareGraphs(projectId: string, date1: number, date2: number) {
    const graph1 = await this.getGraphAtTime(projectId, date1)
    const graph2 = await this.getGraphAtTime(projectId, date2)
    
    const addedNodes = graph2.nodes.filter(n => 
      !graph1.nodes.find(n1 => n1.id === n.id)
    )
    
    const removedNodes = graph1.nodes.filter(n => 
      !graph2.nodes.find(n2 => n2.id === n.id)
    )
    
    const addedEdges = graph2.edges.filter(e => 
      !graph1.edges.find(e1 => e1.id === e.id)
    )
    
    return { addedNodes, removedNodes, addedEdges }
  }
}
```

---


## 14. Performance Optimization

### 14.1 Caching Strategy

**Cache graph queries:**
```typescript
// src/services/graph-cache.ts
import NodeCache from 'node-cache'

export class GraphCache {
  private cache = new NodeCache({ stdTTL: 300 }) // 5 minutes

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get<T>(key)
    if (cached) return cached

    const data = await fetcher()
    this.cache.set(key, data)
    return data
  }

  invalidate(pattern: string) {
    const keys = this.cache.keys()
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.del(key)
      }
    }
  }
}

// Usage
const graphCache = new GraphCache()

router.get('/api/graph/:projectId', async (req, res) => {
  const data = await graphCache.getOrFetch(
    `graph:${req.params.projectId}`,
    () => graphQueries.getProjectGraph(req.params.projectId)
  )
  res.json(data)
})
```

### 14.2 Incremental Updates

**Only re-cluster when needed:**
```typescript
// src/services/graph-incremental.ts
export class GraphIncremental {
  private changeThreshold = 50 // Re-cluster after 50 new nodes

  async addNodes(projectId: string, nodes: GraphNode[]) {
    // Insert nodes
    for (const node of nodes) {
      graphQueries.insertNode(node)
    }

    // Check if we need to re-cluster
    const stats = await graphQueries.getProjectStats(projectId)
    const lastCluster = await this.getLastClusterTime(projectId)
    const nodesSinceCluster = stats.totalNodes - lastCluster.nodeCount

    if (nodesSinceCluster >= this.changeThreshold) {
      await this.recluster(projectId)
    }
  }

  private async recluster(projectId: string) {
    logger.info('GraphIncremental', `Re-clustering project ${projectId}`)
    
    // Export to JSON
    const graphJson = await graphBuilder.exportToNetworkX(projectId)
    
    // Run Python clustering
    const result = await runPythonScript('cluster_graph.py', [
      graphJson,
      `/tmp/clustered_${projectId}.json`
    ])
    
    // Update communities in database
    const clustered = JSON.parse(result)
    for (const node of clustered.nodes) {
      graphQueries.updateNodeCommunity(node.id, node.community)
    }
    
    // Save cluster timestamp
    await this.saveClusterTime(projectId, Date.now())
  }
}
```

### 14.3 Database Indexing

**Optimize queries:**
```sql
-- Add composite indexes for common queries
CREATE INDEX idx_nodes_project_type ON graph_nodes(project_id, type);
CREATE INDEX idx_nodes_project_community ON graph_nodes(project_id, community);
CREATE INDEX idx_edges_source_relation ON graph_edges(source_id, relation);
CREATE INDEX idx_edges_target_relation ON graph_edges(target_id, relation);

-- Add covering index for node list queries
CREATE INDEX idx_nodes_list ON graph_nodes(project_id, degree DESC, id, label, type);

-- Analyze tables for query planner
ANALYZE graph_nodes;
ANALYZE graph_edges;
```

### 14.4 Lazy Loading

**Load graph in chunks:**
```typescript
// dashboard/src/hooks/useGraphLazy.ts
export function useGraphLazy(projectId: string) {
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set())
  const [graph, setGraph] = useState<GraphData | null>(null)

  const loadInitial = async () => {
    // Load only god nodes and their immediate neighbors
    const res = await fetch(`/api/graph/${projectId}/initial`)
    const data = await res.json()
    setGraph(data)
    setVisibleNodes(new Set(data.nodes.map(n => n.id)))
  }

  const expandNode = async (nodeId: string) => {
    // Load neighbors of clicked node
    const res = await fetch(`/api/graph/${projectId}/node/${nodeId}/neighbors`)
    const neighbors = await res.json()
    
    setGraph(prev => ({
      nodes: [...prev!.nodes, ...neighbors.nodes],
      edges: [...prev!.edges, ...neighbors.edges]
    }))
    
    setVisibleNodes(prev => {
      const next = new Set(prev)
      neighbors.nodes.forEach(n => next.add(n.id))
      return next
    })
  }

  return { graph, loadInitial, expandNode }
}
```

---

## 15. Troubleshooting

### 15.1 Common Issues

**Issue: Clustering fails with "No module named graspologic"**
```bash
# Solution: Install Python dependencies
pip3 install networkx graspologic

# Or use a virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install networkx graspologic
```

**Issue: Graph visualization is slow with 1000+ nodes**
```typescript
// Solution: Enable physics only for initial layout
const options = {
  physics: {
    enabled: true,
    stabilization: {
      iterations: 200,
      onlyDynamicEdges: false
    }
  }
}

network.on('stabilizationIterationsDone', () => {
  network.setOptions({ physics: false })
})
```

**Issue: Extraction returns empty nodes/edges**
```typescript
// Solution: Check LLM response format
console.log('Raw LLM response:', content.text)

// Ensure JSON is properly extracted
const jsonMatch = content.text.match(/\{[\s\S]*\}/)
if (jsonMatch) {
  const extraction = JSON.parse(jsonMatch[0])
}
```

**Issue: Duplicate nodes in graph**
```typescript
// Solution: Run deduplication
await graphBuilder.deduplicateNodes(projectId)

// Or prevent duplicates during insertion
const existing = graphQueries.getNode(node.id)
if (!existing) {
  graphQueries.insertNode(node)
}
```

### 15.2 Debugging Tips

**Enable verbose logging:**
```typescript
// src/services/logger.ts
export const logger = new Logger(LogLevel.DEBUG)

// Log all graph operations
logger.debug('GraphExtractor', 'Extracting from session', { sessionId })
logger.debug('GraphBuilder', 'Adding nodes', { count: nodes.length })
```

**Inspect graph structure:**
```bash
# Check node count
sqlite3 ~/.memctx/db.sqlite "SELECT COUNT(*) FROM graph_nodes"

# Check edge count
sqlite3 ~/.memctx/db.sqlite "SELECT COUNT(*) FROM graph_edges"

# Find orphaned nodes (no edges)
sqlite3 ~/.memctx/db.sqlite "
  SELECT id, label FROM graph_nodes 
  WHERE id NOT IN (SELECT source_id FROM graph_edges)
    AND id NOT IN (SELECT target_id FROM graph_edges)
"

# Check community distribution
sqlite3 ~/.memctx/db.sqlite "
  SELECT community, COUNT(*) as count 
  FROM graph_nodes 
  GROUP BY community 
  ORDER BY count DESC
"
```

**Test extraction manually:**
```bash
# Create test session
curl -X POST http://localhost:9999/api/graph/test/extract \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "transcript": "I modified auth.ts and database.ts files",
    "summary": "Fixed authentication bug"
  }'

# Check results
curl http://localhost:9999/api/graph/test | jq '.nodes | length'
curl http://localhost:9999/api/graph/test | jq '.edges | length'
```

---

## 16. Roadmap and Future Enhancements

### 16.1 Phase 5: Advanced Features (Future)

**Temporal Graph Analysis:**
- Track how concepts evolve over time
- Visualize graph changes as animation
- Identify trending topics

**Multi-Project Graphs:**
- Link concepts across different projects
- Find reusable patterns
- Cross-project search

**AI-Powered Insights:**
- Automatic architecture documentation
- Suggest refactoring opportunities
- Predict technical debt

**Collaborative Features:**
- Share graphs with team members
- Annotate nodes and edges
- Discussion threads on concepts

### 16.2 Integration with Other Tools

**VS Code Extension:**
- Show graph in sidebar
- Click node to jump to file
- Highlight related files

**Slack Bot:**
- Query graph from Slack
- Get daily insights
- Alert on surprising connections

**GitHub Integration:**
- Auto-update graph on PR merge
- Show graph in PR description
- Link commits to concepts

---

## 17. Resources and References

### 17.1 Documentation

- **Graphify GitHub**: https://github.com/safishamsi/graphify
- **NetworkX Docs**: https://networkx.org/documentation/stable/
- **Leiden Algorithm**: https://www.nature.com/articles/s41598-019-41695-z
- **vis-network**: https://visjs.github.io/vis-network/docs/network/

### 17.2 Example Projects

- **Graphify Examples**: `/tmp/graphify/worked/`
- **Karpathy Repos Graph**: 52 files, 71.5x reduction
- **Mixed Corpus**: Code + papers + images

### 17.3 Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share graphs
- **Contributing**: See ARCHITECTURE.md for module structure

---

## 18. Conclusion

### 18.1 Summary

Integrating Graphify-style knowledge graphs into MemCTX will:

✅ **Connect sessions** - See how work relates across time
✅ **Compress context** - 71x fewer tokens for queries
✅ **Reveal patterns** - Find architectural insights automatically
✅ **Improve search** - Query by concept, not keywords
✅ **Track evolution** - Watch ideas develop over sessions

### 18.2 Next Steps

1. **Start small** - Implement Phase 1 (basic extraction)
2. **Test thoroughly** - Verify extraction quality
3. **Iterate** - Add clustering and visualization
4. **Optimize** - Cache, index, lazy load
5. **Expand** - Add advanced features as needed

### 18.3 Estimated Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Foundation | 1-2 weeks | Medium |
| Phase 2: Graph Building | 1-2 weeks | Medium |
| Phase 3: Visualization | 1-2 weeks | High |
| Phase 4: Auto-Extraction | 1 week | Low |
| **Total** | **4-7 weeks** | **Medium-High** |

### 18.4 Success Metrics

- **Extraction Quality**: 80%+ accuracy on node/edge detection
- **Query Performance**: <500ms for graph queries
- **User Adoption**: 50%+ of users explore graphs
- **Token Savings**: 50x+ reduction vs reading raw sessions
- **Insight Discovery**: 10+ surprising connections per project

---

## Appendix A: Complete File Structure

```
artifacts/claudectx-backup/
├── src/
│   ├── services/
│   │   ├── graph-extractor.ts       # Extract nodes/edges from sessions
│   │   ├── graph-builder.ts         # Build and merge graphs
│   │   ├── graph-analyzer.ts        # Find patterns and insights
│   │   ├── graph-cache.ts           # Cache graph queries
│   │   ├── graph-security.ts        # Input validation
│   │   └── python-bridge.ts         # Run Python scripts
│   ├── api/
│   │   └── graph.ts                 # Graph API endpoints
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 009_add_graph_tables.sql
│   │   └── graph-queries.ts         # Database queries
│   └── middleware/
│       └── graph-rate-limit.ts      # Rate limiting
├── scripts/
│   └── cluster_graph.py             # Leiden clustering
└── dashboard/
    └── src/
        ├── pages/
        │   └── GraphPage.tsx        # Main graph page
        ├── components/
        │   ├── GraphView.tsx        # Graph visualization
        │   ├── GraphQuery.tsx       # Query interface
        │   ├── CommunitySidebar.tsx # Community filter
        │   └── NodeDetailsPanel.tsx # Node details
        └── hooks/
            ├── useGraphLazy.ts      # Lazy loading
            └── useGraphUpdates.ts   # Real-time updates
```

---

## Appendix B: SQL Migration

```sql
-- migrations/009_add_graph_tables.sql

-- Nodes table
CREATE TABLE IF NOT EXISTS graph_nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('session', 'concept', 'file', 'tool', 'decision', 'technology')),
  session_id TEXT,
  project_id TEXT NOT NULL,
  community INTEGER,
  degree INTEGER DEFAULT 0,
  metadata JSON,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Edges table
CREATE TABLE IF NOT EXISTS graph_edges (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK(confidence IN ('EXTRACTED', 'INFERRED', 'AMBIGUOUS')),
  confidence_score REAL DEFAULT 1.0,
  weight REAL DEFAULT 1.0,
  metadata JSON,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (source_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES graph_nodes(id) ON DELETE CASCADE
);

-- Communities table
CREATE TABLE IF NOT EXISTS graph_communities (
  id INTEGER PRIMARY KEY,
  project_id TEXT NOT NULL,
  label TEXT,
  description TEXT,
  node_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nodes_project ON graph_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_session ON graph_nodes(session_id);
CREATE INDEX IF NOT EXISTS idx_nodes_community ON graph_nodes(community);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_nodes_degree ON graph_nodes(degree DESC);
CREATE INDEX IF NOT EXISTS idx_edges_source ON graph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON graph_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_edges_relation ON graph_edges(relation);
CREATE INDEX IF NOT EXISTS idx_communities_project ON graph_communities(project_id);
```

---

**End of Guide**

For questions or contributions, visit: https://github.com/safishamsi/graphify

