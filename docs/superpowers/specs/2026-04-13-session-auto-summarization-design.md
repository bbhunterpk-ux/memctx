---
name: Session Auto-Summarization and Enhanced Status Management
description: Automatic detection and summarization of stale sessions with improved UI controls for sync/resync operations
type: feature
---

# Session Auto-Summarization and Enhanced Status Management

## Problem Statement

Users experience three critical issues with session management:

1. **Force End button disappears** - When sessions are left open overnight, the Force End button becomes unavailable even though the session is still active
2. **No auto-summarization** - Sessions that are closed or left inactive don't automatically trigger AI summarization
3. **Confusing sync buttons** - No clear distinction between "first-time sync" (no summary exists) vs "resync" (regenerate existing summary)

## Goals

1. Automatically detect and summarize stale sessions (inactive for 8+ hours)
2. Always show Force End button for truly active sessions
3. Provide clear "Sync Summary" / "Resync Summary" buttons based on summary state
4. Track session activity accurately to distinguish active vs abandoned sessions

## Architecture

### Core Components

#### 1. Background Worker (`stale-session-worker.ts`)
- Runs every 30 minutes via Node.js `setInterval`
- Queries for sessions where:
  - `status = 'active'` OR `status IS NULL`
  - `last_activity < (now - 8 hours)`
  - `transcript_path IS NOT NULL`
- Auto-triggers Force End + Summarization for stale sessions
- Marks sessions with `auto_ended = 1` flag

#### 2. Activity Tracker (`activity-tracker.ts`)
- Updates `last_activity` timestamp on:
  - Tool use events (via hook)
  - User messages (via hook)
  - Session detail page views (via API endpoint)
- Debounced to avoid excessive database writes (max 1 update per minute per session)

#### 3. Enhanced UI Components
- **SessionCard.tsx** - Add "Sync Summary" / "Resync Summary" button next to Force End
- **SessionDetail.tsx** - Replace current "Resync" button with dynamic "Sync Summary" / "Resync Summary"
- **Status detection** - Fix `isActive` logic to handle null/missing status fields

#### 4. API Endpoints
- `POST /api/sessions/:id/sync` - First-time summarization (no summary exists)
- `POST /api/sessions/:id/resync` - Regenerate existing summary
- `POST /api/sessions/:id/activity` - Update last_activity timestamp

### Database Schema Changes

```sql
-- Add new columns to sessions table
ALTER TABLE sessions ADD COLUMN last_activity INTEGER;
ALTER TABLE sessions ADD COLUMN auto_ended BOOLEAN DEFAULT 0;
ALTER TABLE sessions ADD COLUMN summary_requested_at INTEGER;

-- Create index for worker queries
CREATE INDEX IF NOT EXISTS idx_sessions_activity 
ON sessions(status, last_activity);

-- Backfill last_activity for existing sessions
UPDATE sessions 
SET last_activity = COALESCE(ended_at, started_at) 
WHERE last_activity IS NULL;
```

**Field Purposes:**
- `last_activity` - Unix timestamp of last user interaction
- `auto_ended` - Boolean flag (1 = auto-closed by worker, 0 = manual)
- `summary_requested_at` - Unix timestamp when user clicked sync/resync
- Index on `(status, last_activity)` - Optimizes worker queries

### Data Flow

#### Automatic Summarization Flow
```
Background Worker (every 30 min)
    ↓
Query: SELECT * FROM sessions 
       WHERE (status = 'active' OR status IS NULL)
       AND last_activity < (now - 8 hours)
       AND transcript_path IS NOT NULL
    ↓
For each stale session:
    - Update: status = 'completed', auto_ended = 1
    - Queue for summarization (priority = 'normal')
    - Broadcast WebSocket event: session_auto_ended
    ↓
Summarization Queue processes job
    ↓
UI updates via WebSocket
```

