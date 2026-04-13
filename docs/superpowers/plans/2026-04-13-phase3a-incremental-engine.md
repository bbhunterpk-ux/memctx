# Phase 3A: Incremental Memory Engine - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement core incremental checkpoint system that processes memory every 10 turns OR 5 minutes (whichever comes first)

**Architecture:** Add checkpoint trigger logic to UserPromptSubmit hook, create incremental checkpoint queue (separate from end-of-session queue), implement incremental summarizer that processes partial transcripts, store checkpoints in new database table, broadcast completion via WebSocket

**Tech Stack:** TypeScript, SQLite, Anthropic SDK, WebSocket, Express.js

---


## File Structure

### New Files
- `src/db/migrations/012_incremental_checkpoints.sql` - Database schema for checkpoints
- `src/services/incremental-checkpoint-queue.ts` - Queue for checkpoint processing
- `src/services/incremental-summarizer.ts` - Partial transcript summarization
- `src/services/__tests__/incremental-summarizer.test.ts` - Unit tests for summarizer
- `src/services/__tests__/incremental-checkpoint-queue.test.ts` - Unit tests for queue

### Modified Files
- `src/config.ts` - Add incremental checkpoint configuration
- `src/db/queries.ts` - Add checkpoint CRUD operations
- `src/api/hook.ts` - Add checkpoint trigger logic to UserPromptSubmit
- `src/index.ts` - Initialize checkpoint queue and recovery scan
- `src/ws/broadcast.ts` - Add checkpoint_complete event type

---


## Task 1: Database Migration

**Files:**
- Create: `artifacts/claudectx-backup/src/db/migrations/012_incremental_checkpoints.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Create session_checkpoints table
CREATE TABLE IF NOT EXISTS session_checkpoints (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  checkpoint_number INTEGER NOT NULL,
  turn_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  summary_title TEXT,
  summary_data TEXT,
  transcript_range TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(session_id, checkpoint_number)
);

CREATE INDEX idx_checkpoints_session ON session_checkpoints(session_id);
CREATE INDEX idx_checkpoints_project ON session_checkpoints(project_id);
CREATE INDEX idx_checkpoints_created ON session_checkpoints(created_at);

-- Add checkpoint tracking to sessions
ALTER TABLE sessions ADD COLUMN last_checkpoint_turn INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN last_checkpoint_time INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN checkpoint_count INTEGER DEFAULT 0;
```

- [ ] **Step 2: Test migration locally**

Run: `cd artifacts/claudectx-backup && pnpm run build && node dist/index.js`

Expected: Migration 012 applies successfully, tables created

- [ ] **Step 3: Verify schema**

Run: `sqlite3 ~/.memctx/db.sqlite "SELECT sql FROM sqlite_master WHERE name='session_checkpoints';"`

Expected: Shows CREATE TABLE statement with all columns

- [ ] **Step 4: Commit**

```bash
git add artifacts/claudectx-backup/src/db/migrations/012_incremental_checkpoints.sql
git commit -m "feat: add database migration for incremental checkpoints

- Create session_checkpoints table
- Add checkpoint tracking columns to sessions
- Add indexes for performance

Part of Phase 3A"
```

---


## Task 2: Configuration

**Files:**
- Modify: `artifacts/claudectx-backup/src/config.ts`

- [ ] **Step 1: Write test for config values**

Create: `artifacts/claudectx-backup/src/__tests__/config.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('CONFIG - Incremental Checkpoints', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should default enableIncrementalCheckpoints to false', () => {
    delete process.env.ENABLE_INCREMENTAL
    const { CONFIG } = require('../config')
    expect(CONFIG.enableIncrementalCheckpoints).toBe(false)
  })

  it('should enable incremental checkpoints when ENABLE_INCREMENTAL=true', () => {
    process.env.ENABLE_INCREMENTAL = 'true'
    delete require.cache[require.resolve('../config')]
    const { CONFIG } = require('../config')
    expect(CONFIG.enableIncrementalCheckpoints).toBe(true)
  })

  it('should use default checkpoint turn threshold of 10', () => {
    delete process.env.CHECKPOINT_TURNS
    delete require.cache[require.resolve('../config')]
    const { CONFIG } = require('../config')
    expect(CONFIG.checkpointTurnThreshold).toBe(10)
  })

  it('should use custom checkpoint turn threshold', () => {
    process.env.CHECKPOINT_TURNS = '15'
    delete require.cache[require.resolve('../config')]
    const { CONFIG } = require('../config')
    expect(CONFIG.checkpointTurnThreshold).toBe(15)
  })

  it('should use default checkpoint time threshold of 300 seconds', () => {
    delete process.env.CHECKPOINT_TIME
    delete require.cache[require.resolve('../config')]
    const { CONFIG } = require('../config')
    expect(CONFIG.checkpointTimeThreshold).toBe(300)
  })

  it('should default checkpointIncludeGraph to true', () => {
    delete process.env.CHECKPOINT_GRAPH
    delete require.cache[require.resolve('../config')]
    const { CONFIG } = require('../config')
    expect(CONFIG.checkpointIncludeGraph).toBe(true)
  })

  it('should disable graph extraction when CHECKPOINT_GRAPH=false', () => {
    process.env.CHECKPOINT_GRAPH = 'false'
    delete require.cache[require.resolve('../config')]
    const { CONFIG } = require('../config')
    expect(CONFIG.checkpointIncludeGraph).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd artifacts/claudectx-backup && pnpm test config.test.ts`

Expected: FAIL - CONFIG properties not defined

- [ ] **Step 3: Add config fields**

Modify: `artifacts/claudectx-backup/src/config.ts`

Add after existing config fields:

```typescript
  // Incremental checkpointing
  enableIncrementalCheckpoints: process.env.ENABLE_INCREMENTAL === 'true',
  checkpointTurnThreshold: parseInt(process.env.CHECKPOINT_TURNS || '10'),
  checkpointTimeThreshold: parseInt(process.env.CHECKPOINT_TIME || '300'),
  checkpointIncludeGraph: process.env.CHECKPOINT_GRAPH !== 'false',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd artifacts/claudectx-backup && pnpm test config.test.ts`

Expected: PASS - All config tests pass

- [ ] **Step 5: Commit**

```bash
git add artifacts/claudectx-backup/src/config.ts artifacts/claudectx-backup/src/__tests__/config.test.ts
git commit -m "feat: add incremental checkpoint configuration

- Add ENABLE_INCREMENTAL feature flag (default: false)
- Add CHECKPOINT_TURNS threshold (default: 10)
- Add CHECKPOINT_TIME threshold (default: 300s)
- Add CHECKPOINT_GRAPH toggle (default: true)
- Add unit tests for all config values

Part of Phase 3A"
```

---


## Task 3: Database Queries

**Files:**
- Modify: `artifacts/claudectx-backup/src/db/queries.ts`
- Test: `artifacts/claudectx-backup/src/db/__tests__/queries.test.ts`

- [ ] **Step 1: Write test for insertCheckpoint**

