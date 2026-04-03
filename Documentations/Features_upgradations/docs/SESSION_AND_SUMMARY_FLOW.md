# Session and Summary Creation Flow

## Overview

ClaudeContext automatically tracks Claude Code sessions, captures their activity, and generates AI-powered summaries when sessions end. This document explains the complete flow from session start to summary generation.

---

## 1. Session Lifecycle

### 1.1 Session Start

**Trigger:** When Claude Code starts a new conversation

**Hook:** `SessionStart` hook in `~/.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claudectx/hooks/session-start.js",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

**Flow:**

1. Claude Code generates a unique `session_id` (UUID)
2. Claude Code creates a transcript file at:
   ```
   ~/.claude/projects/<project-path>/<session_id>.jsonl
   ```
3. SessionStart hook receives JSON input:
   ```json
   {
     "session_id": "cdf670bf-4648-4ac0-af05-66c0c6133b37",
     "cwd": "/home/max/All_Projects_Files/April 2026 Projects/Claude-Context",
     "transcript_path": "~/.claude/projects/..."
   }
   ```

4. Hook posts to worker API:
   ```javascript
   POST http://localhost:8000/api/hook
   {
     "event": "SessionStart",
     "session_id": "...",
     "cwd": "...",
     "transcript_path": "..."
   }
   ```

5. Worker creates session record in database:
   ```sql
   INSERT INTO sessions (id, project_id, started_at, status, transcript_path)
   VALUES (?, ?, unixepoch(), 'active', ?)
   ```

**Database Schema:**

```sql
CREATE TABLE sessions (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  started_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  ended_at        INTEGER,
  transcript_path TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  summary_title   TEXT,
  summary_status  TEXT,
  summary_what_we_did    TEXT,
  summary_decisions      TEXT,
  summary_files_changed  TEXT,
  summary_next_steps     TEXT,
  summary_gotchas        TEXT,
  summary_tech_notes     TEXT,
  total_turns     INTEGER DEFAULT 0,
  total_tool_calls INTEGER DEFAULT 0,
  files_touched   TEXT,
  tools_used      TEXT,
  estimated_tokens INTEGER DEFAULT 0
);
```

---

### 1.2 Session Activity Tracking

**During the session, ClaudeContext tracks:**

#### User Prompts

**Hook:** `UserPromptSubmit`

```javascript
POST /api/hook
{
  "event": "UserPromptSubmit",
  "session_id": "...",
  "cwd": "...",
  "prompt_preview": "First 200 chars of user message"
}
```

**Stored as observation:**

```sql
INSERT INTO observations (session_id, project_id, event_type, content)
VALUES (?, ?, 'user_message', ?)
```

#### Tool Calls

**Hook:** `PostToolUse`

```javascript
POST /api/hook
{
  "event": "PostToolUse",
  "session_id": "...",
  "tool_name": "Edit",
  "file_path": "/path/to/file.ts",
  "command": "...",
  "success": true
}
```

**Stored as observation:**

```sql
INSERT INTO observations (session_id, project_id, event_type, tool_name, file_path, content)
VALUES (?, ?, 'tool_call', ?, ?, ?)
```

#### Assistant Responses

**Hook:** `Stop` (after each assistant response)

```javascript
POST /api/hook
{
  "event": "Stop",
  "session_id": "...",
  "message_preview": "First 200 chars of response"
}
```

**Stored as observation:**

```sql
INSERT INTO observations (session_id, project_id, event_type, content)
VALUES (?, ?, 'assistant_message', ?)
```

---

### 1.3 Session End

**Trigger:** When user exits Claude Code (Ctrl+D, /exit, or closes terminal)

**Hook:** `SessionEnd`

```json
{
  "hooks": {
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
    ]
  }
}
```

**Flow:**

1. Claude Code finalizes transcript file
2. SessionEnd hook receives:
   ```json
   {
     "session_id": "cdf670bf-4648-4ac0-af05-66c0c6133b37",
     "cwd": "/home/max/All_Projects_Files/April 2026 Projects/Claude-Context",
     "transcript_path": "~/.claude/projects/.../cdf670bf-4648-4ac0-af05-66c0c6133b37.jsonl"
   }
   ```

3. Hook posts to worker:
   ```javascript
   POST http://localhost:8000/api/hook
   {
     "event": "SessionEnd",
     "session_id": "...",
     "cwd": "...",
     "transcript_path": "..."
   }
   ```

4. Worker updates session:
   ```sql
   UPDATE sessions
   SET ended_at = unixepoch(),
       status = 'completed',
       transcript_path = ?
   WHERE id = ?
   ```

5. Worker enqueues summarization job:
   ```javascript
   enqueue(() => summarizeSession(session_id, transcript_path, project_id))
   ```

---

## 2. AI Summary Generation

### 2.1 Transcript Reading

**File:** `src/services/transcript-reader.ts`

**Transcript Format (JSONL):**

```jsonl
{"type":"user","content":"check recent context","timestamp":1775175855000}
{"type":"tool_use","name":"Bash","input":{"command":"curl -s http://localhost:9999/api/context"},"timestamp":1775175856000}
{"type":"tool_result","tool_use_id":"...","content":"...","timestamp":1775175857000}
{"type":"assistant","content":"The ClaudeContext system is working...","timestamp":1775175858000}
```

**Reading Process:**

```typescript
export async function readTranscript(path: string): Promise<Turn[]> {
  const content = await fs.readFile(path, 'utf-8')
  const lines = content.trim().split('\n')
  
  return lines.map(line => {
    try {
      return JSON.parse(line)
    } catch {
      return null
    }
  }).filter(Boolean)
}
```

**Turn Types:**

- `user` - User messages
- `assistant` - Claude responses
- `tool_use` - Tool invocations
- `tool_result` - Tool outputs

---

### 2.2 Transcript Compaction

**File:** `src/services/summarizer.ts`

**Why Compact?**

- Full transcripts can be 100K+ tokens
- AI summarization has token limits (1500 tokens for summary)
- Only recent context matters for summary

**Compaction Strategy:**

```typescript
// Take last 60 turns only
const recentTurns = turns.slice(-60)

