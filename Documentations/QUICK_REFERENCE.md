# ClaudeContext v2.0 - Quick Reference Card

**One-page reference for the upgrade process**

---

## 📁 File Structure

```
Claude-Context/
├── README_UPGRADE.md          ← START HERE (master index)
├── UPGRADE_ROADMAP.md         ← Full implementation plan (38KB)
├── UPGRADE_CHECKLIST.md       ← Step-by-step checklist
├── UPGRADE_SUMMARY.md         ← Executive overview
├── START_UPGRADE.md           ← Phase 1 quick start
├── QUICK_REFERENCE.md         ← This file
└── docs/
    ├── SESSION_AND_SUMMARY_FLOW.md  ← Session lifecycle
    ├── MEMORY_SYSTEM.md             ← Memory architecture
    ├── UI_DATA_FLOW.md              ← Dashboard implementation
    └── Upgraded_Versions/           ← Target v2.0 specs
        ├── SESSION_AND_SUMMARY_FLOW.md
        └── MEMORY_SYSTEM.md
```

---

## 🚀 Quick Start Commands

```bash
# 1. Backup
cp ~/.claudectx/db.sqlite ~/.claudectx/db.sqlite.backup.$(date +%Y%m%d)
git tag v1.0-backup

# 2. Install dependencies
pnpm add fuse.js node-cron @types/node-cron --save-dev

# 3. Create branch
git checkout -b feature/v2.0-upgrade

# 4. Start Phase 1
cat START_UPGRADE.md
```

---

## 📊 6 Phases at a Glance

| Phase | Time | What | Files |
|-------|------|------|-------|
| 1 | 2-3h | Database schema + indexes | `003_enhance_sessions_schema.sql`, `schema.ts` |
| 2 | 4-5h | Enhanced AI summarization | `transcript-compactor.ts`, `summarizer.ts` |
| 3 | 6-8h | Memory consolidation | `consolidator.ts`, `scheduler.ts` |
| 4 | 3-4h | Smart context injection | `briefing-generator.ts`, `context-builder.ts` |
| 5 | 5-6h | Memory decay + fuzzy matching | `memory-decay.ts`, `fuzzy-match.ts` |
| 6 | 2-3h | Performance + monitoring | `queue.ts`, `logger.ts`, `metrics.ts` |

**Total: 22-29 hours**

---

## 🔧 Essential Commands

### Check Status
```bash
# Health
curl http://localhost:8000/api/health | jq '.'

# Metrics
curl http://localhost:8000/api/metrics | jq '.'

# Logs
tail -f /tmp/claudectx.log

# Database
sqlite3 ~/.claudectx/db.sqlite "SELECT COUNT(*) FROM sessions;"
```

### Build & Restart
```bash
cd artifacts/claudectx-backup
pnpm run build
pkill -f "node dist/src/index.js"
ANTHROPIC_BASE_URL=http://localhost:20128/v1 \
ANTHROPIC_AUTH_TOKEN=sk_9router \
ANTHROPIC_DEFAULT_HAIKU_MODEL=AWS \
node dist/src/index.js > /tmp/claudectx.log 2>&1 &
```

### Rollback
```bash
# Full rollback
cp ~/.claudectx/db.sqlite.backup.$(date +%Y%m%d) ~/.claudectx/db.sqlite
git checkout main
pnpm run build
# Restart worker
```

---

## 📋 Phase 1 Checklist (Start Here)

- [ ] Backup database
- [ ] Create migration file `003_enhance_sessions_schema.sql`
- [ ] Add 7 new columns to sessions table
- [ ] Create 5 performance indexes
- [ ] Update `schema.ts` with new fields
- [ ] Apply migration
- [ ] Rebuild: `pnpm run build`
- [ ] Restart worker
- [ ] Verify: Check columns exist
- [ ] Commit: `git commit -m "feat(db): add enhanced session schema"`

**Time: 2-3 hours**

---

## 🎯 What Changes

### Session Fields (7 → 14)
```
NEW:
- summary_mood (productive/struggling/exploratory/debugging)
- summary_complexity (1-5)
- summary_blockers (JSON array)
- summary_resolved (JSON array)
- summary_key_insight (text)
- duration_seconds (integer)
- embedding_summary (JSON array for future)
```

