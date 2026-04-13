# Graph Integration Plan for MemCTX

**Goal**: Add knowledge graph features to memctx package without breaking existing installation

---

## Port Strategy

### Option 1: Single Port with Feature Flag (RECOMMENDED)
- Keep port 9999 for everything
- Add `--enable-graph` flag to enable graph features
- Graph UI accessible at `http://localhost:9999/graph`
- Backward compatible - existing users see no changes

### Option 2: Dual Port
- Port 9999: Existing MemCTX (sessions, summaries)
- Port 3333: Graph features only
- Requires two processes running
- More complex but complete isolation

### Option 3: Dynamic Port
- Port 9999: Production (installed package)
- Port 3333: Development/testing branch
- Switch ports based on environment

**RECOMMENDED: Option 1** - Single port with feature flag for simplicity

---

## Branch Strategy

```
main (v1.0.10 - stable)
  ↓
feature/knowledge-graph (development)
  ↓
  ├── Phase 1: Database + Basic Extraction
  ├── Phase 2: Graph Building + Clustering  
  ├── Phase 3: Visualization
  └── Phase 4: Auto-extraction
  ↓
main (v2.0.0 - with graphs)
```

---

## Implementation Plan

### Phase 1: Setup & Database (Week 1)

**Branch**: `feature/knowledge-graph`

**Tasks**:
1. Create feature branch
2. Add database migration
3. Add graph queries
4. Add feature flag system
5. Test locally on port 3333

**No npm publish** - local testing only

---

### Phase 2: Core Graph Features (Week 2-3)

**Tasks**:
1. Graph extractor service
2. Graph builder service
3. Python clustering integration
4. API endpoints
5. Test extraction from existing sessions

**Still no publish** - local testing continues

---

### Phase 3: UI Integration (Week 4-5)

**Tasks**:
1. Graph visualization component
2. Graph page in dashboard
3. Query interface
4. Community sidebar
5. Integration with existing UI

**Still no publish** - local testing

---

### Phase 4: Testing & Polish (Week 6)

**Tasks**:
1. End-to-end testing
2. Performance optimization
3. Documentation
4. Migration guide for existing users

**Ready for merge** - but still no publish

---

### Phase 5: Release (Week 7)

**Tasks**:
1. Merge to main
2. Bump version to 2.0.0
3. Publish to npm
4. Announce new features

---


## Detailed Step-by-Step Guide

### Step 1: Create Feature Branch

```bash
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context/artifacts/claudectx-backup

# Create and switch to feature branch
git checkout -b feature/knowledge-graph

# Verify branch
git branch
```

---

### Step 2: Add Feature Flag System

**Create config for feature flags:**

```typescript
// src/config.ts (update existing)
export const CONFIG = {
  port: parseInt(process.env.PORT || '9999'),
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  dbPath: process.env.DB_PATH || path.join(os.homedir(), '.memctx', 'db.sqlite'),
  
  // NEW: Feature flags
  features: {
    graph: process.env.ENABLE_GRAPH === 'true' || false,
    graphPort: parseInt(process.env.GRAPH_PORT || '3333')
  }
}
```

**Update CLI to support flags:**

```typescript
// src/bin/claudectx.ts (update)
program
  .command('start')
  .option('--enable-graph', 'Enable knowledge graph features')
  .option('--graph-port <port>', 'Port for graph features (default: 3333)')
  .action((options) => {
    if (options.enableGraph) {
      process.env.ENABLE_GRAPH = 'true'
    }
    if (options.graphPort) {
      process.env.GRAPH_PORT = options.graphPort
    }
    // ... rest of start logic
  })
```

---

### Step 3: Database Migration

**Create migration file:**

```bash
# Create migration
cat > src/db/migrations/009_add_graph_tables.sql << 'SQL'
-- Graph nodes table
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

-- Graph edges table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nodes_project ON graph_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_session ON graph_nodes(session_id);
CREATE INDEX IF NOT EXISTS idx_nodes_community ON graph_nodes(community);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_edges_source ON graph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON graph_edges(target_id);
SQL
```

**Update migration runner to include new migration:**

```typescript
// src/db/migrate.ts (verify it picks up 009_*.sql)
// Should automatically detect and run new migration
```

---

### Step 4: Add Dependencies

**Update package.json:**

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.82.0",
    "@types/better-sqlite3": "^7.6.13",
    "better-sqlite3": "^12.8.0",
    "chokidar": "^5.0.0",
    "express": "^5.2.1",
    "p-queue": "^9.1.2",
    "ws": "^8.17.0"
  },
  "optionalDependencies": {
    "vis-network": "^9.1.9"
  }
}
```

**For Python clustering (optional):**

```bash
# Create requirements.txt
cat > requirements.txt << 'TXT'
networkx>=3.2
graspologic>=3.3.0
TXT