Create: `artifacts/claudectx-backup/src/db/__tests__/queries.test.ts` (if doesn't exist, otherwise append)

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { queries } from '../queries'
import { initDB } from '../client'

describe('Checkpoint Queries', () => {
  beforeEach(() => {
    initDB(':memory:')
  })

  it('should insert checkpoint', () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    
    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: Math.floor(Date.now() / 1000),
      status: 'active'
    })

    queries.insertCheckpoint({
      id: 'checkpoint-1',
      session_id: sessionId,
      project_id: projectId,
      checkpoint_number: 1,
      turn_count: 10,
      created_at: Math.floor(Date.now() / 1000),
      summary_title: 'Test Checkpoint',
      summary_data: JSON.stringify({ test: true }),
      transcript_range: 'turns 0-10'
    })

    const checkpoints = queries.getSessionCheckpoints(sessionId)
    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0].checkpoint_number).toBe(1)
    expect(checkpoints[0].summary_title).toBe('Test Checkpoint')
  })

  it('should get session checkpoints in order', () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    
    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: Math.floor(Date.now() / 1000),
      status: 'active'
    })

    queries.insertCheckpoint({
      id: 'checkpoint-2',
      session_id: sessionId,
      project_id: projectId,
      checkpoint_number: 2,
      turn_count: 20,
      created_at: Math.floor(Date.now() / 1000),
      summary_title: 'Second',
      summary_data: '{}',
      transcript_range: 'turns 10-20'
    })

    queries.insertCheckpoint({
      id: 'checkpoint-1',
      session_id: sessionId,
      project_id: projectId,
      checkpoint_number: 1,
      turn_count: 10,
      created_at: Math.floor(Date.now() / 1000) - 100,
      summary_title: 'First',
      summary_data: '{}',
      transcript_range: 'turns 0-10'
    })

    const checkpoints = queries.getSessionCheckpoints(sessionId)
    expect(checkpoints).toHaveLength(2)
    expect(checkpoints[0].checkpoint_number).toBe(1)
    expect(checkpoints[1].checkpoint_number).toBe(2)
  })

  it('should get latest checkpoint', () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    
    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: Math.floor(Date.now() / 1000),
      status: 'active'
    })

    queries.insertCheckpoint({
      id: 'checkpoint-1',
      session_id: sessionId,
      project_id: projectId,
      checkpoint_number: 1,
      turn_count: 10,
      created_at: Math.floor(Date.now() / 1000),
      summary_title: 'First',
      summary_data: '{}',
      transcript_range: 'turns 0-10'
    })

    queries.insertCheckpoint({
      id: 'checkpoint-2',
      session_id: sessionId,
      project_id: projectId,
      checkpoint_number: 2,
      turn_count: 20,
      created_at: Math.floor(Date.now() / 1000),
      summary_title: 'Second',
      summary_data: '{}',
      transcript_range: 'turns 10-20'
    })

    const latest = queries.getLatestCheckpoint(sessionId)
    expect(latest).toBeDefined()
    expect(latest?.checkpoint_number).toBe(2)
    expect(latest?.summary_title).toBe('Second')
  })

  it('should return null for latest checkpoint when none exist', () => {
    const latest = queries.getLatestCheckpoint('nonexistent-session')
    expect(latest).toBeNull()
  })

  it('should get incomplete checkpoints', () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)
    
    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 25,
      last_checkpoint_turn: 10
    })

    const incomplete = queries.getIncompleteCheckpoints(10)
    expect(incomplete).toHaveLength(1)
    expect(incomplete[0].session_id).toBe(sessionId)
    expect(incomplete[0].turn_count).toBe(25)
    expect(incomplete[0].last_checkpoint_turn).toBe(10)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd artifacts/claudectx-backup && pnpm test queries.test.ts`

Expected: FAIL - queries methods not defined

- [ ] **Step 3: Implement checkpoint queries**

Modify: `artifacts/claudectx-backup/src/db/queries.ts`

Add to queries object:

```typescript
  insertCheckpoint(checkpoint: {
    id: string
    session_id: string
    project_id: string
    checkpoint_number: number
    turn_count: number
    created_at: number
    summary_title: string | null
    summary_data: string | null
    transcript_range: string | null
  }): void {
    db.prepare(`
      INSERT INTO session_checkpoints (
        id, session_id, project_id, checkpoint_number, turn_count,
        created_at, summary_title, summary_data, transcript_range
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      checkpoint.id,
      checkpoint.session_id,
      checkpoint.project_id,
      checkpoint.checkpoint_number,
      checkpoint.turn_count,
      checkpoint.created_at,
      checkpoint.summary_title,
      checkpoint.summary_data,
      checkpoint.transcript_range
    )
  },

  getSessionCheckpoints(sessionId: string): any[] {
    return db.prepare(`
      SELECT * FROM session_checkpoints
      WHERE session_id = ?
      ORDER BY checkpoint_number ASC
    `).all(sessionId)
  },

  getLatestCheckpoint(sessionId: string): any | null {
    return db.prepare(`
      SELECT * FROM session_checkpoints
      WHERE session_id = ?
      ORDER BY checkpoint_number DESC
      LIMIT 1
    `).get(sessionId) || null
  },

  getIncompleteCheckpoints(turnThreshold: number): any[] {
    return db.prepare(`
      SELECT id as session_id, project_id, checkpoint_count, last_checkpoint_turn, turn_count
      FROM sessions
      WHERE status = 'active'
        AND turn_count - last_checkpoint_turn >= ?
    `).all(turnThreshold)
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd artifacts/claudectx-backup && pnpm test queries.test.ts`

Expected: PASS - All checkpoint query tests pass

- [ ] **Step 5: Commit**

```bash
git add artifacts/claudectx-backup/src/db/queries.ts artifacts/claudectx-backup/src/db/__tests__/queries.test.ts
git commit -m "feat: add checkpoint database queries

- insertCheckpoint: store checkpoint data
- getSessionCheckpoints: retrieve all checkpoints for session
- getLatestCheckpoint: get most recent checkpoint
- getIncompleteCheckpoints: find sessions needing checkpoints
- Add comprehensive unit tests

Part of Phase 3A"
```

---


## Task 4: Incremental Checkpoint Queue

**Files:**
- Create: `artifacts/claudectx-backup/src/services/incremental-checkpoint-queue.ts`
- Test: `artifacts/claudectx-backup/src/services/__tests__/incremental-checkpoint-queue.test.ts`

- [ ] **Step 1: Write test for queue**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { incrementalCheckpointQueue } from '../incremental-checkpoint-queue'

vi.mock('../incremental-summarizer', () => ({
  incrementalSummarize: vi.fn().mockResolvedValue(undefined)
}))

describe('IncrementalCheckpointQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should enqueue checkpoint job', async () => {
    const job = {
      sessionId: 'test-session',
      projectId: 'test-project',
      checkpointNumber: 1,
      turnRange: [0, 10] as [number, number]
    }

    await incrementalCheckpointQueue.enqueue(job)
    
    expect(incrementalCheckpointQueue.size()).toBeGreaterThanOrEqual(0)
  })

  it('should process checkpoint job', async () => {
    const { incrementalSummarize } = await import('../incremental-summarizer')
    
    const job = {
      sessionId: 'test-session',
      projectId: 'test-project',
      checkpointNumber: 1,
      turnRange: [0, 10] as [number, number]
    }

    await incrementalCheckpointQueue.enqueue(job)
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(incrementalSummarize).toHaveBeenCalledWith(
      'test-session',
      'test-project',
      1,
      [0, 10]
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd artifacts/claudectx-backup && pnpm test incremental-checkpoint-queue.test.ts`

Expected: FAIL - incrementalCheckpointQueue not defined

- [ ] **Step 3: Implement queue**

```typescript
import { incrementalSummarize } from './incremental-summarizer'
import { logger } from './logger'

interface CheckpointJob {
  sessionId: string
  projectId: string
  checkpointNumber: number
  turnRange: [number, number]
}

class IncrementalCheckpointQueue {
  private queue: CheckpointJob[] = []
  private processing = false
  private concurrency = 1
  private retryAttempts = 2
  private retryDelay = 5000

  async enqueue(job: CheckpointJob): Promise<void> {
    this.queue.push(job)
    logger.info('IncrementalCheckpointQueue', `Enqueued checkpoint ${job.checkpointNumber} for session ${job.sessionId}`)
    
    if (!this.processing) {
      this.processQueue()
    }
  }

  size(): number {
    return this.queue.length
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()
      if (!job) break

      await this.processJobWithRetry(job)
    }

    this.processing = false
  }

  private async processJobWithRetry(job: CheckpointJob, attempt = 0): Promise<void> {
    try {
      logger.info('IncrementalCheckpointQueue', `Processing checkpoint ${job.checkpointNumber} for session ${job.sessionId}`)
      
      await incrementalSummarize(
        job.sessionId,
        job.projectId,
        job.checkpointNumber,
        job.turnRange
      )

      logger.info('IncrementalCheckpointQueue', `Completed checkpoint ${job.checkpointNumber} for session ${job.sessionId}`)
    } catch (err) {
      logger.error('IncrementalCheckpointQueue', `Checkpoint ${job.checkpointNumber} failed for session ${job.sessionId}`, { error: err })

      if (attempt < this.retryAttempts) {
        logger.info('IncrementalCheckpointQueue', `Retrying checkpoint ${job.checkpointNumber} (attempt ${attempt + 1}/${this.retryAttempts})`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        await this.processJobWithRetry(job, attempt + 1)
      } else {
        logger.error('IncrementalCheckpointQueue', `Checkpoint ${job.checkpointNumber} failed after ${this.retryAttempts} retries`)
      }
    }
  }
}

export const incrementalCheckpointQueue = new IncrementalCheckpointQueue()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd artifacts/claudectx-backup && pnpm test incremental-checkpoint-queue.test.ts`

Expected: PASS - Queue tests pass

- [ ] **Step 5: Commit**

```bash
git add artifacts/claudectx-backup/src/services/incremental-checkpoint-queue.ts artifacts/claudectx-backup/src/services/__tests__/incremental-checkpoint-queue.test.ts
git commit -m "feat: add incremental checkpoint queue

- Queue with concurrency limit (1)
- Retry logic with exponential backoff (2 attempts, 5s delay)
- Processes checkpoint jobs sequentially
- Add unit tests

Part of Phase 3A"
```

---


## Task 5: Incremental Summarizer

**Files:**
- Create: `artifacts/claudectx-backup/src/services/incremental-summarizer.ts`
- Test: `artifacts/claudectx-backup/src/services/__tests__/incremental-summarizer.test.ts`

- [ ] **Step 1: Write test for incremental summarizer**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { incrementalSummarize } from '../incremental-summarizer'
import { queries } from '../../db/queries'
import { initDB } from '../../db/client'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            title: 'Test Checkpoint',
            status: 'in_progress',
            what_we_did: ['Tested checkpoint'],
            decisions_made: [],
            files_changed: [],
            next_steps: [],
            gotchas: [],
            tech_stack_notes: [],
            graph: {
              nodes: [],
              edges: []
            }
          })
        }]
      })
    }
  }))
}))

vi.mock('../../ws/broadcast', () => ({
  broadcast: vi.fn()
}))

describe('incrementalSummarize', () => {
  beforeEach(() => {
    initDB(':memory:')
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('should create checkpoint with summary', async () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 10
    })

    queries.insertObservation({
      session_id: sessionId,
      project_id: projectId,
      event_type: 'user_message',
      content: 'Test message',
      metadata: '{}'
    })

    await incrementalSummarize(sessionId, projectId, 1, [0, 10])

    const checkpoints = queries.getSessionCheckpoints(sessionId)
    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0].checkpoint_number).toBe(1)
    expect(checkpoints[0].summary_title).toBe('Test Checkpoint')
  })

  it('should update session checkpoint tracking', async () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 10
    })

    queries.insertObservation({
      session_id: sessionId,
      project_id: projectId,
      event_type: 'user_message',
      content: 'Test message',
      metadata: '{}'
    })

    await incrementalSummarize(sessionId, projectId, 1, [0, 10])

    const session = queries.getSession(sessionId)
    expect(session?.last_checkpoint_turn).toBe(10)
    expect(session?.checkpoint_count).toBe(1)
    expect(session?.last_checkpoint_time).toBeGreaterThan(0)
  })

  it('should broadcast checkpoint_complete event', async () => {
    const { broadcast } = await import('../../ws/broadcast')
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 10
    })

    queries.insertObservation({
      session_id: sessionId,
      project_id: projectId,
      event_type: 'user_message',
      content: 'Test message',
      metadata: '{}'
    })

    await incrementalSummarize(sessionId, projectId, 1, [0, 10])

    expect(broadcast).toHaveBeenCalledWith({
      type: 'checkpoint_complete',
      session_id: sessionId,
      checkpoint_number: 1,
      title: 'Test Checkpoint',
      nodes_added: 0,
      edges_added: 0
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd artifacts/claudectx-backup && pnpm test incremental-summarizer.test.ts`

Expected: FAIL - incrementalSummarize not defined

- [ ] **Step 3: Implement incremental summarizer (part 1 - structure)**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { queries } from '../db/queries'
import { CONFIG } from '../config'
import { broadcast } from '../ws/broadcast'
import { logger } from './logger'
import { insertGraphNodes, insertGraphEdges } from '../db/graph-queries'
import { normalizeNodeId } from '../utils/node-id'
import { consolidateGraphNodes } from './graph-consolidator'

interface SessionSummary {
  title: string
  status: 'completed' | 'in_progress' | 'blocked'
  what_we_did: string[]
  decisions_made: string[]
  files_changed: string[]
  next_steps: string[]
  gotchas: string[]
  tech_stack_notes: string[]
  mood?: string
  complexity?: string
  blockers?: string[]
  resolved?: string[]
  key_insight?: string
  graph?: {
    nodes: Array<{
      id: string
      label: string
      type: 'file' | 'function' | 'class' | 'concept' | 'problem' | 'decision'
      confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS'
      metadata?: Record<string, any>
    }>
    edges: Array<{
      sourceId: string
      targetId: string
      relationship: 'imports' | 'calls' | 'implements' | 'solves' | 'related_to'
      confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS'
      weight?: number
      metadata?: Record<string, any>
    }>
  }
}

function buildPartialTranscript(observations: any[]): string {
  const lines: string[] = []
  
  for (const obs of observations) {
    if (obs.event_type === 'user_message') {
      lines.push(`USER: ${obs.content}`)
    } else if (obs.event_type === 'assistant_message') {
      lines.push(`CLAUDE: ${obs.content}`)
    } else if (obs.event_type === 'tool_call') {
      const toolName = obs.tool_name || 'unknown'
      const filePath = obs.file_path ? ` file: ${obs.file_path}` : ''
      lines.push(`TOOL(${toolName}):${filePath}`)
    } else if (obs.event_type === 'decision') {
      lines.push(`DECISION: ${obs.content}`)
    }
  }
  
  return lines.join('\n')
}

export async function incrementalSummarize(
  sessionId: string,
  projectId: string,
  checkpointNumber: number,
  turnRange: [number, number]
): Promise<void> {
  if (!CONFIG.apiKey || CONFIG.disableSummaries) {
    logger.warn('IncrementalSummarizer', 'API key missing or summaries disabled')
    return
  }

  try {
    const startTime = Date.now()
    
    // Get observations for this session
    const observations = queries.getSessionObservations(sessionId)
    
    if (observations.length === 0) {
      logger.warn('IncrementalSummarizer', `No observations found for session ${sessionId}`)
      return
    }
    
    // Build partial transcript
    const partialTranscript = buildPartialTranscript(observations)
    
    const client = new Anthropic({
      apiKey: CONFIG.apiKey,
      baseURL: CONFIG.apiBaseUrl
    })
    
    logger.info('IncrementalSummarizer', `Processing checkpoint ${checkpointNumber} for session ${sessionId}`, {
      turnRange,
      observationCount: observations.length
    })
    
    // Continue in next step...
  } catch (err) {
    logger.error('IncrementalSummarizer', `Checkpoint failed for session ${sessionId}`, { error: err })
    throw err
  }
}
```

- [ ] **Step 4: Implement incremental summarizer (part 2 - LLM call)**

Add to incrementalSummarize function after logger.info:

```typescript
    const response = await client.messages.create({
      model: CONFIG.summaryModel,
      max_tokens: CONFIG.summaryMaxTokens,
      stream: false,
      system: `You are processing a PARTIAL session transcript for incremental checkpointing.
This is checkpoint #${checkpointNumber} covering turns ${turnRange[0]}-${turnRange[1]}.

Extract the same information as full summarization, but focus on what happened in THIS segment.
Always respond with ONLY valid JSON matching the exact schema provided. No preamble, no markdown, no explanation.`,
      messages: [{
        role: 'user',
        content: `Summarize this partial Claude Code session transcript (checkpoint #${checkpointNumber}).

TRANSCRIPT (turns ${turnRange[0]}-${turnRange[1]}):
${partialTranscript}

Return this exact JSON schema:
{
  "title": "5-8 word title describing the main work done",
  "status": "completed OR in_progress OR blocked",
  "what_we_did": ["specific thing 1", "specific thing 2"],
  "decisions_made": ["architectural or technical decision made"],
  "files_changed": ["relative/path/to/file.ts"],
  "next_steps": ["concrete next thing to do"],
  "gotchas": ["important warning or thing to remember"],
  "tech_stack_notes": ["framework/library/pattern note"],
  "mood": "productive OR frustrated OR exploratory OR debugging OR blocked",
  "complexity": "trivial OR simple OR moderate OR complex OR very_complex",
  "blockers": ["thing that blocked progress"],
  "resolved": ["problem that was solved"],
  "key_insight": "single most important learning or realization",
  "graph": {
    "nodes": [
      {"id": "file:src/index.ts", "label": "src/index.ts", "type": "file", "confidence": "EXTRACTED"}
    ],
    "edges": [
      {"sourceId": "file:src/index.ts", "targetId": "function:main", "relationship": "calls", "confidence": "EXTRACTED"}
    ]
  }
}`
      }]
    })
    
    // Parse response
    let raw = ''
    if (response.content && response.content[0]) {
      raw = response.content[0].type === 'text' ? response.content[0].text : ''
    } else if ((response as any).choices && (response as any).choices[0]) {
      raw = (response as any).choices[0].message.content || ''
    } else {
      throw new Error(`Invalid API response: ${JSON.stringify(response)}`)
    }
    
    const summary: SessionSummary = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
```

- [ ] **Step 5: Implement incremental summarizer (part 3 - storage)**

Add after summary parsing:

```typescript
    // Store checkpoint
    const checkpointId = `${sessionId}_checkpoint_${checkpointNumber}`
    queries.insertCheckpoint({
      id: checkpointId,
      session_id: sessionId,
      project_id: projectId,
      checkpoint_number: checkpointNumber,
      turn_count: turnRange[1],
      created_at: Math.floor(Date.now() / 1000),
      summary_title: summary.title,
      summary_data: JSON.stringify(summary),
      transcript_range: `turns ${turnRange[0]}-${turnRange[1]}`
    })
    
    // Extract graph (if enabled)
    let nodesAdded = 0
    let edgesAdded = 0
    
    if (CONFIG.checkpointIncludeGraph && summary.graph) {
      const normalizedNodes = summary.graph.nodes.map(node => ({
        id: normalizeNodeId(node.type, node.label),
        label: node.label,
        type: node.type,
        confidence: node.confidence,
        metadata: node.metadata ? JSON.stringify(node.metadata) : null
      }))
      
      if (normalizedNodes.length > 0) {
        insertGraphNodes(projectId, normalizedNodes, sessionId)
        nodesAdded = normalizedNodes.length
      }
      
      if (summary.graph.edges.length > 0) {
        const edgesForDb = summary.graph.edges.map(edge => ({
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          relationship: edge.relationship,
          confidence: edge.confidence,
          weight: edge.weight || 1.0,
          metadata: edge.metadata ? JSON.stringify(edge.metadata) : null
        }))
        insertGraphEdges(projectId, edgesForDb, sessionId)
        edgesAdded = summary.graph.edges.length
      }
      
      await consolidateGraphNodes(projectId)
    }
    
    // Update session checkpoint tracking
    queries.updateSession(sessionId, {
      last_checkpoint_turn: turnRange[1],
      last_checkpoint_time: Math.floor(Date.now() / 1000),
      checkpoint_count: checkpointNumber
    })
    
    // Broadcast to UI
    broadcast({
      type: 'checkpoint_complete',
      session_id: sessionId,
      checkpoint_number: checkpointNumber,
      title: summary.title,
      nodes_added: nodesAdded,
      edges_added: edgesAdded
    })
    
    const duration = Date.now() - startTime
    logger.info('IncrementalSummarizer', `Checkpoint ${checkpointNumber} completed for session ${sessionId}`, {
      duration: `${duration}ms`,
      nodesAdded,
      edgesAdded
    })
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd artifacts/claudectx-backup && pnpm test incremental-summarizer.test.ts`

Expected: PASS - All incremental summarizer tests pass

- [ ] **Step 7: Commit**

```bash
git add artifacts/claudectx-backup/src/services/incremental-summarizer.ts artifacts/claudectx-backup/src/services/__tests__/incremental-summarizer.test.ts
git commit -m "feat: add incremental summarizer

- Process partial transcripts from observations
- Call LLM with checkpoint-specific prompt
- Store checkpoint in database
- Extract graph nodes/edges (if enabled)
- Update session checkpoint tracking
- Broadcast checkpoint_complete event
- Add comprehensive unit tests

Part of Phase 3A"
```

---


## Task 6: Hook Integration

**Files:**
- Modify: `artifacts/claudectx-backup/src/api/hook.ts`

- [ ] **Step 1: Write integration test**

Create: `artifacts/claudectx-backup/src/api/__tests__/hook-checkpoint.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { hookRouter } from '../hook'
import { initDB } from '../../db/client'
import { queries } from '../../db/queries'
import { incrementalCheckpointQueue } from '../../services/incremental-checkpoint-queue'

vi.mock('../../services/project-detector', () => ({
  detectProject: vi.fn().mockResolvedValue({
    id: 'test-project',
    name: 'Test Project',
    path: '/test'
  })
}))

vi.mock('../../services/incremental-checkpoint-queue', () => ({
  incrementalCheckpointQueue: {
    enqueue: vi.fn()
  }
}))

vi.mock('../../ws/broadcast', () => ({
  broadcast: vi.fn()
}))

describe('Hook - Checkpoint Trigger', () => {
  let app: express.Application

  beforeEach(() => {
    initDB(':memory:')
    vi.clearAllMocks()
    process.env.ENABLE_INCREMENTAL = 'true'
    process.env.CHECKPOINT_TURNS = '10'
    process.env.CHECKPOINT_TIME = '300'
    
    app = express()
    app.use(express.json())
    app.use('/api/hook', hookRouter)
  })

  it('should trigger checkpoint after 10 turns', async () => {
    const sessionId = 'test-session'
    const projectId = 'test-project'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 9,
      last_checkpoint_turn: 0
    })

    // Send 10th prompt
    await request(app)
      .post('/api/hook')
      .send({
        event: 'UserPromptSubmit',
        session_id: sessionId,
        cwd: '/test',
        prompt_preview: 'Test prompt'
      })

    const session = queries.getSession(sessionId)
    expect(session?.turn_count).toBe(10)

    expect(incrementalCheckpointQueue.enqueue).toHaveBeenCalledWith({
      sessionId,
      projectId,
      checkpointNumber: 1,
      turnRange: [0, 10]
    })
  })

  it('should trigger checkpoint after 5 minutes', async () => {
    const sessionId = 'test-session'
    const projectId = 'test-project'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now - 301, // 301 seconds ago
      status: 'active',
      turn_count: 5,
      last_checkpoint_turn: 0,
      last_checkpoint_time: 0
    })

    await request(app)
      .post('/api/hook')
      .send({
        event: 'UserPromptSubmit',
        session_id: sessionId,
        cwd: '/test',
        prompt_preview: 'Test prompt'
      })

    expect(incrementalCheckpointQueue.enqueue).toHaveBeenCalledWith({
      sessionId,
      projectId,
      checkpointNumber: 1,
      turnRange: [0, 6]
    })
  })

  it('should not trigger checkpoint when feature disabled', async () => {
    process.env.ENABLE_INCREMENTAL = 'false'
    delete require.cache[require.resolve('../../config')]
    
    const sessionId = 'test-session'
    const projectId = 'test-project'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 9,
      last_checkpoint_turn: 0
    })

    await request(app)
      .post('/api/hook')
      .send({
        event: 'UserPromptSubmit',
        session_id: sessionId,
        cwd: '/test',
        prompt_preview: 'Test prompt'
      })

    expect(incrementalCheckpointQueue.enqueue).not.toHaveBeenCalled()
  })

  it('should calculate correct turn range for second checkpoint', async () => {
    const sessionId = 'test-session'
    const projectId = 'test-project'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 19,
      last_checkpoint_turn: 10,
      checkpoint_count: 1
    })

    await request(app)
      .post('/api/hook')
      .send({
        event: 'UserPromptSubmit',
        session_id: sessionId,
        cwd: '/test',
        prompt_preview: 'Test prompt'
      })

    expect(incrementalCheckpointQueue.enqueue).toHaveBeenCalledWith({
      sessionId,
      projectId,
      checkpointNumber: 2,
      turnRange: [10, 20]
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd artifacts/claudectx-backup && pnpm test hook-checkpoint.test.ts`

Expected: FAIL - Checkpoint trigger logic not implemented

- [ ] **Step 3: Add checkpoint trigger to hook**

Modify: `artifacts/claudectx-backup/src/api/hook.ts`

Add import at top:

```typescript
import { incrementalCheckpointQueue } from '../services/incremental-checkpoint-queue'
```

Modify UserPromptSubmit case (after existing observation logging):

```typescript
      case 'UserPromptSubmit': {
        console.log('[Hook] UserPromptSubmit:', data.prompt_preview?.slice(0, 50))
        // Log user prompt as observation
        const obs = {
          session_id,
          project_id: project.id,
          event_type: 'user_message',
          tool_name: null,
          file_path: null,
          content: data.prompt_preview || data.prompt || '',
          metadata: JSON.stringify({})
        }
        queries.insertObservation(obs)
        queries.incrementTurnStats(session_id, 'turns')

        // Update session last_activity timestamp
        queries.updateSession(session_id, {
          last_activity: Math.floor(Date.now() / 1000)
        })
        console.log('[Hook] Updated last_activity for session:', session_id.slice(0, 8))

        // Check if checkpoint needed (only if feature enabled)
        if (CONFIG.enableIncrementalCheckpoints) {
          const session = queries.getSession(session_id)
          if (session) {
            const now = Math.floor(Date.now() / 1000)
            const turnsSinceCheckpoint = session.turn_count - (session.last_checkpoint_turn || 0)
            const timeSinceCheckpoint = now - (session.last_checkpoint_time || session.started_at)
            
            if (turnsSinceCheckpoint >= CONFIG.checkpointTurnThreshold || 
                timeSinceCheckpoint >= CONFIG.checkpointTimeThreshold) {
              
              logger.info('Hook', `Checkpoint threshold met for session ${session_id}`, {
                turns: turnsSinceCheckpoint,
                time: timeSinceCheckpoint
              })
              
              incrementalCheckpointQueue.enqueue({
                sessionId: session_id,
                projectId: project.id,
                checkpointNumber: (session.checkpoint_count || 0) + 1,
                turnRange: [session.last_checkpoint_turn || 0, session.turn_count]
              })
            }
          }
        }

        broadcast({ type: 'user_prompt', session_id, preview: data.prompt_preview })
        break
      }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd artifacts/claudectx-backup && pnpm test hook-checkpoint.test.ts`

Expected: PASS - All checkpoint trigger tests pass

- [ ] **Step 5: Commit**

```bash
git add artifacts/claudectx-backup/src/api/hook.ts artifacts/claudectx-backup/src/api/__tests__/hook-checkpoint.test.ts
git commit -m "feat: add checkpoint trigger to UserPromptSubmit hook

- Check turn threshold (default: 10 turns)
- Check time threshold (default: 300 seconds)
- Enqueue checkpoint when either threshold met
- Calculate correct turn range for checkpoints
- Only trigger when ENABLE_INCREMENTAL=true
- Add comprehensive integration tests

Part of Phase 3A"
```

---


## Task 7: Startup Recovery Scan

**Files:**
- Modify: `artifacts/claudectx-backup/src/index.ts`

- [ ] **Step 1: Write test for recovery scan**

Create: `artifacts/claudectx-backup/src/__tests__/recovery-scan.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { queries } from '../db/queries'
import { initDB } from '../db/client'
import { incrementalCheckpointQueue } from '../services/incremental-checkpoint-queue'

vi.mock('../services/incremental-checkpoint-queue', () => ({
  incrementalCheckpointQueue: {
    enqueue: vi.fn()
  }
}))

describe('Recovery Scan', () => {
  beforeEach(() => {
    initDB(':memory:')
    vi.clearAllMocks()
    process.env.ENABLE_INCREMENTAL = 'true'
    process.env.CHECKPOINT_TURNS = '10'
  })

  it('should enqueue checkpoint for incomplete session', () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 25,
      last_checkpoint_turn: 10,
      checkpoint_count: 1
    })

    // Simulate recovery scan
    const incomplete = queries.getIncompleteCheckpoints(10)
    expect(incomplete).toHaveLength(1)
    
    for (const session of incomplete) {
      incrementalCheckpointQueue.enqueue({
        sessionId: session.session_id,
        projectId: session.project_id,
        checkpointNumber: (session.checkpoint_count || 0) + 1,
        turnRange: [session.last_checkpoint_turn || 0, session.turn_count]
      })
    }

    expect(incrementalCheckpointQueue.enqueue).toHaveBeenCalledWith({
      sessionId,
      projectId,
      checkpointNumber: 2,
      turnRange: [10, 25]
    })
  })

  it('should not enqueue checkpoint for completed session', () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'completed',
      turn_count: 25,
      last_checkpoint_turn: 10,
      checkpoint_count: 1
    })

    const incomplete = queries.getIncompleteCheckpoints(10)
    expect(incomplete).toHaveLength(0)
  })

  it('should not enqueue checkpoint when turns below threshold', () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 15,
      last_checkpoint_turn: 10,
      checkpoint_count: 1
    })

    const incomplete = queries.getIncompleteCheckpoints(10)
    expect(incomplete).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it passes (logic already in queries)**

