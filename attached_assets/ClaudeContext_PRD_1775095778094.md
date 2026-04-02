# ClaudeContext SDK — Full Product Requirements Document
> **For Replit AI Agent:** Build this entire system exactly as specified. Every section is implementation-ready. Follow the file structure, API contracts, database schema, and hook scripts precisely. Do not simplify or skip any layer.

---

## 1. Product Overview

### What We Are Building
A Node.js SDK called **ClaudeContext** that runs as a background daemon alongside Claude Code. It automatically captures every Claude Code session — every message, tool call, file edit, and decision — summarizes each session using Claude Haiku AI, stores everything in a local SQLite database organized by project workspace, and injects the last N session summaries back into Claude Code at the start of every new session. A React dashboard runs at `http://localhost:9999` for browsing all sessions.

### The Core Problem
When a Claude Code session's context window fills up, the user must start a new session. That new session has zero knowledge of what happened before. Users waste 5–15 minutes every session re-explaining context, architecture decisions, what was built, and what comes next. This kills productivity on multi-day projects.

### The Solution
ClaudeContext hooks into Claude Code's lifecycle events. At the end of every session, it reads the raw `.jsonl` transcript, calls Claude Haiku to extract a structured summary (what was done, files changed, decisions made, next steps, gotchas), and saves it to SQLite. At the start of every new session, it silently injects the last 3 session summaries directly into Claude's context. Claude already knows everything — no user input required.

### Key Principles
- **Zero manual work.** Everything happens automatically via hooks.
- **Never blocks Claude Code.** All hooks complete in under 50ms; heavy work runs in the background worker.
- **Local first.** All data stored at `~/.claudectx/`. No cloud required.
- **Per-project workspaces.** Each git repository is a separate project with its own session history.
- **One install command.** `npx claudectx install` sets up everything.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code (CLI)                        │
│                                                                 │
│  SessionStart → PostToolUse → UserPromptSubmit → Stop → SessionEnd │
│       ↓              ↓               ↓            ↓       ↓    │
│  [Hook scripts — tiny Node.js files, fire-and-forget via HTTP]  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST /api/hook (async, <10ms)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Worker Service (Node.js, port 9999)                │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Async Queue │  │ AI Summarizer│  │  Context Builder       │ │
│  │  (p-queue)  │  │ (Haiku API)  │  │  (injects at startup)  │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SQLite Database (better-sqlite3)           │   │
│  │   projects | sessions | observations | obs_fts (FTS5)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         React Dashboard (served at localhost:9999)      │   │
│  │    Projects / Sessions / SessionDetail / Search / Live  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### Backend (Worker Service)
| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.4 | Language |
| `express` | ^4.19 | HTTP server |
| `better-sqlite3` | ^9.4 | SQLite database |
| `@anthropic-ai/sdk` | ^0.26 | Haiku summarization |
| `ws` | ^8.17 | WebSocket for live dashboard |
| `p-queue` | ^8.0 | Async job queue |
| `chokidar` | ^3.6 | Watch ~/.claude/ for new transcripts |
| `simple-git` | ^3.25 | Detect git remote for project ID |
| `tsx` | ^4.11 | Run TypeScript directly |
| `pm2` | ^5.3 | Daemon process manager |

### Frontend (Dashboard)
| Package | Version | Purpose |
|---|---|---|
| `react` | ^19 | UI framework |
| `react-dom` | ^19 | DOM rendering |
| `vite` | ^5 | Build tool |
| `tailwindcss` | ^3.4 | Styling |
| `@tanstack/react-query` | ^5 | Data fetching |
| `recharts` | ^2.12 | Charts (token usage, activity) |
| `react-router-dom` | ^6 | Client routing |
| `date-fns` | ^3 | Date formatting |
| `lucide-react` | ^0.383 | Icons |

### Hook Scripts
- Plain Node.js (no dependencies) for maximum speed
- Read JSON from stdin (Claude Code passes hook data via stdin)
- POST to worker via `http` built-in module
- Always `process.exit(0)` — never block Claude Code

---

## 4. Complete File Structure

```
claudectx/
├── package.json                    ← root package (monorepo-style workspaces)
├── tsconfig.json
├── tsconfig.worker.json
├── tsconfig.hooks.json
│
├── src/
│   ├── index.ts                    ← worker entry point
│   ├── config.ts                   ← all paths and constants
│   │
│   ├── hooks/                      ← compiled to dist/hooks/
│   │   ├── session-start.ts
│   │   ├── session-end.ts
│   │   ├── post-tool-use.ts
│   │   ├── user-prompt-submit.ts
│   │   ├── stop.ts
│   │   ├── pre-compact.ts
│   │   └── utils.ts                ← shared: readStdin, postToWorker
│   │
│   ├── services/
│   │   ├── queue.ts                ← p-queue wrapper
│   │   ├── summarizer.ts           ← Haiku AI summarization
│   │   ├── transcript-reader.ts    ← parse .jsonl files
│   │   ├── context-builder.ts      ← build context string for injection
│   │   ├── project-detector.ts     ← detect project from cwd + git
│   │   ├── claude-md-updater.ts    ← update CLAUDE.md memory block
│   │   └── watcher.ts              ← chokidar file watcher
│   │
│   ├── db/
│   │   ├── client.ts               ← initialize SQLite
│   │   ├── schema.ts               ← CREATE TABLE statements
│   │   ├── migrations.ts           ← run schema migrations
│   │   └── queries.ts              ← all typed query functions
│   │
│   ├── api/
│   │   ├── hook.ts                 ← POST /api/hook
│   │   ├── sessions.ts             ← GET /api/sessions, GET /api/sessions/:id
│   │   ├── projects.ts             ← GET /api/projects, GET /api/projects/:id
│   │   ├── context.ts              ← GET /api/context
│   │   ├── search.ts               ← POST /api/search
│   │   ├── observations.ts         ← GET /api/observations
│   │   └── health.ts               ← GET /api/health
│   │
│   └── ws/
│       └── broadcast.ts            ← WebSocket broadcast helpers
│
├── dashboard/                      ← React SPA
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── client.ts           ← fetch wrappers for all endpoints
│   │   ├── pages/
│   │   │   ├── Projects.tsx        ← /
│   │   │   ├── ProjectDetail.tsx   ← /project/:id
│   │   │   ├── SessionDetail.tsx   ← /session/:id
│   │   │   ├── Search.tsx          ← /search
│   │   │   └── Live.tsx            ← /live (WebSocket feed)
│   │   └── components/
│   │       ├── SessionCard.tsx
│   │       ├── ObservationList.tsx
│   │       ├── SummaryView.tsx
│   │       ├── ActivityChart.tsx
│   │       ├── SearchBar.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── CopyButton.tsx
│   │       └── Layout.tsx
│   └── public/
│
├── installer/
│   ├── hooks-settings.json         ← the hooks config to patch into ~/.claude/settings.json
│   ├── patch-settings.ts           ← merges hooks into existing settings.json
│   └── daemon.ts                   ← start/stop pm2 daemon
│
└── bin/
    └── claudectx.ts                ← CLI entry: install / start / stop / status / open
```

