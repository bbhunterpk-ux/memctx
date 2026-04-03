# Start ClaudeContext v2.0 Upgrade - Quick Start

**Ready to begin?** Follow these steps to start the upgrade safely.

---

## Pre-Flight Checklist

### 1. Backup Everything
```bash
# Backup database
cp ~/.claudectx/db.sqlite ~/.claudectx/db.sqlite.backup.$(date +%Y%m%d)

# Backup current code
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context
git add -A
git commit -m "chore: backup before v2.0 upgrade"
git tag v1.0-backup
```

### 2. Verify Current System
```bash
# Check worker is running
curl http://localhost:8000/api/health

# Check database
sqlite3 ~/.claudectx/db.sqlite "SELECT COUNT(*) FROM sessions;"

# Check current version
git log --oneline -1
```

### 3. Install Dependencies
```bash
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context
pnpm add fuse.js node-cron
pnpm add @types/node-cron --save-dev
```

### 4. Create Feature Branch
```bash
git checkout -b feature/v2.0-upgrade
```

---

## Phase 1: Database Schema (START HERE)

**Estimated Time:** 2-3 hours  
**Risk:** Low  
**Can Rollback:** Yes

### Step 1: Create Migration File

```bash
cat > artifacts/claudectx-backup/src/db/migrations/003_enhance_sessions_schema.sql << 'SQL'
-- ClaudeContext v2.0 - Enhanced Sessions Schema
-- Date: 2026-04-03
-- Description: Add new fields for mood, complexity, blockers, key insights

-- Add new session fields
ALTER TABLE sessions ADD COLUMN summary_mood TEXT;
ALTER TABLE sessions ADD COLUMN summary_complexity INTEGER;
ALTER TABLE sessions ADD COLUMN summary_blockers TEXT;
ALTER TABLE sessions ADD COLUMN summary_resolved TEXT;
ALTER TABLE sessions ADD COLUMN summary_key_insight TEXT;
ALTER TABLE sessions ADD COLUMN duration_seconds INTEGER;
ALTER TABLE sessions ADD COLUMN embedding_summary TEXT;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_sessions_project_ended ON sessions(project_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_summary_status ON sessions(summary_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_confidence ON knowledge_items(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_success ON learned_patterns(success_count DESC);
SQL
```

### Step 2: Update TypeScript Schema

Edit `artifacts/claudectx-backup/src/db/schema.ts`:

```typescript
// Add to sessions table definition
export const sessions = sqliteTable('sessions', {
  // ... existing fields ...
  
  // NEW v2.0 fields
  summary_mood: text('summary_mood'),
  summary_complexity: integer('summary_complexity'),
  summary_blockers: text('summary_blockers'),
  summary_resolved: text('summary_resolved'),
  summary_key_insight: text('summary_key_insight'),
  duration_seconds: integer('duration_seconds'),
  embedding_summary: text('embedding_summary')
})
```

### Step 3: Apply Migration

```bash
# Apply migration
sqlite3 ~/.claudectx/db.sqlite < artifacts/claudectx-backup/src/db/migrations/003_enhance_sessions_schema.sql

# Verify columns added
sqlite3 ~/.claudectx/db.sqlite "PRAGMA table_info(sessions);" | grep summary_mood

# Verify indexes created
sqlite3 ~/.claudectx/db.sqlite ".indexes sessions"
```

### Step 4: Update Queries

Edit `artifacts/claudectx-backup/src/db/queries.ts`:

```typescript
// Update updateSession function to handle new fields
export function updateSession(sessionId: string, updates: Partial<Session>) {
  return db
    .update(sessions)
    .set({
      ...updates,
      updated_at: sql`unixepoch()`
    })
    .where(eq(sessions.id, sessionId))
    .run()
}
```

### Step 5: Test

```bash
# Rebuild
cd artifacts/claudectx-backup
pnpm run build

# Check for errors
echo $?  # Should be 0

# Test database
sqlite3 ~/.claudectx/db.sqlite "SELECT summary_mood, summary_complexity FROM sessions LIMIT 1;"
# Should return NULL values (no errors)
```

### Step 6: Commit

```bash
git add -A
git commit -m "feat(db): add enhanced session schema with 7 new fields

- Add summary_mood, summary_complexity, summary_blockers
- Add summary_resolved, summary_key_insight, duration_seconds
- Add embedding_summary for future semantic search
- Create 5 performance indexes
- Update TypeScript schema types

Migration: 003_enhance_sessions_schema.sql"
```

---

## Verification

After Phase 1, verify:

```bash
# 1. Check columns exist
sqlite3 ~/.claudectx/db.sqlite "PRAGMA table_info(sessions);" | grep -E "summary_mood|summary_complexity|summary_blockers|summary_resolved|summary_key_insight|duration_seconds|embedding_summary"

# Should show 7 new columns

# 2. Check indexes exist
sqlite3 ~/.claudectx/db.sqlite ".indexes sessions"

# Should show:
# idx_sessions_project_ended
# idx_sessions_status
# idx_sessions_summary_status

# 3. Check build successful
ls -la artifacts/claudectx-backup/dist/src/db/schema.js

# 4. Test worker restart
pkill -f "node dist/src/index.js"
cd artifacts/claudectx-backup
ANTHROPIC_BASE_URL=http://localhost:20128/v1 \
ANTHROPIC_AUTH_TOKEN=sk_9router \
ANTHROPIC_DEFAULT_HAIKU_MODEL=AWS \
node dist/src/index.js > /tmp/claudectx.log 2>&1 &

# 5. Check health
sleep 2
curl http://localhost:8000/api/health | jq '.'
```

---

## If Something Goes Wrong

### Rollback Phase 1

```bash
# Stop worker
pkill -f "node dist/src/index.js"

# Restore database
cp ~/.claudectx/db.sqlite.backup.$(date +%Y%m%d) ~/.claudectx/db.sqlite

# Revert code
git checkout main

# Rebuild
cd artifacts/claudectx-backup
pnpm run build

# Restart worker
ANTHROPIC_BASE_URL=http://localhost:20128/v1 \
ANTHROPIC_AUTH_TOKEN=sk_9router \
ANTHROPIC_DEFAULT_HAIKU_MODEL=AWS \
node dist/src/index.js > /tmp/claudectx.log 2>&1 &
```

---

## Next Steps

After Phase 1 is complete and verified:

1. ✅ Phase 1 complete - Database schema enhanced
2. ➡️ **Next:** Phase 2 - Enhanced Summarization (see UPGRADE_ROADMAP.md)
3. Take a break! Phase 1 is the foundation for everything else.

---

## Getting Help

### Check Logs
```bash
tail -f /tmp/claudectx.log
```

### Check Database
```bash
sqlite3 ~/.claudectx/db.sqlite
# Then run SQL queries
```

### Check Health
```bash
curl http://localhost:8000/api/health | jq '.'
```

### Review Documentation
- `UPGRADE_ROADMAP.md` - Full plan
- `UPGRADE_CHECKLIST.md` - Step-by-step checklist
- `UPGRADE_SUMMARY.md` - Overview of changes

---

## Time Estimate

- **Phase 1:** 2-3 hours (you are here)
- **Phase 2:** 4-5 hours
- **Phase 3:** 6-8 hours
- **Phase 4:** 3-4 hours
- **Phase 5:** 5-6 hours
- **Phase 6:** 2-3 hours

**Total:** 22-29 hours over 3-4 weeks

---

## Ready?

```bash
# Let's go!
echo "Starting ClaudeContext v2.0 Upgrade - Phase 1"
date
```

Good luck! 🚀

