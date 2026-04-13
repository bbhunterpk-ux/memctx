# Phase 3: Incremental Memory Engine - Design Specification

**Date:** 2026-04-13  
**Status:** Draft  
**Version:** 1.0.0


## Overview

Phase 3 transforms MemCTX from end-of-session summarization to real-time incremental memory processing. Instead of waiting until session end, the system processes memory every 10 turns OR 5 minutes (whichever comes first), providing:

- **Real-time memory building** - Graph and summaries update mid-session
- **Crash resilience** - Memory never lost, even if session crashes
- **Live UI feedback** - Users see memory forming as they work
- **Better context** - AI can reference recent checkpoints during long sessions

**Trade-off:** 2.7x higher API costs (multiple LLM calls per session vs. 1 at end)


## Requirements

### Functional Requirements

1. **Hybrid Trigger System**
   - Process memory after every 10 user prompts
   - Process memory after 5 minutes of elapsed time
   - Whichever condition is met first triggers checkpoint

2. **Full Checkpoint Storage**
   - Store complete summaries (title, what_we_did, decisions, etc.)
   - Extract and store graph nodes/edges at each checkpoint
   - Store preferences, knowledge, patterns, tasks, contacts
   - Maintain checkpoint history for debugging/time-travel queries

3. **Real-time UI Updates**
   - Broadcast checkpoint completion via WebSocket
   - Update graph view incrementally (append new nodes/edges)
   - Show notification with checkpoint number and stats
   - Refresh memory cards on project detail page

4. **Backward Compatibility**
   - Feature flag: `ENABLE_INCREMENTAL=true` to opt-in
   - Default: disabled (Phase 1 behavior)
   - End-of-session summarization still runs regardless

### Non-Functional Requirements

1. **Performance**
   - Checkpoint processing must not block user interaction
   - Queue-based async processing (separate from end-of-session queue)
   - Lower priority than final summaries

2. **Reliability**
   - Checkpoint failures don't block session progress
   - Recovery scan on startup finds incomplete checkpoints
   - Retry logic with exponential backoff

3. **Cost Management**
   - Configurable turn/time thresholds
   - Optional toggle to skip graph extraction in checkpoints
   - Use Haiku model for cost efficiency


## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              UserPromptSubmit Hook (hook.ts)                 │
│  - Increment turn count                                      │
│  - Check: turns >= 10 OR time >= 5min?                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼ (if threshold met)
┌─────────────────────────────────────────────────────────────┐
│         Incremental Checkpoint Queue (new)                   │
│  - Priority: lower than end-of-session                       │
│  - Payload: sessionId, projectId, checkpointNumber, turnRange│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│      Incremental Summarizer (incremental-summarizer.ts)     │
│  - Read partial transcript (turns since last checkpoint)     │
│  - Call LLM with same schema as full summarization          │
│  - Extract summary + graph nodes/edges                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (session_checkpoints table)            │
│  - Store checkpoint summary                                  │
│  - Insert graph nodes/edges (tagged with session_id)        │
│  - Update session.last_checkpoint_turn/time                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              WebSocket Broadcast (broadcast.ts)              │
│  - Event: checkpoint_complete                                │
│  - Payload: checkpoint #, title, nodes/edges added          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Frontend Dashboard                          │
│  - Update graph view (append nodes/edges)                    │
│  - Show notification                                         │
│  - Refresh memory cards                                      │
└─────────────────────────────────────────────────────────────┘
```


## Database Schema

### New Table: session_checkpoints

```sql
CREATE TABLE session_checkpoints (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  checkpoint_number INTEGER NOT NULL,
  turn_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  summary_title TEXT,
  summary_data TEXT, -- JSON blob with full SessionSummary
  transcript_range TEXT, -- "turns 1-10" for debugging
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(session_id, checkpoint_number)
);