---

## 5. Database Schema

File location: `~/.claudectx/db.sqlite`

```sql
-- Projects (one per git repository / workspace)
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,        -- sha256 of root_path
  name        TEXT NOT NULL,           -- folder name
  root_path   TEXT NOT NULL UNIQUE,    -- absolute path
  git_remote  TEXT,                    -- e.g. github.com/user/repo
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Sessions (one per Claude Code session)
CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,    -- claude's session_id from hook input
  project_id      TEXT NOT NULL REFERENCES projects(id),
  started_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  ended_at        INTEGER,
  transcript_path TEXT,               -- absolute path to .jsonl file
  status          TEXT NOT NULL DEFAULT 'active',  -- active | completed | compacted | error
  -- AI-generated summary fields (populated after SessionEnd)
  summary_title   TEXT,               -- "Implement JWT auth middleware"
  summary_status  TEXT,               -- completed | in_progress | blocked
  summary_what_we_did    TEXT,        -- JSON array of strings
  summary_decisions      TEXT,        -- JSON array of strings
  summary_files_changed  TEXT,        -- JSON array of file paths
  summary_next_steps     TEXT,        -- JSON array of strings
  summary_gotchas        TEXT,        -- JSON array of strings
  summary_tech_notes     TEXT,        -- JSON array of strings
  -- Stats
  total_turns     INTEGER DEFAULT 0,
  total_tool_calls INTEGER DEFAULT 0,
  files_touched   TEXT,               -- JSON array
  tools_used      TEXT,               -- JSON object {toolName: count}
  estimated_tokens INTEGER DEFAULT 0
);

-- Observations (every captured event within a session)
CREATE TABLE IF NOT EXISTS observations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions(id),
  project_id  TEXT NOT NULL REFERENCES projects(id),
  event_type  TEXT NOT NULL,          -- tool_call | user_message | assistant_message | file_edit | decision
  tool_name   TEXT,                   -- for tool_call events
  file_path   TEXT,                   -- for file_edit events
  content     TEXT,                   -- the actual content/summary
  metadata    TEXT,                   -- JSON blob of extra fields
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Full-text search on observations
CREATE VIRTUAL TABLE IF NOT EXISTS obs_fts USING fts5(
  content,
  event_type,
  session_id UNINDEXED,
  project_id UNINDEXED,
  tokenize = 'porter ascii'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS obs_ai AFTER INSERT ON observations BEGIN
  INSERT INTO obs_fts(rowid, content, event_type, session_id, project_id)
  VALUES (new.id, new.content, new.event_type, new.session_id, new.project_id);
END;

CREATE TRIGGER IF NOT EXISTS obs_ad AFTER DELETE ON observations BEGIN
  DELETE FROM obs_fts WHERE rowid = old.id;
END;

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert defaults
INSERT OR IGNORE INTO settings VALUES ('context_sessions', '3');
INSERT OR IGNORE INTO settings VALUES ('api_key_set', 'false');
INSERT OR IGNORE INTO settings VALUES ('summaries_enabled', 'true');
```

---

## 6. Hook Scripts

### How Hooks Work in Claude Code
Claude Code passes a JSON object via **stdin** to each hook script. The hook script reads stdin, does its work, and exits. The hook must exit within the configured timeout. Exit code 0 = success. The hook can print JSON to stdout for certain events (SessionStart can inject `additionalContext`).

### Hook: `session-start.ts`
**Fires when:** Claude Code starts a new session (new terminal, `/clear`, or resume)
**Purpose:** Inject last N session summaries as background context

```typescript
// src/hooks/session-start.ts
import { readStdin, postToWorker, safeExit } from './utils'

async function main() {
  const input = await readStdin()
  // input shape: { session_id, cwd, hook_event_name: "SessionStart", source: "startup"|"clear"|"resume" }

  try {
    // Upsert session record (mark as active)
    await postToWorker('/api/hook', {
      event: 'SessionStart',
      session_id: input.session_id,
      cwd: input.cwd,
      source: input.source || 'startup'
    })

    // Get context to inject
    const context = await postToWorker('/api/context', {
      cwd: input.cwd,
      session_id: input.session_id
    })

    if (context && context.markdown) {
      // Inject silently — Claude reads it, user doesn't see it
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: context.markdown
        }
      }))
    }
  } catch {
    // Never fail — if worker is down, Claude Code still starts normally
  }

  process.exit(0)
}

main()
```

