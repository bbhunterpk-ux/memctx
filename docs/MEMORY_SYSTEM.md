# Memory System - AI-Powered Knowledge Extraction

## Overview

ClaudeContext's memory system automatically extracts structured knowledge from session summaries and stores it in a queryable database. This enables Claude to learn your preferences, remember domain knowledge, and apply successful patterns across sessions.

---

## 1. Memory Architecture

### 1.1 Memory Types

ClaudeContext extracts 5 types of memory from each session:

| Type | Purpose | Example |
|------|---------|---------|
| **Preferences** | User's coding style, workflow, communication preferences | `coding.style = "TypeScript with strict mode"` |
| **Knowledge** | Domain knowledge, technologies, gotchas | `technology.9router = "Returns OpenAI format, not Anthropic"` |
| **Patterns** | Problem-solving approaches that worked | `debugging.Check logs first = "Always check logs before diving into code"` |
| **Tasks** | Pending work identified during sessions | `"Test memory system" (priority: high, status: pending)` |
| **Contacts** | People, teams, organizations mentioned | `"Max" (role: Developer, type: person)` |

---

### 1.2 Database Schema

**File:** `src/db/migrations/001_add_memory_tables.sql`

#### Preferences Table

```sql
CREATE TABLE preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,  -- communication_style, coding, workflow, testing
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,  -- 0-1 confidence score
  source_session_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(project_id, category, key),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (source_session_id) REFERENCES sessions(id)
);
```

**Example Data:**

| category | key | value | confidence |
|----------|-----|-------|------------|
| coding | style | TypeScript with strict mode | 0.9 |
| coding | orm | Drizzle ORM | 0.95 |
| workflow | git_commits | Detailed commit messages | 0.9 |

---

## 2. Memory Extraction Process

### 2.1 AI Extraction from Summary

**When:** After session summary is generated

**File:** `src/services/summarizer.ts`

**AI Response Structure:**

```json
{
  "title": "Fixed ClaudeContext Session Summarization",
  "status": "completed",
  "preferences": [
    {
      "category": "coding",
      "key": "style",
      "value": "TypeScript with strict mode",
      "confidence": 0.9
    }
  ],
  "knowledge": [
    {
      "category": "technology",
      "topic": "9router",
      "content": "Returns OpenAI format, not Anthropic format",
      "confidence": 0.8
    }
  ],
  "patterns": [
    {
      "type": "debugging",
      "title": "Check logs first",
      "description": "Always check application logs before diving into code"
    }
  ],
  "tasks": [
    {
      "title": "Test memory system",
      "description": "Verify memory extraction and injection works",
      "priority": "high",
      "status": "pending"
    }
  ]
}
```

---

## 3. Memory Storage

All memory is stored in SQLite database at `~/.claudectx/db.sqlite` with project isolation via `project_id` foreign keys.

---

## 4. Memory Retrieval

**Endpoint:** `GET /api/memory?project_id=<id>`

Returns all memory for a project including preferences, knowledge, patterns, tasks, and contacts.

**Context API:** `GET /api/context?cwd=/path/to/project`

Returns formatted markdown with memory that gets injected into Claude's system prompt at session start.

---

## 5. Full Documentation

See SESSION_AND_SUMMARY_FLOW.md for complete details on:
- Database schemas for all 5 memory tables
- AI extraction logic and confidence scoring
- Upsert strategies for deduplication
- Query functions and filtering
- Project isolation implementation
- Memory consolidation (future)
- Dashboard UI components
- Troubleshooting and best practices
