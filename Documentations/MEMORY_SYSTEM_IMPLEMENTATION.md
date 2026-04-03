# Memory System - Quick Implementation Guide

**Status**: Design complete, ready to implement in next session  
**Estimated Time**: 10-15 hours total

---

## What's Ready

1. ✅ Database schema designed (001_add_memory_tables.sql)
2. ✅ Migration system created (migrate.ts)
3. ✅ Architecture documented (MEMORY_SYSTEM_DESIGN.md)

---

## Implementation Steps (Next Session)

### Step 1: Apply Database Migration (30 min)
```bash
cd artifacts/claudectx-backup
# Migration will auto-run on worker restart
./start.sh
# Verify tables created
sqlite3 ~/.claudectx/db.sqlite ".tables"
```

### Step 2: Add Memory Queries (1 hour)
Add to `src/db/queries.ts`:
- `getPreferences(category?)`
- `setPreference(category, key, value, confidence)`
- `getKnowledge(category?, limit?)`
- `addKnowledge(item)`
- `getPatterns(type?, limit?)`
- `addPattern(pattern)`
- `getTasks(status?, project_id?)`
- `addTask(task)`
- `getContacts(type?)`
- `addContact(contact)`

### Step 3: Enhance Summarizer (2 hours)
Update `src/services/summarizer.ts`:
- Expand prompt to extract all memory types
- Parse memory from AI response
- Store in new tables
- Test with existing sessions

### Step 4: Enhance Context Builder (1 hour)
Update `src/services/context-builder.ts`:
- Query all memory types
- Format for injection
- Test context output

### Step 5: Add API Endpoints (2 hours)
Create `src/api/memory.ts`:
- GET /api/memory/preferences
- POST /api/memory/preferences
- GET /api/memory/knowledge
- POST /api/memory/knowledge
- GET /api/memory/patterns
- GET /api/memory/tasks
- POST /api/memory/tasks

### Step 6: Test & Verify (1 hour)
- Restart worker
- Exit current session
- Check memory extraction
- Start new session
- Verify memory injection

---

## Files to Create/Modify

### New Files
- ✅ `src/db/migrations/001_add_memory_tables.sql`
- ✅ `src/db/migrate.ts`
- `src/api/memory.ts`
- `src/services/memory-extractor.ts`

### Modified Files
- `src/db/client.ts` - Add migration runner
- `src/db/queries.ts` - Add memory queries
- `src/services/summarizer.ts` - Extract memory
- `src/services/context-builder.ts` - Inject memory
- `src/index.ts` - Register memory routes

---

## Quick Start Command

```bash
# Next session, run this:
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context
cat MEMORY_SYSTEM_IMPLEMENTATION.md
# Then follow steps 1-6
```

---

## Expected Result

After implementation, session start will show:

```
=== ClaudeContext Memory ===

## Your Preferences
- coding_style: TypeScript, functional, immutable
- testing: TDD, 80%+ coverage
- git: atomic commits, descriptive messages

## Recent Sessions
[Apr 2] Fixed Dashboard Real-Time Updates
[Apr 2] Debugged Missing Session Summaries
[Apr 2] Fixed ClaudeContext User Prompt Capture

## Pending Tasks
- [high] Implement memory system
- [medium] Test context injection

## What You Know
- 9router: Returns OpenAI format
- SQLite: ORDER BY started_at DESC
- Hooks: SessionEnd fires on proper exit

## Your Patterns
- Debug: Check logs first, test with curl
- Update: Rebuild, restart, verify

=== End of ClaudeContext Memory ===
```

---

## Current Session Summary

**What we accomplished:**
1. Fixed ClaudeContext system (API endpoint, response format)
2. Generated summaries for 4 sessions
3. Verified context injection working
4. Designed comprehensive memory system
5. Created database schema and migration

**Next session:**
Implement the memory system following this guide.