// Compact each turn
const compactTranscript = recentTurns.map(t => {
  if (t.role === 'user') 
    return `USER: ${(t.content || '').slice(0, 300)}`
  
  if (t.role === 'assistant') 
    return `CLAUDE: ${(t.content || '').slice(0, 400)}`
  
  if (t.type === 'tool_use') 
    return `TOOL(${t.name}): ${JSON.stringify(t.input || {}).slice(0, 200)}`
  
  return null
}).filter(Boolean).join('\n')
```

**Example Compacted Transcript:**

```
USER: check recent context
TOOL(Bash): {"command":"curl -s http://localhost:9999/api/context"}
CLAUDE: The ClaudeContext system is working. Here's what the recent context shows...
USER: continue
TOOL(Bash): {"command":"sqlite3 ~/.claudectx/db.sqlite \"SELECT...\""}
CLAUDE: The session has no ended_at timestamp...
```

---

### 2.3 AI Summarization Request

**API Configuration:**

```typescript
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN || 'sk_9router',
  baseURL: process.env.ANTHROPIC_BASE_URL || 'http://localhost:20128/v1'
})
```

**Model Selection:**

```typescript
const model = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'AWS'
// 'AWS' is an alias in 9router that routes to the fastest available model
```

**System Prompt:**

```typescript
system: `You are a memory extraction system. Analyze the session and extract:
1. Session summary (what was done)
2. User preferences discovered (coding style, workflow, communication)
3. Domain knowledge learned (technologies, patterns, gotchas)
4. Problem-solving patterns used
5. Pending tasks identified
6. People/teams mentioned

Always respond with ONLY valid JSON matching the exact schema provided. No preamble, no markdown, no explanation.`
```

**User Prompt:**

```typescript
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
  "tech_stack_notes": ["framework/library/pattern note"],
  "preferences": [{"category": "coding", "key": "style", "value": "TypeScript", "confidence": 0.9}],
  "knowledge": [{"category": "technology", "topic": "9router", "content": "Returns OpenAI format", "confidence": 0.8}],
  "patterns": [{"type": "debugging", "title": "Check logs first", "description": "Always check logs before diving into code"}],
  "tasks": [{"title": "Fix bug", "description": "Details", "priority": "high", "status": "pending"}],
  "contacts": [{"name": "John", "type": "person", "role": "engineer", "context": "discussed API"}]
}

