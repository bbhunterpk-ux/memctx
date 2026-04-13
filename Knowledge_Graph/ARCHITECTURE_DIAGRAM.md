# Knowledge Graph Architecture - Visual Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MemCTX System                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │ Production   │         │ Development  │                      │
│  │ Port 9999    │         │ Port 3333    │                      │
│  │ (npm package)│         │ (local build)│                      │
│  └──────┬───────┘         └──────┬───────┘                      │
│         │                        │                               │
│         │                        │ ← Test new features here      │
│         │                        │                               │
│  ┌──────▼────────────────────────▼───────┐                      │
│  │         Express.js Server              │                      │
│  │  ┌──────────────────────────────────┐  │                      │
│  │  │  Existing Routes                 │  │                      │
│  │  │  • /api/sessions                 │  │                      │
│  │  │  • /api/projects                 │  │                      │
│  │  │  • /api/logs                     │  │                      │
│  │  └──────────────────────────────────┘  │                      │
│  │  ┌──────────────────────────────────┐  │                      │
│  │  │  NEW: Graph Routes               │  │                      │
│  │  │  • GET /api/graph/:projectId     │  │                      │
│  │  │  • POST /api/graph/:projectId/   │  │                      │
│  │  │    extract/:sessionId            │  │                      │
│  │  │  • GET /api/graph/:projectId/    │  │                      │
│  │  │    search?q=query                │  │                      │
│  │  │  • DELETE /api/graph/:projectId  │  │                      │
│  │  └──────────────────────────────────┘  │                      │
│  └────────────────┬───────────────────────┘                      │
│                   │                                               │
│  ┌────────────────▼───────────────────────┐                      │
│  │      Services Layer                    │                      │
│  │  ┌──────────────────────────────────┐  │                      │
│  │  │  GraphExtractor                  │  │                      │
│  │  │  • extractFromTranscript()       │  │                      │
│  │  │  • Uses Claude API               │  │                      │
│  │  │  • Returns nodes + edges         │  │                      │
│  │  └──────────────────────────────────┘  │                      │
│  └────────────────┬───────────────────────┘                      │
│                   │                                               │
│  ┌────────────────▼───────────────────────┐                      │
│  │      Database Layer (SQLite)           │                      │
│  │  ┌──────────────────────────────────┐  │                      │
│  │  │  Existing Tables                 │  │                      │
│  │  │  • projects                      │  │                      │
│  │  │  • sessions                      │  │                      │
│  │  │  • messages                      │  │                      │
│  │  └──────────────────────────────────┘  │                      │
│  │  ┌──────────────────────────────────┐  │                      │
│  │  │  NEW: Graph Tables               │  │                      │
│  │  │  • graph_nodes                   │  │                      │
│  │  │  │  - id, projectId, label       │  │                      │
│  │  │  │  - type, confidence           │  │                      │
│  │  │  • graph_edges                   │  │                      │
│  │  │  │  - id, projectId              │  │                      │
│  │  │  │  - sourceId, targetId         │  │                      │
│  │  │  │  - relationship, weight       │  │                      │
│  │  └──────────────────────────────────┘  │                      │
│  └────────────────────────────────────────┘                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Existing Pages                                          │   │
│  │  • Dashboard                                             │   │
│  │  • Sessions List                                         │   │
│  │  • Session Detail                                        │   │
│  │  • Logs                                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NEW: GraphViewer Component                              │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Controls                                          │  │   │
│  │  │  [Extract] [Refresh] [Search]                      │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  vis-network Canvas                                │  │   │
│  │  │                                                    │  │   │
│  │  │     ●────────●                                     │  │   │
│  │  │     │        │                                     │  │   │
│  │  │     ●        ●────●                                │  │   │
│  │  │              │    │                                │  │   │
│  │  │              ●────●                                │  │   │
│  │  │                                                    │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Legend                                            │  │   │
│  │  │  🔵 File  🟢 Function  🟣 Class  🟠 Concept        │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Graph Extraction

```
┌─────────────┐
│   User      │
│   Clicks    │
│  "Extract"  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  POST /api/graph/:projectId/extract/:sessionId          │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  1. Fetch session transcript from database              │
│     SELECT * FROM sessions WHERE id = :sessionId        │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  2. GraphExtractor.extractFromTranscript()              │
│     • Send transcript to Claude API                     │
│     • Prompt: "Extract knowledge graph..."              │
│     • Parse JSON response                               │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  3. Claude API Response                                 │
│     {                                                   │
│       "nodes": [                                        │
│         {                                               │
│           "id": "file:src/index.ts",                    │
│           "label": "index.ts",                          │
│           "type": "file",                               │
│           "confidence": "EXTRACTED"                     │
│         },                                              │
│         {                                               │
│           "id": "concept:authentication",               │
│           "label": "Authentication",                    │
│           "type": "concept",                            │
│           "confidence": "INFERRED"                      │
│         }                                               │
│       ],                                                │
│       "edges": [                                        │
│         {                                               │
│           "sourceId": "file:src/index.ts",              │
│           "targetId": "concept:authentication",         │
│           "relationship": "implements",                 │
│           "confidence": "EXTRACTED"                     │
│         }                                               │
│       ]                                                 │
│     }                                                   │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  4. Save to database                                    │
│     INSERT INTO graph_nodes (id, projectId, label, ...) │
│     INSERT INTO graph_edges (id, sourceId, targetId...) │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  5. Return success                                      │
│     { success: true, data: { nodesAdded: 2, ... } }     │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  6. Frontend reloads graph                              │
│     GET /api/graph/:projectId                           │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  7. vis-network renders visualization                   │
│     • Nodes positioned by physics simulation            │
│     • Edges drawn with arrows                           │
│     • Colors by node type                               │
└─────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌──────────────────┐
│    projects      │
│  ┌────────────┐  │
│  │ id (PK)    │◄─┼─────────────┐
│  │ name       │  │             │
│  │ path       │  │             │
│  └────────────┘  │             │
└──────────────────┘             │
                                 │
┌──────────────────┐             │
│    sessions      │             │
│  ┌────────────┐  │             │
│  │ id (PK)    │  │             │
│  │ projectId  │──┼─────────────┘
│  │ transcript │  │
│  │ status     │  │
│  └────────────┘  │
└──────────────────┘
                                 
┌──────────────────┐             
│  graph_nodes     │             
│  ┌────────────┐  │             
│  │ id (PK)    │◄─┼─────────────┐
│  │ projectId  │──┼─────────────┼─────────────┐
│  │ label      │  │             │             │
│  │ type       │  │             │             │
│  │ confidence │  │             │             │
│  └────────────┘  │             │             │
└──────────────────┘             │             │
                                 │             │
┌──────────────────┐             │             │
│  graph_edges     │             │             │
│  ┌────────────┐  │             │             │
│  │ id (PK)    │  │             │             │
│  │ projectId  │──┼─────────────┘             │
│  │ sourceId   │──┼───────────────────────────┘
│  │ targetId   │──┼───────────────────────────┐
│  │ relationship│  │                           │
│  │ confidence │  │                           │
│  │ weight     │  │                           │
│  └────────────┘  │                           │
└──────────────────┘                           │
         │                                     │
         └─────────────────────────────────────┘
```