### Hook: `session-end.ts`
**Fires when:** Session ends (user exits, `/exit`, or crash)
**Purpose:** Trigger final AI summarization and save session

```typescript
// src/hooks/session-end.ts
import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()
  // input shape: { session_id, transcript_path, cwd, hook_event_name: "SessionEnd" }

  try {
    await postToWorker('/api/hook', {
      event: 'SessionEnd',
      session_id: input.session_id,
      transcript_path: input.transcript_path,
      cwd: input.cwd
    })
  } catch {
    // Ignore — worker will pick up transcript via file watcher anyway
  }

  process.exit(0)
}

main()
```

### Hook: `post-tool-use.ts`
**Fires when:** Any tool completes (Bash, Write, Edit, Read, etc.)
**Purpose:** Log tool calls as observations

```typescript
// src/hooks/post-tool-use.ts
import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()
  // input shape: { session_id, cwd, tool_name, tool_input, tool_response, tool_use_id }

  try {
    // Don't send full tool_response — can be MB of file content
    await postToWorker('/api/hook', {
      event: 'PostToolUse',
      session_id: input.session_id,
      cwd: input.cwd,
      tool_name: input.tool_name,
      file_path: input.tool_input?.file_path || input.tool_input?.path || null,
      command: input.tool_input?.command?.slice(0, 200) || null, // truncate bash commands
      success: !input.tool_response?.error
    })
  } catch {
    // Never block Claude Code
  }

  process.exit(0)
}

main()
```

### Hook: `user-prompt-submit.ts`
**Fires when:** User submits a message
**Purpose:** Log user messages, count turns

```typescript
// src/hooks/user-prompt-submit.ts
import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()
  // input shape: { session_id, cwd, hook_event_name, prompt }

  try {
    await postToWorker('/api/hook', {
      event: 'UserPromptSubmit',
      session_id: input.session_id,
      cwd: input.cwd,
      // Only first 500 chars — we don't need full prompt in observations
      prompt_preview: (input.prompt || '').slice(0, 500)
    })
  } catch {}

  process.exit(0)
}

main()
```

### Hook: `stop.ts`
**Fires when:** Claude finishes a response turn
**Purpose:** Capture assistant responses, check for keywords

```typescript
// src/hooks/stop.ts
import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()
  // input shape: { session_id, cwd, stop_hook_active, last_assistant_message }

  // CRITICAL: Check stop_hook_active to prevent infinite loop
  if (input.stop_hook_active) {
    process.exit(0)
  }

  try {
    await postToWorker('/api/hook', {
      event: 'Stop',
      session_id: input.session_id,
      cwd: input.cwd,
      message_preview: (input.last_assistant_message || '').slice(0, 300)
    })
  } catch {}

  process.exit(0)
}

main()
```

### Hook: `pre-compact.ts`
**Fires when:** Claude Code is about to compact the context window
**Purpose:** Snapshot current session state before information is lost

```typescript
// src/hooks/pre-compact.ts
import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()

  try {
    await postToWorker('/api/hook', {
      event: 'PreCompact',
      session_id: input.session_id,
      cwd: input.cwd,
      transcript_path: input.transcript_path
    })
  } catch {}

  process.exit(0)
}

main()
```

### Shared Utility: `utils.ts`

```typescript
// src/hooks/utils.ts
import * as http from 'http'

const WORKER_PORT = process.env.CLAUDECTX_PORT || '9999'

export async function readStdin(): Promise<any> {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.on('data', chunk => { data += chunk })
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)) }
      catch { resolve({}) }
    })
    // Timeout: if no stdin after 1s, resolve empty
    setTimeout(() => resolve({}), 1000)
  })
}

export async function postToWorker(path: string, body: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const req = http.request({
      hostname: 'localhost',
      port: WORKER_PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve({}) }
      })
    })
    req.on('error', reject)
    req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(payload)
    req.end()
  })
}
```

---

## 7. Hook Installation Config

This JSON is patched into `~/.claude/settings.json` at install time (merged, not replaced).

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claudectx/hooks/session-start.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claudectx/hooks/session-end.js",
            "timeout": 3000
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claudectx/hooks/post-tool-use.js",
            "timeout": 2000
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claudectx/hooks/user-prompt-submit.js",
            "timeout": 2000
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claudectx/hooks/stop.js",
            "timeout": 2000
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claudectx/hooks/pre-compact.js",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

---

## 8. Worker Service — Core Files

### `src/index.ts` — Entry Point

```typescript
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import path from 'path'
import { initDB } from './db/client'
import { hookRouter } from './api/hook'
import { sessionsRouter } from './api/sessions'
import { projectsRouter } from './api/projects'
import { contextRouter } from './api/context'
import { searchRouter } from './api/search'
import { healthRouter } from './api/health'
import { observationsRouter } from './api/observations'
import { startWatcher } from './services/watcher'
import { broadcast, initWS } from './ws/broadcast'

const PORT = parseInt(process.env.CLAUDECTX_PORT || '9999')

async function main() {
  // Initialize database
  initDB()

  const app = express()
  app.use(express.json({ limit: '10mb' }))

  // CORS for dashboard development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    next()
  })

  // API routes
  app.use('/api/hook', hookRouter)
  app.use('/api/sessions', sessionsRouter)
  app.use('/api/projects', projectsRouter)
  app.use('/api/context', contextRouter)
  app.use('/api/search', searchRouter)
  app.use('/api/health', healthRouter)
  app.use('/api/observations', observationsRouter)

  // Serve React dashboard build
  const dashboardDist = path.join(__dirname, '..', 'dashboard', 'dist')
  app.use(express.static(dashboardDist))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(dashboardDist, 'index.html'))
    }
  })

  const server = createServer(app)

  // WebSocket server for live dashboard updates
  const wss = new WebSocketServer({ server })
  initWS(wss)

  // Start file watcher for transcript auto-detection
  startWatcher()

  server.listen(PORT, () => {
    console.log(`ClaudeContext running at http://localhost:${PORT}`)
  })
}

