# Phase 3B: Rich Memory Features - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add advanced layers to the memory engine including momentum tracking, learning progression, emotional context/frustration tracking, code quality, and productivity metrics.

**Architecture:** Extend the database schema to capture rich memory attributes on sessions, update the summarizer prompts and interfaces to extract these metrics from transcripts/observations, and expose them on the dashboard.

**Tech Stack:** TypeScript, SQLite, Anthropic SDK (Prompt Engineering), Express.js (API updates), Vue 3 (Dashboard enhancements)

---

## File Structure

### Modified Files
- `artifacts/claudectx-backup/src/db/migrations/013_rich_memory.sql` - New DB migration.
- `artifacts/claudectx-backup/src/services/summarizer.ts` (and `incremental-summarizer.ts`) - Prompt extensions for rich metrics.
- `artifacts/claudectx-backup/src/db/queries.ts` - Update insert/get operations.
- `artifacts/claudectx-backup/dashboard/src/components/...` - Visualize momentum and emotional states.

---

## Task 1: Database Migration

- Create `artifacts/claudectx-backup/src/db/migrations/013_rich_memory.sql`:
```sql
ALTER TABLE sessions ADD COLUMN metric_momentum INTEGER DEFAULT 50;
ALTER TABLE sessions ADD COLUMN metric_frustration INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN metric_productivity INTEGER DEFAULT 50;
ALTER TABLE sessions ADD COLUMN learning_progression TEXT;
ALTER TABLE sessions ADD COLUMN emotional_context TEXT;
ALTER TABLE sessions ADD COLUMN code_quality_notes TEXT;
```

## Task 2: Service/Prompt Updates

- Update `SessionSummary` interface in `summarizer.ts` and `incremental-summarizer.ts`.
- Add `metrics: { momentum: number, frustration: number, productivity: number }`
- Add `learning_progression`, `emotional_context`, and `code_quality_notes` to prompt JSON schema expectation.
- Ensure the prompt guides the LLM to deduce frustration (e.g. repeated errors, swearing), momentum (e.g. fast consecutive commits), and productivity.

## Task 3: Backend DB Queries

- Update `queries.ts` to map and save the newly returned metrics.
- Expose the rich metrics in the `/api/sessions` API payload natively.

## Task 4: Dashboard Visualization

- Update the session component to display a "Frustration Meter" or a "Momentum Chart".
- Add Badges for `emotional_context` (e.g. "Frustrated 🔴", "Flow State 🟢").