Rules:
- what_we_did: max 5 items, be specific (not "wrote code")
- decisions_made: only real decisions, skip trivial ones
- files_changed: only files actually modified/created
- next_steps: max 3 items, most important first
- gotchas: warnings, edge cases, things that went wrong
- tech_stack_notes: libraries, frameworks, patterns used
- preferences: user's coding style, workflow preferences
- knowledge: domain knowledge learned during session
- patterns: problem-solving approaches that worked
- tasks: pending work identified during session
- contacts: people/teams mentioned in conversation`
}]
```

**API Call:**

```typescript
const response = await client.messages.create({
  model: 'AWS',
  max_tokens: 1500,
  stream: false,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }]
})
```

---

### 2.4 Response Parsing

**Raw AI Response:**

```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\"title\":\"Fixed ClaudeContext Session Summarization\",\"status\":\"completed\",\"what_we_did\":[\"Restarted worker with correct API endpoint\",\"Generated summaries for all completed sessions\"],\"decisions_made\":[],\"files_changed\":[],\"next_steps\":[\"Monitor current session completion\"],\"gotchas\":[\"Worker must use port 8000 for hooks to reach it\"],\"tech_stack_notes\":[],\"preferences\":[],\"knowledge\":[],\"patterns\":[],\"tasks\":[],\"contacts\":[]}"
    }
  ]
}
```

**Parsing:**

```typescript
const textContent = response.content.find(c => c.type === 'text')
if (!textContent) throw new Error('No text content in response')

const summary: SessionSummary = JSON.parse(textContent.text)
```

**Validation:**

```typescript
if (!summary.title || !summary.status || !summary.what_we_did) {
  throw new Error('Invalid summary structure')
}
```

---

### 2.5 Summary Storage

**Database Update:**

```typescript
queries.updateSession(sessionId, {
  summary_status: summary.status,
  summary_title: summary.title,
  summary_what_we_did: JSON.stringify(summary.what_we_did),
  summary_decisions: JSON.stringify(summary.decisions_made),
  summary_files_changed: JSON.stringify(summary.files_changed),
  summary_next_steps: JSON.stringify(summary.next_steps),
  summary_gotchas: JSON.stringify(summary.gotchas),
  summary_tech_notes: JSON.stringify(summary.tech_stack_notes)
})
```

**SQL:**

```sql
UPDATE sessions
SET summary_status = 'completed',
    summary_title = 'Fixed ClaudeContext Session Summarization',
    summary_what_we_did = '["Restarted worker with correct API endpoint","Generated summaries for all completed sessions"]',
    summary_decisions = '[]',
    summary_files_changed = '[]',
    summary_next_steps = '["Monitor current session completion"]',
    summary_gotchas = '["Worker must use port 8000 for hooks to reach it"]',
    summary_tech_notes = '[]'
WHERE id = 'cdf670bf-4648-4ac0-af05-66c0c6133b37'
```

---

### 2.6 CLAUDE.md Auto-Update

**File:** `src/services/claude-md-updater.ts`

**Purpose:** Inject session summary into project's CLAUDE.md file

**Process:**

1. **Detect project CLAUDE.md:**
   ```typescript
   const claudeMdPath = path.join(projectPath, 'CLAUDE.md')
   ```

2. **Read existing content:**
   ```typescript
   let content = ''
   if (fs.existsSync(claudeMdPath)) {
     content = await fs.readFile(claudeMdPath, 'utf-8')
   }
   ```

3. **Generate session summary block:**
   ```typescript
   const sessionBlock = `## Recent session history (auto-updated by ClaudeContext)
