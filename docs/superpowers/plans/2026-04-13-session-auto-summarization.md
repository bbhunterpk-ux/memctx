# Session Auto-Summarization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically detect and summarize stale sessions with enhanced UI controls for sync/resync operations

**Architecture:** Background worker checks for inactive sessions every 30 minutes, activity tracker updates last_activity on user interactions, enhanced UI shows dynamic Sync/Resync buttons based on summary state

**Tech Stack:** TypeScript, SQLite, Express.js, React, WebSocket

---

## File Structure

### Backend Files
- **Create:** `artifacts/claudectx-backup/src/services/stale-session-worker.ts` - Background worker for detecting stale sessions
- **Create:** `artifacts/claudectx-backup/src/services/activity-tracker.ts` - Activity tracking with debouncing
- **Modify:** `artifacts/claudectx-backup/src/db/schema.ts` - Add new columns to sessions table
- **Modify:** `artifacts/claudectx-backup/src/db/queries.ts` - Add queries for stale sessions and activity updates
- **Modify:** `artifacts/claudectx-backup/src/api/sessions.ts` - Add sync and activity endpoints
- **Modify:** `artifacts/claudectx-backup/src/hooks/post-tool-use.ts` - Integrate activity tracker
- **Modify:** `artifacts/claudectx-backup/bin/claudectx.ts` - Start background worker

### Frontend Files
- **Modify:** `artifacts/claudectx-backup/dashboard/src/components/SessionCard.tsx` - Fix isActive logic, add Sync/Resync button
- **Modify:** `artifacts/claudectx-backup/dashboard/src/pages/SessionDetail.tsx` - Replace resync button with dynamic Sync/Resync
- **Modify:** `artifacts/claudectx-backup/dashboard/src/api/client.ts` - Add syncSession API method

### Database Migration
- **Create:** `artifacts/claudectx-backup/src/db/migrations/003-session-activity.ts` - Migration for new columns

---

## Task 1: Database Schema Migration

**Files:**
- Create: `artifacts/claudectx-backup/src/db/migrations/003-session-activity.ts`
- Modify: `artifacts/claudectx-backup/src/db/schema.ts:1-77`

- [ ] **Step 1: Create migration file**

```typescript
export const migration_003 = `
-- Add activity tracking columns
ALTER TABLE sessions ADD COLUMN last_activity INTEGER;
ALTER TABLE sessions ADD COLUMN auto_ended INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN summary_requested_at INTEGER;

-- Create index for worker queries
CREATE INDEX IF NOT EXISTS idx_sessions_activity 
ON sessions(status, last_activity);

-- Backfill last_activity for existing sessions
UPDATE sessions 
SET last_activity = COALESCE(ended_at, started_at) 
WHERE last_activity IS NULL;
`
```

- [ ] **Step 2: Update schema.ts to include new fields**

Add after line 37 (after `summary_key_insight TEXT,`):

```typescript
  last_activity       INTEGER,
  auto_ended          INTEGER DEFAULT 0,
  summary_requested_at INTEGER,
```

Add after line 76 (before closing backtick):

```typescript
CREATE INDEX IF NOT EXISTS idx_sessions_activity 
ON sessions(status, last_activity);
```

- [ ] **Step 3: Run migration**

```bash
cd artifacts/claudectx-backup
pnpm run migrate
```

Expected: Migration runs successfully, new columns added

- [ ] **Step 4: Verify schema changes**

```bash
sqlite3 ~/.memctx/memctx.db ".schema sessions"
```

Expected: See `last_activity`, `auto_ended`, `summary_requested_at` columns and index

- [ ] **Step 5: Commit**

