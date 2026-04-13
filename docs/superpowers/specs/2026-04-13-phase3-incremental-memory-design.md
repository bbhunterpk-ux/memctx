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


### Enhanced UI Components

#### 1. Session Timeline View (New Component)

**Location:** `dashboard/src/components/SessionTimeline.tsx`

**Features:**
- Horizontal timeline showing checkpoints as milestones
- Color-coded segments by mood/momentum
- Hover to see checkpoint summary
- Click to expand full checkpoint details
- Visual indicators for breakthroughs, blockers, decisions

**Data Source:** `session_checkpoints` table + `sessions` table

#### 2. Memory Heatmap (New Component)

**Location:** `dashboard/src/components/MemoryHeatmap.tsx`

**Features:**
- Calendar-style heatmap showing session activity
- Color intensity = productivity/focus score
- Hover shows daily summary
- Click to filter sessions by date
- Weekly/monthly aggregation views

**Data Source:** Aggregated from `sessions` table

#### 3. Knowledge Graph Explorer (Enhanced)

**Location:** `dashboard/src/components/GraphExplorer.tsx`

**New Features:**
- Real-time node addition animation (on checkpoint_complete)
- Node size = importance/connection count
- Node color = type (file=blue, concept=green, problem=red)
- Edge thickness = relationship strength
- Filter by confidence level (EXTRACTED/INFERRED/AMBIGUOUS)
- Search nodes by label
- Expand/collapse node clusters

**Data Source:** `graph_nodes` + `graph_edges` tables

#### 4. Focus Score Dashboard (New Component)

**Location:** `dashboard/src/components/FocusScoreDashboard.tsx`

**Features:**
- Gauge showing current session focus score (0-100)
- Trend line over time
- Context switch counter
- Deep work period tracker
- Distraction alerts

**Data Source:** Calculated from checkpoint data

#### 5. Learning Progress Tracker (New Component)

**Location:** `dashboard/src/components/LearningTracker.tsx`

**Features:**
- Concept mastery graph (concepts × confidence)
- Confusion point tracker (resolved vs unresolved)
- Aha moment timeline
- Question frequency analysis
- Recommended learning resources

**Data Source:** `knowledge` table + checkpoint learning data

#### 6. Tech Debt Monitor (New Component)

**Location:** `dashboard/src/components/TechDebtMonitor.tsx`

**Features:**
- Debt added vs resolved chart
- Debt by category (TODO, hack, workaround)
- Aging debt alerts (> 7 days old)
- Debt resolution suggestions
- Link to files with debt

**Data Source:** Extracted from checkpoint code quality signals

#### 7. Emotional Journey View (New Component)

**Location:** `dashboard/src/components/EmotionalJourney.tsx`

**Features:**
- Line graph showing frustration/confidence over time
- Energy level indicator
- Breakthrough moment markers
- Blocker impact visualization
- Break suggestions when frustration high

**Data Source:** Checkpoint emotional context data

#### 8. Productivity Analytics (New Component)

**Location:** `dashboard/src/components/ProductivityAnalytics.tsx`

**Features:**
- Lines changed per hour
- Files touched heatmap
- Commit velocity graph
- Tool efficiency matrix
- Time-to-first-commit tracker
- Productivity score (0-100)

**Data Source:** Checkpoint productivity metrics


### Updated LLM Extraction Schema

To support rich memory features, extend the existing `SessionSummary` interface:

```typescript
interface SessionSummary {
  // ... existing fields (title, status, what_we_did, etc.) ...
  
  // NEW: Session momentum
  momentum?: {
    velocity: 'fast' | 'steady' | 'slow' | 'blocked'
    focus_score: number  // 0-1
    context_switches: number
    deep_work_periods: Array<{start: number, end: number, topic: string}>
  }
  
  // NEW: Code quality signals
  code_quality?: {
    refactoring_count: number
    test_coverage_mentions: string[]
    bug_fixes: Array<{file: string, description: string}>
    tech_debt_added: string[]
    tech_debt_resolved: string[]
  }
  
  // NEW: Learning curve
  learning?: {
    new_concepts_learned: Array<{concept: string, confidence: number}>
    questions_asked: string[]
    confusion_points: Array<{topic: string, resolved: boolean}>
    aha_moments: string[]
  }
  
  // NEW: Collaboration signals
  collaboration?: {
    pair_programming: boolean
    code_review_feedback: string[]
    external_references: Array<{type: string, url: string}>
    team_mentions: Array<{person: string, context: string}>
  }
  
  // NEW: Emotional context
  emotional?: {
    frustration_level: number  // 0-1
    confidence_level: number  // 0-1
    energy_level: 'high' | 'medium' | 'low'
    breakthrough_moments: Array<{timestamp: number, description: string}>
    blockers_emotional_impact: Array<{blocker: string, impact: string}>
  }
  
  // NEW: Productivity metrics
  productivity?: {
    lines_changed: number
    files_touched: number
    commits_made: number
    time_to_first_commit: number
    avg_time_between_commits: number
    tool_efficiency: {[tool: string]: {count: number, success_rate: number}}
  }
  
  // NEW: Context depth
  context_depth?: {
    max_call_stack_depth: number
    abstraction_layers: string[]
    cross_cutting_concerns: string[]
    architectural_patterns: string[]
  }
}
```

**LLM Prompt Update:**

Add to system prompt in `summarizer.ts` and `incremental-summarizer.ts`:

```
Extract rich memory features:

MOMENTUM:
- velocity: fast (rapid progress), steady (consistent), slow (careful), blocked (stuck)
- focus_score: 0-1 (1=single topic, 0=scattered across many)
- context_switches: count of topic/file changes
- deep_work_periods: uninterrupted work on single topic

CODE QUALITY:
- refactoring_count: number of refactors performed
- test_coverage_mentions: tests written/discussed
- bug_fixes: bugs fixed with file and description
- tech_debt_added: TODOs, hacks, workarounds added
- tech_debt_resolved: debt paid down

LEARNING:
- new_concepts_learned: concepts with confidence (0-1)
- questions_asked: user questions to Claude
- confusion_points: topics causing friction (resolved true/false)
- aha_moments: breakthroughs/insights

COLLABORATION:
- pair_programming: detected from conversation style
- code_review_feedback: review comments discussed
- external_references: docs/stackoverflow/github links
- team_mentions: people mentioned with context

EMOTIONAL:
- frustration_level: 0-1 (0=calm, 1=very frustrated)
- confidence_level: 0-1 (0=uncertain, 1=confident)
- energy_level: high/medium/low
- breakthrough_moments: timestamp + description
- blockers_emotional_impact: blocker + impact level

PRODUCTIVITY:
- lines_changed: approximate from edits
- files_touched: count of files modified
- commits_made: git commits during session
- time_to_first_commit: seconds from start
- avg_time_between_commits: average interval
- tool_efficiency: per-tool usage + success rate

CONTEXT DEPTH:
- max_call_stack_depth: deepest nesting level discussed
- abstraction_layers: UI/API/Service/DB layers touched
- cross_cutting_concerns: auth/logging/errors discussed
- architectural_patterns: MVC/Repository/Factory/etc used
```


### API Endpoints for Rich Memory

**Location:** `src/api/memory.ts` (extend existing endpoints)

#### GET /api/memory/momentum/:sessionId

Returns session momentum data for timeline visualization.

```typescript
{
  "session_id": "abc123",
  "checkpoints": [
    {
      "checkpoint_number": 1,
      "velocity": "fast",
      "focus_score": 0.85,
      "context_switches": 2,
      "deep_work_periods": [
        {"start": 1681234567, "end": 1681235567, "topic": "authentication"}
      ]
    }
  ]
}
```

#### GET /api/memory/learning/:projectId

Returns learning progress across all sessions in a project.

