# Session and Summary Creation Flow
> **ClaudeContext v2.0** — World-Class Context-Aware Memory System

## Overview

ClaudeContext automatically tracks Claude Code sessions, captures their full activity, extracts deep memory, and injects rich contextual awareness into every new session. This document covers the complete lifecycle: session tracking → AI summarization → memory extraction → context injection → next-session intelligence.

**What makes this system world-class:**
- Claude starts every session already knowing your project state, recent decisions, pending tasks, tech gotchas, and your personal coding preferences
- No re-explaining. No lost context. No repeated mistakes.
- Memory compounds across sessions — the more you use it, the smarter it gets.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claude Code                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐  │
│  │SessionStart │  │UserPrompt    │  │PostTool  │  │Session │  │
│  │    Hook     │  │Submit Hook   │  │Use Hook  │  │End Hook│  │
│  └──────┬──────┘  └──────┬───────┘  └────┬─────┘  └───┬────┘  │
└─────────┼────────────────┼───────────────┼────────────┼────────┘
          │                │               │            │
          └────────────────┴───────────────┴────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  POST /api/hook      │
                         │  (Express Worker)    │
                         └──────────┬──────────┘
                                    │
          ┌─────────────────────────┼──────────────────────────┐
          │                         │                          │
          ▼                         ▼                          ▼
  ┌──────────────┐        ┌──────────────────┐      ┌──────────────────┐
  │  Session DB  │        │  Observation DB  │      │  Memory Engine   │
  │  (sessions)  │        │  (observations)  │      │  (preferences,   │
  └──────────────┘        └──────────────────┘      │   knowledge,     │
                                                     │   patterns,tasks)│
                                                     └──────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  Summarizer Service  │
                         │  (AI-powered)        │
                         └──────────┬──────────┘
                                    │
               ┌────────────────────┼───────────────────────┐
               ▼                    ▼                        ▼
     ┌──────────────┐    ┌────────────────────┐   ┌──────────────────┐
     │  CLAUDE.md   │    │  Semantic Indexer  │   │  Context Builder │
     │  Auto-Update │    │  (vector-ready)    │   │  /api/context    │
     └──────────────┘    └────────────────────┘   └────────┬─────────┘
                                                            │
                                               ┌────────────▼──────────┐
                                               │  SessionStart Hook    │
                                               │  Injects into prompt  │
                                               └───────────────────────┘
```

---

## 1. Session Lifecycle

### 1.1 Session Start

**Trigger:** When Claude Code starts a new conversation

**Hook:** `SessionStart` in `~/.claude/settings.json`

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

**Enhanced Flow:**

1. Claude Code generates a unique `session_id` (UUID)
2. Hook receives JSON input:
   ```json
   {
     "session_id": "cdf670bf-4648-4ac0-af05-66c0c6133b37",
     "cwd": "/home/user/projects/my-app",
     "transcript_path": "~/.claude/projects/.../<session_id>.jsonl"
   }
   ```
3. Hook calls `POST /api/hook` → worker creates session record
4. **[NEW]** Hook calls `GET /api/context` → gets enriched context markdown
5. **[NEW]** Hook calls `GET /api/smart-briefing` → gets AI-generated session briefing
6. Combined context is injected into Claude's system prompt

**[NEW] What gets injected at session start:**
```
=== ClaudeContext Memory ===

## 🧠 Project State
You are working on: "my-app" (Node.js + TypeScript)
Last active: 2 hours ago
Overall project status: IN PROGRESS

## 📋 Last 3 Sessions
### Session 1 (2h ago): "Fixed Auth Token Refresh Bug"
- STATUS: completed
- DID: Identified race condition in token refresh, added mutex lock, wrote regression test
- NEXT: Add integration test for concurrent refresh scenario
- ⚠️ GOTCHA: JWT_SECRET must be set in .env.test or tests silently pass with wrong token

### Session 2 (yesterday): "Set Up CI Pipeline"
- STATUS: completed
- DID: Configured GitHub Actions, added lint/test/build steps
- NEXT: Add deployment step for staging