```bash
git add artifacts/claudectx-backup/src/db/migrations/003-session-activity.ts artifacts/claudectx-backup/src/db/schema.ts
git commit -m "feat: add session activity tracking columns

- Add last_activity, auto_ended, summary_requested_at to sessions table
- Create index on (status, last_activity) for worker queries
- Backfill last_activity from ended_at or started_at

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Add Database Queries

**Files:**
- Modify: `artifacts/claudectx-backup/src/db/queries.ts`

- [ ] **Step 1: Add getStaleSessions query**

Add after the existing query methods:

```typescript
getStaleSessions(staleThreshold: number) {
  return this.db.prepare(`
    SELECT * FROM sessions
    WHERE (status = 'active' OR status IS NULL)
    AND last_activity < ?
    AND transcript_path IS NOT NULL
  `).all(staleThreshold)
}
```

- [ ] **Step 2: Add updateSessionActivity query**

```typescript
updateSessionActivity(sessionId: string, timestamp: number) {
  this.db.prepare(`
    UPDATE sessions 
    SET last_activity = ? 
    WHERE id = ?
  `).run(timestamp, sessionId)
}
```

- [ ] **Step 3: Update updateSession to handle new fields**

Verify the existing `updateSession` method accepts `last_activity`, `auto_ended`, and `summary_requested_at` fields. No changes needed if it uses dynamic field mapping.

- [ ] **Step 4: Commit**

```bash
git add artifacts/claudectx-backup/src/db/queries.ts
git commit -m "feat: add queries for stale session detection and activity tracking

- Add getStaleSessions query for background worker
- Add updateSessionActivity for debounced activity updates

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create Activity Tracker Service

**Files:**
- Create: `artifacts/claudectx-backup/src/services/activity-tracker.ts`

- [ ] **Step 1: Create activity tracker class**

```typescript
import { queries } from '../db/queries'

export class ActivityTracker {
  private lastUpdate: Map<string, number> = new Map()
  private readonly DEBOUNCE_MS = 60 * 1000 // 1 minute

  updateActivity(sessionId: string) {
    const now = Date.now()
    const lastUpdate = this.lastUpdate.get(sessionId) || 0
    
    if (now - lastUpdate < this.DEBOUNCE_MS) {
      return // Skip if updated recently
    }

    try {
      queries.updateSessionActivity(sessionId, Math.floor(now / 1000))
      this.lastUpdate.set(sessionId, now)
    } catch (error) {
      console.error('[ActivityTracker] Failed to update activity:', error)
    }
  }

  // Clear old entries to prevent memory leak
  cleanup() {
    const now = Date.now()
    const threshold = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [sessionId, timestamp] of this.lastUpdate.entries()) {
      if (now - timestamp > threshold) {
        this.lastUpdate.delete(sessionId)
      }
    }
  }
}

export const activityTracker = new ActivityTracker()

// Run cleanup every hour
setInterval(() => activityTracker.cleanup(), 60 * 60 * 1000)
```

- [ ] **Step 2: Verify imports and exports**

Check that the file compiles:

```bash
cd artifacts/claudectx-backup
pnpm run build:worker
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add artifacts/claudectx-backup/src/services/activity-tracker.ts
git commit -m "feat: add activity tracker service with debouncing

- Debounce activity updates to max 1 per minute per session
- Add cleanup to prevent memory leaks
- Export singleton instance for global use

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Create Stale Session Worker

**Files:**
- Create: `artifacts/claudectx-backup/src/services/stale-session-worker.ts`

- [ ] **Step 1: Create worker class**

```typescript
import { queries } from '../db/queries'
import { summarizationQueue } from './summarization-queue'
import { broadcast } from '../ws/broadcast'
import { logger } from './logger'

export class StaleSessionWorker {
  private intervalId: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes
  private readonly STALE_THRESHOLD = 8 * 60 * 60 // 8 hours
  private isRunning = false

  start() {
    if (this.isRunning) {
      console.log('[StaleSessionWorker] Already running')
      return
    }

    this.isRunning = true
    console.log('[StaleSessionWorker] Starting worker')
    
    // Run immediately on start
    this.checkStaleSessions()
    
    // Then run every CHECK_INTERVAL
    this.intervalId = setInterval(() => this.checkStaleSessions(), this.CHECK_INTERVAL)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('[StaleSessionWorker] Stopped')
  }

