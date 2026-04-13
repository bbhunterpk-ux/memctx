# Knowledge Graph - Quick Command Reference

## 🚀 Getting Started

```bash
# Navigate to project
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context

# Read documentation
cat START_HERE.md                    # Overview (5 min)
cat LOCAL_TESTING_SETUP.md           # Implementation guide (15 min)

# Create feature branch
git checkout -b feature/knowledge-graph
```

## 🔨 Development Commands

### Build & Run
```bash
# Build project
pnpm run build

# Run development server (port 3333)
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js

# Run with API key
ANTHROPIC_API_KEY=sk-ant-... PORT=3333 node artifacts/claudectx-backup/dist/src/index.js

# Production server (port 9999) - already running
memctx
```

### Database Operations
```bash
# Apply migration
sqlite3 /tmp/memctx.db < artifacts/claudectx-backup/migrations/009_add_graph_tables.sql

# Check tables exist
sqlite3 /tmp/memctx.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'graph_%';"

# Count nodes
sqlite3 /tmp/memctx.db "SELECT COUNT(*) FROM graph_nodes;"

# Count edges
sqlite3 /tmp/memctx.db "SELECT COUNT(*) FROM graph_edges;"

# View sample nodes
sqlite3 /tmp/memctx.db "SELECT * FROM graph_nodes LIMIT 5;"

# Delete all graph data
sqlite3 /tmp/memctx.db "DELETE FROM graph_edges; DELETE FROM graph_nodes;"
```

## 🧪 Testing Commands

### Health Checks
```bash
# Test development server
curl http://localhost:3333/api/health

# Test production server
curl http://localhost:9999/api/health
```

### API Testing
```bash
# Get project ID (replace with your actual project)
PROJECT_ID="your-project-id"

# Get session ID (replace with your actual session)
SESSION_ID="your-session-id"

# Extract graph from session
curl -X POST http://localhost:3333/api/graph/$PROJECT_ID/extract/$SESSION_ID

# Fetch graph for project
curl http://localhost:3333/api/graph/$PROJECT_ID

# Search graph nodes
curl "http://localhost:3333/api/graph/$PROJECT_ID/search?q=authentication"

# Delete graph for project
curl -X DELETE http://localhost:3333/api/graph/$PROJECT_ID
```

### Get IDs for Testing
```bash
# Get all projects
curl http://localhost:3333/api/projects | jq

# Get sessions for a project
curl "http://localhost:3333/api/sessions?projectId=$PROJECT_ID" | jq

# Get latest session ID
curl "http://localhost:3333/api/sessions?projectId=$PROJECT_ID" | jq -r '.[0].id'
```

## 🐛 Troubleshooting Commands

### Port Issues
```bash
# Check what's using port 3333
lsof -i :3333

# Kill process on port 3333
lsof -i :3333 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Check what's using port 9999
lsof -i :9999
```

### Process Management
```bash
# Find node processes
ps aux | grep node

# Kill specific process
kill -9 <PID>

# Kill all node processes (careful!)
pkill -9 node
```

### Build Issues
```bash
# Clean build
rm -rf artifacts/claudectx-backup/dist

# Rebuild
pnpm run build

# Type check
cd artifacts/claudectx-backup
pnpm run type-check

# Check for console.log
grep -r "console.log" artifacts/claudectx-backup/src/
```

### Database Issues
```bash
# Backup database
cp /tmp/memctx.db /tmp/memctx.db.backup

# Restore database
cp /tmp/memctx.db.backup /tmp/memctx.db

# Check database integrity
sqlite3 /tmp/memctx.db "PRAGMA integrity_check;"

# View schema
sqlite3 /tmp/memctx.db ".schema graph_nodes"
sqlite3 /tmp/memctx.db ".schema graph_edges"
```

## 📦 Git Commands

### Branch Management
```bash
# Create feature branch
git checkout -b feature/knowledge-graph

# Check current branch
git branch

# View changes
git status
git diff

# Stage changes
git add .

# Commit changes
git commit -m "feat: add knowledge graph feature"

# Push branch
git push origin feature/knowledge-graph
```

### Merging to Main
```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge feature branch
git merge feature/knowledge-graph

# Push to remote
git push origin main
```

## 📤 Publishing Commands

### Version Management
```bash
# Check current version
cat artifacts/claudectx-backup/package.json | grep version

# Bump version (edit package.json manually)
# Change "version": "1.0.7" to "1.0.8"

# Commit version bump
git add artifacts/claudectx-backup/package.json
git commit -m "chore: bump version to 1.0.8"
```