main().catch(console.error)
```

### `src/config.ts` — All Paths

```typescript
import { homedir } from 'os'
import path from 'path'

export const CONFIG = {
  // ClaudeContext data directory
  dataDir: path.join(homedir(), '.claudectx'),
  dbPath: path.join(homedir(), '.claudectx', 'db.sqlite'),
  hooksDir: path.join(homedir(), '.claudectx', 'hooks'),
  logsDir: path.join(homedir(), '.claudectx', 'logs'),

  // Claude Code paths
  claudeDir: path.join(homedir(), '.claude'),
  claudeProjectsDir: path.join(homedir(), '.claude', 'projects'),
  claudeSettingsPath: path.join(homedir(), '.claude', 'settings.json'),

  // Worker settings
  port: parseInt(process.env.CLAUDECTX_PORT || '9999'),
  apiKey: process.env.ANTHROPIC_API_KEY || '',

  // Context injection settings
  defaultContextSessions: 3,   // inject last 3 sessions by default
  maxContextTokens: 2000,       // max tokens to inject at session start
  summaryModel: 'claude-haiku-4-5-20251001' as const,
  summaryMaxTokens: 1500,
}
```

### `src/api/hook.ts` — Main Event Intake

```typescript
import { Router } from 'express'
import { db } from '../db/client'
import { detectProject } from '../services/project-detector'
import { enqueue } from '../services/queue'
import { summarizeSession, snapshotSession } from '../services/summarizer'
import { broadcast } from '../ws/broadcast'
import { queries } from '../db/queries'

export const hookRouter = Router()

hookRouter.post('/', async (req, res) => {
  res.json({ ok: true }) // Always respond immediately

  const { event, session_id, cwd, ...data } = req.body
  if (!session_id || !cwd) return

  try {
    const project = await detectProject(cwd)

    switch (event) {

      case 'SessionStart': {
        // Upsert session record
        queries.upsertSession({
          id: session_id,
          project_id: project.id,
          started_at: Date.now() / 1000 | 0,
          status: 'active'
        })
        broadcast({ type: 'session_start', session_id, project })
        break
      }

      case 'SessionEnd': {
        queries.updateSession(session_id, {
          ended_at: Date.now() / 1000 | 0,
          status: 'completed',
          transcript_path: data.transcript_path || null
        })
        // Queue AI summarization (async — don't block response)
        if (data.transcript_path) {
          enqueue(() => summarizeSession(session_id, data.transcript_path, project.id))
        }
        broadcast({ type: 'session_end', session_id })
        break
      }

      case 'PostToolUse': {
        const obs = {
          session_id,
          project_id: project.id,
          event_type: 'tool_call',
          tool_name: data.tool_name,
          file_path: data.file_path || null,
          content: data.command
            ? `${data.tool_name}: ${data.command}`
            : `${data.tool_name}${data.file_path ? ': ' + data.file_path : ''}`,
          metadata: JSON.stringify({ success: data.success })
        }
        queries.insertObservation(obs)
        queries.incrementTurnStats(session_id, 'tool_calls')

        // Track files touched
        if (data.file_path) {
          queries.addFileTouched(session_id, data.file_path)
        }

        broadcast({ type: 'tool_use', session_id, tool_name: data.tool_name, file_path: data.file_path })
        break
      }

      case 'UserPromptSubmit': {
        queries.incrementTurnStats(session_id, 'turns')
        broadcast({ type: 'user_prompt', session_id, preview: data.prompt_preview })
        break
      }

      case 'Stop': {
        // Just track turn count
        broadcast({ type: 'stop', session_id, preview: data.message_preview })
        break
      }

      case 'PreCompact': {
        queries.updateSession(session_id, { status: 'compacted' })
        if (data.transcript_path) {
          enqueue(() => snapshotSession(session_id, data.transcript_path, project.id))
        }
        broadcast({ type: 'pre_compact', session_id })
        break
      }
    }
  } catch (err) {
    console.error('Hook processing error:', err)
  }
})
```

---

## 9. Service Implementations

### `src/services/project-detector.ts`

```typescript
import { createHash } from 'crypto'
import { execSync } from 'child_process'
import path from 'path'
import { queries } from '../db/queries'