  private async checkStaleSessions() {
    try {
      const now = Math.floor(Date.now() / 1000)
      const staleThreshold = now - this.STALE_THRESHOLD
      
      console.log(`[StaleSessionWorker] Checking for stale sessions (threshold: ${new Date(staleThreshold * 1000).toISOString()})`)
      
      const staleSessions = queries.getStaleSessions(staleThreshold)
      
      if (staleSessions.length === 0) {
        console.log('[StaleSessionWorker] No stale sessions found')
        return
      }

      console.log(`[StaleSessionWorker] Found ${staleSessions.length} stale sessions`)
      
      for (const session of staleSessions) {
        await this.endStaleSession(session)
      }
    } catch (error: any) {
      logger.error('StaleSessionWorker', 'Check failed', { error: error.message })
      console.error('[StaleSessionWorker] Error:', error)
    }
  }

  private async endStaleSession(session: any) {
    try {
      console.log(`[StaleSessionWorker] Auto-ending session ${session.id.slice(0, 8)}`)
      
      // Mark as completed and auto-ended
      queries.updateSession(session.id, {
        status: 'completed',
        ended_at: session.last_activity || Math.floor(Date.now() / 1000),
        auto_ended: 1
      })

      // Queue for summarization
      if (session.transcript_path) {
        console.log(`[StaleSessionWorker] Queuing summarization for ${session.id.slice(0, 8)}`)
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

      logger.info('StaleSessionWorker', `Auto-ended session ${session.id}`, {
        last_activity: session.last_activity,
        project_id: session.project_id
      })
    } catch (error: any) {
      logger.error('StaleSessionWorker', `Failed to end session ${session.id}`, { error: error.message })
      console.error(`[StaleSessionWorker] Failed to end session ${session.id}:`, error)
    }
  }
}

export const staleSessionWorker = new StaleSessionWorker()
```

- [ ] **Step 2: Verify imports and build**

```bash
cd artifacts/claudectx-backup
pnpm run build:worker
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add artifacts/claudectx-backup/src/services/stale-session-worker.ts
git commit -m "feat: add stale session worker for auto-summarization

- Check for stale sessions every 30 minutes
- Auto-end sessions inactive for 8+ hours
- Queue for summarization with normal priority
- Broadcast WebSocket events for UI updates

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add API Endpoints for Sync and Activity

**Files:**
- Modify: `artifacts/claudectx-backup/src/api/sessions.ts`

- [ ] **Step 1: Import required dependencies**

Add to imports at top of file:

```typescript
import { activityTracker } from '../services/activity-tracker'
```

- [ ] **Step 2: Add sync endpoint**

Add before the export statement:

```typescript
// POST /api/sessions/:id/sync
router.post('/:id/sync', async (req, res) => {
  try {
    const sessionId = req.params.id as string
    const session = queries.getSession(sessionId)
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      })
    }

    if (!session.transcript_path) {
      return res.status(400).json({ 
        success: false,
        error: 'No transcript available' 
      })
    }

    // Update summary_requested_at
    queries.updateSession(session.id, {
      summary_requested_at: Math.floor(Date.now() / 1000)
    })

    // Queue for summarization with high priority
    summarizationQueue.enqueue({
      sessionId: session.id,
      transcriptPath: session.transcript_path,
      projectId: session.project_id,
      priority: 'high'
    })

    res.json({ 
      success: true, 
      message: 'Queued for summarization' 
    })
  } catch (error: any) {
    logger.error('Sessions', 'Sync failed', { error: error.message })
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})
```

- [ ] **Step 3: Add activity tracking endpoint**

```typescript
// POST /api/sessions/:id/activity
router.post('/:id/activity', async (req, res) => {
  try {
    const sessionId = req.params.id as string
    activityTracker.updateActivity(sessionId)
    res.json({ success: true })
  } catch (error: any) {
    logger.error('Sessions', 'Activity update failed', { error: error.message })
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})
```

- [ ] **Step 4: Verify build**

```bash
cd artifacts/claudectx-backup
pnpm run build:worker
```

Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add artifacts/claudectx-backup/src/api/sessions.ts
git commit -m "feat: add sync and activity tracking API endpoints

- POST /api/sessions/:id/sync for manual summarization
- POST /api/sessions/:id/activity for activity tracking
- High priority queue for user-requested syncs

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Integrate Activity Tracker into Hooks

**Files:**
- Modify: `artifacts/claudectx-backup/src/hooks/post-tool-use.ts`

- [ ] **Step 1: Import activity tracker**

Add to imports at top of file:

```typescript
import { activityTracker } from '../services/activity-tracker'
```

- [ ] **Step 2: Add activity tracking to hook**

Add at the end of the `postToolUseHook` function (before the closing brace):

```typescript
  // Track session activity
  if (event.session_id) {
    activityTracker.updateActivity(event.session_id)
  }
```

- [ ] **Step 3: Verify build**

```bash
cd artifacts/claudectx-backup
pnpm run build:worker
```

Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add artifacts/claudectx-backup/src/hooks/post-tool-use.ts
git commit -m "feat: integrate activity tracker into post-tool-use hook

- Update last_activity on every tool use
- Debounced to prevent excessive database writes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Start Worker in Main Entry Point

**Files:**
- Modify: `artifacts/claudectx-backup/bin/claudectx.ts`

- [ ] **Step 1: Import stale session worker**

Add to imports at top of file:

```typescript
import { staleSessionWorker } from '../src/services/stale-session-worker'
```

- [ ] **Step 2: Start worker after server starts**

Find where the server starts (likely after `app.listen()` or similar), and add:

```typescript
// Start stale session worker
staleSessionWorker.start()
console.log('[Worker] Stale session worker started')
```

- [ ] **Step 3: Stop worker on process exit**

Add process handlers:

```typescript
process.on('SIGINT', () => {
  console.log('[Worker] Stopping stale session worker...')
  staleSessionWorker.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('[Worker] Stopping stale session worker...')
  staleSessionWorker.stop()
  process.exit(0)
})
```

- [ ] **Step 4: Test worker starts**

```bash
cd artifacts/claudectx-backup
pnpm run build:worker
pnpm run start:worker
```

Expected: See "[Worker] Stale session worker started" in logs

- [ ] **Step 5: Stop and commit**

```bash
# Stop the worker (Ctrl+C)
git add artifacts/claudectx-backup/bin/claudectx.ts
git commit -m "feat: start stale session worker on server startup

- Start worker after server initialization
- Graceful shutdown on SIGINT/SIGTERM
- Log worker lifecycle events

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Add syncSession to Frontend API Client

**Files:**
- Modify: `artifacts/claudectx-backup/dashboard/src/api/client.ts`

- [ ] **Step 1: Add syncSession method**

Add after the `resyncSession` method (around line 40):

```typescript
syncSession: (sessionId: string) => apiFetch(`/api/sessions/${sessionId}/sync`, { method: 'POST' }),
```

- [ ] **Step 2: Add updateSessionActivity method**

```typescript
updateSessionActivity: (sessionId: string) => apiFetch(`/api/sessions/${sessionId}/activity`, { method: 'POST' }),
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd artifacts/claudectx-backup/dashboard
pnpm run build
```

Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add artifacts/claudectx-backup/dashboard/src/api/client.ts
git commit -m "feat: add syncSession and updateSessionActivity API methods

- Add syncSession for manual summarization trigger
- Add updateSessionActivity for tracking page views

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Fix SessionCard isActive Logic and Add Sync Button

**Files:**
- Modify: `artifacts/claudectx-backup/dashboard/src/components/SessionCard.tsx:56-58`
- Modify: `artifacts/claudectx-backup/dashboard/src/components/SessionCard.tsx:313-346`

- [ ] **Step 1: Fix isActive detection logic**

Replace lines 56-58:

```typescript
const isActive = session.status === 'active' || 
                 !session.status || 
                 (session.summary_status && session.summary_status.toLowerCase() === 'in_progress')
```

- [ ] **Step 2: Add state for sync button**

Add after line 39 (after `const [archiving, setArchiving] = useState(false)`):

```typescript
const [syncing, setSyncing] = useState(false)
```

- [ ] **Step 3: Add hasSummary check**

Add after the `isActive` constant:

```typescript
const hasSummary = !!session.summary_title
```

- [ ] **Step 4: Add handleSyncSummary function**

Add after the `handleToggleArchive` function (around line 122):

```typescript
const handleSyncSummary = async (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  setSyncing(true)
  const toastId = toast.loading(hasSummary ? 'Resyncing summary...' : 'Syncing summary...')
  try {
    if (hasSummary) {
      await api.resyncSession(session.id)
    } else {
      await api.syncSession(session.id)
    }
    toast.dismiss(toastId)
    toast.success('Session queued for summarization')
    if (onSessionUpdated) {
      setTimeout(() => onSessionUpdated(), 2000)
    }
  } catch (error) {
    toast.dismiss(toastId)
    toast.error('Failed to sync: ' + error)
  } finally {
    setSyncing(false)
  }
}
```

- [ ] **Step 5: Add Sync/Resync button in UI**

Add after the Force End button (after line 346, before the delete button):

```typescript
<button
  onClick={handleSyncSummary}
  disabled={syncing || !session.transcript_path}
  title={hasSummary ? 'Resync summary' : 'Sync summary'}
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
    cursor: syncing || !session.transcript_path ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s',
    opacity: !session.transcript_path ? 0.5 : 1,
  }}
  onMouseEnter={e => {
    if (!syncing && session.transcript_path) {
      (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)25'
    }
  }}
  onMouseLeave={e => {
    if (!syncing) {
      (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)15'
    }
  }}
