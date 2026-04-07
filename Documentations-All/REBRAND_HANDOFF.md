# MemCTX Rebrand - Session Handoff

## Context
Rebranding ClaudeContext → MemCTX to better reflect its purpose as a memory/context system for Claude Code.

## Completed ✅
1. **Dashboard UI** (`artifacts/claudectx-backup/dashboard/src/components/Layout.tsx`)
   - Sidebar title: "ClaudeContext" → "MemCTX"
   
2. **Package Metadata** (`artifacts/claudectx-backup/package.json`)
   - name: "claudectx-backup" → "memctx"
   - description updated
   - bin name: "claudectx" → "memctx"

## Remaining Tasks 🔄

### High Priority (User-Facing)
- [ ] **README.md** - Update all references, installation instructions
- [ ] **HTML Title** (`artifacts/claudectx-backup/dashboard/index.html`) - Page title
- [ ] **CLI Scripts**
  - `artifacts/claudectx-backup/start.sh` - Update paths/references
  - `artifacts/claudectx-backup/kill.sh` - Update process names
- [ ] **Config Paths** - Migrate `~/.claudectx` → `~/.memctx`
  - Worker code references
  - Dashboard code references
  - Migration script for existing users

### Medium Priority (Documentation)
- [ ] **All .md files** in project root
- [ ] **Worker package** (`artifacts/claudectx-backup/worker/`)
  - package.json metadata
  - Any hardcoded strings
- [ ] **API Server** (`artifacts/claudectx-backup/api-server/`)
  - Check for hardcoded references

### Low Priority (Internal)
- [ ] Git commit messages style (if any templates exist)
- [ ] Any example configs or templates

## Key Decisions Made
- Keeping "ClaudeContext" in memory files and internal references (for now)
- Dashboard already shows "MemCTX" to users
- Package bin already renamed in package.json

## Search Strategy
Use these patterns to find remaining references:
```bash
grep -r "ClaudeContext" --exclude-dir=node_modules --exclude-dir=dist
grep -r "claudectx" --exclude-dir=node_modules --exclude-dir=dist
grep -r "\.claudectx" --exclude-dir=node_modules --exclude-dir=dist
```

## Testing Checklist
After rebrand:
- [ ] `pnpm install` works
- [ ] `memctx` command available globally
- [ ] Dashboard loads with "MemCTX" branding
- [ ] Worker starts without errors
- [ ] Config migration works for existing users

## Notes
- Current state is stable - dashboard and package.json done
- No breaking changes to API or data structures
- Mostly cosmetic rebrand + config path migration