export async function detectProject(cwd: string): Promise<{ id: string; name: string; root_path: string }> {
  // Try to find git root
  let rootPath = cwd
  let gitRemote: string | null = null

  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
    rootPath = gitRoot

    try {
      gitRemote = execSync('git remote get-url origin', {
        cwd: gitRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
    } catch {}
  } catch {
    // Not a git repo — use cwd as root
  }

  const projectId = createHash('sha256').update(rootPath).digest('hex').slice(0, 16)
  const projectName = path.basename(rootPath)

  // Upsert project
  queries.upsertProject({
    id: projectId,
    name: projectName,
    root_path: rootPath,
    git_remote: gitRemote
  })

  return { id: projectId, name: projectName, root_path: rootPath }
}
```

### `src/services/summarizer.ts` — Core AI Summarization

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { readTranscript } from './transcript-reader'
import { queries } from '../db/queries'
import { CONFIG } from '../config'
import { updateClaudeMd } from './claude-md-updater'
import { broadcast } from '../ws/broadcast'

const client = new Anthropic({ apiKey: CONFIG.apiKey })

interface SessionSummary {
  title: string
  status: 'completed' | 'in_progress' | 'blocked'
  what_we_did: string[]
  decisions_made: string[]
  files_changed: string[]
  next_steps: string[]
  gotchas: string[]
  tech_stack_notes: string[]
}

export async function summarizeSession(
  sessionId: string,
  transcriptPath: string,
  projectId: string
): Promise<void> {
  if (!CONFIG.apiKey) {
    console.log('No API key — skipping AI summary for session', sessionId)
    return
  }

  try {
    const turns = await readTranscript(transcriptPath)
    if (turns.length === 0) return

    // Build compact representation (last 60 turns max to stay under token limit)
    const recentTurns = turns.slice(-60)
    const compactTranscript = recentTurns.map(t => {
      if (t.role === 'user') return `USER: ${t.content.slice(0, 300)}`
      if (t.role === 'assistant') return `CLAUDE: ${t.content.slice(0, 400)}`
      if (t.type === 'tool_use') return `TOOL(${t.name}): ${JSON.stringify(t.input).slice(0, 200)}`
      return null
    }).filter(Boolean).join('\n')

    const response = await client.messages.create({
      model: CONFIG.summaryModel,
      max_tokens: CONFIG.summaryMaxTokens,
      system: `You are a technical session summarizer. Extract structured information from Claude Code session transcripts.
Always respond with ONLY valid JSON matching the exact schema provided. No preamble, no markdown, no explanation.`,
      messages: [{
        role: 'user',
        content: `Summarize this Claude Code coding session transcript. Return ONLY JSON.

TRANSCRIPT:
${compactTranscript}

Return this exact JSON schema:
{
  "title": "5-8 word title describing the main work done",
  "status": "completed OR in_progress OR blocked",
  "what_we_did": ["specific thing 1", "specific thing 2", "specific thing 3"],
  "decisions_made": ["architectural or technical decision made"],
  "files_changed": ["relative/path/to/file.ts"],
  "next_steps": ["concrete next thing to do"],
  "gotchas": ["important warning or thing to remember"],
  "tech_stack_notes": ["framework/library/pattern note"]
}

Rules:
- what_we_did: max 5 items, be specific (not "wrote code")
- decisions_made: only real decisions, skip trivial ones
- files_changed: only files actually modified/created
- next_steps: max 3 items, most important first
- gotchas: only truly important things (bugs found, footguns)
- tech_stack_notes: language/framework specifics future sessions need
- If nothing significant happened, use status "in_progress"`
      }]
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const summary: SessionSummary = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())

    // Save to DB
    queries.updateSession(sessionId, {
      summary_title: summary.title,
      summary_status: summary.status,
      summary_what_we_did: JSON.stringify(summary.what_we_did),
      summary_decisions: JSON.stringify(summary.decisions_made),
      summary_files_changed: JSON.stringify(summary.files_changed),
      summary_next_steps: JSON.stringify(summary.next_steps),
      summary_gotchas: JSON.stringify(summary.gotchas),
      summary_tech_notes: JSON.stringify(summary.tech_stack_notes),
      status: 'completed'
    })

    // Save key items as searchable observations
    for (const item of [...summary.what_we_did, ...summary.decisions_made]) {
      queries.insertObservation({
        session_id: sessionId,
        project_id: projectId,
        event_type: 'decision',
        content: item,
        metadata: '{}'
      })
    }

    // Update CLAUDE.md
    await updateClaudeMd(projectId, sessionId, summary)

    broadcast({ type: 'summary_ready', session_id: sessionId, title: summary.title })
    console.log(`Summary saved for session ${sessionId}: "${summary.title}"`)

  } catch (err) {
    console.error('Summarization failed for session', sessionId, err)
    queries.updateSession(sessionId, { status: 'completed' })
  }
}

export async function snapshotSession(
  sessionId: string,
  transcriptPath: string,
  projectId: string
): Promise<void> {
  // Same as summarizeSession but marks status as 'compacted' not 'completed'
  await summarizeSession(sessionId, transcriptPath, projectId)
  queries.updateSession(sessionId, { status: 'compacted' })
}
```

### `src/services/context-builder.ts`

```typescript
import { queries } from '../db/queries'
import { detectProject } from './project-detector'

export async function buildContextMarkdown(cwd: string, n: number = 3): Promise<string> {
  const project = await detectProject(cwd)
  const sessions = queries.getLastNCompletedSessions(project.id, n)

  if (sessions.length === 0) {
    return '' // No past sessions — return empty (no injection)
  }

  const lines: string[] = [
    `=== ClaudeContext: Last ${sessions.length} session(s) for [${project.name}] ===`,
    ''
  ]

  for (const s of sessions) {
    const date = new Date(s.started_at * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    lines.push(`[${date}] ${s.summary_title || 'Untitled session'} — ${(s.summary_status || 'completed').toUpperCase()}`)

    if (s.summary_what_we_did) {
      const items = JSON.parse(s.summary_what_we_did) as string[]
      if (items.length > 0) {
        lines.push(`  Done: ${items.slice(0, 3).join(' • ')}`)
      }
    }

    if (s.summary_files_changed) {
      const files = JSON.parse(s.summary_files_changed) as string[]
      if (files.length > 0) {
        lines.push(`  Files: ${files.slice(0, 4).join(', ')}`)
      }
    }

    if (s.summary_next_steps) {
      const next = JSON.parse(s.summary_next_steps) as string[]
      if (next.length > 0) {
        lines.push(`  Next: ${next[0]}`)
      }
    }

    if (s.summary_gotchas) {
      const gotchas = JSON.parse(s.summary_gotchas) as string[]
      if (gotchas.length > 0) {
        lines.push(`  ⚠ Remember: ${gotchas[0]}`)
      }
    }

    lines.push('')
  }

  lines.push('=== End of ClaudeContext ===')
  return lines.join('\n')
}
```

### `src/services/transcript-reader.ts`

```typescript
import fs from 'fs'
import readline from 'readline'

interface Turn {
  role?: string
  type?: string
  name?: string
  content?: string
  input?: any
}

export async function readTranscript(filePath: string): Promise<Turn[]> {
  if (!fs.existsSync(filePath)) return []

  const turns: Turn[] = []
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)

      // Extract meaningful content from Claude Code's JSONL format
      if (entry.type === 'user' && entry.message?.content) {
        const content = Array.isArray(entry.message.content)
          ? entry.message.content.map((c: any) => c.text || '').join(' ')
          : String(entry.message.content)
        turns.push({ role: 'user', content })
      }

      if (entry.type === 'assistant' && entry.message?.content) {
        const content = Array.isArray(entry.message.content)
          ? entry.message.content
              .filter((c: any) => c.type === 'text')
              .map((c: any) => c.text || '').join(' ')
          : String(entry.message.content)
        turns.push({ role: 'assistant', content })

        // Extract tool uses from assistant messages
        if (Array.isArray(entry.message.content)) {
          for (const block of entry.message.content) {
            if (block.type === 'tool_use') {
              turns.push({ type: 'tool_use', name: block.name, input: block.input })
            }
          }
        }
      }
    } catch {
      // Skip malformed lines
    }
  }

  return turns
}
```

### `src/services/claude-md-updater.ts`

```typescript
import fs from 'fs'
import path from 'path'

const MARKER_START = '<!-- CLAUDECTX:START -->'
const MARKER_END = '<!-- CLAUDECTX:END -->'

export async function updateClaudeMd(
  projectId: string,
  sessionId: string,
  summary: any
): Promise<void> {
  // Find CLAUDE.md in the project root
  const { queries } = await import('../db/queries')
  const project = queries.getProject(projectId)
  if (!project) return

  const claudeMdPath = path.join(project.root_path, 'CLAUDE.md')

  const block = [
    MARKER_START,
    '## Recent session history (auto-updated by ClaudeContext)',
    '',
    `**Last session:** ${summary.title} — ${summary.status.toUpperCase()}`,
    summary.what_we_did?.length ? `**Completed:** ${summary.what_we_did.slice(0, 3).join(', ')}` : '',
    summary.next_steps?.length ? `**Up next:** ${summary.next_steps[0]}` : '',
    summary.gotchas?.length ? `**Remember:** ${summary.gotchas[0]}` : '',
    '',
    `_Updated automatically. View full history at http://localhost:9999_`,
    MARKER_END
  ].filter(Boolean).join('\n')

  let existing = ''
  if (fs.existsSync(claudeMdPath)) {
    existing = fs.readFileSync(claudeMdPath, 'utf8')
  }

  // Replace or append the block
  if (existing.includes(MARKER_START)) {
    const start = existing.indexOf(MARKER_START)
    const end = existing.indexOf(MARKER_END) + MARKER_END.length
    existing = existing.slice(0, start) + block + existing.slice(end)
  } else {
    existing = existing + '\n\n' + block
  }

  fs.writeFileSync(claudeMdPath, existing, 'utf8')
}
```

---

## 10. REST API Endpoints

### `GET /api/health`
```json
{
  "status": "ok",
  "version": "1.0.0",
  "db": "connected",
  "api_key": true,
  "uptime": 3600
}
```

### `POST /api/hook`
Receives all hook events. Always returns `{ "ok": true }` immediately.
Body: `{ event, session_id, cwd, ...eventSpecificFields }`

### `GET /api/context`
Query: `?cwd=/path/to/project&n=3`
Returns: `{ markdown: "=== ClaudeContext: Last 3 sessions... ===" }`
(Used by session-start hook to get injection text)
Also accepts POST with JSON body for hook calls.

### `GET /api/projects`
Returns array of all projects:
```json
[
  {
    "id": "abc123",
    "name": "my-app",
    "root_path": "/Users/user/projects/my-app",
    "git_remote": "github.com/user/my-app",
    "session_count": 12,
    "last_session_at": 1712000000,
    "created_at": 1710000000
  }
]
```

### `GET /api/projects/:id`
Returns single project with recent sessions array.

### `GET /api/sessions`
Query: `?project_id=abc123&limit=20&offset=0&status=completed`
Returns paginated sessions array with summary fields.

### `GET /api/sessions/:id`
Returns full session with all observations:
```json
{
  "id": "session-uuid",
  "project_id": "abc123",
  "started_at": 1712000000,
  "ended_at": 1712003600,
  "status": "completed",
  "summary_title": "Implement JWT auth middleware",
  "summary_status": "completed",
  "summary_what_we_did": ["Added JWT middleware", "Wrote 12 unit tests"],
  "summary_decisions": ["Use RS256 algorithm for signing"],
  "summary_files_changed": ["src/middleware/jwt.ts", "tests/jwt.test.ts"],
  "summary_next_steps": ["Add rate limiting to /login"],
  "summary_gotchas": ["bcrypt.compare is async — never use sync version"],
  "summary_tech_notes": ["Using jose library not jsonwebtoken"],
  "total_turns": 24,
  "total_tool_calls": 47,
  "observations": [ /* array of observations */ ]
}
```

### `POST /api/search`
Body: `{ "query": "JWT authentication", "project_id": "abc123" (optional) }`
Returns FTS5 search results from observations table:
```json
{
  "results": [
    {
      "observation_id": 123,
      "content": "Implemented JWT middleware using jose library",
      "session_id": "...",
      "session_title": "Implement JWT auth middleware",
      "project_name": "my-app",
      "created_at": 1712000000,
      "relevance_rank": 0.95
    }
  ]
}
```

---

## 11. React Dashboard

### Pages

#### `/ — Projects list`
- Grid of project cards
- Each card: project name, git remote, session count, last active date, quick stats
- Click → goes to `/project/:id`

#### `/project/:id — Project Detail`
- Header: project name, git remote, total sessions, total files changed
- Sessions list: sorted by date, shows title, status badge (completed/in_progress/blocked), duration, files changed count
- Click session → `/session/:id`

#### `/session/:id — Session Detail`
- Session header: title, status, duration, date
- Summary cards: What we did | Decisions | Files changed | Next steps | Gotchas | Tech notes
- Observations timeline: chronological list of tool calls, with file paths and timestamps
- "Copy context" button: copies formatted markdown suitable for pasting into a new Claude session

#### `/search — Search`
- Search input (full text search across all observations)
- Filter by project
- Results list: shows matching observations with session context
- Click result → opens session detail

#### `/live — Live Feed`
- WebSocket connection to worker
- Real-time stream of events from active Claude Code sessions
- Shows: session start/end, tool uses, file edits
- Session selector if multiple sessions running

### Key Components

**`SessionCard.tsx`**
```typescript
// Props: session object
// Shows: title, status badge (color-coded), duration, date, file count
// Clickable → /session/:id
```

**`SummaryView.tsx`**
```typescript
// Props: summary fields (arrays)
// Renders: 6-panel grid
// Each panel: icon + title + bulleted list
// Panels: Done | Decisions | Files | Next Steps | Gotchas | Tech Notes
```

**`StatusBadge.tsx`**
```typescript
// Props: status string
// completed → green badge
// in_progress → yellow badge
// blocked → red badge
// active → blue pulsing badge
// compacted → gray badge
```

**`CopyButton.tsx`**
```typescript
// Copies formatted session summary to clipboard
// Format: markdown ready to paste into Claude Code
// Shows checkmark after copy
```

**`ActivityChart.tsx`**
```typescript
// Recharts BarChart
// X axis: dates (last 14 days)
// Y axis: session count
// Tooltip: shows session titles on hover
```

---

## 12. CLI — `bin/claudectx.ts`

```
Usage: claudectx <command>