**Last session:** ${summary.title} — ${summary.status.toUpperCase()}
**Completed:** ${summary.what_we_did.join(', ')}
**Up next:** ${summary.next_steps.join(', ')}
**Remember:** ${summary.gotchas.join(', ')}
_Updated automatically. View full history at http://localhost:8000_`
   ```

4. **Inject or replace:**
   ```typescript
   const startMarker = '<!-- CLAUDECTX:START -->'
   const endMarker = '<!-- CLAUDECTX:END -->'
   
   if (content.includes(startMarker)) {
     // Replace existing block
     const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g')
     content = content.replace(regex, `${startMarker}\n${sessionBlock}\n${endMarker}`)
   } else {
     // Prepend new block
     content = `\n\n${startMarker}\n${sessionBlock}\n${endMarker}\n\n${content}`
   }
   ```

5. **Write back:**
   ```typescript
   await fs.writeFile(claudeMdPath, content, 'utf-8')
   ```

**Result in CLAUDE.md:**

```markdown
<!-- CLAUDECTX:START -->
## Recent session history (auto-updated by ClaudeContext)
**Last session:** Fixed ClaudeContext Session Summarization — COMPLETED
**Completed:** Restarted worker with correct API endpoint, Generated summaries for all completed sessions
**Up next:** Monitor current session completion
**Remember:** Worker must use port 8000 for hooks to reach it
_Updated automatically. View full history at http://localhost:8000_
<!-- CLAUDECTX:END -->
```

---

## 3. Summary Retrieval

### 3.1 Context API

**Endpoint:** `GET /api/context?cwd=/path/to/project`

**File:** `src/api/context.ts`

**Process:**

1. **Detect project:**
   ```typescript
   const project = await detectProject(cwd)
   ```

2. **Get recent completed sessions:**
   ```typescript
   const sessions = queries.getRecentCompletedSessions(project.id, 3)
   ```

   ```sql
   SELECT * FROM sessions
   WHERE project_id = ? 
     AND ended_at IS NOT NULL
     AND summary_title IS NOT NULL
   ORDER BY ended_at DESC
   LIMIT 3
   ```

3. **Build markdown:**
   ```typescript
   const markdown = buildContextMarkdown(sessions)
   ```

4. **Return:**
   ```json
   {
     "markdown": "=== ClaudeContext Memory ===\n\n## Recent Sessions\n..."
   }
   ```

---

### 3.2 SessionStart Hook Injection

**When new session starts:**

1. SessionStart hook calls context API
2. Gets markdown with recent session summaries
3. Injects into Claude's system prompt
4. Claude has full context from previous sessions

**Injection Point:**

```javascript
// In session-start.js hook
const context = await fetch(`http://localhost:8000/api/context?cwd=${cwd}`)
const { markdown } = await context.json()

// Markdown is automatically injected by Claude Code
// into the system prompt as a <system-reminder> block
```

---

## 4. Error Handling

### 4.1 Summarization Failures

**Common Errors:**

1. **API Connection Failed:**
   ```
   APIConnectionError: Connection error.
   ```
   - **Cause:** 9router not running or wrong port
   - **Fix:** Check `ANTHROPIC_BASE_URL` environment variable

2. **502 Bad Gateway:**
   ```
   InternalServerError: 502 {"error":{"message":"fetch failed"}}
   ```
   - **Cause:** Model not available or wrong model name
   - **Fix:** Use `AWS` alias instead of specific model names

3. **Invalid JSON Response:**
   ```
   SyntaxError: Unexpected token in JSON
   ```
   - **Cause:** AI returned markdown or explanation instead of pure JSON
   - **Fix:** System prompt emphasizes "ONLY JSON, no markdown"

**Retry Logic:**

```typescript
try {
  await summarizeSession(sessionId, transcriptPath, projectId)
} catch (err) {
  console.error('Summarization failed:', err)
  queries.updateSession(sessionId, {
    summary_status: 'failed'
  })
}
```

---

### 4.2 Hook Failures

**Silent Failures:**

```javascript
try {
  await postToWorker('/api/hook', payload)
} catch {
  // Ignore — worker will pick up transcript via file watcher
}
```

**Why Silent?**

- Hooks must not block Claude Code startup/shutdown
- Worker has file watcher as backup mechanism
- Session data is preserved in transcript file

---

## 5. Performance Considerations

### 5.1 Queue System

**File:** `src/services/queue.ts`

**Why Queue?**

- Summarization takes 5-15 seconds
- Multiple sessions might end simultaneously
- Prevents API rate limiting

**Implementation:**

```typescript
import PQueue from 'p-queue'

const queue = new PQueue({ concurrency: 1 })

export function enqueue(fn: () => Promise<void>) {
  queue.add(fn)
}
```

**Usage:**

```typescript
enqueue(() => summarizeSession(sessionId, transcriptPath, projectId))
```

---

### 5.2 Caching

**No caching needed because:**

- Summaries generated once per session
- Stored in database permanently
- Context API reads from database (fast)

---

## 6. Monitoring

### 6.1 Health Check

**Endpoint:** `GET /api/health`

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "db": "connected",
  "api_key": true,
  "summaries_enabled": true,
  "uptime": 3600,
  "queue_size": 0
}
```

---

### 6.2 Logs

**Worker logs:** `/tmp/claudectx.log`

**Key log messages:**

