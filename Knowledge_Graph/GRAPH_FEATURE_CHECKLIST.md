# Knowledge Graph Feature - Implementation Checklist

## ✅ Pre-Implementation

- [ ] Read LOCAL_TESTING_SETUP.md
- [ ] Understand dual-port strategy (3333 dev, 9999 prod)
- [ ] Verify ANTHROPIC_API_KEY is set
- [ ] Backup current database: `cp /tmp/memctx.db /tmp/memctx.db.backup`

## 📋 Phase 1: Database Schema (Day 1)

- [ ] Create feature branch: `git checkout -b feature/knowledge-graph`
- [ ] Create migration file: `artifacts/claudectx-backup/migrations/009_add_graph_tables.sql`
- [ ] Add graph_nodes table schema
- [ ] Add graph_edges table schema
- [ ] Add indexes for performance
- [ ] Test migration: `sqlite3 /tmp/memctx.db < migrations/009_add_graph_tables.sql`
- [ ] Verify tables created: `sqlite3 /tmp/memctx.db ".tables"`

## 📋 Phase 2: Graph Extractor (Day 2-3)

- [ ] Create `src/services/graph-extractor.ts`
- [ ] Implement GraphExtractor class
- [ ] Add extractFromTranscript method
- [ ] Test extraction with sample transcript
- [ ] Verify JSON parsing works
- [ ] Handle edge cases (empty transcript, malformed JSON)

## 📋 Phase 3: Database Integration (Day 3-4)

- [ ] Create `src/db/graph-queries.ts`
- [ ] Add insertGraphNodes function
- [ ] Add insertGraphEdges function
- [ ] Add getGraphForProject function
- [ ] Add searchGraphNodes function
- [ ] Add deleteGraphForProject function
- [ ] Update `src/db/schema.ts` with graph tables
- [ ] Test all query functions

## 📋 Phase 4: API Endpoints (Day 4-5)

- [ ] Create `src/routes/graph.ts`
- [ ] Add GET /api/graph/:projectId endpoint
- [ ] Add POST /api/graph/:projectId/extract/:sessionId endpoint
- [ ] Add GET /api/graph/:projectId/search endpoint
- [ ] Add DELETE /api/graph/:projectId endpoint
- [ ] Register routes in `src/index.ts`
- [ ] Test all endpoints with curl

## 📋 Phase 5: Frontend Visualization (Day 5-7)

- [ ] Install vis-network: `cd dashboard && pnpm add vis-network vis-data`
- [ ] Install types: `pnpm add -D @types/vis-network`
- [ ] Create `dashboard/src/components/GraphViewer.tsx`
- [ ] Implement graph loading logic
- [ ] Add vis-network visualization
- [ ] Add color coding by node type
- [ ] Add legend
- [ ] Add extract/refresh buttons
- [ ] Add route to App.tsx
- [ ] Add navigation link

## 🧪 Testing Phase (Day 8-9)

### Local Development Testing

- [ ] Build project: `pnpm run build`
- [ ] Start dev server: `PORT=3333 node dist/src/index.js`
- [ ] Verify production still running on 9999
- [ ] Test health endpoint: `curl http://localhost:3333/api/health`
- [ ] Get test session ID
- [ ] Extract graph from session
- [ ] Verify nodes and edges created
- [ ] Test graph visualization in browser
- [ ] Test search functionality
- [ ] Test delete functionality

### Edge Cases

- [ ] Test with empty session
- [ ] Test with very large session (>10k tokens)
- [ ] Test with malformed data
- [ ] Test concurrent extractions
- [ ] Test database constraints (foreign keys)

### Performance

- [ ] Test with 100+ nodes
- [ ] Test with 500+ edges
- [ ] Verify graph renders smoothly
- [ ] Check API response times (<2s)
- [ ] Monitor memory usage

## 🚀 Pre-Publish Checklist

- [ ] All tests passing
- [ ] No console.log statements
- [ ] No TypeScript errors: `pnpm run type-check`
- [ ] Build succeeds: `pnpm run build`
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

## 📦 Publishing

- [ ] Commit all changes: `git add . && git commit -m "feat: add knowledge graph"`
- [ ] Merge to main: `git checkout main && git merge feature/knowledge-graph`
- [ ] Push to GitHub: `git push origin main`
- [ ] Bump version: Edit package.json (1.0.7 → 1.0.8)
- [ ] Commit version: `git commit -am "chore: bump version to 1.0.8"`
- [ ] Build: `pnpm run build`
- [ ] Publish: `cd artifacts/claudectx-backup && npm publish`
- [ ] Test install: `npm uninstall -g memctx && npm install -g memctx@1.0.8`
- [ ] Verify: `memctx --version`

## 🎯 Quick Commands Reference

```bash
# Start development server
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js

# Test API
curl http://localhost:3333/api/graph/PROJECT_ID

# Extract graph
curl -X POST http://localhost:3333/api/graph/PROJECT_ID/extract/SESSION_ID

# Search nodes
curl "http://localhost:3333/api/graph/PROJECT_ID/search?q=authentication"

# Delete graph
curl -X DELETE http://localhost:3333/api/graph/PROJECT_ID

# Check database
sqlite3 /tmp/memctx.db "SELECT COUNT(*) FROM graph_nodes;"
sqlite3 /tmp/memctx.db "SELECT COUNT(*) FROM graph_edges;"

# Kill process on port
lsof -i :3333 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## 📊 Success Metrics

- [ ] Graph extraction completes in <30s for typical session
- [ ] Visualization renders 100+ nodes smoothly
- [ ] API response times <2s
- [ ] No memory leaks during extended use
- [ ] Database size remains reasonable (<100MB for 1000 sessions)

## 🐛 Known Issues / TODO

- [ ] Add full-text search for graph nodes
- [ ] Implement community detection (Leiden algorithm)
- [ ] Add graph export (JSON, GraphML)
- [ ] Add graph merge (combine multiple sessions)
- [ ] Add incremental updates (don't re-extract entire session)
- [ ] Add graph analytics (centrality, clustering coefficient)
- [ ] Add graph filtering (by type, confidence, date)
- [ ] Add graph comparison (diff between versions)

## 📚 Documentation Files

- `LOCAL_TESTING_SETUP.md` - Complete implementation guide
- `GRAPHIFY_INTEGRATION_GUIDE.md` - Comprehensive reference (18 sections)
- `GRAPH_INTEGRATION_PLAN.md` - Original detailed plan
- `GRAPH_FEATURE_CHECKLIST.md` - This file

## 🆘 Troubleshooting

### Port 3333 already in use
```bash
lsof -i :3333
kill -9 <PID>
```

### Migration not applied
```bash
sqlite3 /tmp/memctx.db < artifacts/claudectx-backup/migrations/009_add_graph_tables.sql
```

### Build fails
```bash
rm -rf artifacts/claudectx-backup/dist
pnpm run build
```

### Graph not showing
1. Check browser console for errors
2. Verify API returns data: `curl http://localhost:3333/api/graph/PROJECT_ID`
3. Check if nodes/edges exist in database
4. Verify vis-network installed: `ls node_modules/vis-network`

### Extraction fails
1. Verify ANTHROPIC_API_KEY set: `echo $ANTHROPIC_API_KEY`
2. Check API quota/limits
3. Verify session has transcript
4. Check worker logs for errors

---

**Start here:** Read LOCAL_TESTING_SETUP.md, then follow this checklist phase by phase.