Commands:
  install     Install ClaudeContext — registers hooks, starts daemon
  uninstall   Remove hooks and stop daemon
  start       Start the worker daemon
  stop        Stop the worker daemon
  restart     Restart the worker daemon
  status      Show daemon status and health check
  open        Open dashboard in browser
  export      Export all sessions as markdown files
  search      Search sessions from terminal
  config      Show or edit configuration

Options:
  --port      Port for worker (default: 9999)
  --api-key   Set Anthropic API key
  --sessions  Number of sessions to inject at startup (default: 3)
```

**Install flow (`claudectx install`):**
1. Create `~/.claudectx/` directory structure
2. Build hook scripts to `~/.claudectx/hooks/`
3. Merge hooks config into `~/.claude/settings.json` (preserve existing settings)
4. Start pm2 daemon: `pm2 start ~/.claudectx/worker.js --name claudectx`
5. pm2 save (survive reboot)
6. Open `http://localhost:9999` in browser
7. Print success message with instructions

---

## 13. Data Flow — Complete End-to-End

### When a new Claude Code session starts:
```
1. Claude Code fires SessionStart hook
2. session-start.js reads stdin → gets session_id + cwd
3. POSTs to worker POST /api/hook { event: SessionStart, session_id, cwd }
4. Worker upserts session in DB, detects project from cwd+git
5. session-start.js GETs /api/context?cwd=...&n=3
6. Worker queries last 3 completed sessions for this project
7. Builds context markdown string (last 3 summaries)
8. session-start.js writes JSON to stdout: { hookSpecificOutput: { additionalContext: "..." } }
9. Claude Code injects the context — Claude now knows last 3 sessions
10. Dashboard Live page receives WebSocket event: session_start
```