>
  <RefreshCw size={12} />
  {syncing ? 'Syncing...' : (hasSummary ? 'Resync' : 'Sync')}
</button>
```

- [ ] **Step 6: Add RefreshCw import**

Add to imports at top of file (line 3):

```typescript
import { Clock, FileText, Wrench, Lightbulb, AlertCircle, Smile, Frown, Meh, Zap, CheckCircle, Trash2, Star, Archive, ArchiveRestore, RefreshCw } from 'lucide-react'
```

- [ ] **Step 7: Test in browser**

```bash
cd artifacts/claudectx-backup/dashboard
pnpm run dev
```

Open http://localhost:5173 and verify:
- Force End button shows for active sessions (even with null status)
- Sync button shows "Sync" for sessions without summary
- Sync button shows "Resync" for sessions with summary
- Button is disabled when no transcript_path

- [ ] **Step 8: Commit**

```bash
git add artifacts/claudectx-backup/dashboard/src/components/SessionCard.tsx
git commit -m "feat: fix isActive logic and add Sync/Resync button to SessionCard

- Fix isActive to handle null/missing status
- Add dynamic Sync/Resync button based on summary state
- Disable button when no transcript available
- Show loading state during sync operation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Update SessionDetail with Sync/Resync Button

**Files:**
- Modify: `artifacts/claudectx-backup/dashboard/src/pages/SessionDetail.tsx`

