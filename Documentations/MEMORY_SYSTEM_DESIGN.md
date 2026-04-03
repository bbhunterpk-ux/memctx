# ClaudeContext Memory System Design

**Goal**: Expand beyond session summaries to include persistent, structured memory across multiple dimensions

---

## Current State (Session Context Only)

```
ClaudeContext (Current)
└── context/
    └── recent_sessions/
        ├── session_summaries (what we did)
        ├── decisions_made
        ├── files_changed
        └── next_steps
```

**Limitation**: Only captures session-level context, no persistent memory about user preferences, relationships, knowledge, etc.

---

## Proposed Memory Architecture

```
~/.claudectx/memory/
├── preferences/
│   ├── communication_style.md
│   ├── topic_interests.md
│   ├── coding_preferences.md
│   └── workflow_preferences.md
├── relationships/
│   ├── contacts/
│   │   ├── person_name.md
│   │   └── team_name.md
│   └── interaction_history/
│       └── {contact_id}_history.jsonl
├── knowledge/
│   ├── domain_expertise/
│   │   ├── technology_stack.md
│   │   ├── business_domain.md
│   │   └── architecture_patterns.md
│   └── learned_skills/
│       ├── debugging_techniques.md
│       └── problem_solving_patterns.md
└── context/
    ├── recent_conversations/
    │   └── session_summaries.db (existing)
    ├── pending_tasks/
    │   ├── backlog.md
    │   └── active_tasks.md
    └── project_state/
        └── {project_id}_state.md
```

---

## Database Schema Extensions

### New Tables

```sql
-- User preferences
CREATE TABLE preferences (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,  -- communication_style, coding, workflow
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(category, key)
);

-- Relationships/Contacts
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- person, team, organization
  role TEXT,
  metadata TEXT,  -- JSON
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Interaction history
CREATE TABLE interactions (
  id INTEGER PRIMARY KEY,
  contact_id TEXT NOT NULL,
  session_id TEXT,
  interaction_type TEXT,  -- mentioned, collaborated, discussed
  context TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Domain knowledge
CREATE TABLE knowledge_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,  -- technology, business, architecture
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,  -- 0-1 confidence score
  source_session_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id)
);

-- Learned patterns
CREATE TABLE learned_patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL,  -- debugging, problem_solving, code_pattern
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  example TEXT,
  success_count INTEGER DEFAULT 0,
  last_used_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Pending tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed, blocked
  priority TEXT DEFAULT 'medium',  -- low, medium, high, urgent
  project_id TEXT,
  created_session_id TEXT,
  completed_session_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (created_session_id) REFERENCES sessions(id),
  FOREIGN KEY (completed_session_id) REFERENCES sessions(id)
);
```

---

## Memory Extraction During Summarization

### Enhanced Summarizer Prompt

```typescript
const response = await client.messages.create({
  model: CONFIG.summaryModel,
  max_tokens: 2000,
  system: `You are a memory extraction system. Analyze the session and extract:
1. Session summary (existing)
2. User preferences discovered
3. People/teams mentioned
4. Domain knowledge learned
5. Problem-solving patterns used
6. Pending tasks identified`,
  messages: [{
    role: 'user',
    content: `Analyze this session and extract structured memory.

TRANSCRIPT:
${compactTranscript}

Return JSON with these sections:
{
  "session_summary": { /* existing fields */ },
  "preferences": [
    {"category": "coding", "key": "prefers_typescript", "value": "true", "confidence": 0.9}
  ],
  "contacts": [
    {"name": "John", "type": "person", "role": "backend engineer", "context": "discussed API design"}
  ],
  "knowledge": [
    {"category": "technology", "topic": "React hooks", "content": "useEffect cleanup prevents memory leaks", "confidence": 0.8}
  ],
  "patterns": [
    {"type": "debugging", "title": "Check logs first", "description": "Always check application logs before diving into code"}
  ],
  "tasks": [
    {"title": "Fix authentication bug", "priority": "high", "status": "pending"}
  ]
}`
  }]
})
```

---

## Memory Injection at Session Start

### Enhanced Context Builder