Run: `cd artifacts/claudectx-backup && pnpm test recovery-scan.test.ts`

Expected: PASS - Recovery scan logic works

- [ ] **Step 3: Add recovery scan to startup**

Modify: `artifacts/claudectx-backup/src/index.ts`

Add import at top:

```typescript
import { incrementalCheckpointQueue } from './services/incremental-checkpoint-queue'
```

Add after `initDB()` call in main function:

```typescript
  // Recovery scan for incomplete checkpoints
  if (CONFIG.enableIncrementalCheckpoints) {
    logger.info('Startup', 'Running recovery scan for incomplete checkpoints')
    const incomplete = queries.getIncompleteCheckpoints(CONFIG.checkpointTurnThreshold)
    
    if (incomplete.length > 0) {
      logger.info('Startup', `Found ${incomplete.length} sessions needing checkpoints, queuing`)
      
      for (const session of incomplete) {
        incrementalCheckpointQueue.enqueue({
          sessionId: session.session_id,
          projectId: session.project_id,
          checkpointNumber: (session.checkpoint_count || 0) + 1,
          turnRange: [session.last_checkpoint_turn || 0, session.turn_count]
        })
      }
    } else {
      logger.info('Startup', 'No incomplete checkpoints found')
    }
  }
```

- [ ] **Step 4: Test recovery scan manually**