CREATE INDEX idx_checkpoints_session ON session_checkpoints(session_id);
CREATE INDEX idx_checkpoints_project ON session_checkpoints(project_id);
```

### Modified Table: sessions

```sql
-- Add checkpoint tracking columns
ALTER TABLE sessions ADD COLUMN last_checkpoint_turn INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN last_checkpoint_time INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN checkpoint_count INTEGER DEFAULT 0;
```

### Graph Tables (no changes)

Graph nodes and edges continue using existing schema. Each checkpoint inserts nodes/edges tagged with `session_id` for provenance tracking.


## Implementation Details

### 1. Checkpoint Trigger Logic

**Location:** `src/api/hook.ts` (UserPromptSubmit handler)

```typescript
case 'UserPromptSubmit': {
  // ... existing observation logging ...
  
  // Update session last_activity timestamp
  queries.updateSession(session_id, {
    last_activity: Math.floor(Date.now() / 1000)
  });
  
  // Check if checkpoint needed (only if feature enabled)
  if (CONFIG.enableIncrementalCheckpoints) {
    const session = queries.getSession(session_id);
    const now = Math.floor(Date.now() / 1000);
    const turnsSinceCheckpoint = session.turn_count - (session.last_checkpoint_turn || 0);
    const timeSinceCheckpoint = now - (session.last_checkpoint_time || session.started_at);
    
    if (turnsSinceCheckpoint >= CONFIG.checkpointTurnThreshold || 
        timeSinceCheckpoint >= CONFIG.checkpointTimeThreshold) {
      
      logger.info('Hook', `Checkpoint threshold met for session ${session_id}`, {
        turns: turnsSinceCheckpoint,
        time: timeSinceCheckpoint
      });
      
      incrementalCheckpointQueue.enqueue({
        sessionId: session_id,
        projectId: project.id,
        checkpointNumber: (session.checkpoint_count || 0) + 1,
        turnRange: [session.last_checkpoint_turn || 0, session.turn_count]
      });
    }
  }
  
  broadcast({ type: 'user_prompt', session_id, preview: data.prompt_preview });
  break;
}
```


### 2. Incremental Checkpoint Queue

**Location:** `src/services/incremental-checkpoint-queue.ts` (new file)

```typescript
import { Queue } from './queue-base'
import { incrementalSummarize } from './incremental-summarizer'
import { logger } from './logger'

interface CheckpointJob {
  sessionId: string
  projectId: string
  checkpointNumber: number
  turnRange: [number, number]
}

class IncrementalCheckpointQueue extends Queue<CheckpointJob> {
  constructor() {
    super('incremental-checkpoint', {
      concurrency: 1,
      retryAttempts: 2,
      retryDelay: 5000
    })
  }

  async processJob(job: CheckpointJob): Promise<void> {
    logger.info('IncrementalCheckpointQueue', `Processing checkpoint ${job.checkpointNumber} for session ${job.sessionId}`)
    
    await incrementalSummarize(
      job.sessionId,
      job.projectId,
      job.checkpointNumber,
      job.turnRange
    )
  }
}

export const incrementalCheckpointQueue = new IncrementalCheckpointQueue()
```

**Priority:** Lower than end-of-session summarization queue. If both queues have jobs, end-of-session takes precedence.


### 3. Incremental Summarizer

**Location:** `src/services/incremental-summarizer.ts` (new file)

Key differences from `summarizer.ts`:
- Processes **partial transcript** (only turns since last checkpoint)
- Stores result in `session_checkpoints` table
- Still extracts full graph nodes/edges (cumulative knowledge)
- Updates checkpoint tracking fields after success

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { queries } from '../db/queries'
import { CONFIG } from '../config'
import { broadcast } from '../ws/broadcast'
import { logger } from '../services/logger'
import { insertGraphNodes, insertGraphEdges } from '../db/graph-queries'
import { normalizeNodeId } from '../utils/node-id'
import { consolidateGraphNodes } from './graph-consolidator'

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
    
    // Get observations for this turn range
    const observations = queries.getSessionObservations(sessionId)
    const rangeObservations = observations.filter(obs => {
      // Filter by turn range (approximate - observations don't have turn numbers)
      // Use created_at timestamps as proxy
      return true // TODO: implement proper turn range filtering
    })
    
    // Build partial transcript
    const partialTranscript = buildPartialTranscript(rangeObservations)
    
    const client = new Anthropic({
      apiKey: CONFIG.apiKey,
      baseURL: CONFIG.apiBaseUrl
    })
    
    logger.info('IncrementalSummarizer', `Processing checkpoint ${checkpointNumber} for session ${sessionId}`, {
      turnRange,
      observationCount: rangeObservations.length
    })
    
    const response = await client.messages.create({
      model: CONFIG.summaryModel,
      max_tokens: CONFIG.summaryMaxTokens,
      stream: false,
      system: `You are processing a PARTIAL session transcript for incremental checkpointing.
