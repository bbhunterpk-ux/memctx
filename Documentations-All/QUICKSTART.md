# ClaudeContext - Quick Start Guide

## 🚀 Current Status

**System**: ✅ FULLY OPERATIONAL  
**Worker**: Running at http://localhost:8000 (PID 227815)  
**Database**: ~/.claudectx/db.sqlite (4KB)  
**Dashboard**: http://localhost:8000

---

## ⚡ Quick Commands

### Check Status
```bash
# Health check
curl http://localhost:8000/api/health | jq

# View sessions
curl http://localhost:8000/api/sessions | jq

# Open dashboard
open http://localhost:8000  # macOS
xdg-open http://localhost:8000  # Linux
```

### Start/Stop Worker
```bash
# Start worker
cd artifacts/claudectx-backup
PORT=8000 node dist/src/index.js &

# Stop worker
pkill -f "node dist/src/index.js"

# Check if running
ps aux | grep "node dist/src/index.js" | grep -v grep
```

### Rebuild (if needed)
```bash
cd artifacts/claudectx-backup

# Rebuild worker
pnpm run build:worker

# Rebuild dashboard
cd dashboard && pnpm run build
```

---

## 📋 Installation Steps (Not Yet Done)

### 1. Install Hooks
```bash
cd artifacts/claudectx-backup
node dist/bin/claudectx.js install
```

This will patch `~/.claude/settings.json` with 6 hooks.

### 2. Set API Key
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Start as Daemon
```bash
# Option A: Using PM2
pm2 start dist/src/index.js --name claudectx

# Option B: Using the CLI
node dist/bin/claudectx.js start

# Option C: Manual
PORT=8000 node dist/src/index.js > /tmp/claudectx.log 2>&1 &
```

### 4. Test with Claude Code
```bash
# Start a new Claude Code session
claude

# The hooks will automatically:
# - Inject context from previous sessions
# - Log all tool calls
# - Summarize on exit
```

---

## 🔍 API Endpoints

```bash
# Health check
GET /api/health

# List all sessions
GET /api/sessions

# Get session details
GET /api/sessions/:id

# List all projects
GET /api/projects

# Get project details
GET /api/projects/:id

# Search observations
POST /api/search
{"query": "search term", "project_id": "optional"}

# Get context for injection
GET /api/context?cwd=/path/to/project&n=3

# List observations
GET /api/observations?session_id=xxx&limit=100

# Hook event intake
POST /api/hook
{"event": "SessionStart", "session_id": "xxx", "cwd": "/path"}
```

---

## 📊 Database Queries

```bash
# Connect to database
sqlite3 ~/.claudectx/db.sqlite

# View all sessions
SELECT id, status, total_tool_calls, started_at FROM sessions;

# View all projects
SELECT id, name, root_path FROM projects;

# View recent observations
SELECT event_type, tool_name, file_path, created_at 
FROM observations 
ORDER BY created_at DESC 
LIMIT 10;

# Full-text search
SELECT * FROM obs_fts WHERE obs_fts MATCH 'search term';
```

---

## 🐛 Troubleshooting

### Worker won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Check logs
tail -f /tmp/claudectx.log

# Verify database exists
ls -lh ~/.claudectx/db.sqlite
```

### Dashboard not loading
```bash
# Verify dashboard is built
ls -la artifacts/claudectx-backup/dashboard/dist/

# Check worker logs for errors
curl http://localhost:8000/api/health

# Rebuild dashboard if needed
cd artifacts/claudectx-backup/dashboard
pnpm run build
```

### Hooks not firing
```bash
# Check if hooks are installed
cat ~/.claude/settings.json | jq '.hooks'

# Verify hook scripts exist
ls -la ~/.claudectx/hooks/

# Test hook manually
echo '{"session_id":"test","cwd":"'$(pwd)'"}' | node ~/.claudectx/hooks/session-start.js
```

### AI Summaries not working
```bash
# Check if API key is set
echo $ANTHROPIC_API_KEY

# Check health endpoint
curl http://localhost:8000/api/health | jq '.api_key'

# Set API key
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 📁 Important Paths

```
~/.claudectx/                    # Data directory
├── db.sqlite                    # SQLite database
├── db.sqlite-shm                # Shared memory file
├── db.sqlite-wal                # Write-ahead log
├── hooks/                       # Installed hook scripts
│   ├── session-start.js
│   ├── session-end.js
│   ├── post-tool-use.js
│   ├── user-prompt-submit.js
│   ├── stop.js
│   └── pre-compact.js
└── logs/                        # Log files (if configured)

~/.claude/
├── settings.json                # Claude Code settings (hooks config)
└── projects/                    # Claude Code transcripts (watched)
```

---

## 🎯 Test Data

Current test session in database:
- **Session ID**: test-session-001
- **Project**: Claude-Context (c6d8edec13ba353f)
- **Status**: active
- **Tool Calls**: 1 (Write to src/test.ts)
- **Files Touched**: ["src/test.ts"]

---

## 📚 Documentation

- **STATUS.md** - Full project status report
- **Docs/ClaudeContext_PRD.md** - Complete PRD (12,748 lines)
- **Docs/Project_details.md** - Architecture overview

---

## 🔗 Quick Links

- Dashboard: http://localhost:8000
- Health Check: http://localhost:8000/api/health
- Sessions API: http://localhost:8000/api/sessions
- Search: http://localhost:8000/search
- Live Feed: http://localhost:8000/live

---

## ⚙️ Configuration

Edit `artifacts/claudectx-backup/src/config.ts`:

```typescript
export const CONFIG = {
  port: 8000,                      // Worker port
  defaultContextSessions: 3,       // Sessions to inject
  maxContextTokens: 2000,          // Max tokens for context
  summaryModel: 'claude-haiku-4-5-20251001',
  summaryMaxTokens: 1500,
}
```

Environment variables:
- `PORT` or `CLAUDECTX_PORT` - Worker port
- `ANTHROPIC_API_KEY` - API key for summaries
- `CLAUDECTX_SESSIONS` - Number of sessions to inject
- `CLAUDECTX_DISABLE_SUMMARIES` - Set to '1' to disable

---

## 🎉 Success Checklist

- [x] Worker service built and compiled
- [x] Dashboard built with Vite
- [x] Database initialized with schema
- [x] All API endpoints tested
- [x] Worker running on port 8000
- [x] Dashboard accessible
- [x] Test session created
- [ ] Hooks installed in ~/.claude/settings.json
- [ ] API key configured
- [ ] Tested with real Claude Code session
- [ ] Context injection verified

---

**Last Updated**: 2026-04-02 02:59 UTC  
**Status**: System operational, ready for hook installation