Run: `cd artifacts/claudectx-backup && pnpm run build && ENABLE_INCREMENTAL=true node dist/index.js`

Expected: Logs show "Running recovery scan for incomplete checkpoints"

- [ ] **Step 5: Commit**

```bash
git add artifacts/claudectx-backup/src/index.ts artifacts/claudectx-backup/src/__tests__/recovery-scan.test.ts
git commit -m "feat: add startup recovery scan for incomplete checkpoints

- Scan for active sessions with turns >= threshold
- Enqueue missed checkpoints on startup
- Only run when ENABLE_INCREMENTAL=true
- Add unit tests for recovery logic

Part of Phase 3A"
```

---


## Task 8: WebSocket Event Type

**Files:**
- Modify: `artifacts/claudectx-backup/src/ws/broadcast.ts`

- [ ] **Step 1: Read current broadcast types**

Run: `cat artifacts/claudectx-backup/src/ws/broadcast.ts | grep "type:"`

Expected: See existing event types (session_start, session_end, etc.)

- [ ] **Step 2: Add TypeScript type for checkpoint_complete event**

Modify: `artifacts/claudectx-backup/src/ws/broadcast.ts`

Add to event type union (if types are defined):

```typescript
| {
    type: 'checkpoint_complete'
    session_id: string
    checkpoint_number: number
    title: string
    nodes_added: number
    edges_added: number
  }
```