### During the session:
```
Every user message → UserPromptSubmit hook → POST /api/hook → increment turn counter
Every tool use → PostToolUse hook → POST /api/hook → insert observation, track files
Every Claude response → Stop hook → POST /api/hook → broadcast to dashboard
```

### When session ends:
```
1. Claude Code fires SessionEnd hook
2. session-end.js POSTs to worker: { event: SessionEnd, session_id, transcript_path }
3. Worker marks session ended in DB
4. Worker enqueues summarization job
5. Queue processor calls summarizeSession()
6. Reads .jsonl transcript file (last 60 turns)
7. Calls Claude Haiku API with compact transcript
8. Receives structured JSON summary
9. Saves all summary fields to sessions table
10. Inserts key items as searchable observations
11. Updates CLAUDE.md with <!-- CLAUDECTX:START --> block
12. Broadcasts summary_ready event to dashboard
13. Dashboard updates automatically
```

### When user asks "check last 5 sessions":
```
1. User types "check last 5 sessions" in Claude Code
2. Claude Code has MCP context tool registered (see Section 14)
3. Claude calls GET /api/context?cwd=...&n=5
4. Worker returns last 5 session summaries as markdown
5. Claude reads and summarizes for user
```

---

## 14. MCP Tool Registration (Optional Enhancement)

Register a MCP server so Claude can actively query session history mid-conversation.

**`mcp-server.ts`** — registers these tools:
- `claudectx_get_last_sessions(n: number, project?: string)` → returns last N session summaries
- `claudectx_search(query: string)` → full text search across all sessions
- `claudectx_get_session(session_id: string)` → full session detail
- `claudectx_save_decision(content: string)` → force-save current observation

Register with: `claude mcp add claudectx node ~/.claudectx/mcp-server.js`

---

## 15. Error Handling Rules