# Install (optional - only if user wants clustering)
pip3 install -r requirements.txt
```

---

### Step 5: Create Graph Services

**Create directory structure:**

```bash
mkdir -p src/services/graph
mkdir -p src/api/graph
mkdir -p scripts/graph
```

**Create basic extractor:**

```typescript
// src/services/graph/extractor.ts
import { logger } from '../logger'

export interface GraphNode {
  id: string
  label: string
  type: 'session' | 'concept' | 'file' | 'tool' | 'decision' | 'technology'
  session_id?: string
  project_id: string
  metadata?: any
  created_at: number
  updated_at: number
}

export interface GraphEdge {
  id: string
  source_id: string
  target_id: string
  relation: string
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS'
  confidence_score: number
  weight: number
  metadata?: any
  created_at: number
}

export class GraphExtractor {
  async extractFromSession(sessionId: string, transcript: string): Promise<{
    nodes: GraphNode[]
    edges: GraphEdge[]
  }> {
    logger.info('GraphExtractor', `Extracting from session ${sessionId}`)
    
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const now = Math.floor(Date.now() / 1000)

    // Extract files from Read/Write/Edit tool calls
    const fileRegex = /(?:Read|Write|Edit).*?file_path["\s:]+([^\s"]+)/g
    const matches = [...transcript.matchAll(fileRegex)]
    
    for (const match of matches) {
      const filePath = match[1]
      const fileId = this.makeId(filePath)
      
      // Add file node
      nodes.push({
        id: fileId,
        label: filePath.split('/').pop() || filePath,
        type: 'file',
        session_id: sessionId,
        project_id: '', // Will be set by caller
        metadata: { path: filePath },
        created_at: now,
        updated_at: now
      })
      
      // Add edge from session to file
      edges.push({
        id: `${sessionId}_${fileId}`,
        source_id: sessionId,
        target_id: fileId,
        relation: 'modifies',
        confidence: 'EXTRACTED',
        confidence_score: 1.0,
        weight: 1.0,
        created_at: now
      })
    }

    logger.info('GraphExtractor', `Extracted ${nodes.length} nodes, ${edges.length} edges`)
    return { nodes, edges }
  }

  private makeId(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }
}
```

---

### Step 6: Create Graph Queries

```typescript
// src/db/graph-queries.ts
import { db } from './client'
import type { GraphNode, GraphEdge } from '../services/graph/extractor'