### Build & Publish
```bash
# Build production
pnpm run build

# Navigate to package
cd artifacts/claudectx-backup

# Publish to npm
npm publish

# Go back to root
cd ../..
```

### Install & Verify
```bash
# Uninstall old version
npm uninstall -g memctx

# Install new version
npm install -g memctx@1.0.8

# Verify version
memctx --version

# Start service
memctx
```

## 🔍 Monitoring Commands

### Logs
```bash
# View worker logs
tail -f /tmp/memctx.log

# View dashboard logs
# (check browser console)

# View API logs
# (check terminal where server is running)
```

### System Info
```bash
# Check disk space
df -h /tmp

# Check memory usage
free -h

# Check CPU usage
top -n 1 | head -20
```

## 📊 Testing Workflow

### Complete Test Sequence
```bash
# 1. Build
pnpm run build

# 2. Start dev server
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js &

# 3. Wait for startup
sleep 2

# 4. Health check
curl http://localhost:3333/api/health

# 5. Get project ID
PROJECT_ID=$(curl -s http://localhost:3333/api/projects | jq -r '.[0].id')

# 6. Get session ID
SESSION_ID=$(curl -s "http://localhost:3333/api/sessions?projectId=$PROJECT_ID" | jq -r '.[0].id')

# 7. Extract graph
curl -X POST http://localhost:3333/api/graph/$PROJECT_ID/extract/$SESSION_ID

# 8. Fetch graph
curl http://localhost:3333/api/graph/$PROJECT_ID | jq

# 9. Search graph
curl "http://localhost:3333/api/graph/$PROJECT_ID/search?q=test" | jq

# 10. Open in browser
open http://localhost:3333/graph/$PROJECT_ID
```

## 🎯 Quick Reference

### File Locations
```bash
# Migration
artifacts/claudectx-backup/migrations/009_add_graph_tables.sql

# Services
artifacts/claudectx-backup/src/services/graph-extractor.ts

# Queries
artifacts/claudectx-backup/src/db/graph-queries.ts

# Routes
artifacts/claudectx-backup/src/routes/graph.ts

# Component
artifacts/claudectx-backup/dashboard/src/components/GraphViewer.tsx

# Database
/tmp/memctx.db

# Logs
/tmp/memctx.log
```

### URLs
```bash
# Development
http://localhost:3333
http://localhost:3333/api/health
http://localhost:3333/graph/PROJECT_ID

# Production
http://localhost:9999
http://localhost:9999/api/health
http://localhost:9999/graph/PROJECT_ID
```

### Environment Variables
```bash
# Required
export ANTHROPIC_API_KEY=sk-ant-...

# Optional
export PORT=3333
export NODE_ENV=development
```

## 💡 One-Liners

```bash
# Quick rebuild and restart
pnpm run build && PORT=3333 node artifacts/claudectx-backup/dist/src/index.js

# Test all endpoints
for endpoint in health projects sessions; do curl http://localhost:3333/api/$endpoint; done

# Count graph data
sqlite3 /tmp/memctx.db "SELECT 'Nodes:', COUNT(*) FROM graph_nodes UNION ALL SELECT 'Edges:', COUNT(*) FROM graph_edges;"

# Clean and rebuild
rm -rf artifacts/claudectx-backup/dist && pnpm run build

# Full reset (careful!)
sqlite3 /tmp/memctx.db "DELETE FROM graph_edges; DELETE FROM graph_nodes;" && echo "Graph data cleared"
```

## 📋 Checklist Commands

```bash
# Phase 1: Database
sqlite3 /tmp/memctx.db < artifacts/claudectx-backup/migrations/009_add_graph_tables.sql
sqlite3 /tmp/memctx.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'graph_%';"

# Phase 2: Extractor
# (write code, then test)
pnpm run build

# Phase 3: Queries
# (write code, then test)
pnpm run build

# Phase 4: API
pnpm run build
PORT=3333 node artifacts/claudectx-backup/dist/src/index.js
curl http://localhost:3333/api/health

# Phase 5: Frontend
cd artifacts/claudectx-backup/dashboard
pnpm add vis-network vis-data
pnpm add -D @types/vis-network
cd ../../..
pnpm run build
```

---

**Print this page for quick reference while coding!**

**Documentation:** See START_HERE.md for complete guide  
**Implementation:** See LOCAL_TESTING_SETUP.md for code examples  
**Progress:** See GRAPH_FEATURE_CHECKLIST.md for tracking