1. **Hooks must never crash Claude Code.** Every hook wraps all logic in try/catch and always calls `process.exit(0)`.
2. **Worker must never crash.** Use process-level error handlers. pm2 auto-restarts on crash.
3. **Missing API key → graceful degradation.** Sessions still saved, just without AI summaries. Summary fields are null.
4. **Transcript not found → skip summarization.** Log warning, mark session completed anyway.
5. **Database locked → retry 3x with 100ms delay.** SQLite can lock during concurrent writes.
6. **Haiku API error → log error, save session without summary.** Never fail the whole flow.
7. **Hook timeout.** Claude Code kills hooks after configured timeout. Hooks must respond in <2s. Always fire-and-forget to worker.
8. **Worker not running.** Hooks catch connection refused error and exit 0. Claude Code continues normally.

---

## 16. Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...     # Required for AI summaries
CLAUDECTX_PORT=9999               # Worker port (default: 9999)
CLAUDECTX_SESSIONS=3              # Sessions to inject at startup
CLAUDECTX_DISABLE_SUMMARIES=1    # Disable AI summaries (save API calls)
CLAUDECTX_DATA_DIR=~/.claudectx  # Override data directory
```

---

## 17. Package.json

```json
{
  "name": "claudectx",
  "version": "1.0.0",
  "description": "Autonomous session memory for Claude Code",
  "bin": {
    "claudectx": "./dist/bin/claudectx.js"
  },
  "scripts": {
    "build": "npm run build:worker && npm run build:hooks && npm run build:dashboard",
    "build:worker": "tsc -p tsconfig.worker.json",
    "build:hooks": "tsc -p tsconfig.hooks.json",
    "build:dashboard": "cd dashboard && vite build",
    "dev:worker": "tsx watch src/index.ts",
    "dev:dashboard": "cd dashboard && vite",
    "start": "node dist/index.js",
    "install-sdk": "node dist/bin/claudectx.js install"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.26.0",
    "better-sqlite3": "^9.4.3",
    "chokidar": "^3.6.0",
    "express": "^4.19.2",
    "p-queue": "^8.0.1",
    "pm2": "^5.3.1",
    "simple-git": "^3.25.0",
    "ws": "^8.17.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.10",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.0",
    "@types/ws": "^8.5.10",
    "tsx": "^4.11.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 18. Build Order for Replit

Build in this exact order:

1. **Set up project structure** — create all directories and empty files as per Section 4
2. **`src/config.ts`** — all constants and paths
3. **`src/db/schema.ts` + `src/db/client.ts` + `src/db/queries.ts`** — full database layer
4. **`src/hooks/utils.ts`** — shared hook utilities
5. **All 6 hook scripts** — `session-start.ts`, `session-end.ts`, `post-tool-use.ts`, `user-prompt-submit.ts`, `stop.ts`, `pre-compact.ts`
6. **`src/services/project-detector.ts`** — git detection
7. **`src/services/queue.ts`** — p-queue wrapper
8. **`src/services/transcript-reader.ts`** — JSONL parser
9. **`src/services/summarizer.ts`** — Haiku AI summarization
10. **`src/services/context-builder.ts`** — context markdown builder
11. **`src/services/claude-md-updater.ts`** — CLAUDE.md updater
12. **`src/ws/broadcast.ts`** — WebSocket broadcast
13. **All API route files** — hook.ts, sessions.ts, projects.ts, context.ts, search.ts, health.ts
14. **`src/index.ts`** — wire everything together
15. **`installer/` files** — patch-settings.ts, daemon.ts
16. **`bin/claudectx.ts`** — CLI
17. **Dashboard** — React app with all pages and components
18. **`installer/hooks-settings.json`** — hook config
19. **Test end-to-end** — run worker, send mock hook events via curl, verify DB, check dashboard

---

## 19. Testing Checklist

```bash
# 1. Start worker
npm run dev:worker

# 2. Send mock SessionStart
curl -X POST http://localhost:9999/api/hook \
  -H "Content-Type: application/json" \
  -d '{"event":"SessionStart","session_id":"test-123","cwd":"/Users/test/my-project"}'

# 3. Send mock tool use
curl -X POST http://localhost:9999/api/hook \
  -H "Content-Type: application/json" \
  -d '{"event":"PostToolUse","session_id":"test-123","cwd":"/Users/test/my-project","tool_name":"Write","file_path":"src/index.ts","success":true}'

# 4. Send mock session end
curl -X POST http://localhost:9999/api/hook \
  -H "Content-Type: application/json" \
  -d '{"event":"SessionEnd","session_id":"test-123","cwd":"/Users/test/my-project","transcript_path":"/Users/test/.claude/projects/abc/test-123.jsonl"}'

# 5. Check health
curl http://localhost:9999/api/health

# 6. Check projects
curl http://localhost:9999/api/projects

# 7. Check sessions
curl http://localhost:9999/api/sessions?project_id=<project_id>

# 8. Test context injection
curl "http://localhost:9999/api/context?cwd=/Users/test/my-project&n=3"

# 9. Test search
curl -X POST http://localhost:9999/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"index.ts"}'

# 10. Open dashboard
open http://localhost:9999
```

---

## 20. Success Criteria

The system is working correctly when:

1. Starting Claude Code → `session-start.js` hook fires → worker receives event → session created in DB
2. Using any Claude Code tool → `post-tool-use.js` fires → observation saved to DB
3. Ending a Claude Code session → `session-end.js` fires → transcript summarized → summary saved to DB
4. Starting a **new** Claude Code session in the **same project** → context from last 3 sessions auto-injected → Claude knows what happened before without user typing anything
5. `http://localhost:9999` shows all projects, all sessions, all observations with summaries
6. Search returns relevant results from past sessions
7. CLAUDE.md in project root contains updated `<!-- CLAUDECTX:START -->` block after each session
8. `npx claudectx install` completes in under 30 seconds and everything works
9. Worker process survives machine restart (pm2 startup)
10. No Claude Code slowdown — all hooks return in under 100ms

---

*End of PRD — ClaudeContext SDK v1.0*
*Build exactly as specified. Every detail matters.*
