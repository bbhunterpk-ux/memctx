# Knowledge Graph Feature - Getting Started

## 📚 Documentation Overview

This directory contains complete documentation for adding knowledge graph visualization to MemCTX. Start here, then follow the guides in order.

### 🎯 Start Here

1. **ARCHITECTURE_DIAGRAM.md** - Visual overview of the system (5 min read)
2. **LOCAL_TESTING_SETUP.md** - Complete implementation guide (15 min read)
3. **GRAPH_FEATURE_CHECKLIST.md** - Step-by-step checklist (use while implementing)

### 📖 Reference Documentation

- **GRAPHIFY_INTEGRATION_GUIDE.md** - Comprehensive 18-section reference (deep dive)
- **GRAPH_INTEGRATION_PLAN.md** - Original detailed plan (alternative approach)

## 🚀 Quick Start (5 Minutes)

### 1. Understand the Setup

```
Production (Port 9999)          Development (Port 3333)
├── Installed npm package       ├── Local build from source
├── Stable version              ├── Test new features
└── Always running              └── Iterate quickly

Both share the same database (/tmp/memctx.db)
```

### 2. Create Feature Branch

```bash
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context
git checkout -b feature/knowledge-graph
```

### 3. Build and Test

```bash
# Build
pnpm run build

# Run on port 3333
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js

# Test (in another terminal)
curl http://localhost:3333/api/health
```

### 4. Verify Both Servers

```bash
# Production (should still work)
curl http://localhost:9999/api/health

# Development (new features)
curl http://localhost:3333/api/health
```

## 📋 Implementation Phases

| Phase | Duration | What You'll Build |
|-------|----------|-------------------|
| **Phase 1** | 1 day | Database schema (graph_nodes, graph_edges) |
| **Phase 2** | 2 days | Graph extractor (Claude API integration) |
| **Phase 3** | 2 days | Database queries (insert, fetch, search) |
| **Phase 4** | 2 days | API endpoints (REST API) |
| **Phase 5** | 3 days | Frontend visualization (vis-network) |
| **Testing** | 2 days | Local testing, bug fixes |
| **Total** | **12 days** | **Complete feature** |

## 🎨 What You'll Get

### Knowledge Graph Visualization

```
     [index.ts] ──imports──> [utils.ts]
         │
         │ implements
         ▼
   [Authentication] ──related_to──> [JWT]
         │
         │ solves
         ▼
    [Login Bug]
```

### Interactive Features

- **Node Types**: Files, Functions, Classes, Concepts, Problems, Decisions
- **Relationships**: imports, calls, extends, implements, solves, related_to
- **Confidence Levels**: EXTRACTED, INFERRED, AMBIGUOUS
- **Search**: Find nodes by name or type
- **Extract**: Generate graph from any session
- **Visualization**: Interactive, zoomable, color-coded

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Express.js + TypeScript | API server |
| Database | SQLite + Drizzle ORM | Data persistence |
| Extraction | Claude API (Sonnet 4.6) | Graph generation |
| Frontend | React + TypeScript | UI components |
| Visualization | vis-network | Interactive graphs |
| Build | pnpm + tsup | Package management |

## 📁 Files You'll Create

```
New Files (7 total):
├── migrations/009_add_graph_tables.sql          (Database schema)
├── src/services/graph-extractor.ts              (Claude API integration)
├── src/db/graph-queries.ts                      (Database operations)
├── src/routes/graph.ts                          (API endpoints)
└── dashboard/src/components/GraphViewer.tsx     (Visualization)

Modified Files (3 total):
├── src/db/schema.ts                             (Add graph tables)
├── src/index.ts                                 (Register routes)
└── dashboard/src/App.tsx                        (Add graph page)
```

## 🧪 Testing Strategy

### Local Testing (Port 3333)

