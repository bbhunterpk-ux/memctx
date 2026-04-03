# Memory System — AI-Powered Knowledge Extraction & Consolidation
> **ClaudeContext v2.0** — The system that makes Claude smarter with every session

## Overview

ClaudeContext's memory system doesn't just record what happened — it **learns who you are as a developer**. Preferences, domain knowledge, problem-solving patterns, and pending work are extracted from every session, consolidated across time, and injected back at the start of the next session so Claude already knows your context, your style, and what you're working on.

**The compounding effect:** Session 1 gives Claude basic awareness. Session 10 gives Claude a rich model of your preferences, tech stack quirks, and project history. Session 50 means Claude behaves like a senior engineer who has worked alongside you for months.

---

## 1. Memory Architecture

### 1.1 The Five Memory Types

| Type | Purpose | Scope | Example |
|------|---------|-------|---------|
| **Preferences** | How you like to work — coding style, tooling, communication | Global + per-project | `coding.style = "TypeScript strict mode, never use any"` |
| **Knowledge** | Facts about your tech stack, domain, gotchas | Per-project | `[9router] Returns OpenAI format — parse .choices[0].message.content` |
| **Patterns** | Problem-solving approaches that work for you | Global + per-project | `debugging: Check application logs before touching code` |
| **Tasks** | Work identified during sessions, tracked across time | Per-project | `[HIGH] Add integration test for concurrent token refresh` |
| **Contacts** | People, teams, systems mentioned in sessions | Per-project | `Max — Lead engineer, owns the auth service` |

### 1.2 Memory Lifecycle

```
Session Transcript
       │
       ▼
AI Extraction (per-session)
  │  Pulls raw: preferences, knowledge, patterns, tasks, contacts
  │
  ▼
Confidence Scoring
  │  Each item gets a confidence score 0.0–1.0
  │  New item from one session: confidence ~0.5–0.8
  │
  ▼
Consolidation Engine
  │  Merges with existing memory
  │  Seen again → confidence increases
  │  Contradicted → confidence decreases, flag for review
  │  Not seen in N days → confidence slowly decays
  │
  ▼
Memory Store (SQLite)
  │  Queryable, project-isolated, timestamped
  │
  ▼
Context Builder
  │  Filters by confidence threshold
  │  Ranks by recency + confidence
  │  Formats as markdown for injection
  │
  ▼
Session Start Injection
     Claude starts next session already knowing all of this
```

---

## 2. Database Schema

### 2.1 Preferences