#### Manual Sync/Resync Flow
```
User clicks "Sync Summary" or "Resync Summary"
    ↓
API: POST /api/sessions/:id/sync (or /resync)
    ↓
Update: summary_requested_at = now
    ↓
Queue for summarization (priority = 'high')
    ↓
Return: { success: true, message: "Queued for summarization" }
    ↓
UI shows loading state
    ↓
WebSocket event: summary_ready
    ↓
UI refetches session data
```

#### Activity Tracking Flow
```
User interacts with session (tool use, message, page view)
    ↓
Activity Tracker checks: last update > 1 minute ago?
    ↓
If yes: UPDATE sessions SET last_activity = now WHERE id = :id
    ↓
Debounce prevents excessive writes
```

## Implementation Details

### 1. Background Worker

**File:** `artifacts/claudectx-backup/src/services/stale-session-worker.ts`

```typescript
export class StaleSessionWorker {
  private intervalId: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes
  private readonly STALE_THRESHOLD = 8 * 60 * 60 // 8 hours

  start() {
    this.intervalId = setInterval(() => this.checkStaleSessions(), this.CHECK_INTERVAL)
    // Run immediately on start
    this.checkStaleSessions()
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId)
  }

  private async checkStaleSessions() {
    const now = Math.floor(Date.now() / 1000)
    const staleThreshold = now - this.STALE_THRESHOLD
    
    const staleSessions = queries.getStaleSessions(staleThreshold)
    
    for (const session of staleSessions) {
      await this.endStaleSession(session)
    }
  }

  private async endStaleSession(session: any) {
    // Mark as completed and auto-ended
    queries.updateSession(session.id, {
      status: 'completed',
      ended_at: session.last_activity || Math.floor(Date.now() / 1000),
      auto_ended: 1
    })

    // Queue for summarization
    if (session.transcript_path) {
      summarizationQueue.enqueue({
        sessionId: session.id,
        transcriptPath: session.transcript_path,
        projectId: session.project_id,
        priority: 'normal'
      })
    }

    // Broadcast event
    broadcast({
      type: 'session_auto_ended',
      session_id: session.id
    })
  }
}
```

### 2. Activity Tracker

**File:** `artifacts/claudectx-backup/src/services/activity-tracker.ts`

```typescript
export class ActivityTracker {
  private lastUpdate: Map<string, number> = new Map()
  private readonly DEBOUNCE_MS = 60 * 1000 // 1 minute

  updateActivity(sessionId: string) {
    const now = Date.now()
    const lastUpdate = this.lastUpdate.get(sessionId) || 0
    
    if (now - lastUpdate < this.DEBOUNCE_MS) {
      return // Skip if updated recently
    }

    queries.updateSessionActivity(sessionId, Math.floor(now / 1000))
    this.lastUpdate.set(sessionId, now)
  }
}

export const activityTracker = new ActivityTracker()
```

### 3. Database Queries

**Add to:** `artifacts/claudectx-backup/src/db/queries.ts`

```typescript
getStaleSessions(staleThreshold: number) {
  return db.prepare(`
    SELECT * FROM sessions
    WHERE (status = 'active' OR status IS NULL)
    AND last_activity < ?
    AND transcript_path IS NOT NULL
  `).all(staleThreshold)
}

updateSessionActivity(sessionId: string, timestamp: number) {
  db.prepare(`
    UPDATE sessions 
    SET last_activity = ? 
    WHERE id = ?
  `).run(timestamp, sessionId)
}
```

### 4. API Endpoints

**Add to:** `artifacts/claudectx-backup/src/api/sessions.ts`

```typescript
// POST /api/sessions/:id/sync
router.post('/:id/sync', async (req, res) => {
  const session = queries.getSession(req.params.id)
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  if (!session.transcript_path) {
    return res.status(400).json({ error: 'No transcript available' })
  }

  // Update summary_requested_at
  queries.updateSession(session.id, {
    summary_requested_at: Math.floor(Date.now() / 1000)
  })

  // Queue for summarization
  summarizationQueue.enqueue({
    sessionId: session.id,
    transcriptPath: session.transcript_path,
    projectId: session.project_id,
    priority: 'high'
  })

  res.json({ success: true, message: 'Queued for summarization' })
})

// POST /api/sessions/:id/activity
router.post('/:id/activity', async (req, res) => {
  activityTracker.updateActivity(req.params.id)
  res.json({ success: true })
})
```