```bash
# 1. Extract graph from session
curl -X POST http://localhost:3333/api/graph/PROJECT_ID/extract/SESSION_ID

# 2. Fetch graph
curl http://localhost:3333/api/graph/PROJECT_ID

# 3. Search nodes
curl "http://localhost:3333/api/graph/PROJECT_ID/search?q=authentication"

# 4. View in browser
open http://localhost:3333/graph/PROJECT_ID
```

### Production Verification (Port 9999)

```bash
# Ensure production still works
curl http://localhost:9999/api/sessions
curl http://localhost:9999/api/projects
```

## 🔒 Security Considerations

- ✅ Input validation on all API endpoints
- ✅ Rate limiting on extraction endpoint (expensive Claude API calls)
- ✅ Project ID verification (users can only access their projects)
- ✅ SQL injection prevention (parameterized queries via Drizzle)
- ✅ XSS prevention (sanitized graph labels)

## 📊 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Extraction time | <30s | For typical session (5k tokens) |
| Graph load time | <2s | For 100 nodes + 200 edges |
| Visualization render | <1s | Smooth 60fps interaction |
| Database size | <100MB | For 1000 sessions with graphs |
| API response time | <500ms | For fetch/search operations |

## 🐛 Common Issues

### Port 3333 Already in Use

```bash
lsof -i :3333 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Migration Not Applied

```bash
sqlite3 /tmp/memctx.db < artifacts/claudectx-backup/migrations/009_add_graph_tables.sql
```

### ANTHROPIC_API_KEY Not Set

```bash
export ANTHROPIC_API_KEY=sk-ant-...
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js
```

### Build Fails

```bash
rm -rf artifacts/claudectx-backup/dist
pnpm run build
```

## 📦 Publishing Workflow

When ready to publish:

```bash
# 1. Merge to main
git checkout main
git merge feature/knowledge-graph

# 2. Bump version
# Edit artifacts/claudectx-backup/package.json: 1.0.7 → 1.0.8

# 3. Build and publish
pnpm run build
cd artifacts/claudectx-backup
npm publish

# 4. Install new version
npm uninstall -g memctx
npm install -g memctx@1.0.8

# 5. Verify
memctx --version  # Should show 1.0.8
```

## 🎯 Success Criteria

Before merging to main:

- [ ] All 5 phases completed
- [ ] Graph extraction works for sample sessions
- [ ] Visualization renders correctly
- [ ] Search functionality works
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Tests pass (when added)
- [ ] Documentation updated
- [ ] Production (9999) still works
- [ ] Development (3333) fully functional

## 💡 Tips

1. **Test incrementally** - Don't wait until everything is done
2. **Use curl** - Test API endpoints before building UI
3. **Check logs** - Monitor console for errors
4. **Commit often** - Small commits are easier to debug
5. **Keep production running** - Always have port 9999 available

## 🆘 Need Help?

1. Check **LOCAL_TESTING_SETUP.md** for detailed instructions
2. Review **ARCHITECTURE_DIAGRAM.md** for system overview
3. Use **GRAPH_FEATURE_CHECKLIST.md** to track progress
4. Refer to **GRAPHIFY_INTEGRATION_GUIDE.md** for deep dives

## 📈 Future Enhancements

After initial release:

- [ ] Community detection (Leiden algorithm)
- [ ] Graph export (JSON, GraphML)
- [ ] Graph merge (combine multiple sessions)
- [ ] Incremental updates (don't re-extract entire session)
- [ ] Graph analytics (centrality, clustering)
- [ ] Graph filtering (by type, confidence, date)
- [ ] Graph comparison (diff between versions)
- [ ] Full-text search with FTS5

## 🎉 Let's Build!

You now have everything you need to add knowledge graph visualization to MemCTX.

**Next steps:**

1. Read ARCHITECTURE_DIAGRAM.md (5 min)
2. Read LOCAL_TESTING_SETUP.md (15 min)
3. Create feature branch
4. Follow GRAPH_FEATURE_CHECKLIST.md phase by phase

Good luck! 🚀

---

**Documentation created:** 2026-04-13  
**MemCTX version:** 1.0.7  
**Target version:** 1.0.8 (with knowledge graph)