```sql
CREATE TABLE preferences (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        TEXT,           -- NULL = global preference (applies to all projects)
  category          TEXT NOT NULL,  -- 'coding' | 'testing' | 'workflow' | 'communication' | 'tooling' | 'architecture'
  key               TEXT NOT NULL,  -- e.g. 'style', 'orm', 'test_framework', 'commit_format'
  value             TEXT NOT NULL,  -- e.g. 'TypeScript strict mode, never use any'
  confidence        REAL NOT NULL DEFAULT 0.6,
  evidence          TEXT,           -- brief quote/observation that revealed this preference
  seen_count        INTEGER NOT NULL DEFAULT 1,
  confirmed_count   INTEGER NOT NULL DEFAULT 0,  -- times explicitly reconfirmed
  contradicted_count INTEGER NOT NULL DEFAULT 0, -- times a conflicting preference was seen
  source_session_id TEXT REFERENCES sessions(id),
  first_seen        INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen         INTEGER NOT NULL DEFAULT (unixepoch()),
  last_confirmed    INTEGER,
  is_active         INTEGER NOT NULL DEFAULT 1,  -- 0 = soft-deleted / overridden
  UNIQUE(project_id, category, key),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

**Example rows:**

| category | key | value | confidence | seen_count |
|----------|-----|-------|------------|------------|
| coding | type_safety | TypeScript strict mode, never use `any` | 0.95 | 8 |
| coding | orm | Drizzle ORM over Prisma | 0.85 | 4 |
| testing | framework | Jest + supertest for API tests | 0.90 | 6 |
| workflow | commit_format | Conventional commits (feat/fix/chore) | 0.88 | 7 |
| communication | explanations | Show code first, explain after — not the reverse | 0.75 | 3 |
| architecture | error_handling | Always use typed error classes, never raw `Error` | 0.80 | 5 |

---

### 2.2 Knowledge

```sql
CREATE TABLE knowledge (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        TEXT NOT NULL REFERENCES projects(id),
  category          TEXT NOT NULL,  -- 'technology' | 'domain' | 'architecture' | 'process' | 'gotcha'
  topic             TEXT NOT NULL,  -- e.g. '9router', 'JWT refresh', 'Docker compose'
  content           TEXT NOT NULL,  -- the actual insight
  confidence        REAL NOT NULL DEFAULT 0.6,
  source            TEXT NOT NULL DEFAULT 'discovered',  -- 'discovered' | 'confirmed' | 'updated' | 'corrected'
  severity          TEXT,           -- for gotchas: 'critical' | 'high' | 'med'
  seen_count        INTEGER NOT NULL DEFAULT 1,
  source_session_id TEXT REFERENCES sessions(id),
  first_seen        INTEGER NOT NULL DEFAULT (unixepoch()),
  last_confirmed    INTEGER NOT NULL DEFAULT (unixepoch()),
  is_active         INTEGER NOT NULL DEFAULT 1
);
```

**Example rows:**

| category | topic | content | confidence | severity |
|----------|-------|---------|------------|----------|
| technology | 9router | Returns OpenAI-format responses — parse `.choices[0].message.content`, not Anthropic format | 0.95 | — |
| gotcha | JWT test setup | `JWT_SECRET` must be in `.env.test` or tests silently pass with wrong tokens | 0.90 | critical |
| gotcha | Docker | `docker compose up` requires `--build` flag after any `package.json` changes | 0.85 | high |
| architecture | token refresh | Race condition possible if two requests read stale token before either writes — fixed with mutex | 0.88 | — |
| process | deploy | Staging deploys require manual approval in GitHub Actions — not automatic | 0.75 | — |

---

### 2.3 Patterns

```sql
CREATE TABLE patterns (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        TEXT,           -- NULL = global pattern
  type              TEXT NOT NULL,  -- 'debugging' | 'architecture' | 'workflow' | 'communication' | 'testing'
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  when_to_apply     TEXT,           -- specific trigger condition
  effectiveness     TEXT NOT NULL DEFAULT 'med',  -- 'high' | 'med' | 'low'
  seen_count        INTEGER NOT NULL DEFAULT 1,
  success_count     INTEGER NOT NULL DEFAULT 0,   -- times this pattern led to success
  source_session_id TEXT REFERENCES sessions(id),
  created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen         INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(project_id, type, title)
);
```

**Example rows:**

| type | title | description | effectiveness | seen_count |
|------|-------|-------------|---------------|------------|
| debugging | Logs before code | Always check application logs before modifying any code. 90% of bugs are visible in logs | high | 9 |
| debugging | Reproduce first | Never fix a bug you can't reproduce. Write a failing test before touching implementation | high | 6 |
| workflow | Read before refactor | Always read the full file before suggesting changes. User prefers to understand existing structure | high | 5 |
| communication | Error before fix | When user pastes an error, acknowledge what it means before suggesting a fix | med | 4 |
| testing | Test the contract | Test observable behavior (what the function returns), not implementation details | high | 7 |

---

### 2.4 Tasks

```sql
CREATE TABLE tasks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        TEXT NOT NULL REFERENCES projects(id),
  source_session_id TEXT REFERENCES sessions(id),   -- where task was first identified
  resolved_session_id TEXT REFERENCES sessions(id), -- where task was resolved (if applicable)
  title             TEXT NOT NULL,
  description       TEXT,           -- full context needed to work on this without re-reading transcript
  priority          TEXT NOT NULL DEFAULT 'med',  -- 'critical' | 'high' | 'med' | 'low'
  status            TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
  blocked_by        TEXT,           -- what's blocking this task
  depends_on        TEXT,           -- JSON array of task IDs this depends on
  tags              TEXT,           -- JSON array of tags e.g. ["auth", "testing", "ci"]
  estimated_effort  TEXT,           -- 'minutes' | 'hours' | 'days'
  created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  resolved_at       INTEGER
);
```

**Example rows:**

| title | priority | status | description |
|-------|----------|--------|-------------|
| Add integration test for concurrent token refresh | high | blocked | Need to mock concurrent requests hitting /auth/refresh simultaneously. Blocked by: no test DB fixture setup yet |
| Add deployment step to CI pipeline | med | pending | GitHub Actions workflow needs a staging deploy step after build passes. Use existing `deploy.sh` script |
| Move config to zod validation | low | pending | Replace manual `process.env.X || 'default'` with a validated zod schema at app startup |

---

### 2.5 Contacts

```sql
CREATE TABLE contacts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,   -- 'person' | 'team' | 'service' | 'company'
  role        TEXT,
  context     TEXT,            -- why they're relevant to this project
  first_seen  INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen   INTEGER NOT NULL DEFAULT (unixepoch()),
  seen_count  INTEGER NOT NULL DEFAULT 1,
  UNIQUE(project_id, name, type)
);
```

---

## 3. Memory Extraction

### 3.1 Extraction Prompt (AI)

After every session summary is generated, the summarizer includes memory extraction in the same call. The AI is instructed to find memory signals in the transcript, not just summarize actions.

**Key extraction guidance in the system prompt:**

```
MEMORY EXTRACTION RULES:

Preferences — look for HOW the developer works, not WHAT they worked on:
  - Did they correct Claude's code style? → coding preference
  - Did they ask for a specific explanation format? → communication preference
  - Did they choose Tool A over Tool B? → tooling preference
  - Did they push back on an approach? → architecture/workflow preference
  Only extract preferences with real evidence. Don't infer from one coincidence.

Knowledge — look for facts about the tech stack or domain:
  - Something that surprised them about a library
  - A workaround they discovered
  - A constraint specific to this project
  - Something that broke and why
  Mark severity 'critical' if forgetting it would break things silently.

Patterns — look for approaches that WORKED:
  - A debugging technique that led to the solution
  - A workflow step they repeated
  - A communication style that helped them
  Only extract patterns with evidence of effectiveness.

Tasks — look for explicit or implicit pending work:
  - Explicitly mentioned: "I'll do X next"
  - Implicitly identified: "this would break if Y" without fixing Y
  - Deferred: "let's skip X for now"
  Include enough description to work on the task without re-reading this transcript.
```

### 3.2 Confidence Scoring

Every extracted memory item gets a confidence score based on evidence strength:

| Evidence | Confidence |
|----------|------------|
| Developer explicitly stated a preference | 0.90 |
| Developer corrected Claude to match their preference | 0.85 |
| Developer chose option A over option B with reasoning | 0.80 |
| Inferred from consistent behavior across session | 0.65 |
| Single observed behavior, no explicit confirmation | 0.50 |
| Speculation / weak signal | 0.30 |

---

## 4. Memory Consolidation Engine

### 4.1 Overview

Raw per-session extractions are noisy. Consolidation is what turns noise into signal.

**File:** `src/services/memory-consolidator.ts`

**Runs:** After every session summarization completes (enqueued in memoryQueue)

### 4.2 Preference Consolidation

```typescript
async function consolidatePreference(item: RawPreference, projectId: string) {
  const existing = await db.query<Preference>(
    `SELECT * FROM preferences WHERE project_id = ? AND category = ? AND key = ?`,
    [projectId, item.category, item.key]
  )

  if (!existing) {
    // New preference — insert
    await db.run(
      `INSERT INTO preferences (project_id, category, key, value, confidence, evidence, seen_count, source_session_id)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [projectId, item.category, item.key, item.value, item.confidence, item.evidence, item.sessionId]
    )
    return
  }

  if (existing.value === item.value) {
    // Same preference confirmed again — increase confidence
    const newConfidence = Math.min(0.99, existing.confidence + 0.05)
    await db.run(
      `UPDATE preferences
       SET confidence = ?, seen_count = seen_count + 1, confirmed_count = confirmed_count + 1,
           last_seen = unixepoch(), last_confirmed = unixepoch()
       WHERE id = ?`,
      [newConfidence, existing.id]
    )
  } else {
    // Conflicting value — this is interesting
    if (item.confidence > existing.confidence + 0.1) {
      // New value is significantly more confident — update
      await db.run(
        `UPDATE preferences
         SET value = ?, confidence = ?, evidence = ?, seen_count = seen_count + 1,
             contradicted_count = contradicted_count + 1, last_seen = unixepoch()
         WHERE id = ?`,
        [item.value, item.confidence, item.evidence, existing.id]
      )
    } else {
      // Ambiguous — lower confidence on existing, flag for review
      await db.run(
        `UPDATE preferences
         SET confidence = MAX(0.1, confidence - 0.1),
             contradicted_count = contradicted_count + 1,
             last_seen = unixepoch()
         WHERE id = ?`,
        [existing.id]
      )
    }
  }
}
```

### 4.3 Knowledge Consolidation

```typescript
async function consolidateKnowledge(item: RawKnowledge, projectId: string) {
  // Fuzzy match on topic + category (same topic can be expressed differently)
  const existing = await db.query<Knowledge>(
    `SELECT * FROM knowledge
     WHERE project_id = ? AND category = ?
       AND (topic = ? OR topic LIKE ?)
     ORDER BY confidence DESC LIMIT 1`,
    [projectId, item.category, item.topic, `%${item.topic.split(' ')[0]}%`]
  )

  if (!existing) {
    await db.run(
      `INSERT INTO knowledge (project_id, category, topic, content, confidence, severity, source, source_session_id)
       VALUES (?, ?, ?, ?, ?, ?, 'discovered', ?)`,
      [projectId, item.category, item.topic, item.content, item.confidence, item.severity || null, item.sessionId]
    )
    return
  }

  // Knowledge already exists — update confidence + timestamp
  const isUpdated = item.content !== existing.content
  await db.run(
    `UPDATE knowledge
     SET confidence = MIN(0.99, confidence + 0.04),
         seen_count = seen_count + 1,
         content = ?,                             -- take newer content (may be refined)
         source = ?,
         last_confirmed = unixepoch()
     WHERE id = ?`,
    [
      item.confidence > existing.confidence ? item.content : existing.content,
      isUpdated ? 'updated' : 'confirmed',
      existing.id
    ]
  )
}
```

### 4.4 Task Lifecycle

Tasks are the most dynamic memory type. They open in one session and close in another.

```typescript
async function consolidateTasks(summary: SessionSummary, projectId: string, sessionId: string) {
  // Step 1: Close tasks that were resolved this session
  for (const resolved of summary.resolved) {
    const match = await findSimilarTask(resolved, projectId)
    if (match) {
      await db.run(
        `UPDATE tasks
         SET status = 'completed', resolved_session_id = ?, resolved_at = unixepoch(), updated_at = unixepoch()
         WHERE id = ?`,
        [sessionId, match.id]
      )
      console.log(`[Memory] Task closed: "${match.title}"`)
    }
  }

  // Step 2: Update in-progress tasks
  for (const inProgress of summary.what_we_did) {
    const match = await findSimilarTask(inProgress, projectId)
    if (match && match.status === 'pending') {
      await db.run(
        `UPDATE tasks SET status = 'in_progress', updated_at = unixepoch() WHERE id = ?`,
        [match.id]
      )
    }
  }

  // Step 3: Add new tasks from this session
  for (const task of summary.tasks) {
    if (task.status === 'completed') continue  // skip already-done tasks

    const existing = await findSimilarTask(task.title, projectId)
    if (existing) {
      // Update description if more detailed
      if ((task.description?.length || 0) > (existing.description?.length || 0)) {
        await db.run(
          `UPDATE tasks SET description = ?, priority = ?, status = ?, blocked_by = ?, updated_at = unixepoch()
           WHERE id = ?`,
          [task.description, task.priority, task.status, task.blockedBy || null, existing.id]
        )
      }
    } else {
      await db.run(
        `INSERT INTO tasks (project_id, source_session_id, title, description, priority, status, blocked_by, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [projectId, sessionId, task.title, task.description, task.priority, task.status,
         task.blockedBy || null, JSON.stringify(task.tags || [])]
      )
    }
  }
}