- [ ] **Step 1: Add syncing state**

Add after line 113 (after `const [notesModalOpen, setNotesModalOpen] = useState(false)`):

```typescript
const [syncing, setSyncing] = useState(false)
```

- [ ] **Step 2: Update handleResync to be handleSyncSummary**

Replace the `handleResync` function (lines 160-175) with:

```typescript
const handleSyncSummary = async () => {
  if (!id) return
  const hasSummary = !!session?.summary_title
  setSyncing(true)
  const toastId = toast.loading(hasSummary ? 'Resyncing summary...' : 'Syncing summary...')
  try {
    if (hasSummary) {
      await api.resyncSession(id)
    } else {
      await api.syncSession(id)
    }
    toast.dismiss(toastId)
    toast.success('Session queued for summarization')
    setTimeout(() => refetch(), 2000)
  } catch (error) {
    toast.dismiss(toastId)
    toast.error('Failed to sync: ' + error)
  } finally {
    setSyncing(false)
  }
}
```

- [ ] **Step 3: Track activity on page view**

Add after the WebSocket useEffect (around line 158):

```typescript
// Track activity when viewing session detail
useEffect(() => {
  if (id) {
    api.updateSessionActivity(id).catch(err => {
      console.error('Failed to update activity:', err)
    })
  }
}, [id])
```