## Node Types and Colors

```
┌─────────────────────────────────────────────────────────┐
│  Node Type      │  Color   │  Shape  │  Example         │
├─────────────────────────────────────────────────────────┤
│  file           │  🔵 Blue │  Box    │  src/index.ts    │
│  function       │  🟢 Green│  Dot    │  handleRequest() │
│  class          │  🟣 Purple│ Dot    │  UserService     │
│  concept        │  🟠 Amber│  Dot    │  Authentication  │
│  problem        │  🔴 Red  │  Dot    │  Memory leak     │
│  decision       │  🔵 Cyan │  Dot    │  Use Redis       │
└─────────────────────────────────────────────────────────┘
```

## Edge Types and Relationships

```
┌─────────────────────────────────────────────────────────┐
│  Relationship   │  Example                              │
├─────────────────────────────────────────────────────────┤
│  imports        │  index.ts ──imports──> utils.ts       │
│  calls          │  main() ──calls──> helper()           │
│  extends        │  UserService ──extends──> BaseService │
│  implements     │  auth.ts ──implements──> JWT concept  │
│  solves         │  Fix ──solves──> Bug                  │
│  related_to     │  Concept A ──related_to──> Concept B  │
└─────────────────────────────────────────────────────────┘
```

## Confidence Levels

```
┌─────────────────────────────────────────────────────────┐
│  Level      │  Meaning              │  Edge Opacity    │
├─────────────────────────────────────────────────────────┤
│  EXTRACTED  │  Explicitly mentioned │  0.7 (solid)     │
│  INFERRED   │  Implied by context   │  0.7 (solid)     │
│  AMBIGUOUS  │  Unclear/uncertain    │  0.3 (faded)     │
└─────────────────────────────────────────────────────────┘
```

## Development vs Production

```
┌─────────────────────────────────────────────────────────┐
│                    Development (Port 3333)              │
├─────────────────────────────────────────────────────────┤
│  • Local build from source                              │
│  • Test new features                                    │
│  • Iterate quickly                                      │
│  • Same database (/tmp/memctx.db)                       │
│  • Start: PORT=3333 node dist/src/index.js              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Production (Port 9999)               │
├─────────────────────────────────────────────────────────┤
│  • Installed npm package (memctx)                       │
│  • Stable version                                       │
│  • Always available                                     │
│  • Same database (/tmp/memctx.db)                       │
│  • Start: memctx (or memctx start)                      │
└─────────────────────────────────────────────────────────┘

Both can run simultaneously - they share the database but use
different ports, so you can test new features without breaking
your production workflow.
```

## File Structure

```
Claude-Context/
├── artifacts/
│   └── claudectx-backup/
│       ├── src/
│       │   ├── index.ts                    (main server)
│       │   ├── routes/
│       │   │   ├── sessions.ts             (existing)
│       │   │   ├── projects.ts             (existing)
│       │   │   └── graph.ts                (NEW)
│       │   ├── services/
│       │   │   └── graph-extractor.ts      (NEW)
│       │   └── db/
│       │       ├── schema.ts               (add graph tables)
│       │       ├── queries.ts              (existing)
│       │       └── graph-queries.ts        (NEW)
│       ├── dashboard/
│       │   └── src/
│       │       ├── App.tsx                 (add graph route)
│       │       └── components/
│       │           └── GraphViewer.tsx     (NEW)
│       └── migrations/
│           └── 009_add_graph_tables.sql    (NEW)
├── LOCAL_TESTING_SETUP.md                  (implementation guide)
├── GRAPH_FEATURE_CHECKLIST.md              (this checklist)
├── GRAPHIFY_INTEGRATION_GUIDE.md           (comprehensive reference)
└── GRAPH_INTEGRATION_PLAN.md               (detailed plan)
```

## Quick Start Commands

```bash
# 1. Create branch
git checkout -b feature/knowledge-graph

# 2. Build
pnpm run build

# 3. Run dev server
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js

# 4. Test
curl http://localhost:3333/api/health

# 5. Open browser
# Dev:  http://localhost:3333
# Prod: http://localhost:9999
```

---

**Next:** Follow GRAPH_FEATURE_CHECKLIST.md phase by phase