```typescript
{
  "project_id": "proj123",
  "concepts": [
    {"concept": "React hooks", "confidence": 0.9, "first_seen": 1681234567, "last_seen": 1681334567}
  ],
  "confusion_points": [
    {"topic": "TypeScript generics", "resolved": true, "session_id": "abc123"}
  ],
  "aha_moments": [
    {"description": "Understood closure scope", "timestamp": 1681234567, "session_id": "abc123"}
  ]
}
```

#### GET /api/memory/tech-debt/:projectId

Returns tech debt tracking data.

```typescript
{
  "project_id": "proj123",
  "debt_added": [
    {"item": "TODO: refactor auth", "session_id": "abc123", "age_days": 3}
  ],
  "debt_resolved": [
    {"item": "Fixed N+1 query", "session_id": "def456", "resolved_at": 1681234567}
  ],
  "debt_score": 42  // 0-100, lower is better
}
```

#### GET /api/memory/productivity/:sessionId

Returns productivity metrics for a session.

```typescript
{
  "session_id": "abc123",
  "lines_changed": 342,
  "files_touched": 8,
  "commits_made": 3,
  "time_to_first_commit": 420,
  "avg_time_between_commits": 600,
  "tool_efficiency": {
    "Edit": {"count": 15, "success_rate": 0.93},
    "Read": {"count": 42, "success_rate": 1.0}
  },
  "productivity_score": 78
}
```

#### GET /api/memory/emotional/:sessionId

Returns emotional journey data.

```typescript
{
  "session_id": "abc123",
  "timeline": [
    {"checkpoint": 1, "frustration": 0.2, "confidence": 0.8, "energy": "high"},
    {"checkpoint": 2, "frustration": 0.6, "confidence": 0.5, "energy": "medium"}
  ],
  "breakthrough_moments": [
    {"timestamp": 1681234567, "description": "Figured out async/await pattern"}
  ],
  "blockers": [
    {"blocker": "CORS errors", "impact": "high"}
  ]
}
```

#### GET /api/memory/heatmap/:projectId

Returns activity heatmap data for calendar view.

```typescript
{
  "project_id": "proj123",
  "dates": {
    "2026-04-01": {"sessions": 2, "productivity_score": 65, "focus_score": 0.7},
    "2026-04-02": {"sessions": 1, "productivity_score": 82, "focus_score": 0.9}
  }
}
```


## Testing Strategy

### Unit Tests

**Location:** `src/services/__tests__/incremental-summarizer.test.ts`

Test cases:
- Checkpoint creation with valid turn range
- Partial transcript building from observations
- Graph extraction and normalization
- Error handling on LLM API failure
- Retry logic with exponential backoff

**Location:** `src/services/__tests__/incremental-checkpoint-queue.test.ts`

Test cases:
- Queue enqueue/dequeue operations
- Concurrency limiting (max 1 concurrent)
- Priority ordering (end-of-session > checkpoint)
- Job retry on failure

### Integration Tests

**Location:** `src/__tests__/integration/incremental-checkpoints.test.ts`

Test scenarios:
1. **Happy path:** 30-turn session creates 3 checkpoints + final summary
2. **Time-based trigger:** Idle session triggers checkpoint after 5 minutes
3. **Hybrid trigger:** Whichever comes first (turns or time)
4. **Checkpoint failure recovery:** Failed checkpoint retries successfully
5. **Session end before checkpoint:** No checkpoints created, final summary runs
6. **Real-time UI updates:** WebSocket broadcasts checkpoint_complete events

### End-to-End Tests

**Location:** `e2e/incremental-memory.spec.ts`

Test flows:
1. Start session → send 10 prompts → verify checkpoint created → check UI update
2. Start session → wait 5 minutes → verify time-based checkpoint
3. Crash worker mid-checkpoint → restart → verify recovery scan
4. View session timeline → verify checkpoints displayed correctly
5. View knowledge graph → verify real-time node additions

### Performance Tests

**Metrics to track:**
- Checkpoint processing time (target: < 5 seconds)
- Queue throughput (checkpoints/minute)
- Database write latency
- WebSocket broadcast latency
- UI render time for graph updates