### Session 3 (2 days ago): "Scaffolded User Auth Module"
- STATUS: completed
- DID: Created auth routes, middleware, refresh token flow
- FILES: src/auth/*, src/middleware/auth.ts

## ✅ Open Tasks (from previous sessions)
1. [HIGH] Add integration test for concurrent token refresh
2. [MED] Add deployment step to CI pipeline
3. [LOW] Move config to environment validation library (zod)

## 🧬 Your Preferences (learned over time)
- Code style: TypeScript strict mode, no `any`
- Testing: Jest + supertest for API tests
- Commits: Conventional commits format
- Error handling: Always use typed error classes
- You prefer reading existing code before suggesting refactors

## ⚡ Domain Knowledge (accumulated)
- JWT_SECRET must be set in .env.test for tests to pass correctly
- 9router returns OpenAI-format responses — parse .choices[0].message.content
- Docker compose for this project requires --build flag after package.json changes

## 🔄 Problem-Solving Patterns (what works for you)
- When debugging: check logs first, then add targeted console.logs, avoid shotgun debugging
- When stuck: ask user to paste the exact error before suggesting fixes

=== End ClaudeContext Memory ===
```

**Database Schema (sessions):**

```sql
CREATE TABLE sessions (
  id                     TEXT PRIMARY KEY,
  project_id             TEXT NOT NULL REFERENCES projects(id),
  started_at             INTEGER NOT NULL DEFAULT (unixepoch()),
  ended_at               INTEGER,
  transcript_path        TEXT,
  status                 TEXT NOT NULL DEFAULT 'active',

  -- Summary fields
  summary_title          TEXT,
  summary_status         TEXT,
  summary_what_we_did    TEXT,   -- JSON array
  summary_decisions      TEXT,   -- JSON array
  summary_files_changed  TEXT,   -- JSON array
  summary_next_steps     TEXT,   -- JSON array
  summary_gotchas        TEXT,   -- JSON array
  summary_tech_notes     TEXT,   -- JSON array

  -- [NEW] Enhanced fields
  summary_mood           TEXT,   -- 'productive' | 'struggling' | 'exploratory' | 'debugging'
  summary_complexity     INTEGER, -- 1-5 complexity score
  summary_blockers       TEXT,   -- JSON array of active blockers
  summary_resolved       TEXT,   -- JSON array of resolved issues this session
  summary_key_insight    TEXT,   -- single most important insight from session

  -- Metrics
  total_turns            INTEGER DEFAULT 0,
  total_tool_calls       INTEGER DEFAULT 0,
  files_touched          TEXT,   -- JSON array
  tools_used             TEXT,   -- JSON array
  estimated_tokens       INTEGER DEFAULT 0,
  duration_seconds       INTEGER, -- [NEW] session duration

  -- [NEW] Embedding (for semantic search)
  embedding_summary      TEXT    -- JSON float array (1536 dims) for semantic retrieval
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
  "prompt_preview": "First 500 chars of user message"  // [UPGRADED: was 200]
}
```

**[NEW] Intent Detection:** Worker runs a fast local classifier on the prompt to tag intent:
- `debug` — user is fixing a bug
- `feature` — user is building something new
- `refactor` — user is restructuring code
- `question` — user is asking about something
- `review` — user wants something reviewed

This powers per-intent analytics and smarter context injection.

**Stored as observation:**

```sql
INSERT INTO observations (session_id, project_id, event_type, content, intent_tag, word_count)
VALUES (?, ?, 'user_message', ?, ?, ?)
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
  "success": true,
  "duration_ms": 120  // [NEW]
}
```

**[NEW] File change tracking:** Worker maintains a rolling set of files touched per session. When the session ends, this becomes the authoritative `files_touched` list.

**Stored as observation:**

```sql
INSERT INTO observations (session_id, project_id, event_type, tool_name, file_path, content, success, duration_ms)
VALUES (?, ?, 'tool_call', ?, ?, ?, ?, ?)
```

#### Assistant Responses

**Hook:** `Stop` (after each assistant response)

```javascript
POST /api/hook
{
  "event": "Stop",
  "session_id": "...",
  "message_preview": "First 500 chars of response",  // [UPGRADED: was 200]
  "stop_reason": "end_turn"  // [NEW]
}
```

**[NEW] Response quality signal:** If `stop_reason` is `max_tokens`, the worker flags this session as having potentially incomplete responses — useful for debugging truncated outputs.

---

### 1.3 Session End

**Trigger:** When user exits Claude Code (Ctrl+D, /exit, or terminal close)

**Hook:** `SessionEnd`

**Enhanced Flow:**

1. Claude Code finalizes transcript file
2. Hook posts to worker with transcript path
3. Worker marks session ended + calculates `duration_seconds`
4. Worker reads transcript to compute final metrics (total turns, tool calls, files touched)
5. Worker enqueues full summarization job
6. **[NEW]** Worker enqueues memory consolidation job (runs after summary)
7. **[NEW]** Worker enqueues CLAUDE.md update job
8. **[NEW]** Worker emits `session:ended` event to dashboard via SSE

```sql
UPDATE sessions
SET ended_at = unixepoch(),
    status = 'completed',
    transcript_path = ?,
    duration_seconds = unixepoch() - started_at,
    total_turns = ?,
    total_tool_calls = ?,
    files_touched = ?
WHERE id = ?
```

---

## 2. AI Summary Generation

### 2.1 Transcript Reading

**File:** `src/services/transcript-reader.ts`

**Transcript Format (JSONL):**

```jsonl
{"type":"user","content":"fix the token refresh bug","timestamp":1775175855000}
{"type":"tool_use","name":"Read","input":{"file_path":"src/auth/refresh.ts"},"timestamp":1775175856000}
{"type":"tool_result","tool_use_id":"...","content":"...file contents...","timestamp":1775175857000}
{"type":"assistant","content":"I can see the issue — there's a race condition...","timestamp":1775175858000}
```

**[UPGRADED] Turn Types recognized:**
- `user` — user messages
- `assistant` — Claude responses
- `tool_use` — tool invocations
- `tool_result` — tool outputs
- `system` — system messages (filtered out before summarization)

---

### 2.2 Transcript Compaction

**[UPGRADED] Smart Compaction Strategy:**

The old system took the last 60 turns blindly. The new system is smarter:

```typescript
function compactTranscript(turns: Turn[]): string {
  // Always keep first 5 turns (session intent/context)
  const opening = turns.slice(0, 5)

  // Always keep last 40 turns (recent work)
  const recent = turns.slice(-40)

  // From the middle: sample 15 turns prioritizing tool calls and decisions
  const middle = turns.slice(5, -40)
  const importantMiddle = middle
    .filter(t => 
      t.type === 'tool_use' ||                          // tool calls = action taken
      (t.type === 'user' && t.content?.length > 100) || // substantial user messages
      (t.type === 'assistant' && /decided|choosing|instead|because/i.test(t.content || ''))
    )
    .slice(-15)  // keep at most 15 from middle

  const selected = [...opening, ...importantMiddle, ...recent]

  return selected.map(t => {
    if (t.type === 'user')
      return `USER: ${(t.content || '').slice(0, 500)}`
    if (t.type === 'assistant')
      return `CLAUDE: ${(t.content || '').slice(0, 600)}`
    if (t.type === 'tool_use')
      return `TOOL(${t.name}): ${JSON.stringify(t.input || {}).slice(0, 300)}`
    return null
  }).filter(Boolean).join('\n')
}
```

**Why this matters:** Sessions that go 200+ turns (complex debugging, long builds) still produce accurate summaries because we preserve the opening intent + key middle decisions + recent work.

---

### 2.3 AI Summarization Request

**[UPGRADED] System Prompt:**

```typescript
const system = `You are a world-class engineering memory system embedded in a developer's workflow.

Your job: Extract maximum signal from a Claude Code session transcript so the developer never loses context between sessions.

You deeply understand software engineering. You recognize:
- When a bug was truly fixed vs just worked around
- The difference between a decision and a coincidence
- What "gotchas" will actually bite them later
- What "next steps" are genuinely important vs nice-to-have
- The developer's implicit preferences from HOW they communicate and code

Extract everything a brilliant senior engineer colleague would want to know before picking up this work tomorrow.

Rules:
- Be specific. Not "fixed a bug" — "fixed race condition in token refresh by adding mutex lock"
- Be honest about status. If they're stuck, say blocked. If they explored and found nothing, say that.
- Gotchas must be actionable warnings, not observations.
- Preferences should reflect HOW the developer works, not just WHAT they worked on.
- Tasks must have enough description to be actionable without re-reading the transcript.

Respond ONLY with valid JSON. No preamble, no markdown fences, no explanation.`
```

**[UPGRADED] User Prompt with richer schema:**

```typescript
const userPrompt = `Analyze this Claude Code session and extract structured memory.

PROJECT: ${projectName}
DURATION: ${durationMinutes} minutes
TOTAL TURNS: ${totalTurns}
FILES TOUCHED: ${filesTouched.join(', ')}

TRANSCRIPT:
${compactTranscript}

Return ONLY this exact JSON:
{
  "title": "5-8 word title — specific, action-oriented (e.g. 'Fixed JWT Race Condition in Auth Module')",
  "status": "completed | in_progress | blocked | exploratory",
  "mood": "productive | struggling | debugging | exploratory | refactoring",
  "complexity": 3,  // 1=trivial, 2=simple, 3=moderate, 4=complex, 5=very complex
  "key_insight": "Single most important thing learned or decided this session",

  "what_we_did": [
    "Specific action taken (verb + object + result)"
  ],
  "decisions_made": [
    "Decision made and WHY — include the reasoning, not just the outcome"
  ],
  "files_changed": ["relative/path/to/file.ts"],
  "blockers": [
    "Active blocker that was NOT resolved — include what was tried"
  ],
  "resolved": [
    "Issue that WAS resolved — include how it was fixed"
  ],
  "next_steps": [
    {"action": "Specific thing to do next", "priority": "high|med|low", "context": "Why this matters or what to watch out for"}
  ],
  "gotchas": [
    {"warning": "Specific thing that WILL cause problems if forgotten", "severity": "critical|high|med"}
  ],
  "tech_stack_notes": [
    "Framework/library/pattern insight discovered this session"
  ],

  "preferences": [
    {
      "category": "coding|testing|workflow|communication|tooling",
      "key": "Short key name",
      "value": "The preference itself",
      "confidence": 0.9,
      "evidence": "Brief quote or observation that revealed this preference"
    }
  ],
  "knowledge": [
    {
      "category": "technology|domain|architecture|process",
      "topic": "Specific topic",
      "content": "The insight or fact learned",
      "confidence": 0.8,
      "source": "discovered|confirmed|updated"
    }
  ],
  "patterns": [
    {
      "type": "debugging|architecture|workflow|communication",
      "title": "Pattern name",
      "description": "When this pattern applies and what makes it work",
      "effectiveness": "high|med|low"
    }
  ],
  "tasks": [
    {
      "title": "Short task title",
      "description": "Full context needed to do this without re-reading transcript",
      "priority": "high|med|low",
      "status": "pending|in_progress|blocked",
      "blockedBy": "What's blocking it (if status is blocked)"
    }
  ],
  "contacts": [
    {
      "name": "Name",
      "type": "person|team|service|company",
      "role": "Their role",
      "context": "Why they're relevant to this project"
    }
  ]
}

Rules:
- what_we_did: max 6 items. Be surgical — each item should be independently meaningful
- decisions_made: only include real decisions with real reasoning. Skip trivial choices.
- next_steps: max 4 items, ordered by priority. Include enough context to be actionable cold.
- gotchas: only warnings that will ACTUALLY cause problems. No obvious things.
- preferences: only when there's clear evidence from how they asked or what they chose
- knowledge: only newly discovered or newly confirmed facts about the tech/domain
- complexity: honest assessment — helps calibrate future session planning`
```

**[NEW] API call with extended token budget:**

```typescript
const response = await client.messages.create({
  model: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'AWS',
  max_tokens: 2500,   // upgraded from 1500 — complex sessions need room
  stream: false,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }]
})
```

---

### 2.4 Response Parsing

**[UPGRADED] Resilient Parser:**

```typescript
function parseSummaryResponse(raw: string): SessionSummary {
  let text = raw.trim()

  // Strip markdown fences if AI ignored instructions
  text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
  text = text.replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()

  // Strip any leading/trailing explanation text
  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')
  if (jsonStart > 0 || jsonEnd < text.length - 1) {
    text = text.slice(jsonStart, jsonEnd + 1)
  }

  const parsed = JSON.parse(text)

  // Validate required fields with defaults
  return {
    title: parsed.title || 'Untitled Session',
    status: ['completed', 'in_progress', 'blocked', 'exploratory'].includes(parsed.status)
      ? parsed.status : 'completed',
    mood: parsed.mood || 'productive',
    complexity: parsed.complexity || 3,
    key_insight: parsed.key_insight || '',
    what_we_did: Array.isArray(parsed.what_we_did) ? parsed.what_we_did : [],
    decisions_made: Array.isArray(parsed.decisions_made) ? parsed.decisions_made : [],
    files_changed: Array.isArray(parsed.files_changed) ? parsed.files_changed : [],
    blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
    resolved: Array.isArray(parsed.resolved) ? parsed.resolved : [],
    next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
    gotchas: Array.isArray(parsed.gotchas) ? parsed.gotchas : [],
    tech_stack_notes: Array.isArray(parsed.tech_stack_notes) ? parsed.tech_stack_notes : [],
    preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
    knowledge: Array.isArray(parsed.knowledge) ? parsed.knowledge : [],
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    contacts: Array.isArray(parsed.contacts) ? parsed.contacts : []
  }
}
```

---

### 2.5 Summary Storage

**[UPGRADED] Full storage of all new fields:**

```typescript
queries.updateSession(sessionId, {
  summary_status: summary.status,
  summary_title: summary.title,
  summary_mood: summary.mood,
  summary_complexity: summary.complexity,
  summary_key_insight: summary.key_insight,
  summary_what_we_did: JSON.stringify(summary.what_we_did),
  summary_decisions: JSON.stringify(summary.decisions_made),
  summary_files_changed: JSON.stringify(summary.files_changed),
  summary_blockers: JSON.stringify(summary.blockers),
  summary_resolved: JSON.stringify(summary.resolved),
  summary_next_steps: JSON.stringify(summary.next_steps),
  summary_gotchas: JSON.stringify(summary.gotchas),
  summary_tech_notes: JSON.stringify(summary.tech_stack_notes)
})
```

---

### 2.6 CLAUDE.md Auto-Update

**[UPGRADED] Richer session block:**

```markdown
<!-- CLAUDECTX:START -->
## 🧠 ClaudeContext — Auto-Updated Session Memory

> Last updated: 2025-04-03 14:32 UTC | Managed by ClaudeContext — do not edit this block manually

### 🔴 Active Blockers
- Add integration test for concurrent token refresh — blocked by: need to set up test DB fixtures

### ✅ Recent Work (last 3 sessions)
| Session | Status | What We Did |
|---------|--------|-------------|
| Fixed JWT Race Condition in Auth Module | ✅ completed | Added mutex lock to refresh flow, wrote regression test |
| Set Up CI Pipeline | ✅ completed | GitHub Actions with lint/test/build |
| Scaffolded User Auth Module | ✅ completed | Auth routes, middleware, refresh token flow |

### 📋 Open Tasks
- [HIGH] Add integration test for concurrent token refresh
- [MED] Add deployment step to CI pipeline
- [LOW] Move config to zod validation

### ⚠️ Critical Gotchas
- JWT_SECRET must be set in .env.test or tests silently pass with wrong tokens (CRITICAL)
- Docker compose requires --build flag after package.json changes (HIGH)

### 💡 Key Insight from Last Session
Race condition in token refresh was caused by two concurrent requests both reading stale `refreshToken` before either had written the new one — fixed with mutex, not just retry logic.

_View full history → http://localhost:8000_
<!-- CLAUDECTX:END -->
```

---

## 3. Memory Consolidation Engine

**[NEW] This is the system that makes ClaudeContext get smarter over time.**

### 3.1 Why Memory Consolidation?

Per-session summaries capture what happened. Memory consolidation extracts what's **true across sessions** — your actual preferences, project-wide knowledge, and stable patterns.

### 3.2 Consolidation Process

**File:** `src/services/memory-consolidator.ts`

**Runs after every session summary is generated.**

**Step 1 — Merge preferences:**
```typescript
// New preference from session:
{ category: 'testing', key: 'framework', value: 'Jest + supertest', confidence: 0.8 }

// Existing preference in DB:
{ category: 'testing', key: 'framework', value: 'Jest + supertest', confidence: 0.7, seen_count: 3 }

// After merge:
{ ..., confidence: 0.85, seen_count: 4, last_seen: now() }
// Confidence increases each time preference is confirmed
```

**Step 2 — Deduplicate knowledge:**
```typescript
// Check if knowledge already exists (fuzzy match on topic + category)
const existing = await findSimilarKnowledge(item.topic, item.category)
if (existing) {
  // Update confidence and timestamp
  await updateKnowledge(existing.id, { confidence: Math.max(existing.confidence, item.confidence), last_confirmed: now() })
} else {
  await insertKnowledge(item)
}
```

**Step 3 — Resolve tasks across sessions:**
```typescript
// If session summary contains resolved items, find matching open tasks and close them
for (const resolved of summary.resolved) {
  const match = await findSimilarTask(resolved, projectId)
  if (match) {
    await closeTask(match.id, { resolved_in: sessionId, resolution: resolved })
  }
}

// Add new tasks from session
for (const task of summary.tasks) {
  if (task.status !== 'completed') {
    await upsertTask(task, projectId)
  }
}
```

**Step 4 — Pattern reinforcement:**
```typescript
// Patterns that appear in multiple sessions get elevated
const existing = await findPattern(pattern.type, pattern.title)
if (existing) {
  await incrementPatternCount(existing.id)  // seen_count++
} else {
  await insertPattern(pattern)
}
```

### 3.3 Memory Tables

```sql
-- User preferences (accumulated across all sessions)
CREATE TABLE preferences (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT REFERENCES projects(id),  -- NULL = global preference
  category    TEXT NOT NULL,   -- 'coding' | 'testing' | 'workflow' | 'communication' | 'tooling'
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  confidence  REAL NOT NULL DEFAULT 0.5,
  seen_count  INTEGER NOT NULL DEFAULT 1,
  first_seen  INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen   INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(project_id, category, key)
);

-- Domain knowledge (accumulated per project)
CREATE TABLE knowledge (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   TEXT NOT NULL REFERENCES projects(id),
  category     TEXT NOT NULL,   -- 'technology' | 'domain' | 'architecture' | 'process'
  topic        TEXT NOT NULL,
  content      TEXT NOT NULL,
  confidence   REAL NOT NULL DEFAULT 0.5,
  source       TEXT,            -- 'discovered' | 'confirmed' | 'updated'
  seen_count   INTEGER NOT NULL DEFAULT 1,
  first_seen   INTEGER NOT NULL DEFAULT (unixepoch()),
  last_confirmed INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Problem-solving patterns
CREATE TABLE patterns (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   TEXT,            -- NULL = global pattern
  type         TEXT NOT NULL,   -- 'debugging' | 'architecture' | 'workflow' | 'communication'
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  effectiveness TEXT NOT NULL DEFAULT 'med',
  seen_count   INTEGER NOT NULL DEFAULT 1,
  UNIQUE(project_id, type, title)
);

-- Tasks (persistent, cross-session)
CREATE TABLE tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   TEXT NOT NULL REFERENCES projects(id),
  session_id   TEXT REFERENCES sessions(id),  -- session where task was identified
  title        TEXT NOT NULL,
  description  TEXT,
  priority     TEXT NOT NULL DEFAULT 'med',   -- 'high' | 'med' | 'low'
  status       TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'blocked' | 'completed'
  blocked_by   TEXT,
  resolved_in  TEXT REFERENCES sessions(id),  -- session where task was completed
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Contacts
CREATE TABLE contacts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,   -- 'person' | 'team' | 'service' | 'company'
  role        TEXT,
  context     TEXT,
  first_seen  INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen   INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(project_id, name, type)
);
```

---

## 4. Context API

### 4.1 Core Context Endpoint

**Endpoint:** `GET /api/context?cwd=/path/to/project`

**[UPGRADED] Returns richly structured context:**

```typescript
{
  "markdown": "=== ClaudeContext Memory ===\n...",   // ready for system prompt injection
  "structured": {                                     // [NEW] for programmatic use
    "project": { "id": "...", "name": "my-app", "path": "..." },
    "sessions": [...],
    "tasks": [...],
    "preferences": [...],
    "knowledge": [...],
    "patterns": [...],
    "contacts": [...],
    "blockers": [...]
  }
}
```

**[UPGRADED] Context Markdown Builder:**

```typescript
function buildContextMarkdown(data: ContextData): string {
  const sections: string[] = []

  sections.push(`=== ClaudeContext Memory ===\n`)
  sections.push(`## 🧠 Project: ${data.project.name}`)
  sections.push(`Working directory: ${data.project.path}`)

  // Active blockers first — highest priority
  const blockers = data.tasks.filter(t => t.status === 'blocked')
  if (blockers.length > 0) {
    sections.push(`\n## 🔴 Active Blockers`)
    blockers.forEach(b => {
      sections.push(`- ${b.title}${b.blocked_by ? ` (blocked by: ${b.blocked_by})` : ''}`)
    })
  }

  // Recent sessions
  sections.push(`\n## 📋 Recent Sessions`)
  data.sessions.forEach((s, i) => {
    const ago = formatTimeAgo(s.ended_at)
    sections.push(`\n### Session ${i + 1} (${ago}): "${s.summary_title}"`)
    sections.push(`- STATUS: ${s.summary_status?.toUpperCase()}`)
    if (s.summary_key_insight) sections.push(`- 💡 KEY INSIGHT: ${s.summary_key_insight}`)
    const did = JSON.parse(s.summary_what_we_did || '[]') as string[]
    if (did.length) sections.push(`- DID: ${did.slice(0, 3).join(' | ')}`)
    const next = JSON.parse(s.summary_next_steps || '[]') as any[]
    const nextTexts = next.map(n => typeof n === 'string' ? n : n.action)
    if (nextTexts.length) sections.push(`- NEXT: ${nextTexts.slice(0, 3).join(' | ')}`)
    const gotchas = JSON.parse(s.summary_gotchas || '[]') as any[]
    gotchas.filter(g => (g.severity || 'med') === 'critical').forEach(g => {
      sections.push(`- ⚠️ CRITICAL: ${typeof g === 'string' ? g : g.warning}`)
    })
  })

  // Open tasks
  const openTasks = data.tasks.filter(t => t.status !== 'completed')
  if (openTasks.length > 0) {
    sections.push(`\n## ✅ Open Tasks`)
    const sorted = [...openTasks].sort((a, b) => {
      const pri = { high: 0, med: 1, low: 2 }
      return (pri[a.priority] || 1) - (pri[b.priority] || 1)
    })
    sorted.slice(0, 6).forEach(t => {
      sections.push(`- [${t.priority.toUpperCase()}] ${t.title}${t.description ? ` — ${t.description.slice(0, 100)}` : ''}`)
    })
  }

  // Top preferences (confidence >= 0.7)
  const strongPrefs = data.preferences.filter(p => p.confidence >= 0.7)
  if (strongPrefs.length > 0) {
    sections.push(`\n## 🧬 Your Preferences (learned over time)`)
    strongPrefs.slice(0, 8).forEach(p => {
      sections.push(`- ${p.key}: ${p.value}`)
    })
  }

  // High-confidence knowledge
  const keyKnowledge = data.knowledge.filter(k => k.confidence >= 0.7)
  if (keyKnowledge.length > 0) {
    sections.push(`\n## ⚡ Domain Knowledge`)
    keyKnowledge.slice(0, 6).forEach(k => {
      sections.push(`- [${k.topic}] ${k.content}`)
    })
  }

  // Effective patterns
  const patterns = data.patterns.filter(p => p.effectiveness === 'high' && p.seen_count >= 2)
  if (patterns.length > 0) {
    sections.push(`\n## 🔄 What Works For You`)
    patterns.slice(0, 4).forEach(p => {
      sections.push(`- ${p.title}: ${p.description}`)
    })
  }

  sections.push(`\n=== End ClaudeContext Memory ===`)

  return sections.join('\n')
}
```

### 4.2 Smart Briefing Endpoint

**[NEW] Endpoint:** `GET /api/smart-briefing?cwd=/path/to/project`

**Purpose:** AI-generated "what you should know right now" briefing, synthesized from all accumulated memory.

**How it works:**
1. Pull all context (sessions, tasks, preferences, knowledge, patterns)
2. Send to AI with briefing prompt
3. Return a 3-5 sentence human-readable briefing + specific recommendations

**Response:**

```json
{
  "briefing": "You were debugging a race condition in the token refresh flow. It's fixed and tested, but the integration test for concurrent refresh is still pending — that's your highest priority today. Watch out: JWT_SECRET must be set in .env.test or tests silently pass. The CI pipeline is set up but missing a deployment step for staging.",
  "top_priority": "Add integration test for concurrent token refresh",
  "watch_out": "JWT_SECRET must be set in .env.test",
  "session_count": 12,
  "knowledge_items": 8,
  "open_tasks": 3
}
```

This gets injected verbatim into the session start context so Claude opens with full situational awareness.

### 4.3 SessionStart Hook Injection (Full Flow)

```javascript
// session-start.js
async function main() {
  const input = JSON.parse(await readStdin())
  const { session_id, cwd, transcript_path } = input

  // Register session
  await post('/api/hook', { event: 'SessionStart', session_id, cwd, transcript_path })

  // Get enriched context
  const [contextRes, briefingRes] = await Promise.all([
    fetch(`http://localhost:${PORT}/api/context?cwd=${encodeURIComponent(cwd)}`),
    fetch(`http://localhost:${PORT}/api/smart-briefing?cwd=${encodeURIComponent(cwd)}`)
  ])

  const { markdown } = await contextRes.json()
  const briefing = await briefingRes.json()

  // Build final injection
  const injection = [
    briefing.briefing ? `\n> 🧠 Session Briefing: ${briefing.briefing}\n` : '',
    markdown
  ].filter(Boolean).join('\n')

  // Output for Claude Code system prompt injection
  // Claude Code reads stdout from SessionStart hook as <system-reminder>
  process.stdout.write(JSON.stringify({ content: injection }))
}
```

---

## 5. Error Handling

### 5.1 Summarization Failures

**[UPGRADED] Retry with backoff:**

```typescript
async function summarizeWithRetry(sessionId: string, transcriptPath: string, projectId: string, attempt = 1) {
  try {
    await summarizeSession(sessionId, transcriptPath, projectId)
  } catch (err) {
    console.error(`[Summarizer] Attempt ${attempt} failed:`, err)

    if (attempt < 3) {
      const delay = attempt * 5000  // 5s, 10s backoff
      console.log(`[Summarizer] Retrying in ${delay}ms...`)
      await sleep(delay)
      return summarizeWithRetry(sessionId, transcriptPath, projectId, attempt + 1)
    }

    // After 3 failures: save minimal fallback summary
    const turns = await countTranscriptTurns(transcriptPath)
    await queries.updateSession(sessionId, {
      summary_status: 'failed',
      summary_title: `Session (${turns} turns) — summary failed`,
      summary_what_we_did: '[]',
      summary_next_steps: '[]'
    })
  }
}
```

**[NEW] Transcript-only fallback:** Even if AI summarization fails, the system extracts what it can from the transcript directly (files touched, tool calls made, duration) so some data is always preserved.

### 5.2 Hook Failures

**Silent Failures (unchanged):**

```javascript
try {
  await postToWorker('/api/hook', payload)
} catch {
  // Silent — worker has file watcher as backup
  // Session data preserved in transcript file regardless
}
```

**[NEW] File watcher backup:**

```typescript
// Watch for new transcript files in case hooks fail
fs.watch(transcriptDir, async (event, filename) => {
  if (!filename?.endsWith('.jsonl')) return
  const sessionId = filename.replace('.jsonl', '')
  const existing = await queries.getSession(sessionId)
  if (!existing) {
    // Recover missed session
    await recoverMissedSession(sessionId, path.join(transcriptDir, filename))
  }
})
```

---

## 6. Performance

### 6.1 Queue System

```typescript
import PQueue from 'p-queue'

// Separate queues for different priorities
const summaryQueue = new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 })
const memoryQueue = new PQueue({ concurrency: 1 })
const claudeMdQueue = new PQueue({ concurrency: 3 })  // CLAUDE.md updates can run in parallel

export function enqueueSummary(fn: () => Promise<void>) {
  summaryQueue.add(fn)
}
export function enqueueMemoryConsolidation(fn: () => Promise<void>) {
  memoryQueue.add(fn)
}
export function enqueueClaudeMdUpdate(fn: () => Promise<void>) {
  claudeMdQueue.add(fn)
}
```

### 6.2 Database Indexes

```sql
-- [NEW] Add these indexes for fast context queries
CREATE INDEX idx_sessions_project_ended ON sessions(project_id, ended_at DESC);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_preferences_project_confidence ON preferences(project_id, confidence DESC);
CREATE INDEX idx_knowledge_project_confidence ON knowledge(project_id, confidence DESC);
CREATE INDEX idx_observations_session ON observations(session_id, event_type);
```

### 6.3 Context API Response Time Target

The context API must respond in < 100ms since it runs on every session start. With the indexes above, all queries hit indexes and return in < 10ms. The only slow part is the smart briefing (AI call) — this runs in parallel and has a 3s timeout. If it times out, only the static context is injected (still very useful).

---

## 7. Monitoring

### 7.1 Health Check

**Endpoint:** `GET /api/health`

**[UPGRADED] Response:**

```json
{
  "status": "ok",
  "version": "2.0.0",
  "db": "connected",
  "api_key": true,
  "summaries_enabled": true,
  "uptime": 3600,
  "queue": {
    "summary_size": 0,
    "memory_size": 0,
    "claude_md_size": 0
  },
  "stats": {
    "total_sessions": 47,
    "total_tasks": 23,
    "open_tasks": 8,
    "total_preferences": 31,
    "total_knowledge": 19,
    "last_session_ago_minutes": 127
  }
}
```

### 7.2 Logs

**Structured logging (all to `/tmp/claudectx.log`):**

```
[2025-04-03T14:32:01Z] [INFO] [Session] Started: abc123 — project: my-app
[2025-04-03T14:32:01Z] [INFO] [Context] Served in 8ms — 3 sessions, 8 tasks, 31 prefs
[2025-04-03T14:47:33Z] [INFO] [Session] Ended: abc123 — 42 turns, 18 tool calls, 14 min
[2025-04-03T14:47:35Z] [INFO] [Summarizer] Starting for session abc123 (attempt 1)
[2025-04-03T14:47:41Z] [INFO] [Summarizer] Saved: "Fixed JWT Race Condition" — complexity:4, mood:debugging
[2025-04-03T14:47:42Z] [INFO] [Memory] Consolidated: 2 prefs updated, 1 knowledge added, 1 task closed
[2025-04-03T14:47:42Z] [INFO] [CLAUDE.md] Updated: my-app — 3 blockers, 8 open tasks
```

---

## 8. Troubleshooting

### Sessions not being marked as ended

```sql
SELECT id, started_at, ended_at, status FROM sessions WHERE ended_at IS NULL;
```

**Fix:** Check SessionEnd hook, verify worker on port 8000, or manually trigger:
```bash
echo '{"session_id":"...","cwd":"...","transcript_path":"..."}' | node ~/.claudectx/hooks/session-end.js
```

### Summaries failing with 502

```bash
curl http://localhost:20128/v1/models
```

Set correct env vars:
```bash
ANTHROPIC_BASE_URL=http://localhost:20128/v1
ANTHROPIC_AUTH_TOKEN=sk_9router
ANTHROPIC_DEFAULT_HAIKU_MODEL=AWS
```

### Context injection not appearing

```bash
curl "http://localhost:8000/api/context?cwd=$(pwd)"
```

Should return `{ "markdown": "=== ClaudeContext Memory ===..." }`. If empty, check that at least one session has a `summary_title` (summarization must complete first).

### Memory growing stale

Preferences and knowledge that haven't been seen in 30+ days with low confidence can be pruned:
```sql
DELETE FROM preferences WHERE confidence < 0.4 AND last_seen < unixepoch() - 86400*30;
DELETE FROM knowledge WHERE confidence < 0.4 AND last_confirmed < unixepoch() - 86400*30;
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
CLAUDECTX_SESSIONS=5         # [UPGRADED: was 3] Number of recent sessions in context
CLAUDECTX_DISABLE_SUMMARIES=0
CLAUDECTX_DISABLE_BRIEFING=0  # [NEW] Set to 1 to skip smart briefing
CLAUDECTX_MAX_TOKENS=2500     # [NEW] Max tokens for summarization
CLAUDECTX_MEMORY_DECAY=30     # [NEW] Days before low-confidence memories decay

# Database
# Auto-detected at ~/.claudectx/db.sqlite
```

### Hook Configuration

**Location:** `~/.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node ~/.claudectx/hooks/session-start.js", "timeout": 5000 }] }],
    "SessionEnd":   [{ "hooks": [{ "type": "command", "command": "node ~/.claudectx/hooks/session-end.js",   "timeout": 3000 }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node ~/.claudectx/hooks/user-prompt-submit.js", "timeout": 2000 }] }],
    "PostToolUse":  [{ "hooks": [{ "type": "command", "command": "node ~/.claudectx/hooks/post-tool-use.js",  "timeout": 2000 }] }],
    "Stop":         [{ "hooks": [{ "type": "command", "command": "node ~/.claudectx/hooks/stop.js",           "timeout": 2000 }] }]
  }
}
```

---

## 10. What's New in v2.0

| Area | v1.0 | v2.0 |
|------|-------|-------|
| Session summary fields | 7 basic fields | 14 fields including mood, complexity, key_insight, blockers, resolved |
| Compaction strategy | Last 60 turns blindly | Smart: opening + important middle + recent 40 |
| Summary tokens | 1500 | 2500 |
| Task tracking | Per-session only | Cross-session persistent tasks with lifecycle |
| Memory consolidation | None | Full preferences, knowledge, patterns merge across sessions |
| Context injection | 3 sessions, flat list | 5 sessions + smart briefing + structured tasks/preferences |
| CLAUDE.md format | Single block of text | Rich formatted block with blockers, table, key insight |
| Error handling | Single try/catch | Retry with backoff + transcript-only fallback |
| Queue system | Single queue | 3 separate queues by priority |
| DB indexes | None | 5 performance indexes |
| Health endpoint | Basic | Full stats on sessions/tasks/memory |
| Logging | Simple strings | Structured timestamped logs |
| Context response | markdown only | markdown + structured JSON |
| Smart briefing | None | AI-synthesized 3-5 sentence briefing per session |

---

## 11. Related Documentation

- [MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md) — Deep dive on memory consolidation and decay
- [UI_DATA_FLOW.md](./UI_DATA_FLOW.md) — Dashboard implementation
- [API.md](./API.md) — Complete API reference
- [CLAUDE.md](./CLAUDE.md) — Auto-generated project context (managed by ClaudeContext)
