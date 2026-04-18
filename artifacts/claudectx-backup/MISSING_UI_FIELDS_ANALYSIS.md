# Missing Database Fields in UI - Analysis Report

Generated: 2026-04-18

## Executive Summary

After analyzing the database schema and UI components, I've identified **multiple database fields that are stored but NOT displayed** on the ProjectDetail and SessionDetail pages.

---

## 🔴 SESSIONS TABLE - Missing Fields in SessionDetail UI

### Token Usage & Cost Data (CRITICAL - Not Shown Anywhere!)
- `total_input_tokens` - Total input tokens used
- `total_output_tokens` - Total output tokens used  
- `total_cache_read_tokens` - Cache read tokens
- `total_cache_creation_tokens` - Cache creation tokens
- `total_cost_usd` - Total cost in USD

**Impact**: Users cannot see API costs or token consumption per session!

### Session Metadata
- `transcript_path` - Path to full transcript file
- `embedding_summary` - Vector embedding of summary
- `tools_used` - JSON array of tools used in session
- `files_touched` - JSON array of files touched (different from summary_files_changed)
- `estimated_tokens` - Estimated token count

### Checkpoint Data
- `last_checkpoint_turn` - Last turn when checkpoint was saved
- `last_checkpoint_time` - Timestamp of last checkpoint
- `checkpoint_count` - Total number of checkpoints

### Session Timing
- `last_activity` - Last activity timestamp
- `summary_requested_at` - When summary was requested

---

## 🟡 SESSIONS TABLE - Partially Shown Fields

### Currently Shown in SessionDetail:
✅ `summary_mood` - Shown in right sidebar
✅ `summary_complexity` - Shown in right sidebar
✅ `metric_momentum` - Shown in telemetry card
✅ `metric_frustration` - Shown in telemetry card
✅ `metric_productivity` - Shown in telemetry card
✅ `learning_progression` - Shown below stats
✅ `emotional_context` - Shown below stats
✅ `code_quality_notes` - Shown below stats
✅ `aha_moments_count` - Shown in telemetry
✅ `flow_state_duration_mins` - Shown in telemetry
✅ `preferred_verbosity` - Shown in telemetry
✅ `cognitive_load_estimate` - Shown in telemetry
✅ `divergence_score` - Shown in telemetry
✅ `collaboration_style` - Shown in telemetry

### NOT Shown in SessionDetail:
❌ `open_rabbit_holes` - JSON array (mentioned in SummaryView but not rendered)
❌ `environmental_dependencies` - JSON array (mentioned in SummaryView but not rendered)
❌ `unresolved_tech_debt` - JSON array (mentioned in SummaryView but not rendered)
❌ `testing_coverage_gap` - Text field (mentioned in SummaryView but not rendered)
❌ `architectural_drift` - Text field (mentioned in SummaryView but not rendered)

---

## 🔵 PROJECTS TABLE - Missing Fields in ProjectDetail UI

### Currently Shown:
✅ `name` - Project name
✅ `root_path` - File system path
✅ `git_remote` - Git remote URL

### NOT Shown:
❌ `created_at` - When project was created
❌ `updated_at` - Last update timestamp

---

## 📊 OTHER TABLES - Not Displayed Anywhere

### TOKEN_USAGE Table (Entire table not shown!)
- `id` - Usage record ID
- `session_id` - Session reference
- `operation` - Operation type (summarize, consolidate, etc.)
- `model` - Model used
- `input_tokens` - Input tokens for this operation
- `output_tokens` - Output tokens for this operation
- `cache_creation_tokens` - Cache creation tokens
- `cache_read_tokens` - Cache read tokens
- `cost_usd` - Cost for this operation
- `created_at` - Timestamp

**Impact**: No per-operation token/cost breakdown visible!

### SESSION_CHECKPOINTS Table (Not shown)
- Checkpoint data for session recovery

### INTERACTIONS Table (Not shown)
- User interaction patterns

### CONTACTS Table (Not shown)
- Contact information from sessions

### TASKS Table (Not shown)
- Task tracking data

### LEARNED_PATTERNS Table (Not shown)
- Pattern learning data

### KNOWLEDGE_ITEMS Table (Not shown)
- Knowledge base items

### PREFERENCES Table (Not shown)
- User preferences

---

## 🎯 Recommendations

### HIGH PRIORITY (User-Facing Value)

1. **Add Token Usage & Cost Section to SessionDetail**
   - Show total_input_tokens, total_output_tokens
   - Show total_cost_usd prominently
   - Show cache efficiency (cache_read_tokens vs cache_creation_tokens)
   - Add breakdown from token_usage table

2. **Add Missing Summary Fields to SessionDetail**
   - Display `open_rabbit_holes` as expandable section
   - Display `environmental_dependencies` as list
   - Display `unresolved_tech_debt` as warning section
   - Display `testing_coverage_gap` if present
   - Display `architectural_drift` if present

3. **Add Project Timestamps to ProjectDetail**
   - Show `created_at` date
   - Show `updated_at` (last activity)

### MEDIUM PRIORITY

4. **Add Transcript Access**
   - Show link to `transcript_path` for full session transcript

5. **Add Checkpoint Information**
   - Show checkpoint count and last checkpoint time

### LOW PRIORITY

6. **Add Advanced Analytics Page**
   - Token usage trends over time
   - Cost analysis per project
   - Tool usage statistics
   - File touch patterns

---

## 📍 File Locations for Updates

- **SessionDetail UI**: `/dashboard/src/pages/SessionDetail.tsx`
- **ProjectDetail UI**: `/dashboard/src/pages/ProjectDetail.tsx`
- **API Client**: `/dashboard/src/api/client.ts`
- **Backend Queries**: `/src/db/queries.ts`

---

## Summary Statistics

- **Sessions Table**: 58 total columns
  - **Displayed**: ~30 columns
  - **Missing**: ~28 columns
  
- **Token Usage Table**: 9 columns
  - **Displayed**: 0 columns (entire table not shown!)

- **Projects Table**: 6 columns
  - **Displayed**: 3 columns
  - **Missing**: 2 timestamp columns