export const graphQueries = {
  insertNode(node: GraphNode) {
    return db.prepare(`
      INSERT OR REPLACE INTO graph_nodes 
      (id, label, type, session_id, project_id, community, degree, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      node.id, node.label, node.type, node.session_id, node.project_id,
      node.community || null, node.degree || 0, JSON.stringify(node.metadata || {}),
      node.created_at, node.updated_at
    )
  },

  insertEdge(edge: GraphEdge) {
    return db.prepare(`
      INSERT OR REPLACE INTO graph_edges
      (id, source_id, target_id, relation, confidence, confidence_score, weight, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      edge.id, edge.source_id, edge.target_id, edge.relation,
      edge.confidence, edge.confidence_score, edge.weight,
      JSON.stringify(edge.metadata || {}), edge.created_at
    )
  },

  getProjectNodes(projectId: string) {
    return db.prepare(`
      SELECT * FROM graph_nodes WHERE project_id = ? ORDER BY degree DESC
    `).all(projectId)
  },

  getProjectEdges(projectId: string) {
    return db.prepare(`
      SELECT e.* FROM graph_edges e
      JOIN graph_nodes n1 ON e.source_id = n1.id
      WHERE n1.project_id = ?
    `).all(projectId)
  },

  getNode(nodeId: string) {
    return db.prepare(`
      SELECT * FROM graph_nodes WHERE id = ?
    `).get(nodeId)
  }
}
```

---

### Step 7: Create Graph API

```typescript
// src/api/graph/index.ts
import { Router } from 'express'
import { graphQueries } from '../../db/graph-queries'
import { GraphExtractor } from '../../services/graph/extractor'
import { queries } from '../../db/queries'
import { readTranscript } from '../../services/transcript-reader'
import { CONFIG } from '../../config'

export const graphRouter = Router()

// Only enable if feature flag is on
if (!CONFIG.features.graph) {
  graphRouter.use((req, res) => {
    res.status(404).json({ error: 'Graph features not enabled. Start with --enable-graph' })
  })
} else {
  const extractor = new GraphExtractor()

  // Get project graph
  graphRouter.get('/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params
      const nodes = graphQueries.getProjectNodes(projectId)
      const edges = graphQueries.getProjectEdges(projectId)
      
      res.json({ nodes, edges })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Extract graph from session
  graphRouter.post('/:projectId/extract', async (req, res) => {
    try {
      const { projectId } = req.params
      const { sessionId } = req.body

      const session = queries.getSession(sessionId)
      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      const transcript = await readTranscript(session.transcript_path)
      const extraction = await extractor.extractFromSession(sessionId, transcript)

      // Set project_id on all nodes
      extraction.nodes.forEach(node => node.project_id = projectId)

      // Insert into database
      for (const node of extraction.nodes) {
        graphQueries.insertNode(node)
      }
      for (const edge of extraction.edges) {
        graphQueries.insertEdge(edge)
      }

      res.json({
        success: true,
        nodesAdded: extraction.nodes.length,
        edgesAdded: extraction.edges.length
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })
}
```

---

### Step 8: Update Main Server

```typescript
// src/index.ts (add graph routes)
import { graphRouter } from './api/graph'
import { CONFIG } from './config'

// ... existing code ...

// Add graph routes if enabled
if (CONFIG.features.graph) {
  app.use('/api/graph', graphRouter)
  console.log('[Graph] Knowledge graph features enabled')
}

// ... rest of server setup ...
```

---


### Step 9: Local Testing Setup

**Test on port 3333 (separate from production 9999):**

```bash
# In feature branch
cd artifacts/claudectx-backup

# Build the project
pnpm run build

# Test locally with graph features enabled on port 3333
PORT=3333 ENABLE_GRAPH=true node dist/src/index.js

# In another terminal, test the API
curl http://localhost:3333/api/health
curl http://localhost:3333/api/graph/test-project
```

**Keep production running on 9999:**

```bash
# Your installed memctx package still runs on 9999
memctx status  # Should show running on 9999

# Both can run simultaneously for testing
```

---

### Step 10: Testing Checklist

**Before committing anything:**

- [ ] Database migration runs successfully
- [ ] Graph extraction works from a test session
- [ ] API endpoints return data
- [ ] No errors in logs
- [ ] Feature flag works (disabled by default)
- [ ] Port 3333 doesn't conflict with 9999
- [ ] Can switch between ports easily

**Test commands:**

```bash
# 1. Test migration
sqlite3 ~/.memctx/db.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'graph_%'"

# 2. Test extraction
curl -X POST http://localhost:3333/api/graph/test-project/extract \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "your-session-id"}'

# 3. Test graph retrieval
curl http://localhost:3333/api/graph/test-project | jq

# 4. Check logs
tail -f /tmp/memctx.log | grep Graph
```

---

### Step 11: Commit Strategy

**Small, atomic commits:**

```bash
# Commit 1: Database schema
git add src/db/migrations/009_add_graph_tables.sql
git commit -m "feat(graph): add database schema for knowledge graph

- Add graph_nodes table
- Add graph_edges table
- Add indexes for performance"

# Commit 2: Feature flag system
git add src/config.ts src/bin/claudectx.ts
git commit -m "feat(graph): add feature flag system

- Add ENABLE_GRAPH environment variable
- Add --enable-graph CLI flag
- Add graphPort configuration"

# Commit 3: Graph queries
git add src/db/graph-queries.ts
git commit -m "feat(graph): add graph database queries

- insertNode, insertEdge
- getProjectNodes, getProjectEdges
- getNode helper"

# Commit 4: Graph extractor
git add src/services/graph/
git commit -m "feat(graph): add basic graph extractor

- Extract files from transcripts
- Create nodes and edges
- EXTRACTED confidence level"

# Commit 5: Graph API
git add src/api/graph/
git commit -m "feat(graph): add graph API endpoints

- GET /:projectId - get project graph
- POST /:projectId/extract - extract from session
- Feature flag protected"

# Commit 6: Integration
git add src/index.ts
git commit -m "feat(graph): integrate graph routes into main server

- Mount /api/graph routes
- Only when feature flag enabled
- Log when graph features active"
```

**DO NOT push to remote yet** - keep it local for testing

---

### Step 12: Version Strategy

**Current state:**
- `main` branch: v1.0.10 (stable, published)
- `feature/knowledge-graph` branch: v1.0.10-graph.0 (local only)

**Version progression:**

```
v1.0.10           (current, stable)
  ↓
v1.0.10-graph.0   (feature branch, local testing)
  ↓
v1.0.10-graph.1   (after Phase 1 complete)
  ↓
v1.0.10-graph.2   (after Phase 2 complete)
  ↓
v2.0.0-beta.1     (ready for wider testing)
  ↓
v2.0.0            (merge to main, publish)
```

**Update package.json in feature branch:**

```json
{
  "name": "memctx",
  "version": "1.0.10-graph.0",
  "description": "Autonomous session memory for Claude Code with knowledge graphs (BETA)"
}
```

---

### Step 13: Testing Workflow

**Daily testing routine:**

```bash
# Morning: Start fresh
cd artifacts/claudectx-backup
git checkout feature/knowledge-graph
git pull origin feature/knowledge-graph  # If pushed to remote

# Build
pnpm run build

# Start on test port
PORT=3333 ENABLE_GRAPH=true node dist/src/index.js &
TEST_PID=$!

# Run tests
npm test  # If you have tests

# Manual testing
curl http://localhost:3333/api/graph/test-project

# Evening: Stop test server
kill $TEST_PID

# Commit progress
git add .
git commit -m "wip: progress on graph feature"
```

---

### Step 14: Rollback Plan

**If something breaks:**

```bash
# Option 1: Revert to main
git checkout main
pnpm run build
memctx restart  # Back to stable v1.0.10

# Option 2: Stash changes
git checkout feature/knowledge-graph
git stash
pnpm run build
PORT=3333 node dist/src/index.js  # Test without graph

# Option 3: Reset to specific commit
git log --oneline  # Find good commit
git reset --hard <commit-hash>
pnpm run build
```

**Database rollback:**

```bash
# If migration breaks something
sqlite3 ~/.memctx/db.sqlite "DROP TABLE IF EXISTS graph_nodes"
sqlite3 ~/.memctx/db.sqlite "DROP TABLE IF EXISTS graph_edges"

# Restart with clean state
memctx restart
```

---

### Step 15: Documentation Updates

**Update README.md in feature branch:**

```markdown
# MemCTX v2.0.0-beta (Knowledge Graph Edition)

## New Features (BETA)

### Knowledge Graph
- Extract concepts from sessions
- Visualize relationships
- Query across sessions
- Find surprising connections

### Enable Graph Features

```bash
# Install
npm install -g memctx@2.0.0-beta

# Start with graphs enabled
memctx start --enable-graph

# Access graph UI
open http://localhost:9999/graph
```

### Graph API

```bash
# Extract graph from session
curl -X POST http://localhost:9999/api/graph/PROJECT_ID/extract \
  -d '{"sessionId": "SESSION_ID"}'

# Get project graph
curl http://localhost:9999/api/graph/PROJECT_ID
```
```

---

### Step 16: Merge Criteria

**Before merging to main, ensure:**

- [ ] All tests pass
- [ ] No breaking changes to existing features
- [ ] Feature flag works correctly
- [ ] Documentation is complete
- [ ] Migration is reversible
- [ ] Performance is acceptable
- [ ] Security review done
- [ ] At least 2 weeks of local testing
- [ ] User feedback collected (if beta testers available)

---

### Step 17: Release Process

**When ready to release:**

```bash
# 1. Merge feature branch to main
git checkout main
git merge feature/knowledge-graph

# 2. Update version
# Edit package.json: "version": "2.0.0"

# 3. Build
pnpm run build

# 4. Test one more time
PORT=9999 ENABLE_GRAPH=true node dist/src/index.js
# Verify everything works

# 5. Commit version bump
git add package.json
git commit -m "chore: bump version to 2.0.0

- Knowledge graph features
- Feature flag system
- Backward compatible"

# 6. Tag release
git tag -a v2.0.0 -m "Release v2.0.0: Knowledge Graph Edition"

# 7. Push
git push origin main
git push origin v2.0.0

# 8. Publish to npm
npm publish

# 9. Announce
# - GitHub release notes
# - Update documentation
# - Social media / blog post
```

---

## Quick Reference Commands

### Development

```bash
# Switch to feature branch
git checkout feature/knowledge-graph

# Build
pnpm run build

# Test locally (port 3333)
PORT=3333 ENABLE_GRAPH=true node dist/src/index.js

# Test API
curl http://localhost:3333/api/graph/test-project
```

### Production (after release)

```bash
# Install
npm install -g memctx@2.0.0

# Start with graphs
memctx start --enable-graph

# Start without graphs (default)
memctx start
```

### Troubleshooting

```bash
# Check which version
memctx --version

# Check if graph tables exist
sqlite3 ~/.memctx/db.sqlite "SELECT name FROM sqlite_master WHERE type='table'"

# Check logs
tail -f /tmp/memctx.log

# Reset database (DANGER)
rm ~/.memctx/db.sqlite
memctx restart
```

---

## Summary

✅ **Single package** - memctx includes both session tracking and graphs
✅ **Feature flag** - Graphs disabled by default, opt-in with `--enable-graph`
✅ **Port strategy** - Test on 3333, production on 9999
✅ **Branch strategy** - feature/knowledge-graph → main
✅ **No breaking changes** - Existing users unaffected
✅ **Local testing first** - No npm publish until fully tested
✅ **Atomic commits** - Small, reviewable changes
✅ **Rollback plan** - Easy to revert if needed

---

**Next Step**: Create the feature branch and start with Step 1!

```bash
cd artifacts/claudectx-backup
git checkout -b feature/knowledge-graph
git status
```