```
[Summarizer] Starting summarization for session abc123
[Summarizer] Using model: AWS
[Summarizer] API Base URL: http://localhost:20128/v1
Summary saved for session abc123: "Fixed Bug in Authentication"
```

---

## 7. Troubleshooting

### Issue: Sessions not being marked as ended

**Symptoms:**
- `ended_at` is NULL in database
- No summaries generated

**Diagnosis:**
```sql
SELECT id, started_at, ended_at FROM sessions WHERE ended_at IS NULL;
```

**Fix:**
1. Check SessionEnd hook is configured
2. Verify worker is running on port 8000
3. Manually trigger:
   ```bash
   echo '{"session_id":"...","cwd":"...","transcript_path":"..."}' | node ~/.claudectx/hooks/session-end.js
   ```

---

### Issue: Summaries failing with 502 error

**Symptoms:**
```
InternalServerError: 502 fetch failed
```

**Diagnosis:**
```bash
curl http://localhost:20128/v1/models
```

**Fix:**
1. Ensure 9router is running
2. Use `AWS` model alias
3. Set environment variables:
   ```bash
   ANTHROPIC_BASE_URL=http://localhost:20128/v1
   ANTHROPIC_AUTH_TOKEN=sk_9router
   ANTHROPIC_DEFAULT_HAIKU_MODEL=AWS
   ```

---

### Issue: No transcript file

**Symptoms:**
- `transcript_path` is NULL or file doesn't exist
- Cannot generate summary

**Diagnosis:**
```bash
ls -la ~/.claude/projects/<project-path>/<session-id>.jsonl
```

**Fix:**
- Transcript files are created by Claude Code automatically
- If missing, session cannot be summarized
- This is expected for very short sessions (< 1 turn)

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Claude Code                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ SessionStart │  │ UserPrompt   │  │ SessionEnd   │     │
│  │    Hook      │  │    Hook      │  │    Hook      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  Transcript    │                       │
│                    │  .jsonl file   │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  POST /api/hook │
                    └────────┬────────┘
                             │
┌────────────────────────────▼──────────────────────────────┐
│                   ClaudeContext Worker                     │
│                   (Node.js + Express)                      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Hook Handler                            │ │
│  │  • SessionStart → Create session record             │ │
│  │  • UserPrompt → Store observation                   │ │
│  │  • SessionEnd → Mark ended + enqueue summary        │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                      │
│  ┌──────────────────▼───────────────────────────────────┐ │
│  │              Queue System (p-queue)                  │ │
│  │  • Concurrency: 1                                    │ │
│  │  • Prevents API rate limiting                        │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                      │
│  ┌──────────────────▼───────────────────────────────────┐ │
│  │              Summarizer Service                      │ │
│  │  1. Read transcript (.jsonl)                         │ │
│  │  2. Compact to last 60 turns                         │ │
│  │  3. Call Anthropic API                               │ │
│  │  4. Parse JSON response                              │ │
│  │  5. Store summary in DB                              │ │
│  │  6. Update CLAUDE.md                                 │ │
│  │  7. Extract memory (preferences, knowledge, etc)     │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                      │
│  ┌──────────────────▼───────────────────────────────────┐ │
│  │           SQLite Database                            │ │
│  │  • sessions (with summary fields)                    │ │
│  │  • observations (user/assistant/tool events)         │ │
│  │  • preferences, knowledge, patterns, tasks           │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Anthropic API   │
                    │  (via 9router)  │
                    │  Model: AWS     │
                    └─────────────────┘
```

---

## 9. Configuration Reference

### Environment Variables

```bash
# API Configuration
ANTHROPIC_BASE_URL=http://localhost:20128/v1
ANTHROPIC_AUTH_TOKEN=sk_9router
ANTHROPIC_DEFAULT_HAIKU_MODEL=AWS

# Worker Configuration
CLAUDECTX_PORT=8000
CLAUDECTX_SESSIONS=3  # Number of recent sessions in context
CLAUDECTX_DISABLE_SUMMARIES=0  # Set to 1 to disable

# Database
# (Auto-detected at ~/.claudectx/db.sqlite)
```

### Hook Configuration

**Location:** `~/.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
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
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claudectx/hooks/post-tool-use.js",
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
    ]
  }
}
```

---

## 10. Next Steps

- Read [MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md) for memory extraction details
- Read [UI_DATA_FLOW.md](./UI_DATA_FLOW.md) for dashboard implementation
- Check [API.md](./API.md) for complete API reference