- [ ] **Step 4: Find and update the Resync button**

Search for the existing resync button in the file and replace it with:

```typescript
<button
  onClick={handleSyncSummary}
  disabled={syncing || !session.transcript_path}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: syncing ? 'var(--surface)' : 'var(--blue)15',
    color: syncing ? 'var(--text-muted)' : 'var(--blue)',
    border: '1px solid',
    borderColor: syncing ? 'var(--border)' : 'var(--blue)30',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: syncing || !session.transcript_path ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s',
    opacity: !session.transcript_path ? 0.5 : 1,
  }}
  onMouseEnter={e => {
    if (!syncing && session.transcript_path) {
      (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)25'
    }
  }}
  onMouseLeave={e => {
    if (!syncing) {
      (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)15'
    }
  }}
>
  <RefreshCw size={14} />
  {syncing ? 'Processing...' : (hasSummary ? 'Resync Summary' : 'Sync Summary')}
</button>
```

- [ ] **Step 5: Update resyncing variable references**

Replace any remaining `resyncing` variable references with `syncing` (search for `resyncing` in the file)

- [ ] **Step 6: Test in browser**

```bash
cd artifacts/claudectx-backup/dashboard
pnpm run dev
```

Open a session detail page and verify:
- Button shows "Sync Summary" when no summary exists
- Button shows "Resync Summary" when summary exists
- Activity is tracked when viewing the page
- Button works correctly

- [ ] **Step 7: Commit**