This is checkpoint #${checkpointNumber} covering turns ${turnRange[0]}-${turnRange[1]}.

Extract the same information as full summarization, but focus on what happened in THIS segment.`,
      messages: [{
        role: 'user',
        content: `Summarize this partial Claude Code session transcript (checkpoint #${checkpointNumber}).

TRANSCRIPT (turns ${turnRange[0]}-${turnRange[1]}):
${partialTranscript}

Return the same JSON schema as full summarization.`
      }]
    })
    
    // Parse response (same format as full summarization)
    let raw = ''
    if (response.content && response.content[0]) {
      raw = response.content[0].type === 'text' ? response.content[0].text : ''
    } else if ((response as any).choices && (response as any).choices[0]) {
      raw = (response as any).choices[0].message.content || ''
    }
    
    const summary = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    
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
      nodes_added: summary.graph?.nodes.length || 0,
      edges_added: summary.graph?.edges.length || 0
    })
    
    const duration = Date.now() - startTime
    logger.info('IncrementalSummarizer', `Checkpoint ${checkpointNumber} completed for session ${sessionId}`, {
      duration: `${duration}ms`
    })
    
  } catch (err) {
    logger.error('IncrementalSummarizer', `Checkpoint failed for session ${sessionId}`, { error: err })
    throw err
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
    }
  }
  
  return lines.join('\n')
}
```


### 4. Database Queries

**Location:** `src/db/queries.ts` (add new methods)

```typescript
// Insert checkpoint
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
}

// Get checkpoints for a session
getSessionCheckpoints(sessionId: string): any[] {
  return db.prepare(`
    SELECT * FROM session_checkpoints
    WHERE session_id = ?
    ORDER BY checkpoint_number ASC
  `).all(sessionId)
}

// Get latest checkpoint for a session
getLatestCheckpoint(sessionId: string): any | null {
  return db.prepare(`
    SELECT * FROM session_checkpoints
    WHERE session_id = ?
    ORDER BY checkpoint_number DESC
    LIMIT 1
  `).get(sessionId)
}

// Get incomplete checkpoints (for recovery)
getIncompleteCheckpoints(): any[] {
  return db.prepare(`
    SELECT s.id as session_id, s.project_id, s.checkpoint_count, s.last_checkpoint_turn
    FROM sessions s
    WHERE s.status = 'active'
      AND s.turn_count - s.last_checkpoint_turn >= ?
  `).all(CONFIG.checkpointTurnThreshold)
}
```


### 5. Configuration

**Location:** `src/config.ts` (add new fields)

```typescript
export const CONFIG = {
  // ... existing config ...
  
  // Incremental checkpointing
  enableIncrementalCheckpoints: process.env.ENABLE_INCREMENTAL === 'true',
  checkpointTurnThreshold: parseInt(process.env.CHECKPOINT_TURNS || '10'),
  checkpointTimeThreshold: parseInt(process.env.CHECKPOINT_TIME || '300'), // 5 minutes
  checkpointIncludeGraph: process.env.CHECKPOINT_GRAPH !== 'false', // default true
}
```

**Environment Variables:**

```bash
# Enable incremental checkpointing (default: false)
ENABLE_INCREMENTAL=true

# Checkpoint after N turns (default: 10)
CHECKPOINT_TURNS=10

# Checkpoint after N seconds (default: 300 = 5 minutes)
CHECKPOINT_TIME=300

# Include graph extraction in checkpoints (default: true)
CHECKPOINT_GRAPH=true
```

### 6. Frontend Updates

**Location:** `dashboard/src/components/ProjectDetail.tsx`

Add WebSocket listener for checkpoint events:

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:9999')
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'checkpoint_complete' && data.session_id === currentSessionId) {
      // Show notification
      toast.success(`Checkpoint #${data.checkpoint_number}: ${data.title}`, {
        description: `Added ${data.nodes_added} nodes, ${data.edges_added} edges`
      })
      
      // Refresh graph view
      refetchGraph()
      
      // Refresh memory cards
      refetchMemory()
    }
  }
  
  return () => ws.close()
}, [currentSessionId])
```

**Location:** `dashboard/src/components/GraphView.tsx`

Update graph incrementally instead of full reload:

```typescript
const handleCheckpointComplete = (data: CheckpointEvent) => {
  // Append new nodes/edges to existing graph
  setGraphData(prev => ({
    nodes: [...prev.nodes, ...data.new_nodes],
    edges: [...prev.edges, ...data.new_edges]
  }))
}
```


## Error Handling & Edge Cases

### Checkpoint Failure

**Scenario:** LLM API call fails, network timeout, or parsing error

**Handling:**
- Log error with full context (session_id, checkpoint_number, error message)
- Don't block session progress (user continues working)
- Increment retry counter in queue (max 2 retries with 5s delay)
- If all retries fail, mark checkpoint as failed and continue
- Next checkpoint processes larger turn range to catch up

**Recovery:**
```typescript
// On startup, scan for sessions with missed checkpoints
const incompleteSessions = queries.getIncompleteCheckpoints()
for (const session of incompleteSessions) {
  incrementalCheckpointQueue.enqueue({
    sessionId: session.session_id,
    projectId: session.project_id,
    checkpointNumber: session.checkpoint_count + 1,
    turnRange: [session.last_checkpoint_turn, session.turn_count]
  })
}
```

### Session Ends Before First Checkpoint

**Scenario:** User sends 5 prompts and ends session (< 10 turn threshold)

**Handling:**
- No checkpoints created (expected behavior)
- Normal end-of-session summarization runs
- Final summary stored in `sessions` table as usual

### Rapid Checkpoints

**Scenario:** User sends 10 prompts in 30 seconds

**Handling:**
- Queue serializes checkpoint processing (concurrency: 1)
- Each checkpoint processes its turn range independently
- No race conditions (turn ranges don't overlap)
- Later checkpoints may queue up but will process in order

### Crash During Checkpoint

**Scenario:** Worker process crashes while processing checkpoint

**Handling:**
- Checkpoint marked as failed in queue (no database record created)
- On next startup, recovery scan detects missing checkpoint
- Re-enqueue checkpoint job with same turn range
- Idempotent: graph nodes use UNIQUE constraints, won't duplicate

### Time-based Trigger During Idle Session

**Scenario:** User leaves session open for 10 minutes without interaction

**Handling:**
- Time-based trigger fires after 5 minutes
- Checkpoint processes observations since last checkpoint
- If no new observations, checkpoint creates minimal summary
- Graph extraction skipped if no new code discussed


## API Cost Analysis

### Current (Phase 1)

**Per Session:**
- 1 LLM call at session end
- Average session: 40 turns × 500 chars/turn = 20,000 chars
- Compressed transcript: ~40k tokens input
- Model: Haiku (claude-haiku-4-5-20251001)
- Cost: ~$0.15 per session

**Monthly (100 sessions):**
- Total cost: $15/month

### Phase 3 (Incremental)

**Per Session (40 turns):**
- 4 checkpoints (every 10 turns) + 1 final summary
- Each checkpoint: 10 turns × 500 chars = 5,000 chars → ~5k tokens
- Checkpoint cost: ~$0.04 each
- Total checkpoints: 4 × $0.04 = $0.16
- Final summary: $0.15
- **Total: $0.31 per session**

**Monthly (100 sessions):**
- Total cost: $31/month
- **Increase: 2.1x vs Phase 1**

### Cost Mitigation Strategies

1. **Increase turn threshold** (10 → 15 turns)
   - Reduces checkpoints per session: 4 → 2-3
   - Cost: $0.23 per session (1.5x vs Phase 1)

2. **Skip graph extraction in checkpoints**
   - Set `CHECKPOINT_GRAPH=false`
   - Reduces token output by ~30%
   - Cost: ~$0.25 per session (1.7x vs Phase 1)

3. **Time-only trigger** (remove turn threshold)
   - Only checkpoint every 5 minutes
   - Fewer checkpoints for short sessions
   - Cost: variable, ~1.5x average

4. **Adaptive thresholds**
   - Increase threshold after first checkpoint
   - First: 10 turns, Second: 20 turns, Third: 30 turns
   - Cost: ~$0.20 per session (1.3x vs Phase 1)


## Migration Plan

### Database Migration

**File:** `src/db/migrations/012_incremental_checkpoints.sql`

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

### Rollout Strategy

**Phase 1: Development Testing**
1. Deploy with `ENABLE_INCREMENTAL=false` (default)
2. Test locally with `ENABLE_INCREMENTAL=true`
3. Verify checkpoint creation, graph updates, UI broadcasts

**Phase 2: Opt-in Beta**
1. Deploy to production with feature flag disabled
2. Document opt-in instructions in README
3. Collect feedback from early adopters

**Phase 3: Default Enabled**
1. After 2 weeks of stable beta testing
2. Enable by default: `ENABLE_INCREMENTAL=true`
3. Users can opt-out with `ENABLE_INCREMENTAL=false`

### Backward Compatibility

- Existing sessions continue working (no checkpoints created)
- End-of-session summarization still runs regardless of feature flag
- Database migration is additive (no data loss)
- UI gracefully handles missing checkpoint events (no errors)


## Rich Memory Features & UI Enhancements

### Additional Memory Dimensions

Beyond the current extraction schema, Phase 3 adds richer memory features for better UI visualization:

#### 1. Session Momentum Tracking

**Data Structure:**
```typescript
interface SessionMomentum {
  velocity: 'fast' | 'steady' | 'slow' | 'blocked'  // Progress speed
  focus_score: number  // 0-1, how focused vs scattered
  context_switches: number  // How many different topics/files
  deep_work_periods: Array<{start: number, end: number, topic: string}>
}
```

**UI Display:**
- Timeline view showing momentum changes
- Color-coded segments (green=fast, yellow=steady, red=blocked)
- Focus score gauge on session detail page

#### 2. Code Quality Signals

**Data Structure:**
```typescript
interface CodeQualitySignals {
  refactoring_count: number  // How many refactors done
  test_coverage_mentions: string[]  // Tests written/discussed
  bug_fixes: Array<{file: string, description: string}>
  tech_debt_added: string[]  // TODOs, hacks, workarounds mentioned
  tech_debt_resolved: string[]  // Debt paid down
}
```

**UI Display:**
- Quality score badge (green/yellow/red)
- Tech debt tracker (added vs resolved)
- Bug fix timeline

#### 3. Learning Curve Tracking

**Data Structure:**
```typescript
interface LearningCurve {
  new_concepts_learned: Array<{concept: string, confidence: number}>
  questions_asked: string[]  // User questions to Claude
  confusion_points: Array<{topic: string, resolved: boolean}>
  aha_moments: string[]  // Key insights/breakthroughs
}
```

**UI Display:**
- Learning graph (concepts over time)
- Confusion heatmap (which topics caused friction)
- Breakthrough timeline

#### 4. Collaboration Signals

**Data Structure:**
```typescript
interface CollaborationSignals {
  pair_programming: boolean  // Detected from conversation style
  code_review_feedback: string[]  // Review comments discussed
  external_references: Array<{type: 'docs' | 'stackoverflow' | 'github', url: string}>
  team_mentions: Array<{person: string, context: string}>
}
```

**UI Display:**
- Collaboration badge (solo vs pair)
- External resources panel (links to docs/SO)
- Team interaction graph

#### 5. Emotional Intelligence

**Data Structure:**
```typescript
interface EmotionalContext {
  frustration_level: number  // 0-1 scale
  confidence_level: number  // 0-1 scale
  energy_level: 'high' | 'medium' | 'low'
  breakthrough_moments: Array<{timestamp: number, description: string}>
  blockers_emotional_impact: Array<{blocker: string, impact: 'high' | 'medium' | 'low'}>
}
```

**UI Display:**
- Emotional journey timeline
- Energy level indicator
- Frustration alerts (suggest breaks)

#### 6. Productivity Metrics

**Data Structure:**
```typescript
interface ProductivityMetrics {
  lines_changed: number  // Approximate from file edits
  files_touched: number
  commits_made: number
  time_to_first_commit: number  // Seconds from session start
  avg_time_between_commits: number
  tool_efficiency: {[tool: string]: {count: number, success_rate: number}}
}
```

**UI Display:**
- Productivity dashboard
- Tool usage heatmap
- Commit velocity graph

#### 7. Context Depth Tracking

**Data Structure:**
```typescript
interface ContextDepth {
  max_call_stack_depth: number  // How deep into nested functions
  abstraction_layers: string[]  // UI → API → Service → DB
  cross_cutting_concerns: string[]  // Auth, logging, error handling
  architectural_patterns: string[]  // MVC, Repository, Factory, etc.
}
```

**UI Display:**
- Architecture layer visualization
- Call stack depth indicator
- Pattern usage badges

