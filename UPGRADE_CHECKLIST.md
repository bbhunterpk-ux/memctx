# ClaudeContext v2.0 Upgrade Checklist

Quick reference for implementing the upgrade. See UPGRADE_ROADMAP.md for full details.

---

## Pre-Upgrade

- [ ] Backup database: `cp ~/.claudectx/db.sqlite ~/.claudectx/db.sqlite.backup`
- [ ] Create feature branch: `git checkout -b feature/v2.0-upgrade`
- [ ] Install dependencies: `pnpm add fuse.js node-cron`
- [ ] Review UPGRADE_ROADMAP.md

---

## Phase 1: Database Schema (2-3 hours)

- [ ] Create migration file: `003_enhance_sessions_schema.sql`
- [ ] Add 7 new columns to sessions table
- [ ] Create 5 performance indexes
- [ ] Update TypeScript schema types
- [ ] Apply migration: `sqlite3 ~/.claudectx/db.sqlite < migration.sql`
- [ ] Test: Verify columns exist and indexes created
- [ ] Commit: `git commit -m "feat: add enhanced session schema"`

---

## Phase 2: Enhanced Summarization (4-5 hours)

- [ ] Create `src/services/transcript-compactor.ts`
- [ ] Implement smart compaction (opening + important + recent)
- [ ] Update AI prompt in `summarizer.ts`
- [ ] Add new fields to JSON schema (mood, complexity, blockers, etc)
- [ ] Increase token limit to 2500
- [ ] Update summary storage to save new fields
- [ ] Test: Generate summary and verify all fields extracted
- [ ] Commit: `git commit -m "feat: enhanced AI summarization"`

---

## Phase 3: Memory Consolidation (6-8 hours)

- [ ] Create `src/services/consolidator.ts`
- [ ] Implement preference merging with conflict detection
- [ ] Implement knowledge merging with fuzzy matching
- [ ] Implement pattern reinforcement
- [ ] Implement task matching
- [ ] Create `src/services/scheduler.ts`
- [ ] Schedule daily consolidation at 3 AM
- [ ] Test: Create duplicates and verify merge
- [ ] Commit: `git commit -m "feat: memory consolidation engine"`

---

## Phase 4: Smart Context Injection (3-4 hours)

- [ ] Create `src/services/briefing-generator.ts`
- [ ] Implement AI-powered smart briefing
- [ ] Enhance `context-builder.ts` with new format
- [ ] Add blockers section (show first)
- [ ] Add smart briefing section
- [ ] Update CLAUDE.md format with table
- [ ] Test: Generate context and verify formatting
- [ ] Commit: `git commit -m "feat: smart context injection"`

---

## Phase 5: Advanced Features (5-6 hours)

- [ ] Create `src/services/memory-decay.ts`
- [ ] Implement daily decay with configurable rate
- [ ] Add soft-delete at threshold
- [ ] Create `src/utils/fuzzy-match.ts`
- [ ] Implement Levenshtein distance algorithm
- [ ] Implement task fuzzy matching
- [ ] Create migration: `004_add_global_preferences.sql`
- [ ] Add scope field to preferences and patterns
- [ ] Update queries to support global scope
- [ ] Schedule daily decay at 4 AM
- [ ] Test: Verify decay and fuzzy matching
- [ ] Commit: `git commit -m "feat: memory decay and fuzzy matching"`

---

## Phase 6: Performance & Monitoring (2-3 hours)

- [ ] Update `src/services/queue.ts` with 3 priority queues
- [ ] Add retry logic with exponential backoff to summarizer
- [ ] Implement fallback summary (transcript-only)
- [ ] Enhance health endpoint with full stats
- [ ] Create `src/utils/logger.ts`
- [ ] Replace all console.log with structured logging
- [ ] Create `src/services/metrics.ts`
- [ ] Add metrics endpoint
- [ ] Test: Verify queues, retry, and monitoring
- [ ] Commit: `git commit -m "feat: performance and monitoring"`

---

## Post-Upgrade

- [ ] Run full build: `pnpm run build`
- [ ] Restart worker with new code
- [ ] Run initial consolidation: `node scripts/run-consolidation.js`
- [ ] Check health: `curl http://localhost:8000/api/health`
- [ ] Check metrics: `curl http://localhost:8000/api/metrics`
- [ ] Test new session with context injection
- [ ] Update documentation
- [ ] Merge to main: `git checkout main && git merge feature/v2.0-upgrade`
- [ ] Tag release: `git tag v2.0.0`