**Load testing:**
- 10 concurrent sessions with checkpoints
- 100 checkpoints queued simultaneously
- Large transcript (200+ turns) checkpoint processing


## Implementation Phases

### Phase 3A: Core Incremental Engine (Week 1)

**Goal:** Basic checkpoint system working end-to-end

**Tasks:**
1. Database migration (012_incremental_checkpoints.sql)
2. Add checkpoint tracking columns to sessions table
3. Implement incremental-checkpoint-queue.ts
4. Implement incremental-summarizer.ts (basic version)
5. Update hook.ts with trigger logic
6. Add queries for checkpoint CRUD operations
7. Unit tests for core components

**Success Criteria:**
- Checkpoint created after 10 turns
- Checkpoint stored in database
- Graph nodes/edges inserted correctly
- No regression in end-of-session summarization

### Phase 3B: Rich Memory Features (Week 2)

**Goal:** Extract and store enhanced memory dimensions

**Tasks:**
1. Extend SessionSummary interface with new fields
2. Update LLM prompt to extract rich features
3. Add database columns for new memory types
4. Implement API endpoints for rich memory
5. Unit tests for new extraction logic

**Success Criteria:**
- Momentum, learning, emotional data extracted
- Code quality and productivity metrics calculated
- API endpoints return correct data
- No significant increase in LLM processing time

### Phase 3C: Real-time UI Updates (Week 3)

**Goal:** Live dashboard updates as checkpoints complete

**Tasks:**
1. Implement WebSocket broadcast for checkpoint_complete
2. Update frontend to listen for checkpoint events
3. Build SessionTimeline component
4. Build MemoryHeatmap component
5. Enhance GraphExplorer with real-time updates
6. Add notification system for checkpoints

**Success Criteria:**
- Graph updates in real-time (no page refresh)
- Timeline shows checkpoints as they complete
- Notifications appear on checkpoint completion
- No UI performance degradation

### Phase 3D: Advanced UI Components (Week 4)

**Goal:** Rich visualization of memory features

**Tasks:**
1. Build FocusScoreDashboard component
2. Build LearningTracker component
3. Build TechDebtMonitor component
4. Build EmotionalJourney component
5. Build ProductivityAnalytics component
6. Integrate all components into project detail page

**Success Criteria:**
- All 8 new UI components functional
- Data flows correctly from API to UI
- Responsive design on mobile/tablet
- Accessible (WCAG 2.1 AA)

### Phase 3E: Polish & Optimization (Week 5)

**Goal:** Production-ready with cost optimizations

**Tasks:**
1. Implement adaptive thresholds (10→15→20 turns)
2. Add configuration toggles (graph extraction, turn threshold)
3. Optimize LLM prompts for token efficiency
4. Add recovery scan on startup
5. Performance testing and optimization
6. Documentation and user guide

**Success Criteria:**
- API costs < 2x Phase 1 baseline
- Checkpoint processing < 5 seconds
- Zero data loss on crashes
- Feature flag system working
- Comprehensive documentation


## Success Metrics

### Technical Metrics

1. **Reliability**
   - Checkpoint success rate: > 99%
   - Recovery success rate: 100% (no data loss)
   - Uptime: > 99.9%

2. **Performance**
   - Checkpoint processing time: < 5 seconds (p95)
   - Queue latency: < 1 second
   - UI update latency: < 500ms
   - Database write latency: < 100ms

3. **Cost Efficiency**
   - API cost increase: < 2.5x vs Phase 1
   - Token usage per checkpoint: < 10k tokens
   - Storage growth: < 10MB per 100 sessions

### User Experience Metrics

1. **Engagement**
   - Dashboard views per session: +50% vs Phase 1
   - Time spent on memory views: +100%
   - Feature adoption rate: > 60% within 30 days

2. **Satisfaction**
   - User feedback score: > 4.5/5
   - Feature request rate: < 10% (indicates completeness)
   - Bug report rate: < 5 per 1000 sessions