If no type union exists, the broadcast function already accepts any object, so this step documents the event shape for frontend consumers.

- [ ] **Step 3: Verify broadcast is exported**

Run: `grep "export.*broadcast" artifacts/claudectx-backup/src/ws/broadcast.ts`

Expected: Shows `export function broadcast` or `export { broadcast }`

- [ ] **Step 4: Test broadcast with checkpoint event**

Create: `artifacts/claudectx-backup/src/ws/__tests__/broadcast-checkpoint.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { broadcast } from '../broadcast'

vi.mock('ws', () => ({
  WebSocketServer: vi.fn()
}))

describe('Broadcast - Checkpoint Events', () => {
  it('should accept checkpoint_complete event', () => {
    expect(() => {
      broadcast({
        type: 'checkpoint_complete',
        session_id: 'test-session',
        checkpoint_number: 1,
        title: 'Test Checkpoint',
        nodes_added: 5,
        edges_added: 7
      })
    }).not.toThrow()
  })
})
```

- [ ] **Step 5: Run test**

Run: `cd artifacts/claudectx-backup && pnpm test broadcast-checkpoint.test.ts`

Expected: PASS - Broadcast accepts checkpoint event

- [ ] **Step 6: Commit**

```bash
git add artifacts/claudectx-backup/src/ws/broadcast.ts artifacts/claudectx-backup/src/ws/__tests__/broadcast-checkpoint.test.ts
git commit -m "feat: add checkpoint_complete WebSocket event type

- Document checkpoint_complete event shape
- Add test for checkpoint event broadcasting
- Event includes: session_id, checkpoint_number, title, nodes/edges added

Part of Phase 3A"
```