### Memory Features
```
NEW:
- Daily consolidation (merge duplicates)
- Daily decay (soft-delete old memories)
- Fuzzy task matching (handles paraphrasing)
- Global preferences (apply to all projects)
- Conflict detection and resolution
```

### Context Injection
```
BEFORE: 3 sessions, flat list
AFTER:  5 sessions + AI briefing + structured + blockers first
```

---

## 🆘 Troubleshooting

### Migration fails
```bash
sqlite3 ~/.claudectx/db.sqlite "PRAGMA table_info(sessions);"
# Check if columns already exist
```

### Summarization fails
```bash
tail -f /tmp/claudectx.log | grep Summarizer
curl http://localhost:20128/v1/models
```

### Worker not starting
```bash
ps aux | grep "node dist/src/index.js"
lsof -i:8000
```

### Context not injecting
```bash
curl "http://localhost:8000/api/context?cwd=$(pwd)"
cat ~/.claude/settings.json | jq '.hooks.SessionStart'
```

---

## 📖 Documentation Map

**Want to understand the big picture?**
→ `UPGRADE_SUMMARY.md`

**Ready to start implementing?**
→ `START_UPGRADE.md`

**Need detailed code examples?**
→ `UPGRADE_ROADMAP.md`

**Want a step-by-step checklist?**
→ `UPGRADE_CHECKLIST.md`

**Need to understand sessions?**
→ `docs/SESSION_AND_SUMMARY_FLOW.md`

**Need to understand memory?**
→ `docs/MEMORY_SYSTEM.md`

**Building the dashboard?**
→ `docs/UI_DATA_FLOW.md`

---

## ✅ Success Metrics

After upgrade, verify:

```bash
# 1. New fields populated
sqlite3 ~/.claudectx/db.sqlite "SELECT summary_mood, summary_complexity FROM sessions ORDER BY started_at DESC LIMIT 1;"

# 2. Indexes created
sqlite3 ~/.claudectx/db.sqlite ".indexes sessions"

# 3. Health shows memory score
curl http://localhost:8000/api/health | jq '.memory.health_score'

# 4. Context includes briefing
curl "http://localhost:8000/api/context?cwd=$(pwd)" | grep "Smart Briefing"

# 5. Metrics tracking
curl http://localhost:8000/api/metrics | jq '.'
```

---

## 🎯 Key Files to Create/Modify

### Phase 1
- `src/db/migrations/003_enhance_sessions_schema.sql` (new)
- `src/db/schema.ts` (modify)

### Phase 2
- `src/services/transcript-compactor.ts` (new)
- `src/services/summarizer.ts` (modify)

### Phase 3
- `src/services/consolidator.ts` (new)
- `src/services/scheduler.ts` (new)

### Phase 4
- `src/services/briefing-generator.ts` (new)
- `src/services/context-builder.ts` (modify)
- `src/services/claude-md-updater.ts` (modify)

### Phase 5
- `src/services/memory-decay.ts` (new)
- `src/utils/fuzzy-match.ts` (new)
- `src/db/migrations/004_add_global_preferences.sql` (new)

### Phase 6
- `src/services/queue.ts` (modify)
- `src/utils/logger.ts` (new)
- `src/services/metrics.ts` (new)
- `src/api/health.ts` (modify)

---

## 💡 Pro Tips

1. **Test after each phase** - Don't wait until the end
2. **Commit frequently** - One commit per phase minimum
3. **Keep v1.0 running** - Test v2.0 in parallel first
4. **Backup before each phase** - Easy rollback
5. **Read logs** - They tell you what's happening
6. **Use feature flags** - Can disable new features if needed

---

## 🔗 Quick Links

- Master Index: `README_UPGRADE.md`
- Start Phase 1: `START_UPGRADE.md`
- Full Plan: `UPGRADE_ROADMAP.md`
- Checklist: `UPGRADE_CHECKLIST.md`
- Overview: `UPGRADE_SUMMARY.md`

---

## 📞 Getting Help

1. Check logs: `tail -f /tmp/claudectx.log`
2. Check health: `curl http://localhost:8000/api/health`
3. Check database: `sqlite3 ~/.claudectx/db.sqlite`
4. Review documentation in `docs/`
5. Check troubleshooting section in `UPGRADE_CHECKLIST.md`

---

**Last Updated:** 2026-04-03  
**Version:** v2.0 Upgrade Documentation  
**Status:** Ready for Implementation

