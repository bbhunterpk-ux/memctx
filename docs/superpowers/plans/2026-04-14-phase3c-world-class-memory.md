# Phase 3C: World-Class AI Context Parameters

## Goal
Make the memory engine give the AI an almost "superhuman" context for the next session. Track cognitive state, code health, gamification metrics, and perfect session resumption targets.

## Added Metrics
1. **Context Resumption:** `next_session_starting_point`, `open_rabbit_holes`, `environmental_dependencies`
2. **AI Persona Adaptation:** `preferred_verbosity`, `collaboration_style`, `cognitive_load_estimate`
3. **Tech Lead / Code Health:** `unresolved_tech_debt`, `testing_coverage_gap`, `architectural_drift`
4. **Behavioral Insights:** `aha_moments_count`, `flow_state_duration_mins`, `divergence_score`

## Tasks
1. **Migration:** Create `src/db/migrations/014_world_class_memory.sql`
2. **Service Updates:** Add fields to `SessionSummary` in `summarizer.ts` and `incremental-summarizer.ts`.
3. **Queries:** Add the columns to allowed DB mutations in `src/db/queries.ts`.
4. **UI:** Render the new badges in `dashboard/src/components/SessionCard.tsx`.
5. **Build:** Run `pnpm run build` across frontend and worker.