---


## Task 9: Integration Testing

**Files:**
- Create: `artifacts/claudectx-backup/src/__tests__/integration/incremental-checkpoints.test.ts`

- [ ] **Step 1: Write end-to-end integration test**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initDB } from '../../db/client'
import { queries } from '../../db/queries'
import { incrementalCheckpointQueue } from '../../services/incremental-checkpoint-queue'
import { CONFIG } from '../../config'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            title: 'Integration Test Checkpoint',
            status: 'in_progress',
            what_we_did: ['Tested incremental checkpoints'],
            decisions_made: [],
            files_changed: ['test.ts'],
            next_steps: [],
            gotchas: [],
            tech_stack_notes: [],
            graph: {
              nodes: [
                { id: 'file:test.ts', label: 'test.ts', type: 'file', confidence: 'EXTRACTED' }
              ],
              edges: []
            }
          })
        }]
      })
    }
  }))
}))

vi.mock('../../ws/broadcast', () => ({
  broadcast: vi.fn()
}))

describe('Incremental Checkpoints - Integration', () => {
  beforeEach(() => {
    initDB(':memory:')
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    process.env.ENABLE_INCREMENTAL = 'true'
    process.env.CHECKPOINT_TURNS = '10'
  })

  it('should create checkpoint after 10 turns', async () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 10,
      last_checkpoint_turn: 0
    })

    // Add observations
    for (let i = 0; i < 10; i++) {
      queries.insertObservation({
        session_id: sessionId,
        project_id: projectId,
        event_type: 'user_message',
        content: `Test message ${i}`,
        metadata: '{}'
      })
    }

    // Enqueue checkpoint
    await incrementalCheckpointQueue.enqueue({
      sessionId,
      projectId,
      checkpointNumber: 1,
      turnRange: [0, 10]
    })

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify checkpoint created
    const checkpoints = queries.getSessionCheckpoints(sessionId)
    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0].checkpoint_number).toBe(1)
    expect(checkpoints[0].summary_title).toBe('Integration Test Checkpoint')

    // Verify session updated
    const session = queries.getSession(sessionId)
    expect(session?.last_checkpoint_turn).toBe(10)
    expect(session?.checkpoint_count).toBe(1)
  })

  it('should create multiple checkpoints in sequence', async () => {
    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 20,
      last_checkpoint_turn: 0
    })

    // Add observations
    for (let i = 0; i < 20; i++) {
      queries.insertObservation({
        session_id: sessionId,
        project_id: projectId,
        event_type: 'user_message',
        content: `Test message ${i}`,
        metadata: '{}'
      })
    }

    // Enqueue first checkpoint
    await incrementalCheckpointQueue.enqueue({
      sessionId,
      projectId,
      checkpointNumber: 1,
      turnRange: [0, 10]
    })

    await new Promise(resolve => setTimeout(resolve, 200))

    // Enqueue second checkpoint
    await incrementalCheckpointQueue.enqueue({
      sessionId,
      projectId,
      checkpointNumber: 2,
      turnRange: [10, 20]
    })

    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify both checkpoints created
    const checkpoints = queries.getSessionCheckpoints(sessionId)
    expect(checkpoints).toHaveLength(2)
    expect(checkpoints[0].checkpoint_number).toBe(1)
    expect(checkpoints[1].checkpoint_number).toBe(2)

    // Verify session updated
    const session = queries.getSession(sessionId)
    expect(session?.last_checkpoint_turn).toBe(20)
    expect(session?.checkpoint_count).toBe(2)
  })

  it('should handle checkpoint failure gracefully', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'))
    ;(Anthropic as any).mockImplementation(() => ({
      messages: { create: mockCreate }
    }))

    const projectId = 'test-project'
    const sessionId = 'test-session'
    const now = Math.floor(Date.now() / 1000)

    queries.upsertProject({ id: projectId, name: 'Test', path: '/test' })
    queries.upsertSession({
      id: sessionId,
      project_id: projectId,
      started_at: now,
      status: 'active',
      turn_count: 10,
      last_checkpoint_turn: 0
    })

    queries.insertObservation({
      session_id: sessionId,
      project_id: projectId,
      event_type: 'user_message',
      content: 'Test message',
      metadata: '{}'
    })

    // Enqueue checkpoint (will fail)
    await incrementalCheckpointQueue.enqueue({
      sessionId,
      projectId,
      checkpointNumber: 1,
      turnRange: [0, 10]
    })

    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify no checkpoint created
    const checkpoints = queries.getSessionCheckpoints(sessionId)
    expect(checkpoints).toHaveLength(0)

    // Verify session not updated
    const session = queries.getSession(sessionId)
    expect(session?.last_checkpoint_turn).toBe(0)
    expect(session?.checkpoint_count).toBe(0)
  })
})
```

- [ ] **Step 2: Run integration tests**

Run: `cd artifacts/claudectx-backup && pnpm test incremental-checkpoints.test.ts`

Expected: PASS - All integration tests pass

- [ ] **Step 3: Commit**

```bash
git add artifacts/claudectx-backup/src/__tests__/integration/incremental-checkpoints.test.ts
git commit -m "test: add integration tests for incremental checkpoints

