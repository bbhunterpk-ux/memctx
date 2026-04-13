# Graphify Quick Start for MemCTX

**TL;DR**: Add knowledge graphs to MemCTX in 3 steps

---

## What You Get

- **Cross-session connections**: See how concepts relate across different sessions
- **71x token savings**: Query the graph instead of reading raw transcripts
- **Automatic insights**: Find surprising connections and architectural patterns
- **Interactive visualization**: Explore your work as a navigable graph

---

## 3-Step Integration

### Step 1: Database (5 minutes)

```bash
cd artifacts/claudectx-backup
sqlite3 ~/.memctx/db.sqlite < migrations/009_add_graph_tables.sql
```

### Step 2: Dependencies (5 minutes)

```bash
# Frontend
npm install vis-network

# Backend (Python for clustering)
pip3 install networkx graspologic
```

### Step 3: Basic Extraction (30 minutes)

Create `src/services/graph-extractor.ts`:

```typescript
export async function extractFromSession(sessionId: string) {
  const session = await getSession(sessionId)
  const transcript = await readTranscript(session.transcript_path)
  
  // Extract files mentioned
  const fileRegex = /(?:Read|Write|Edit).*?file_path["\s:]+([^\s"]+)/g
  const files = [...transcript.matchAll(fileRegex)].map(m => m[1])
  
  const nodes = files.map(file => ({
    id: file.replace(/[^a-z0-9]/gi, '_'),
    label: file.split('/').pop(),
    type: 'file',
    session_id: sessionId,
    project_id: session.project_id
  }))
  
  const edges = files.map(file => ({
    source: `session_${sessionId}`,
    target: file.replace(/[^a-z0-9]/gi, '_'),
    relation: 'modifies',
    confidence: 'EXTRACTED'
  }))
  
  // Save to database
  for (const node of nodes) {
    graphQueries.insertNode(node)
  }
  for (const edge of edges) {
    graphQueries.insertEdge(edge)
  }
}
```

---

## Test It

```bash
# Extract graph from a session
curl -X POST http://localhost:9999/api/graph/extract \
  -d '{"sessionId": "your-session-id"}'

# View the graph
curl http://localhost:9999/api/graph/your-project-id | jq
```

---

## Next Steps

1. **Add visualization** - See section 8 in full guide
2. **Enable clustering** - See section 10 in full guide
3. **Auto-extract on session end** - See section 5 in full guide

---

## Full Documentation

See `GRAPHIFY_INTEGRATION_GUIDE.md` for:
- Complete implementation phases (4-7 weeks)
- Frontend components with code
- API design and endpoints
- Security considerations
- Performance optimization
- Troubleshooting guide

---

## Architecture Overview

```
Session → Extract → Build Graph → Cluster → Visualize
   ↓         ↓          ↓            ↓          ↓
Transcript  Nodes    NetworkX    Communities  HTML
           Edges                  (Leiden)
```

---

## Key Files to Create

```
src/services/graph-extractor.ts    # Extract nodes/edges
src/services/graph-builder.ts      # Build graph
src/api/graph.ts                   # API endpoints
src/db/graph-queries.ts            # Database queries
scripts/cluster_graph.py           # Clustering
dashboard/src/pages/GraphPage.tsx  # Visualization
```

---

## Estimated Effort

- **Minimal (basic extraction)**: 1 day
- **Full integration**: 4-7 weeks
- **Maintenance**: Low (mostly automatic)

---

## Questions?

Read the full guide: `GRAPHIFY_INTEGRATION_GUIDE.md`
Original project: https://github.com/safishamsi/graphify