// Fuzzy task matching — handles paraphrasing
async function findSimilarTask(description: string, projectId: string): Promise<Task | null> {
  const words = description.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  if (words.length === 0) return null

  // Build OR query on meaningful words
  const conditions = words.slice(0, 5).map(() => 'LOWER(title) LIKE ?').join(' OR ')
  const params = words.slice(0, 5).map(w => `%${w}%`)

  const candidates = await db.queryAll<Task>(
    `SELECT * FROM tasks WHERE project_id = ? AND status != 'completed' AND (${conditions})`,
    [projectId, ...params]
  )

  return candidates[0] || null
}
```

### 4.5 Pattern Reinforcement

```typescript
async function consolidatePattern(item: RawPattern, projectId: string | null) {
  const existing = await db.query<Pattern>(
    `SELECT * FROM patterns WHERE (project_id = ? OR project_id IS NULL) AND type = ? AND title = ?`,
    [projectId, item.type, item.title]
  )

  if (!existing) {
    await db.run(
      `INSERT INTO patterns (project_id, type, title, description, when_to_apply, effectiveness, seen_count)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [projectId, item.type, item.title, item.description, item.whenToApply || null, item.effectiveness]
    )
    return
  }

  // Pattern seen again — reinforce it
  await db.run(
    `UPDATE patterns
     SET seen_count = seen_count + 1,
         effectiveness = CASE
           WHEN seen_count >= 5 THEN 'high'
           WHEN seen_count >= 2 THEN 'med'
           ELSE effectiveness
         END,
         last_seen = unixepoch()
     WHERE id = ?`,
    [existing.id]
  )
}
```

---

## 5. Memory Decay

### 5.1 Why Decay?

Preferences change. Knowledge becomes stale. Without decay, ClaudeContext would confidently inject outdated information. Decay ensures the system reflects your current reality, not your situation from 6 months ago.

### 5.2 Decay Rules

**File:** `src/services/memory-decay.ts`

**Runs:** Daily at midnight (cron job in worker)

```typescript
const DECAY_CONFIG = {
  preferences: {
    decayRatePerDay: 0.002,    // very slow — preferences are stable
    minimumConfidence: 0.2,    // never decay below this
    decayThresholdDays: 60,    // only start decaying after 60 days of inactivity
    deactivateBelow: 0.15      // soft-delete if confidence falls below this
  },
  knowledge: {
    decayRatePerDay: 0.003,    // slightly faster — tech changes
    minimumConfidence: 0.15,
    decayThresholdDays: 45,
    deactivateBelow: 0.10
  },
  patterns: {
    decayRatePerDay: 0.001,    // very slow — patterns are behavioral, stable
    minimumConfidence: 0.25,
    decayThresholdDays: 90,
    deactivateBelow: 0.20
  }
}

async function runDecay() {
  const now = Math.floor(Date.now() / 1000)

  for (const [table, config] of Object.entries(DECAY_CONFIG)) {
    const thresholdTime = now - config.decayThresholdDays * 86400

    // Fetch items that haven't been seen recently
    const items = await db.queryAll(
      `SELECT id, confidence, last_seen FROM ${table}
       WHERE last_seen < ? AND is_active = 1 AND confidence > ?`,
      [thresholdTime, config.minimumConfidence]
    )

    for (const item of items) {
      const daysSinceLastSeen = (now - item.last_seen) / 86400
      const daysToDecay = Math.max(0, daysSinceLastSeen - config.decayThresholdDays)
      const decayAmount = daysToDecay * config.decayRatePerDay
      const newConfidence = Math.max(config.minimumConfidence, item.confidence - decayAmount)

      if (newConfidence <= config.deactivateBelow) {
        await db.run(`UPDATE ${table} SET is_active = 0, confidence = ? WHERE id = ?`, [newConfidence, item.id])
        console.log(`[Decay] Deactivated ${table} item ${item.id} (confidence: ${newConfidence.toFixed(2)})`)
      } else if (newConfidence !== item.confidence) {
        await db.run(`UPDATE ${table} SET confidence = ? WHERE id = ?`, [newConfidence, item.id])
      }
    }
  }
}
```

### 5.3 Decay Visualization

```
Confidence
1.0 ┤
    │  ████ Confirmed multiple times (0.95)
0.8 ┤  ████
    │  ████ Confirmed once more (0.85)
0.6 ┤  ████ First seen (0.65)
    │  ████ ... 60 days of inactivity ...
0.4 ┤  ████ Slow decay begins
    │  ████
0.2 ┤  ████ Minimum floor (0.20)
    │       ← deactivated if drops below 0.15
0.0 ┤
    └──────────────────────────────────── time
       0    60   90   120  180  240 days
```

---

## 6. Memory Retrieval

### 6.1 Memory API

**Endpoint:** `GET /api/memory?project_id=<id>`

**Response:**

```json
{
  "preferences": [
    {
      "id": 1,
      "category": "coding",
      "key": "type_safety",
      "value": "TypeScript strict mode, never use any",
      "confidence": 0.95,
      "seen_count": 8,
      "last_seen": 1775175855
    }
  ],
  "knowledge": [
    {
      "id": 1,
      "category": "gotcha",
      "topic": "JWT test setup",
      "content": "JWT_SECRET must be in .env.test or tests silently pass with wrong tokens",
      "confidence": 0.90,
      "severity": "critical"
    }
  ],
  "patterns": [...],
  "tasks": {
    "open": [...],
    "blocked": [...],
    "completed_recent": [...]
  },
  "contacts": [...],
  "stats": {
    "total_preferences": 31,
    "high_confidence_preferences": 18,
    "open_tasks": 8,
    "blocked_tasks": 2,
    "knowledge_items": 19,
    "critical_gotchas": 2,
    "patterns": 12
  }
}
```

### 6.2 Context Injection Query

When building the context for session start injection, memory items are prioritized:

```typescript
async function getContextMemory(projectId: string): Promise<ContextMemory> {
  // Preferences: confidence >= 0.7, active, ordered by confidence desc
  const preferences = await db.queryAll<Preference>(
    `SELECT * FROM preferences
     WHERE (project_id = ? OR project_id IS NULL)
       AND is_active = 1
       AND confidence >= 0.7
     ORDER BY confidence DESC, seen_count DESC
     LIMIT 15`,
    [projectId]
  )

  // Knowledge: confidence >= 0.65, active
  // Critical severity items always included regardless of confidence
  const knowledge = await db.queryAll<Knowledge>(
    `SELECT * FROM knowledge
     WHERE project_id = ? AND is_active = 1
       AND (confidence >= 0.65 OR severity = 'critical')
     ORDER BY
       CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,
       confidence DESC
     LIMIT 12`,
    [projectId]
  )

  // Patterns: high effectiveness, seen >= 2 times
  const patterns = await db.queryAll<Pattern>(
    `SELECT * FROM patterns
     WHERE (project_id = ? OR project_id IS NULL)
       AND (effectiveness = 'high' OR (effectiveness = 'med' AND seen_count >= 3))
       AND seen_count >= 2
     ORDER BY seen_count DESC
     LIMIT 6`,
    [projectId]
  )

  // Tasks: all open + blocked, ordered by priority
  const tasks = await db.queryAll<Task>(
    `SELECT * FROM tasks
     WHERE project_id = ? AND status IN ('pending', 'in_progress', 'blocked')
     ORDER BY
       CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'med' THEN 2 ELSE 3 END,
       created_at ASC
     LIMIT 10`,
    [projectId]
  )

  // Contacts: seen recently
  const contacts = await db.queryAll<Contact>(
    `SELECT * FROM contacts WHERE project_id = ? ORDER BY last_seen DESC LIMIT 8`,
    [projectId]
  )

  return { preferences, knowledge, patterns, tasks, contacts }
}
```

### 6.3 Context Markdown Format

The memory is formatted for maximum clarity in Claude's system prompt:

```typescript
function formatMemoryForInjection(memory: ContextMemory): string {
  const lines: string[] = []

  // Critical gotchas always first — most important
  const criticalGotchas = memory.knowledge.filter(k => k.severity === 'critical')
  if (criticalGotchas.length > 0) {
    lines.push('## 🚨 Critical Gotchas — Do Not Forget')
    criticalGotchas.forEach(g => lines.push(`- **[${g.topic}]** ${g.content}`))
    lines.push('')
  }

  // Preferences
  if (memory.preferences.length > 0) {
    lines.push('## 🧬 Developer Preferences (learned over time)')
    const byCategory = groupBy(memory.preferences, 'category')
    for (const [cat, prefs] of Object.entries(byCategory)) {
      lines.push(`### ${cat}`)
      prefs.forEach(p => lines.push(`- ${p.key}: ${p.value}`))
    }
    lines.push('')
  }

  // Non-critical knowledge / gotchas
  const otherKnowledge = memory.knowledge.filter(k => k.severity !== 'critical')
  if (otherKnowledge.length > 0) {
    lines.push('## ⚡ Domain Knowledge')
    otherKnowledge.forEach(k => {
      const badge = k.severity === 'high' ? ' ⚠️' : ''
      lines.push(`- [${k.topic}]${badge} ${k.content}`)
    })
    lines.push('')
  }

  // Patterns
  if (memory.patterns.length > 0) {
    lines.push('## 🔄 What Works For This Developer')
    memory.patterns.forEach(p => lines.push(`- **${p.title}:** ${p.description}`))
    lines.push('')
  }

  // Open tasks
  if (memory.tasks.length > 0) {
    lines.push('## ✅ Open Work')
    const blocked = memory.tasks.filter(t => t.status === 'blocked')
    const open = memory.tasks.filter(t => t.status !== 'blocked')

    if (blocked.length > 0) {
      lines.push('### 🔴 Blocked')
      blocked.forEach(t => lines.push(`- ${t.title}${t.blocked_by ? ` (blocked by: ${t.blocked_by})` : ''}`))
    }

    lines.push('### Pending')
    open.forEach(t => lines.push(`- [${t.priority.toUpperCase()}] ${t.title}`))
    lines.push('')
  }

  // Contacts
  if (memory.contacts.length > 0) {
    lines.push('## 👥 People & Teams')
    memory.contacts.forEach(c => lines.push(`- ${c.name} (${c.role || c.type})${c.context ? `: ${c.context}` : ''}`))
  }

  return lines.join('\n')
}
```

---

## 7. Memory Stats & Introspection

### 7.1 Stats Endpoint

**Endpoint:** `GET /api/memory/stats?project_id=<id>`

```json
{
  "project": "my-app",
  "memory_health": "good",
  "preferences": {
    "total": 31,
    "high_confidence": 18,
    "decaying": 3,
    "global": 8,
    "project_specific": 23
  },
  "knowledge": {
    "total": 19,
    "critical_gotchas": 2,
    "high_severity": 3,
    "avg_confidence": 0.78
  },
  "patterns": {
    "total": 12,
    "high_effectiveness": 7,
    "global": 5,
    "project_specific": 7
  },
  "tasks": {
    "open": 8,
    "in_progress": 1,
    "blocked": 2,
    "completed_all_time": 34
  },
  "coverage": {
    "sessions_with_memory": 42,
    "total_sessions": 47,
    "coverage_pct": 89
  }
}
```

### 7.2 Memory Quality Score

The system computes a **memory health score** to tell you how rich the accumulated context is:

```typescript
function computeMemoryHealth(stats: MemoryStats): 'excellent' | 'good' | 'building' | 'sparse' {
  const score =
    (stats.preferences.high_confidence / Math.max(1, stats.preferences.total)) * 30 +
    (Math.min(stats.patterns.total, 10) / 10) * 20 +
    (Math.min(stats.knowledge.total, 15) / 15) * 20 +
    (stats.coverage.coverage_pct / 100) * 30

  if (score >= 75) return 'excellent'
  if (score >= 50) return 'good'
  if (score >= 25) return 'building'
  return 'sparse'
}
```

---

## 8. Memory Management

### 8.1 Manual Override API

Developers can correct or delete specific memory items via the API:

```
PATCH /api/memory/preferences/:id     → update value or confidence
DELETE /api/memory/preferences/:id    → soft-delete (sets is_active = 0)
PATCH /api/memory/knowledge/:id       → update content or severity
PATCH /api/memory/tasks/:id           → update status, priority, description
DELETE /api/memory/tasks/:id          → cancel a task
```

### 8.2 Memory Reset (Per-Project)

```
DELETE /api/memory?project_id=<id>&type=preferences
DELETE /api/memory?project_id=<id>&type=all
```

**Soft delete only** — sets `is_active = 0` rather than deleting rows. This preserves history and allows recovery.

### 8.3 Export

```
GET /api/memory/export?project_id=<id>
```

Returns a full JSON dump of all memory for a project — useful for migration, backup, or inspection.

---

## 9. Configuration

```bash
# Memory system settings
CLAUDECTX_MEMORY_DECAY=1             # 1=enabled, 0=disabled
CLAUDECTX_DECAY_DAYS=30              # days of inactivity before decay starts
CLAUDECTX_MIN_CONFIDENCE=0.70        # minimum confidence to inject into context
CLAUDECTX_MAX_PREFERENCES=15         # max preferences to inject per session
CLAUDECTX_MAX_KNOWLEDGE=12           # max knowledge items to inject per session
CLAUDECTX_MAX_PATTERNS=6             # max patterns to inject per session
CLAUDECTX_MAX_TASKS=10               # max open tasks to inject per session
CLAUDECTX_CRITICAL_ALWAYS=1         # always inject critical gotchas regardless of confidence
```

---

## 10. What's New in v2.0

| Feature | v1.0 | v2.0 |
|---------|-------|-------|
| Memory tables | Basic schema, preferences only fully documented | All 5 types fully documented with schemas and examples |
| Consolidation | Not implemented | Full merge, conflict detection, confidence adjustment |
| Confidence updates | Static — set once | Dynamic — increases on reconfirmation, decreases on contradiction |
| Memory decay | Not implemented | Daily decay with configurable rates, soft-delete below threshold |
| Task lifecycle | Per-session only | Cross-session: open → in_progress → blocked → completed |
| Task matching | Exact title match | Fuzzy match — handles paraphrasing across sessions |
| Pattern reinforcement | No | seen_count drives effectiveness tier upgrade |
| Global vs project memory | All per-project | Preferences and patterns can be global (apply to all projects) |
| Context injection priority | Flat list | Critical gotchas first, then by confidence + recency |
| Memory health score | No | Computed score: sparse → building → good → excellent |
| Memory stats endpoint | No | Full stats with coverage %, confidence distribution |
| Manual override | No | Patch/delete individual memory items via API |
| Export | No | Full JSON export per project |
| Evidence field | No | Every preference stores what revealed it |

---

## 11. Related Documentation

- [SESSION_AND_SUMMARY_FLOW.md](./SESSION_AND_SUMMARY_FLOW.md) — Full session lifecycle and AI summarization
- [UI_DATA_FLOW.md](./UI_DATA_FLOW.md) — Dashboard visualizing memory and sessions
- [API.md](./API.md) — Complete API reference including all memory endpoints