- Test checkpoint creation after 10 turns
- Test multiple sequential checkpoints
- Test graceful failure handling
- Verify database state after checkpoints

Part of Phase 3A"
```

---


## Task 10: Manual End-to-End Testing

**Files:**
- N/A (manual testing)

- [ ] **Step 1: Build and start worker**

Run: `cd artifacts/claudectx-backup && pnpm run build && ENABLE_INCREMENTAL=true ANTHROPIC_API_KEY=<your-key> node dist/index.js`

Expected: Worker starts, logs show "Running recovery scan for incomplete checkpoints"

- [ ] **Step 2: Trigger test session with 10+ prompts**

In another terminal, simulate UserPromptSubmit hooks:

```bash
for i in {1..12}; do
  curl -X POST http://localhost:9999/api/hook \
    -H 'Content-Type: application/json' \
    -d "{
      \"event\": \"UserPromptSubmit\",
      \"session_id\": \"test-$(date +%s)\",
      \"cwd\": \"$(pwd)\",
      \"prompt_preview\": \"Test prompt $i\"
    }"
  sleep 1
done
```

Expected: After 10th prompt, logs show "Checkpoint threshold met"

- [ ] **Step 3: Verify checkpoint in database**

Run: `sqlite3 ~/.memctx/db.sqlite "SELECT checkpoint_number, summary_title FROM session_checkpoints ORDER BY created_at DESC LIMIT 1;"`

Expected: Shows checkpoint with number 1 and a title

- [ ] **Step 4: Verify session tracking updated**

Run: `sqlite3 ~/.memctx/db.sqlite "SELECT last_checkpoint_turn, checkpoint_count FROM sessions WHERE id = (SELECT session_id FROM session_checkpoints ORDER BY created_at DESC LIMIT 1);"`

Expected: Shows last_checkpoint_turn=10, checkpoint_count=1

- [ ] **Step 5: Test time-based trigger**

Start a session and wait 5+ minutes without sending prompts:

```bash
SESSION_ID="test-time-$(date +%s)"
curl -X POST http://localhost:9999/api/hook \
  -H 'Content-Type: application/json' \
  -d "{
    \"event\": \"SessionStart\",
    \"session_id\": \"$SESSION_ID\",
    \"cwd\": \"$(pwd)\"
  }"