### 5. UI Components

**SessionCard.tsx changes:**

```typescript
// Fix isActive detection (line 56-58)
const isActive = session.status === 'active' || 
                 !session.status || 
                 (session.summary_status && session.summary_status.toLowerCase() === 'in_progress')

const hasSummary = !!session.summary_title

// Add Sync/Resync button (after Force End button)
<button
  onClick={handleSyncSummary}
  disabled={syncing}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    background: syncing ? 'var(--surface)' : 'var(--blue)15',
    color: syncing ? 'var(--text-muted)' : 'var(--blue)',
    border: '1px solid',
    borderColor: syncing ? 'var(--border)' : 'var(--blue)30',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: syncing ? 'not-allowed' : 'pointer',
  }}
>
  <RefreshCw size={12} />
  {syncing ? 'Syncing...' : (hasSummary ? 'Resync' : 'Sync')}
</button>
```

**SessionDetail.tsx changes:**

```typescript
// Replace existing resync button with dynamic sync/resync
const hasSummary = !!session.summary_title

<button
  onClick={handleSyncSummary}
  disabled={syncing}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'var(--blue)15',
    color: 'var(--blue)',
    border: '1px solid var(--blue)30',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: syncing ? 'not-allowed' : 'pointer',
  }}
>
  <RefreshCw size={14} />
  {syncing ? 'Processing...' : (hasSummary ? 'Resync Summary' : 'Sync Summary')}
</button>
```

### 6. Hook Integration

**Update:** `artifacts/claudectx-backup/src/hooks/post-tool-use.ts`

```typescript
import { activityTracker } from '../services/activity-tracker'

export async function postToolUseHook(event: any) {
  // Existing logic...
  
  // Track activity
  if (event.session_id) {
    activityTracker.updateActivity(event.session_id)
  }
}
```

## Configuration

**Add to settings table:**

```sql
INSERT OR IGNORE INTO settings VALUES ('stale_session_threshold_hours', '8');
INSERT OR IGNORE INTO settings VALUES ('worker_check_interval_minutes', '30');
```

**Configurable via Settings UI:**
- Stale session threshold (default: 8 hours)
- Worker check interval (default: 30 minutes)
- Enable/disable auto-summarization (default: enabled)

## Error Handling

1. **Worker failures** - Log errors but continue processing other sessions
2. **Summarization failures** - Retry logic already exists in summarization-queue.ts
3. **Database errors** - Rollback transactions, log error, continue
4. **WebSocket disconnects** - UI falls back to polling

## Testing Strategy

1. **Unit tests** - Test worker logic, activity tracker debouncing
2. **Integration tests** - Test full flow from stale detection to summarization
3. **Manual testing** - Create test session, wait 8 hours (or modify threshold), verify auto-end
4. **Edge cases** - Sessions with no transcript, already completed sessions, concurrent updates

## Migration Plan

1. Run database migration to add new columns
2. Backfill `last_activity` for existing sessions
3. Deploy backend changes (worker, API endpoints)
4. Deploy frontend changes (UI buttons)
5. Monitor logs for first 24 hours
6. Adjust thresholds based on user feedback

## Success Metrics

- Force End button always visible for active sessions
- Stale sessions auto-summarized within 30 minutes of threshold
- Clear UI feedback for sync vs resync operations
- No performance degradation from background worker
- User satisfaction with automatic summarization

## Future Enhancements

1. Configurable stale threshold per project
2. Email notifications for auto-ended sessions
3. Batch summarization for multiple stale sessions
4. Analytics dashboard showing auto-end vs manual-end ratio
5. Smart threshold adjustment based on user patterns