3. **Utility**
   - Memory recall accuracy: > 90% (user survey)
   - Context recovery time: < 2 minutes (vs 10+ minutes manual)
   - Session resumption success: > 95%

## Risks & Mitigations

### Risk 1: High API Costs

**Impact:** High  
**Probability:** Medium

**Mitigation:**
- Implement adaptive thresholds (increase after first checkpoint)
- Add cost monitoring dashboard
- Allow users to disable graph extraction in checkpoints
- Provide cost estimates in UI before enabling feature

### Risk 2: LLM Extraction Quality Degradation

**Impact:** High  
**Probability:** Low

**Mitigation:**
- A/B test prompts before deployment
- Monitor extraction accuracy metrics
- Implement fallback to simpler extraction on failure
- Allow manual correction of extracted data

### Risk 3: Database Growth

**Impact:** Medium  
**Probability:** Medium

**Mitigation:**
- Implement checkpoint pruning (keep last 10 per session)
- Compress old checkpoint data
- Add database size monitoring
- Provide cleanup tools for old sessions

### Risk 4: UI Performance with Large Graphs

**Impact:** Medium  
**Probability:** Medium

**Mitigation:**
- Implement graph virtualization (render visible nodes only)
- Add pagination for large node lists
- Lazy load checkpoint details
- Optimize WebSocket message size

### Risk 5: Race Conditions in Concurrent Checkpoints

**Impact:** High  
**Probability:** Low

**Mitigation:**
- Queue serialization (concurrency: 1)
- Database UNIQUE constraints prevent duplicates
- Idempotent checkpoint operations
- Comprehensive integration tests


## Future Enhancements (Post-Phase 3)

### 1. Predictive Checkpointing

Use ML to predict optimal checkpoint timing based on:
- Session complexity patterns
- User working style
- Topic change detection
- Natural break points in conversation

### 2. Differential Checkpoints

Instead of full summaries, store only deltas:
- Reduces storage by ~70%
- Faster processing
- Requires reconstruction logic for queries

### 3. Multi-Session Context Linking

Link related sessions across time:
- "Continued from session X"
- "Related to sessions Y, Z"
- Cross-session graph merging
- Project-level memory consolidation

### 4. Collaborative Memory

Share memory across team members:
- Team knowledge graph
- Shared learning curves
- Collective tech debt tracking
- Team productivity analytics

### 5. Memory Export/Import

Export memory to portable formats:
- JSON export for backup
- Markdown reports for documentation
- CSV for analytics tools
- Import from other tools (Linear, Jira, etc.)

### 6. AI-Powered Insights

Proactive suggestions based on memory:
- "You struggled with X last time, here's a tip"
- "This pattern worked well in session Y"
- "Tech debt in file Z is aging, consider addressing"
- "Your focus score is low, take a break?"

### 7. Voice Annotations

Add voice notes to checkpoints:
- Quick verbal summaries
- Context that's hard to type
- Emotional tone capture
- Transcription + sentiment analysis

## Conclusion

Phase 3 transforms MemCTX from a passive end-of-session recorder to an active real-time memory engine. By processing memory incrementally and extracting rich contextual features, we provide:

1. **Better crash resilience** - Memory saved every 10 turns/5 minutes
2. **Real-time feedback** - Users see memory forming as they work
3. **Richer insights** - 7 new memory dimensions beyond basic summaries
4. **Enhanced UI** - 8 new visualization components
5. **Better context** - AI can reference recent checkpoints during long sessions

**Trade-offs:**
- 2.1x higher API costs (mitigated with adaptive thresholds)
- More complex state management
- Increased database storage

**Next Steps:**
1. Review and approve this design specification
2. Create detailed implementation plan (writing-plans skill)
3. Begin Phase 3A implementation (core incremental engine)

---

**Document Status:** Ready for Review  
**Estimated Implementation Time:** 5 weeks  
**Estimated API Cost Impact:** 2.1x (optimizable to 1.5x)