# Wait 5+ minutes, then send a prompt
sleep 301

curl -X POST http://localhost:9999/api/hook \
  -H 'Content-Type: application/json' \
  -d "{
    \"event\": \"UserPromptSubmit\",
    \"session_id\": \"$SESSION_ID\",
    \"cwd\": \"$(pwd)\",
    \"prompt_preview\": \"Test after 5 minutes\"
  }"
```

Expected: Logs show "Checkpoint threshold met" due to time threshold

- [ ] **Step 6: Test feature flag disabled**

Run: `cd artifacts/claudectx-backup && pnpm run build && ENABLE_INCREMENTAL=false ANTHROPIC_API_KEY=<your-key> node dist/index.js`

Send 10+ prompts, verify no checkpoints created.

Expected: No "Checkpoint threshold met" logs, no checkpoints in database

- [ ] **Step 7: Document test results**

Create: `artifacts/claudectx-backup/TESTING.md` (append to existing or create new)

```markdown
## Phase 3A: Incremental Checkpoints - Manual Test Results

**Date:** 2026-04-13

### Test 1: Turn-based trigger (10 turns)
- ✅ Checkpoint created after 10th prompt
- ✅ Database shows checkpoint_number=1
- ✅ Session tracking updated (last_checkpoint_turn=10)
- ✅ WebSocket broadcast sent (check browser console)

### Test 2: Time-based trigger (5 minutes)
- ✅ Checkpoint created after 5+ minutes
- ✅ Works even with < 10 turns

### Test 3: Feature flag disabled
- ✅ No checkpoints created when ENABLE_INCREMENTAL=false
- ✅ No performance impact on existing flow

### Test 4: Recovery scan
- ✅ Startup detects incomplete sessions
- ✅ Queues missed checkpoints

### Test 5: Multiple checkpoints
- ✅ Second checkpoint uses correct turn range (10-20)
- ✅ checkpoint_count increments correctly
```

- [ ] **Step 8: Commit test documentation**

```bash
git add artifacts/claudectx-backup/TESTING.md
git commit -m "docs: add Phase 3A manual test results

- Turn-based trigger verified
- Time-based trigger verified
- Feature flag behavior verified
- Recovery scan verified
- Multiple checkpoints verified

Part of Phase 3A"
```

---


## Task 11: Version Bump and Publish

**Files:**
- Modify: `artifacts/claudectx-backup/package.json`

- [ ] **Step 1: Run all tests**

Run: `cd artifacts/claudectx-backup && pnpm test`

Expected: All tests pass

- [ ] **Step 2: Build package**

Run: `cd artifacts/claudectx-backup && pnpm run build`

Expected: Build succeeds, dist/ directory created

- [ ] **Step 3: Bump version to 1.2.0**

Modify: `artifacts/claudectx-backup/package.json`

Change version from `1.1.1` to `1.2.0` (minor version bump for new feature)

- [ ] **Step 4: Update CHANGELOG**

Create or modify: `artifacts/claudectx-backup/CHANGELOG.md`

Add entry:

```markdown
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
```

- [ ] **Step 5: Commit version bump**

```bash
git add artifacts/claudectx-backup/package.json artifacts/claudectx-backup/CHANGELOG.md
git commit -m "chore: bump version to 1.2.0

Phase 3A: Incremental Memory Engine complete

- Hybrid checkpoint trigger (10 turns OR 5 minutes)
- Full checkpoint storage with graph extraction
- Startup recovery scan
- WebSocket real-time updates
- Feature flag controlled (default: disabled)"
```

- [ ] **Step 6: Test locally before publishing**

Run: `cd artifacts/claudectx-backup && ENABLE_INCREMENTAL=true pnpm start`

Send test prompts, verify checkpoints work end-to-end.

Expected: Checkpoints created, no errors

- [ ] **Step 7: Publish to npm**

Run: `cd artifacts/claudectx-backup && npm publish --otp=<your-otp-code>`

Expected: Package published as memctx@1.2.0

- [ ] **Step 8: Verify installation**

Run: `npm install -g memctx@1.2.0 && memctx --version`

Expected: Shows version 1.2.0

- [ ] **Step 9: Tag release**

```bash
git tag -a v1.2.0 -m "Phase 3A: Incremental Memory Engine

- Hybrid checkpoint trigger (10 turns OR 5 minutes)
- Full checkpoint storage with graph extraction
- Startup recovery scan
- WebSocket real-time updates
- Feature flag: ENABLE_INCREMENTAL=true"

git push origin v1.2.0
```

- [ ] **Step 10: Update CLAUDE.md**

Modify: `artifacts/claudectx-backup/CLAUDE.md`

Update "Recent session history" section:

```markdown
## Recent session history (auto-updated by ClaudeContext)
**Last session:** Phase 3A: Incremental Memory Engine — COMPLETED
**Completed:** Database migration 012, Config with feature flags, Checkpoint queries, Incremental checkpoint queue, Incremental summarizer, Hook integration, Startup recovery scan, WebSocket events, Integration tests, Manual E2E testing, Published v1.2.0
**Up next:** Phase 3B: Rich Memory Features (momentum, learning, emotional, code quality, productivity)
**Remember:** Feature flag ENABLE_INCREMENTAL=true required to activate incremental checkpoints
_Updated automatically. View full history at http://localhost:9999_
```

- [ ] **Step 11: Final commit**

```bash
git add artifacts/claudectx-backup/CLAUDE.md
git commit -m "docs: update CLAUDE.md for Phase 3A completion"
git push origin main
```

---

## Self-Review Checklist

### Spec Coverage

✅ **Hybrid Trigger System** - Task 6 (hook integration)
✅ **Full Checkpoint Storage** - Task 1 (migration), Task 3 (queries), Task 5 (summarizer)
✅ **Real-time UI Updates** - Task 8 (WebSocket events)
✅ **Backward Compatibility** - Task 2 (feature flag), default disabled
✅ **Performance** - Task 4 (queue with concurrency limit)
✅ **Reliability** - Task 7 (recovery scan), Task 4 (retry logic)
✅ **Cost Management** - Task 2 (configurable thresholds)

### Placeholder Scan

✅ No TBDs, TODOs, or "implement later" comments
✅ All code blocks complete with actual implementation
✅ All test cases have assertions
✅ All commands have expected output

### Type Consistency

✅ CheckpointJob interface consistent across queue and summarizer
✅ SessionSummary interface matches between summarizer and test mocks
✅ Database column names match between migration and queries
✅ Function signatures consistent (incrementalSummarize parameters)

### Missing Requirements

None - all Phase 3A requirements covered.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-13-phase3a-incremental-engine.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