```bash
git add artifacts/claudectx-backup/dashboard/src/pages/SessionDetail.tsx
git commit -m "feat: add dynamic Sync/Resync button to SessionDetail

- Replace static resync with dynamic Sync/Resync based on summary state
- Track activity when viewing session detail page
- Disable button when no transcript available
- Update button labels and loading states

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: End-to-End Testing

**Files:**
- Test all components together

- [ ] **Step 1: Restart worker with fresh build**

```bash
cd artifacts/claudectx-backup
pnpm run build:worker
pnpm run start:worker
```

Expected: See "[Worker] Stale session worker started" in logs

- [ ] **Step 2: Start dashboard**

```bash
cd artifacts/claudectx-backup/dashboard
pnpm run dev
```

Expected: Dashboard runs on http://localhost:5173

- [ ] **Step 3: Test Force End button visibility**

1. Open dashboard
2. Find an active session (or create one)
3. Verify Force End button is visible
4. Verify Force End button shows even for sessions with null status

Expected: Force End button always visible for active sessions

- [ ] **Step 4: Test Sync Summary button**

1. Find a session without a summary
2. Verify button shows "Sync"
3. Click the button
4. Verify toast shows "Syncing summary..."
5. Wait for summarization to complete
6. Verify button now shows "Resync"

Expected: Button label changes based on summary state

- [ ] **Step 5: Test Resync Summary button**

1. Find a session with an existing summary
2. Verify button shows "Resync"
3. Click the button
4. Verify toast shows "Resyncing summary..."
5. Wait for summarization to complete

Expected: Summary regenerates successfully

- [ ] **Step 6: Test activity tracking**

1. Open a session detail page
2. Check database: `sqlite3 ~/.memctx/memctx.db "SELECT id, last_activity FROM sessions WHERE id = '<session-id>'"`
3. Verify last_activity is updated

Expected: last_activity timestamp is recent

- [ ] **Step 7: Test stale session detection (optional - requires time manipulation)**

Option A: Wait 8 hours (not practical)
Option B: Modify STALE_THRESHOLD in stale-session-worker.ts to 60 seconds for testing:

```typescript
private readonly STALE_THRESHOLD = 60 // 60 seconds for testing
```

Then:
1. Create a test session
2. Wait 60 seconds
3. Check logs for "[StaleSessionWorker] Found X stale sessions"
4. Verify session is auto-ended and queued for summarization
5. Restore STALE_THRESHOLD to 8 * 60 * 60

Expected: Stale sessions are detected and auto-ended

- [ ] **Step 8: Verify no errors in logs**

Check both worker and dashboard logs for errors

Expected: No errors or warnings

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "test: verify end-to-end session auto-summarization flow

- Tested Force End button visibility for active sessions
- Tested Sync/Resync button functionality
- Verified activity tracking on page views
- Confirmed stale session detection works

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Documentation and Cleanup

**Files:**
- Create: `docs/features/session-auto-summarization.md`

- [ ] **Step 1: Create feature documentation**

```markdown
# Session Auto-Summarization

## Overview

Automatically detects and summarizes stale sessions that have been inactive for 8+ hours.

## Features

### 1. Background Worker
- Runs every 30 minutes
- Detects sessions inactive for 8+ hours
- Auto-ends and queues for summarization
- Broadcasts WebSocket events for UI updates

### 2. Activity Tracking
- Updates `last_activity` on tool use
- Updates on session detail page views
- Debounced to max 1 update per minute per session

### 3. Enhanced UI
- Force End button always visible for active sessions
- Dynamic Sync/Resync buttons based on summary state
- Available on both SessionCard and SessionDetail

## Configuration

Settings stored in database:
- `stale_session_threshold_hours` - Default: 8
- `worker_check_interval_minutes` - Default: 30

## Database Schema

New columns in `sessions` table:
- `last_activity` - Unix timestamp of last interaction
- `auto_ended` - Boolean flag (1 = auto-ended, 0 = manual)
- `summary_requested_at` - Unix timestamp of manual sync request

## API Endpoints

- `POST /api/sessions/:id/sync` - Trigger summarization
- `POST /api/sessions/:id/activity` - Update activity timestamp

## Troubleshooting

### Worker not running
Check logs for "[Worker] Stale session worker started"

### Sessions not auto-ending
1. Verify `last_activity` is being updated
2. Check worker logs for errors
3. Verify sessions meet criteria (status=active, last_activity > 8h, has transcript)

### Sync button not working
1. Verify session has transcript_path
2. Check API logs for errors
3. Verify summarization queue is processing
```

- [ ] **Step 2: Update main README**

Add to README.md features section:

```markdown
### Session Auto-Summarization
- Automatically detects and summarizes stale sessions (8+ hours inactive)
- Manual Sync/Resync buttons for on-demand summarization
- Activity tracking to distinguish active vs abandoned sessions
```

- [ ] **Step 3: Commit documentation**

```bash
git add docs/features/session-auto-summarization.md README.md
git commit -m "docs: add session auto-summarization feature documentation

- Document background worker behavior
- Explain activity tracking mechanism
- List API endpoints and configuration options
- Add troubleshooting guide

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Plan Complete

All tasks defined. Ready for execution.

**Execution Options:**

1. **Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session, batch execution with checkpoints
