# 🧠 ClaudeContext - Complete User Walkthrough

**Last Updated**: 2026-04-02 03:22 UTC

---

## 🎯 What is ClaudeContext?

ClaudeContext automatically captures every Claude Code session, summarizes it with AI, and injects that context into your next session. **No more re-explaining what you did yesterday!**

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Service

```bash
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context
./start.sh
```

This will:
- ✅ Start the worker service on port 8000
- ✅ Initialize the database
- ✅ Start the dashboard
- ✅ Display the service URL

### Step 2: Open the Dashboard

```bash
# The start script will show you the URL
# Open in browser: http://localhost:8000
```

### Step 3: Use Claude Code Normally

That's it! The hooks are already installed. Just use Claude Code as normal:
- Start a new session
- Run commands, edit files
- Exit when done

**Everything is captured automatically!**

---

## 📖 Complete Walkthrough

### 1️⃣ Starting ClaudeContext

```bash
# Navigate to project
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context

# Start the service
./start.sh
```

**What happens:**
- Checks if already running (won't start duplicates)
- Verifies worker and dashboard are built
- Starts worker on port 8000
- Saves PID to `/tmp/claudectx.pid`
- Logs to `/tmp/claudectx.log`

**Expected output:**
```
╔══════════════════════════════════════════════════════════════════╗
║              🧠 ClaudeContext - Starting Service 🧠              ║
╚══════════════════════════════════════════════════════════════════╝

📋 Configuration:
   Port: 8000
   Database: ~/.claudectx/db.sqlite
   Hooks: ~/.claudectx/hooks/
   API Key: ✓ Set

🚀 Starting ClaudeContext worker...
⏳ Waiting for service to start...

╔══════════════════════════════════════════════════════════════════╗
║              ✅ ClaudeContext Started Successfully ✅              ║
╚══════════════════════════════════════════════════════════════════╝

📊 Service Information:
   PID: 12345
   Port: 8000
   Dashboard: http://localhost:8000
```

---

### 2️⃣ Using Claude Code with ClaudeContext

**Just use Claude Code normally!** The hooks work automatically.

#### What Gets Captured:

**On Session Start:**
- ✅ Context from last 3 sessions injected automatically
- ✅ Claude already knows what you did before

**During Session:**
- ✅ Every command you run (Bash, Write, Edit, Read, etc.)
- ✅ Every file you touch
- ✅ Every message you send
- ✅ All tool calls with metadata

**On Session End:**
- ✅ Full session transcript analyzed
- ✅ AI summary generated (what was done, decisions, files, next steps)
- ✅ Summary stored for next session

---

### 3️⃣ Viewing Your Sessions

#### Option A: Dashboard (Recommended)

```bash
# Open in browser
open http://localhost:8000  # macOS
xdg-open http://localhost:8000  # Linux
```

**Dashboard Features:**
- 📊 **Projects Page** - All your projects with session counts
- 📝 **Session Detail** - Full timeline of what happened
- 🔍 **Search** - Full-text search across all sessions
- 📡 **Live Feed** - Real-time view of current session
- 📈 **Charts** - Activity and token usage visualization

#### Option B: API (For Scripts)

```bash
# List all sessions
curl http://localhost:8000/api/sessions | jq

# Get specific session
curl http://localhost:8000/api/sessions/SESSION_ID | jq

# Search observations
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"authentication"}' | jq

# Get context for injection
curl "http://localhost:8000/api/context?cwd=$(pwd)" | jq
```

#### Option C: Database (Direct)

```bash
# Connect to database
sqlite3 ~/.claudectx/db.sqlite

# View all sessions
SELECT id, status, summary_title, started_at FROM sessions;

# View observations for a session
SELECT event_type, tool_name, file_path, content 
FROM observations 
WHERE session_id = 'YOUR_SESSION_ID';

# Full-text search
SELECT * FROM obs_fts WHERE obs_fts MATCH 'search term';
```

---

### 4️⃣ Understanding the Data

#### Projects
- One project per git repository
- Identified by root path
- Tracks all sessions for that project

#### Sessions
- One session per Claude Code run
- Status: `active`, `completed`, `compacted`
- Contains AI-generated summary after completion

#### Observations
- Individual events within a session
- Types: `tool_call`, `user_message`, `assistant_message`
- Searchable with full-text search

#### AI Summary Structure
```json
{
  "summary_title": "Implement JWT authentication",
  "summary_status": "completed",
  "summary_what_we_did": [
    "Added JWT middleware to Express",
    "Wrote 12 unit tests",
    "Updated API documentation"
  ],
  "summary_decisions": [
    "Use RS256 algorithm for signing",
    "Store tokens in httpOnly cookies"
  ],
  "summary_files_changed": [
    "src/middleware/jwt.ts",
    "tests/jwt.test.ts"
  ],
  "summary_next_steps": [
    "Add rate limiting to /login",
    "Implement refresh token rotation"
  ],
  "summary_gotchas": [
    "bcrypt.compare is async - never use sync version"
  ]
}
```

---

### 5️⃣ Stopping ClaudeContext

```bash
# Option 1: Use stop script
./stop.sh

# Option 2: Kill by PID
kill $(cat /tmp/claudectx.pid)

# Option 3: Find and kill
ps aux | grep "node dist/src/index.js" | grep -v grep
kill <PID>
```

---

## 🎨 Dashboard Tour

### Home Page (Projects)
```
┌─────────────────────────────────────────────────────────────┐
│  ClaudeContext                                    [Search]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 my-app                          🕐 Last active: 2h ago  │
│     github.com/user/my-app                                  │
│     12 sessions  •  47 files changed  •  234 tool calls     │
│     [View Details]                                          │
│                                                             │
│  📁 api-server                      🕐 Last active: 1d ago  │
│     github.com/user/api-server                              │
│     8 sessions  •  23 files changed  •  156 tool calls      │
│     [View Details]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Session Detail Page
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Project                                          │
├─────────────────────────────────────────────────────────────┤
│  Implement JWT authentication                               │
│  ✅ Completed  •  Started: 2h ago  •  Duration: 45min       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 What We Did                    🎯 Decisions             │
│  • Added JWT middleware            • Use RS256 algorithm    │
│  • Wrote 12 unit tests             • httpOnly cookies       │
│  • Updated docs                                             │
│                                                             │
│  📁 Files Changed                  ⚡ Next Steps            │
│  • src/middleware/jwt.ts           • Add rate limiting      │
│  • tests/jwt.test.ts               • Refresh token rotation │
│                                                             │
│  ⚠️  Gotchas                       📚 Tech Notes            │
│  • bcrypt.compare is async         • Using jose library     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Timeline                                                   │
│  ────────────────────────────────────────────────────────── │
│  🔧 Write: src/middleware/jwt.ts                            │
│  🔧 Write: tests/jwt.test.ts                                │
│  ⚙️  Bash: npm test                                         │
│  📝 Edit: src/middleware/jwt.ts                             │
│  ⚙️  Bash: npm test                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Search Page
```
┌─────────────────────────────────────────────────────────────┐
│  Search: [authentication____________]  [🔍 Search]          │
│  Filter: [All Projects ▼]                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 3 results found                                         │
│                                                             │
│  📝 Implement JWT authentication                            │
│     my-app  •  2 hours ago                                  │
│     "Added JWT middleware using jose library..."            │
│     [View Session]                                          │
│                                                             │
│  🔧 Fix authentication bug                                  │
│     my-app  •  1 day ago                                    │
│     "Fixed token expiration check in middleware..."         │
│     [View Session]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Required for AI summarization
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Change port (default: 8000)
export CLAUDECTX_PORT=9000

# Optional: Number of sessions to inject (default: 3)
export CLAUDECTX_SESSIONS=5

# Optional: Disable AI summaries
export CLAUDECTX_DISABLE_SUMMARIES=1
```

### Permanent Configuration

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# ClaudeContext Configuration
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
export CLAUDECTX_PORT=8000
export CLAUDECTX_SESSIONS=3
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check if port is in use
lsof -i :8000

# Check logs
tail -f /tmp/claudectx.log

# Rebuild if needed
cd artifacts/claudectx-backup
pnpm run build:worker
cd dashboard && pnpm run build
```

### Hooks Not Firing

```bash
# Verify hooks are installed
cat ~/.claude/settings.json | jq '.hooks | keys'

# Test hook manually
echo '{"session_id":"test","cwd":"'$(pwd)'"}' | \
  node ~/.claudectx/hooks/session-start.js

# Check hook scripts exist
ls -la ~/.claudectx/hooks/
```

### No Context Injection

```bash
# Check if sessions have summaries
curl http://localhost:8000/api/sessions | jq '.[].summary_title'

# Verify API key is set
echo $ANTHROPIC_API_KEY

# Check context endpoint
curl "http://localhost:8000/api/context?cwd=$(pwd)" | jq
```

### Database Issues

```bash
# Check database exists
ls -lh ~/.claudectx/db.sqlite

# Verify schema
sqlite3 ~/.claudectx/db.sqlite ".schema"

# Count records
sqlite3 ~/.claudectx/db.sqlite "SELECT COUNT(*) FROM sessions;"
```

---

## 📊 Monitoring

### Check Service Status

```bash
# Health check
curl http://localhost:8000/api/health | jq

# View logs
tail -f /tmp/claudectx.log

# Check process
ps aux | grep "node dist/src/index.js"
```

### View Statistics

```bash
# Total sessions
curl http://localhost:8000/api/sessions | jq 'length'

# Sessions by project
curl http://localhost:8000/api/projects | jq '.[] | {name, session_count}'

# Recent activity
curl http://localhost:8000/api/sessions | jq '.[0:5] | .[] | {title: .summary_title, status, started_at}'
```

---

## 🎯 Best Practices

### 1. Set API Key for Summaries
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```
Without this, sessions are captured but not summarized.

### 2. Review Dashboard Regularly
Check http://localhost:8000 to see what's being captured.

### 3. Use Search
Full-text search helps you find past decisions and solutions.

### 4. Keep Worker Running
Add to startup scripts or use PM2 for persistence.

### 5. Monitor Database Size
```bash
du -h ~/.claudectx/db.sqlite
```

---

## 🚀 Advanced Usage

### Run as System Service (systemd)

Create `/etc/systemd/system/claudectx.service`:

```ini
[Unit]
Description=ClaudeContext Worker
After=network.target

[Service]
Type=simple
User=max
WorkingDirectory=/home/max/All_Projects_Files/April 2026 Projects/Claude-Context/artifacts/claudectx-backup
Environment="PORT=8000"
Environment="ANTHROPIC_API_KEY=sk-ant-..."
ExecStart=/usr/bin/node dist/src/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable claudectx
sudo systemctl start claudectx
sudo systemctl status claudectx
```

### Export Sessions

```bash
# Export all sessions as JSON
curl http://localhost:8000/api/sessions > sessions.json

# Export specific project
curl "http://localhost:8000/api/sessions?project_id=abc123" > project-sessions.json
```

---

## 📚 Additional Resources

- **STATUS.md** - Complete project status
- **QUICKSTART.md** - Quick reference
- **INSTALLATION_COMPLETE.md** - Installation details
- **Docs/ClaudeContext_PRD.md** - Full PRD

---

## 🎉 You're All Set!

ClaudeContext is now capturing every Claude Code session automatically. Just:

1. Run `./start.sh` to start the service
2. Use Claude Code normally
3. Check http://localhost:8000 to see your sessions

**Enjoy seamless context continuity!** 🚀
