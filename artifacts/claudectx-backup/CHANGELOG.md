# Changelog

## [1.2.0] - 2026-04-13

### Added
- **Phase 3A: Incremental Memory Engine** - Core checkpoint system
  - Hybrid trigger: 10 turns OR 5 minutes (whichever comes first)
  - Checkpoint storage in new `session_checkpoints` table
  - Incremental summarizer processes partial transcripts
  - Startup recovery scan for incomplete checkpoints
  - WebSocket broadcast for `checkpoint_complete` events
  - Feature flag: `ENABLE_INCREMENTAL=true` to opt-in (default: false)
  - Configuration: `CHECKPOINT_TURNS`, `CHECKPOINT_TIME`, `CHECKPOINT_GRAPH`

### Database
- Migration 012: Add `session_checkpoints` table
- Add checkpoint tracking columns to `sessions` table

### Breaking Changes
- None (feature flag disabled by default)

## [1.1.1] - 2026-04-13

### Fixed
- SPA routing: prevent double error response on client-side routes

## [1.1.0] - 2026-04-13

### Added
- Phase 1: Unified extraction, entity resolution, crash resilience