```typescript
export async function buildContextMarkdown(cwd: string): Promise<string> {
  const project = await detectProject(cwd)
  
  const lines: string[] = [
    `=== ClaudeContext Memory ===`,
    ''
  ]
  
  // 1. User Preferences
  const prefs = queries.getPreferences()
  if (prefs.length > 0) {
    lines.push('## Your Preferences')
    prefs.forEach(p => {
      lines.push(`- ${p.key}: ${p.value}`)
    })
    lines.push('')
  }
  
  // 2. Recent Sessions (existing)
  const sessions = queries.getLastNCompletedSessions(project.id, 3)
  if (sessions.length > 0) {
    lines.push('## Recent Sessions')
    sessions.forEach(s => {
      lines.push(`[${formatDate(s.started_at)}] ${s.summary_title}`)
      lines.push(`  Done: ${s.summary_what_we_did.slice(0, 2).join(' • ')}`)
    })
    lines.push('')
  }
  
  // 3. Active Tasks
  const tasks = queries.getActiveTasks(project.id)
  if (tasks.length > 0) {
    lines.push('## Pending Tasks')
    tasks.forEach(t => {
      lines.push(`- [${t.priority}] ${t.title}`)
    })
    lines.push('')
  }
  
  // 4. Domain Knowledge
  const knowledge = queries.getRecentKnowledge(project.id, 5)
  if (knowledge.length > 0) {
    lines.push('## What You Know')
    knowledge.forEach(k => {
      lines.push(`- ${k.topic}: ${k.content}`)
    })
    lines.push('')
  }
  
  // 5. Learned Patterns
  const patterns = queries.getTopPatterns(5)
  if (patterns.length > 0) {
    lines.push('## Your Patterns')
    patterns.forEach(p => {
      lines.push(`- ${p.title}: ${p.description}`)
    })
    lines.push('')
  }
  
  lines.push('=== End of ClaudeContext Memory ===')
  return lines.join('\n')
}
```

---

## Implementation Plan

### Phase 1: Database Schema (1-2 hours)
1. Create migration script for new tables
2. Update queries.ts with new query functions
3. Test database operations

### Phase 2: Enhanced Summarizer (2-3 hours)
1. Update summarizer prompt to extract all memory types
2. Parse and validate extracted memory
3. Store in new database tables
4. Test with existing sessions

### Phase 3: Enhanced Context Builder (1-2 hours)
1. Update context-builder.ts to query all memory types
2. Format memory for injection
3. Test context injection with new memory

### Phase 4: Memory Management API (2-3 hours)
1. Add API endpoints for memory CRUD operations
2. Add memory search/query endpoints
3. Test API with curl/Postman

### Phase 5: Dashboard UI (3-4 hours)
1. Add memory pages to dashboard
2. Display preferences, knowledge, patterns, tasks
3. Add memory editing interface
4. Test UI updates

### Phase 6: Memory Decay & Confidence (2-3 hours)
1. Implement confidence scoring
2. Add memory decay over time
3. Add memory consolidation (merge similar items)
4. Test memory lifecycle

---

## Example Memory Injection

```
=== ClaudeContext Memory ===

## Your Preferences
- communication_style: concise, technical, no fluff
- coding_style: TypeScript, functional, immutable
- testing_approach: TDD, 80%+ coverage required
- git_workflow: atomic commits, descriptive messages

## Recent Sessions
[Apr 2, 08:49 AM] Fixed Dashboard Real-Time Updates and Session Status
  Done: Updated stale active sessions • Triggered summarization for all sessions

[Apr 2, 08:43 AM] Debugged Missing Session Summaries in Context System
  Done: Identified root cause • Fixed API endpoint configuration

[Apr 2, 08:38 AM] Fixed ClaudeContext User Prompt Capture
  Done: Fixed foreign key error • Enabled user prompt capture

## Pending Tasks
- [high] Add memory system to ClaudeContext
- [medium] Test context injection in new session
- [low] Update documentation

## What You Know
- 9router: Returns OpenAI format responses, not Anthropic format
- SQLite: Use ORDER BY started_at DESC for newest first
- Hooks: SessionEnd only fires on proper exit, not crashes
- TypeScript: Use stream: false to prevent streaming responses
- React: Dashboard auto-refreshes every 15 seconds with refetchInterval

## Your Patterns
- Debug API issues: Check logs first, then test endpoint directly with curl
- Fix database issues: Check schema, then test queries in sqlite3 CLI
- Update worker: Rebuild with pnpm, restart with ./start.sh
- Verify changes: Test with curl, check database, view dashboard

=== End of ClaudeContext Memory ===
```

---

## Benefits

1. **Persistent Preferences**: Remember how user likes to work
2. **Relationship Tracking**: Know who user works with and context
3. **Knowledge Accumulation**: Build up domain expertise over time
4. **Pattern Recognition**: Learn what works for this user
5. **Task Continuity**: Never lose track of pending work
6. **Confidence Scoring**: Know what's certain vs. uncertain
7. **Memory Decay**: Old, unused memories fade naturally

---

## Next Steps

1. Review this design with user
2. Get approval on memory categories
3. Implement Phase 1 (database schema)
4. Test with existing sessions
5. Iterate based on feedback

---

## Questions to Resolve

1. Should memory be project-specific or global?
2. How long should memories persist? (decay strategy)
3. Should user be able to manually edit memories?
4. Should memories be exportable/importable?
5. Privacy: what should NOT be remembered?