---

## Verification Tests

### Test 1: Enhanced Summarization
```bash
# Start new session, do some work, exit
# Check database for new fields
sqlite3 ~/.claudectx/db.sqlite "SELECT summary_mood, summary_complexity, summary_key_insight FROM sessions ORDER BY started_at DESC LIMIT 1;"
```

### Test 2: Memory Consolidation
```bash
# Create duplicate preferences manually
sqlite3 ~/.claudectx/db.sqlite "INSERT INTO preferences (project_id, category, key, value, confidence) VALUES ('test', 'coding', 'style', 'TypeScript', 0.9);"
sqlite3 ~/.claudectx/db.sqlite "INSERT INTO preferences (project_id, category, key, value, confidence) VALUES ('test', 'coding', 'style', 'TypeScript', 0.8);"

# Run consolidation
node -e "require('./dist/src/services/consolidator').consolidateMemory('test')"

# Verify only one remains
sqlite3 ~/.claudectx/db.sqlite "SELECT COUNT(*) FROM preferences WHERE project_id='test' AND category='coding' AND key='style';"
```

### Test 3: Smart Context Injection
```bash
# Start new session
# Check that context includes smart briefing
curl "http://localhost:8000/api/context?cwd=$(pwd)" | grep "Smart Briefing"
```

### Test 4: Memory Decay
```bash
# Update old preference to simulate age
sqlite3 ~/.claudectx/db.sqlite "UPDATE preferences SET updated_at = unixepoch() - 2592000 WHERE id=1;"

# Run decay
node -e "require('./dist/src/services/memory-decay').applyMemoryDecay('test')"

# Check confidence decreased
sqlite3 ~/.claudectx/db.sqlite "SELECT confidence FROM preferences WHERE id=1;"
```

### Test 5: Priority Queues
```bash
# Check queue stats
curl http://localhost:8000/api/health | jq '.queue'
```

---

## Rollback Commands

### Quick Rollback
```bash
# Restore database
cp ~/.claudectx/db.sqlite.backup ~/.claudectx/db.sqlite

# Revert code
git checkout main

# Rebuild and restart
pnpm run build
pkill -f "node dist/src/index.js"
node dist/src/index.js > /tmp/claudectx.log 2>&1 &
```

### Partial Rollback (Keep DB, Revert Code)
```bash
# Just revert code
git checkout main
pnpm run build
pkill -f "node dist/src/index.js"
node dist/src/index.js > /tmp/claudectx.log 2>&1 &
```

---

## Troubleshooting

### Issue: Migration fails
```bash
# Check current schema
sqlite3 ~/.claudectx/db.sqlite ".schema sessions"

# Check if columns already exist
sqlite3 ~/.claudectx/db.sqlite "PRAGMA table_info(sessions);"
```

### Issue: Summarization fails
```bash
# Check logs
tail -f /tmp/claudectx.log | grep Summarizer

# Test AI endpoint
curl http://localhost:20128/v1/models
```

### Issue: Consolidation not running
```bash
# Check scheduler
ps aux | grep node | grep index.js

# Manually trigger
node -e "require('./dist/src/services/consolidator').consolidateMemory('PROJECT_ID')"
```

### Issue: Context not injecting
```bash
# Test context API
curl "http://localhost:8000/api/context?cwd=$(pwd)"

# Check SessionStart hook
cat ~/.claude/settings.json | jq '.hooks.SessionStart'
```

---

## Success Metrics

After upgrade, verify:
- ✅ Sessions have all 14 fields populated
- ✅ Memory consolidation runs daily
- ✅ Duplicate memories are merged
- ✅ Context includes smart briefing
- ✅ CLAUDE.md has rich formatting
- ✅ Health endpoint shows memory health score
- ✅ Queue stats show 3 separate queues
- ✅ Logs are structured with timestamps
- ✅ Metrics endpoint tracks operations

---

## Timeline

- **Week 1:** Phases 1-2 (Foundation)
- **Week 2:** Phases 3-4 (Core Features)
- **Week 3:** Phases 5-6 (Advanced & Polish)
- **Week 4:** Testing & Documentation

**Total:** 22-29 hours over 3-4 weeks

