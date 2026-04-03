# ClaudeContext v2.0 Upgrade Roadmap

## Executive Summary

This roadmap outlines the upgrade path from ClaudeContext v1.0 (current) to v2.0 (world-class context-aware memory system). The upgrade is divided into 6 phases, each deliverable independently, with estimated effort and dependencies clearly marked.

**Current Status:** v1.0 - Basic session tracking and summarization working
**Target:** v2.0 - Advanced memory consolidation, semantic search, smart briefings, and enhanced context injection

---

## Upgrade Overview

### What's Being Added

| Category | v1.0 (Current) | v2.0 (Target) |
|----------|----------------|---------------|
| **Session Fields** | 7 basic fields | 14 fields (mood, complexity, blockers, key_insight) |
| **Memory Consolidation** | None | Full merge with conflict detection |
| **Memory Decay** | None | Daily decay with configurable rates |
| **Task Tracking** | Per-session only | Cross-session lifecycle tracking |
| **Context Injection** | 3 sessions, flat | 5 sessions + smart briefing + structured |
| **Compaction Strategy** | Last 60 turns | Smart: opening + important + recent |
| **Summary Tokens** | 1500 | 2500 |
| **Queue System** | Single queue | 3 priority queues |
| **Error Handling** | Basic try/catch | Retry with backoff + fallback |
| **Health Monitoring** | Basic | Full stats + memory health score |
| **CLAUDE.md Format** | Plain text | Rich formatted with tables |
| **Smart Briefing** | None | AI-synthesized session briefing |

---

## Phase Breakdown

### Phase 1: Database Schema Enhancements
**Effort:** 2-3 hours  
**Dependencies:** None  
**Risk:** Low

### Phase 2: Enhanced Summarization
**Effort:** 4-5 hours  
**Dependencies:** Phase 1  
**Risk:** Medium (AI prompt changes)

### Phase 3: Memory Consolidation Engine
**Effort:** 6-8 hours  
**Dependencies:** Phase 1, Phase 2  
**Risk:** Medium (complex logic)

### Phase 4: Smart Context Injection
**Effort:** 3-4 hours  
**Dependencies:** Phase 2, Phase 3  
**Risk:** Low

### Phase 5: Advanced Features
**Effort:** 5-6 hours  
**Dependencies:** Phase 3  
**Risk:** Medium (memory decay, task matching)

### Phase 6: Performance & Monitoring
**Effort:** 2-3 hours  
**Dependencies:** All previous phases  
**Risk:** Low

**Total Estimated Effort:** 22-29 hours

---

## Detailed Phase Plans

Will be added in next steps...


## Phase 1: Database Schema Enhancements

### Objective
Add new fields to sessions table and create indexes for performance.

### Tasks

#### 1.1 Create Migration File
**File:** `src/db/migrations/003_enhance_sessions_schema.sql`

```sql
-- Add new session fields
ALTER TABLE sessions ADD COLUMN summary_mood TEXT;
ALTER TABLE sessions ADD COLUMN summary_complexity INTEGER;
ALTER TABLE sessions ADD COLUMN summary_blockers TEXT;
ALTER TABLE sessions ADD COLUMN summary_resolved TEXT;
ALTER TABLE sessions ADD COLUMN summary_key_insight TEXT;
ALTER TABLE sessions ADD COLUMN duration_seconds INTEGER;
ALTER TABLE sessions ADD COLUMN embedding_summary TEXT;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_sessions_project_ended ON sessions(project_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_summary_status ON sessions(summary_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_confidence ON knowledge_items(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_success ON learned_patterns(success_count DESC);
```

#### 1.2 Update TypeScript Types
**File:** `src/db/schema.ts`

Add new fields to sessions table definition:
- summary_mood
- summary_complexity
- summary_blockers
- summary_resolved
- summary_key_insight
- duration_seconds
- embedding_summary

#### 1.3 Apply Migration
```bash
sqlite3 ~/.claudectx/db.sqlite < src/db/migrations/003_enhance_sessions_schema.sql
```

#### 1.4 Update Queries
**File:** `src/db/queries.ts`

Update session insert/update functions to handle new fields.

### Testing
- Verify migration applies without errors
- Check all indexes are created
- Test session creation with new fields
- Verify backward compatibility (old sessions still work)

### Rollback Plan
```sql
-- Remove new columns
ALTER TABLE sessions DROP COLUMN summary_mood;
ALTER TABLE sessions DROP COLUMN summary_complexity;
-- ... etc

-- Drop indexes
DROP INDEX IF EXISTS idx_sessions_project_ended;
-- ... etc
```

---

## Phase 2: Enhanced Summarization

### Objective
Upgrade AI summarization to extract mood, complexity, blockers, key insights, and use smart compaction.

### Tasks

#### 2.1 Implement Smart Transcript Compaction
**File:** `src/services/transcript-compactor.ts` (new)

```typescript
export function smartCompact(turns: Turn[]): string {
  // Keep first 10 turns (opening context)
  const opening = turns.slice(0, 10)
  
  // Keep last 40 turns (recent work)
  const recent = turns.slice(-40)
  
  // From middle, keep only important turns
  const middle = turns.slice(10, -40)
  const important = middle.filter(isImportant)
  
  return [...opening, ...important, ...recent]
    .map(formatTurn)
    .join('\n')
}

function isImportant(turn: Turn): boolean {
  // Keep turns with errors, decisions, or key actions
  if (turn.type === 'tool_use' && ['Write', 'Edit'].includes(turn.name)) return true
  if (turn.content?.includes('error') || turn.content?.includes('Error')) return true
  if (turn.content?.includes('decided') || turn.content?.includes('chose')) return true
  return false
}
```

#### 2.2 Update AI Prompt
**File:** `src/services/summarizer.ts`

Enhance system prompt to extract:
```typescript
system: `You are a memory extraction system. Analyze the session and extract:

1. Session summary (what was done)
2. Session mood: 'productive' | 'struggling' | 'exploratory' | 'debugging'
3. Complexity score: 1-5 (1=trivial, 5=very complex)
4. Active blockers: issues preventing progress
5. Resolved issues: problems solved this session
6. Key insight: single most important learning
7. User preferences discovered
8. Domain knowledge learned
9. Problem-solving patterns used
10. Pending tasks identified

Return ONLY valid JSON matching the exact schema.`
```

Update JSON schema to include new fields:
```json
{
  "mood": "productive",
  "complexity": 3,
  "blockers": ["Waiting for API key from DevOps"],
  "resolved": ["Fixed race condition in token refresh"],
  "key_insight": "JWT_SECRET must be set in .env.test or tests silently pass"
}
```

#### 2.3 Increase Token Limit
Change `summaryMaxTokens` from 1500 to 2500 in config.

#### 2.4 Update Summary Storage
**File:** `src/services/summarizer.ts`

Store new fields in database:
```typescript
queries.updateSession(sessionId, {
  summary_mood: summary.mood,
  summary_complexity: summary.complexity,
  summary_blockers: JSON.stringify(summary.blockers),
  summary_resolved: JSON.stringify(summary.resolved),
  summary_key_insight: summary.key_insight,
  duration_seconds: Math.floor((Date.now() - session.started_at) / 1000)
})
```

### Testing
- Test with short session (< 10 turns)
- Test with medium session (30-60 turns)
- Test with long session (100+ turns)
- Verify all new fields are extracted
- Check mood classification accuracy
- Validate complexity scoring

### Rollback Plan
- Revert summarizer.ts to v1.0
- New fields will be NULL (backward compatible)

---

## Phase 3: Memory Consolidation Engine

### Objective
Implement automatic memory merging, conflict detection, and confidence adjustment across sessions.

### Tasks

#### 3.1 Create Consolidation Service
**File:** `src/services/consolidator.ts` (new)

```typescript
export async function consolidateMemory(projectId: string) {
  console.log('[Consolidator] Starting memory consolidation for project', projectId)
  
  // 1. Merge duplicate preferences
  await mergePreferences(projectId)
  
  // 2. Merge duplicate knowledge
  await mergeKnowledge(projectId)
  
  // 3. Reinforce patterns
  await reinforcePatterns(projectId)
  
  // 4. Match and update tasks
  await matchTasks(projectId)
  
  // 5. Update memory metadata
  await updateMemoryMetadata(projectId)
  
  console.log('[Consolidator] Consolidation complete')
}
```

#### 3.2 Implement Preference Merging
```typescript
async function mergePreferences(projectId: string) {
  const prefs = queries.getPreferences(projectId)
  
  // Group by category + key
  const groups = groupBy(prefs, p => `${p.category}:${p.key}`)
  
  for (const [key, group] of Object.entries(groups)) {
    if (group.length === 1) continue
    
    // Check for conflicts
    const values = [...new Set(group.map(p => p.value))]
    
    if (values.length > 1) {
      // Conflict detected - keep highest confidence
      const winner = group.reduce((a, b) => 
        a.confidence > b.confidence ? a : b
      )
      
      // Delete others
      for (const pref of group) {
        if (pref.id !== winner.id) {
          queries.deletePreference(pref.id)
        }
      }
    } else {
      // Same value - merge and increase confidence
      const avgConfidence = group.reduce((sum, p) => sum + p.confidence, 0) / group.length
      const newConfidence = Math.min(1.0, avgConfidence + 0.1)
      
      queries.updatePreference(group[0].id, {
        confidence: newConfidence,
        updated_at: Date.now()
      })
      
      // Delete duplicates
      for (const pref of group.slice(1)) {
        queries.deletePreference(pref.id)
      }
    }
  }
}
```

#### 3.3 Implement Knowledge Merging
```typescript
async function mergeKnowledge(projectId: string) {
  const items = queries.getKnowledge(projectId)
  
  // Find similar topics using fuzzy matching
  const groups = findSimilarKnowledge(items)
  
  for (const group of groups) {
    if (group.length === 1) continue
    
    // Merge content
    const merged = {
      topic: group[0].topic,
      content: group.map(k => k.content).join('. '),
      confidence: Math.max(...group.map(k => k.confidence)),
      access_count: group.reduce((sum, k) => sum + k.access_count, 0)
    }
    
    // Update first, delete rest
    queries.updateKnowledge(group[0].id, merged)
    for (const item of group.slice(1)) {
      queries.deleteKnowledge(item.id)
    }
  }
}
```

#### 3.4 Implement Pattern Reinforcement
```typescript
async function reinforcePatterns(projectId: string) {
  const patterns = queries.getPatterns(projectId)
  
  for (const pattern of patterns) {
    const successRate = pattern.success_count / (pattern.success_count + pattern.failure_count)
    
    // Upgrade effectiveness tier based on usage
    if (pattern.success_count >= 5 && successRate > 0.8) {
      queries.updatePattern(pattern.id, {
        effectiveness_tier: 'proven'
      })
    } else if (pattern.success_count >= 2 && successRate > 0.6) {
      queries.updatePattern(pattern.id, {
        effectiveness_tier: 'working'
      })
    }
  }
}
```

#### 3.5 Implement Task Matching
```typescript
async function matchTasks(projectId: string) {
  const tasks = queries.getTasks(projectId)
  
  // Find similar tasks using fuzzy matching
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const similarity = fuzzyMatch(tasks[i].title, tasks[j].title)
      
      if (similarity > 0.8) {
        // Merge tasks
        const merged = {
          title: tasks[i].title,
          description: [tasks[i].description, tasks[j].description].filter(Boolean).join('\n\n'),
          status: tasks[i].status === 'completed' ? 'completed' : tasks[j].status,
          priority: Math.max(priorityToNumber(tasks[i].priority), priorityToNumber(tasks[j].priority))
        }
        
        queries.updateTask(tasks[i].id, merged)
        queries.deleteTask(tasks[j].id)
      }
    }
  }
}
```

#### 3.6 Schedule Consolidation
**File:** `src/services/scheduler.ts` (new)

```typescript
import cron from 'node-cron'

export function startConsolidationScheduler() {
  // Run consolidation daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Running daily memory consolidation')
    
    const projects = queries.getAllProjects()
    
    for (const project of projects) {
      try {
        await consolidateMemory(project.id)
      } catch (err) {
        console.error(`[Scheduler] Consolidation failed for project ${project.id}:`, err)
      }
    }
  })
}
```

### Testing
- Create duplicate preferences and verify merge
- Create similar knowledge items and verify merge
- Test conflict detection (different values for same key)
- Verify confidence increases on reconfirmation
- Test task fuzzy matching
- Run consolidation manually and check results

### Rollback Plan
- Consolidation is non-destructive (can be disabled)
- Backup database before first run
- Add flag to disable: `CLAUDECTX_DISABLE_CONSOLIDATION=1`

---


## Phase 4: Smart Context Injection

### Objective
Enhance context injection with smart briefings, structured formatting, and priority-based ordering.

### Tasks

#### 4.1 Create Smart Briefing Generator
**File:** `src/services/briefing-generator.ts` (new)

```typescript
export async function generateSmartBriefing(
  sessions: Session[],
  projectId: string
): Promise<string> {
  // Get last 3 sessions
  const recent = sessions.slice(0, 3)
  
  // Build compact summary
  const summaries = recent.map(s => ({
    title: s.summary_title,
    status: s.summary_status,
    what_we_did: parseJsonField(s.summary_what_we_did),
    key_insight: s.summary_key_insight,
    blockers: parseJsonField(s.summary_blockers)
  }))
  
  // Call AI to synthesize briefing
  const client = getClient()
  const response = await client.messages.create({
    model: 'AWS',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Synthesize these 3 recent sessions into a 3-5 sentence briefing for the developer:

${JSON.stringify(summaries, null, 2)}

Focus on: current project state, open blockers, key insights to remember.
Be concise and actionable.`
    }]
  })
  
  return response.content[0].text
}
```

#### 4.2 Enhance Context Builder
**File:** `src/services/context-builder.ts`

```typescript
export async function buildContextMarkdown(
  cwd: string,
  numSessions: number = 5
): Promise<string> {
  const project = await detectProject(cwd)
  const sessions = queries.getRecentCompletedSessions(project.id, numSessions)
  const memory = queries.getProjectMemory(project.id)
  
  let markdown = '=== ClaudeContext Memory ===\n\n'
  
  // 1. Smart Briefing
  const briefing = await generateSmartBriefing(sessions, project.id)
  markdown += `## 🧠 Smart Briefing\n${briefing}\n\n`
  
  // 2. Project State
  markdown += `## 📊 Project State\n`
  markdown += `Project: "${project.name}"\n`
  markdown += `Last active: ${formatRelativeTime(sessions[0]?.ended_at)}\n`
  markdown += `Status: ${sessions[0]?.summary_status?.toUpperCase() || 'UNKNOWN'}\n\n`
  
  // 3. Active Blockers (CRITICAL - show first)
  const blockers = sessions
    .flatMap(s => parseJsonField(s.summary_blockers))
    .filter(Boolean)
  
  if (blockers.length > 0) {
    markdown += `## 🚨 Active Blockers\n`
    blockers.forEach(b => markdown += `- ${b}\n`)
    markdown += '\n'
  }
  
  // 4. Recent Sessions (formatted)
  markdown += `## 📋 Last ${sessions.length} Sessions\n\n`
  
  for (const session of sessions) {
    markdown += `### ${formatRelativeTime(session.ended_at)}: "${session.summary_title}"\n`
    markdown += `- **Status:** ${session.summary_status}\n`
    
    const whatWeDid = parseJsonField(session.summary_what_we_did)
    if (whatWeDid.length > 0) {
      markdown += `- **Did:** ${whatWeDid.join(', ')}\n`
    }
    
    const nextSteps = parseJsonField(session.summary_next_steps)
    if (nextSteps.length > 0) {
      markdown += `- **Next:** ${nextSteps.join(', ')}\n`
    }
    
    if (session.summary_key_insight) {
      markdown += `- **💡 Key Insight:** ${session.summary_key_insight}\n`
    }
    
    markdown += '\n'
  }
  
  // 5. Open Tasks (sorted by priority)
  const tasks = memory.tasks
    .filter(t => ['pending', 'in_progress'].includes(t.status))
    .sort((a, b) => priorityToNumber(b.priority) - priorityToNumber(a.priority))
  
  if (tasks.length > 0) {
    markdown += `## ✅ Open Tasks\n`
    tasks.forEach(t => {
      markdown += `- [${t.priority.toUpperCase()}] ${t.title}\n`
      if (t.description) markdown += `  ${t.description}\n`
    })
    markdown += '\n'
  }
  
  // 6. Your Preferences (top 5 by confidence)
  const topPrefs = memory.preferences
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
  
  if (topPrefs.length > 0) {
    markdown += `## 🧬 Your Preferences\n`
    topPrefs.forEach(p => {
      markdown += `- ${p.key}: ${p.value}\n`
    })
    markdown += '\n'
  }
  
  // 7. Domain Knowledge (top 5 by confidence)
  const topKnowledge = memory.knowledge
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
  
  if (topKnowledge.length > 0) {
    markdown += `## ⚡ Domain Knowledge\n`
    topKnowledge.forEach(k => {
      markdown += `- ${k.topic}: ${k.content}\n`
    })
    markdown += '\n'
  }
  
  // 8. Problem-Solving Patterns (proven ones only)
  const provenPatterns = memory.patterns
    .filter(p => p.success_count >= 3)
    .sort((a, b) => b.success_count - a.success_count)
    .slice(0, 3)
  
  if (provenPatterns.length > 0) {
    markdown += `## 🔄 Proven Patterns\n`
    provenPatterns.forEach(p => {
      markdown += `- ${p.title}: ${p.description}\n`
    })
    markdown += '\n'
  }
  
  markdown += '=== End ClaudeContext Memory ==='
  
  return markdown
}
```

#### 4.3 Update CLAUDE.md Format
**File:** `src/services/claude-md-updater.ts`

```typescript
export async function updateClaudeMd(
  projectPath: string,
  session: Session,
  summary: SessionSummary
) {
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md')
  
  const block = `## Recent session history (auto-updated by ClaudeContext)

**Last session:** ${summary.title} — ${summary.status.toUpperCase()}

| What We Did | Next Steps | Key Insight |
|-------------|------------|-------------|
| ${parseJsonField(session.summary_what_we_did).join(', ')} | ${parseJsonField(session.summary_next_steps).join(', ')} | ${session.summary_key_insight || 'N/A'} |

${session.summary_blockers && parseJsonField(session.summary_blockers).length > 0 ? `
**🚨 Active Blockers:**
${parseJsonField(session.summary_blockers).map(b => `- ${b}`).join('\n')}
` : ''}

_Updated automatically. View full history at http://localhost:8000_`

  // Inject or replace
  let content = ''
  if (fs.existsSync(claudeMdPath)) {
    content = await fs.readFile(claudeMdPath, 'utf-8')
  }
  
  const startMarker = '<!-- CLAUDECTX:START -->'
  const endMarker = '<!-- CLAUDECTX:END -->'
  
  if (content.includes(startMarker)) {
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g')
    content = content.replace(regex, `${startMarker}\n${block}\n${endMarker}`)
  } else {
    content = `\n\n${startMarker}\n${block}\n${endMarker}\n\n${content}`
  }
  
  await fs.writeFile(claudeMdPath, content, 'utf-8')
}
```

### Testing
- Generate smart briefing for 3 sessions
- Verify briefing is concise (3-5 sentences)
- Check context markdown formatting
- Verify blockers appear first
- Test with no blockers, no tasks
- Validate CLAUDE.md table format

### Rollback Plan
- Revert context-builder.ts to v1.0
- Smart briefing is optional (can be disabled)

---

## Phase 5: Advanced Features

### Objective
Implement memory decay, fuzzy task matching, and global preferences.

### Tasks

#### 5.1 Implement Memory Decay
**File:** `src/services/memory-decay.ts` (new)

```typescript
export async function applyMemoryDecay(projectId: string) {
  const now = Math.floor(Date.now() / 1000)
  const DECAY_RATE = 0.01 // 1% per day
  const DECAY_THRESHOLD = 0.3 // Soft-delete below this
  
  // Decay preferences
  const prefs = queries.getPreferences(projectId)
  for (const pref of prefs) {
    const daysSinceUpdate = (now - pref.updated_at) / 86400
    const decayAmount = DECAY_RATE * daysSinceUpdate
    const newConfidence = Math.max(0, pref.confidence - decayAmount)
    
    if (newConfidence < DECAY_THRESHOLD) {
      // Soft delete (mark as archived)
      queries.updatePreference(pref.id, { archived: true })
    } else {
      queries.updatePreference(pref.id, { confidence: newConfidence })
    }
  }
  
  // Decay knowledge
  const knowledge = queries.getKnowledge(projectId)
  for (const item of knowledge) {
    const daysSinceAccess = item.last_accessed_at 
      ? (now - item.last_accessed_at) / 86400
      : (now - item.created_at) / 86400
    
    const decayAmount = DECAY_RATE * daysSinceAccess
    const newConfidence = Math.max(0, item.confidence - decayAmount)
    
    if (newConfidence < DECAY_THRESHOLD) {
      queries.updateKnowledge(item.id, { archived: true })
    } else {
      queries.updateKnowledge(item.id, { confidence: newConfidence })
    }
  }
}
```

#### 5.2 Implement Fuzzy Task Matching
**File:** `src/utils/fuzzy-match.ts` (new)

```typescript
import Fuse from 'fuse.js'

export function fuzzyMatch(str1: string, str2: string): number {
  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLen = Math.max(str1.length, str2.length)
  return 1 - (distance / maxLen)
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

export function findSimilarTasks(tasks: Task[], threshold: number = 0.8): Task[][] {
  const groups: Task[][] = []
  const used = new Set<string>()
  
  for (let i = 0; i < tasks.length; i++) {
    if (used.has(tasks[i].id)) continue
    
    const group = [tasks[i]]
    used.add(tasks[i].id)
    
    for (let j = i + 1; j < tasks.length; j++) {
      if (used.has(tasks[j].id)) continue
      
      const similarity = fuzzyMatch(tasks[i].title, tasks[j].title)
      if (similarity >= threshold) {
        group.push(tasks[j])
        used.add(tasks[j].id)
      }
    }
    
    if (group.length > 1) {
      groups.push(group)
    }
  }
  
  return groups
}
```

#### 5.3 Add Global Preferences Support
**File:** `src/db/migrations/004_add_global_preferences.sql`

```sql
-- Add scope field to preferences
ALTER TABLE preferences ADD COLUMN scope TEXT DEFAULT 'project';

-- Add scope field to patterns
ALTER TABLE learned_patterns ADD COLUMN scope TEXT DEFAULT 'project';

-- Create index
CREATE INDEX IF NOT EXISTS idx_preferences_scope ON preferences(scope);
CREATE INDEX IF NOT EXISTS idx_patterns_scope ON learned_patterns(scope);
```

Update queries to support global scope:
```typescript
export function getPreferences(projectId: string, includeGlobal: boolean = true) {
  if (includeGlobal) {
    return db
      .select()
      .from(preferences)
      .where(
        or(
          eq(preferences.project_id, projectId),
          eq(preferences.scope, 'global')
        )
      )
      .all()
  } else {
    return db
      .select()
      .from(preferences)
      .where(eq(preferences.project_id, projectId))
      .all()
  }
}
```

#### 5.4 Schedule Memory Decay
Add to scheduler:
```typescript
// Run decay daily at 4 AM
cron.schedule('0 4 * * *', async () => {
  console.log('[Scheduler] Running daily memory decay')
  
  const projects = queries.getAllProjects()
  
  for (const project of projects) {
    try {
      await applyMemoryDecay(project.id)
    } catch (err) {
      console.error(`[Scheduler] Decay failed for project ${project.id}:`, err)
    }
  }
})
```

### Testing
- Test memory decay with old preferences
- Verify soft-delete at threshold
- Test fuzzy task matching with similar titles
- Test global preferences across projects
- Run decay manually and verify results

### Rollback Plan
- Decay can be disabled: `CLAUDECTX_DISABLE_DECAY=1`
- Global preferences are backward compatible
- Fuzzy matching is optional

---


## Phase 6: Performance & Monitoring

### Objective
Add priority queues, retry logic, health monitoring, and structured logging.

### Tasks

#### 6.1 Implement Priority Queue System
**File:** `src/services/queue.ts`

```typescript
import PQueue from 'p-queue'

// Three separate queues by priority
const highPriorityQueue = new PQueue({ concurrency: 1 })
const mediumPriorityQueue = new PQueue({ concurrency: 1 })
const lowPriorityQueue = new PQueue({ concurrency: 1 })

export function enqueue(
  fn: () => Promise<void>,
  priority: 'high' | 'medium' | 'low' = 'medium'
) {
  switch (priority) {
    case 'high':
      return highPriorityQueue.add(fn)
    case 'medium':
      return mediumPriorityQueue.add(fn)
    case 'low':
      return lowPriorityQueue.add(fn)
  }
}

export function getQueueStats() {
  return {
    high: {
      size: highPriorityQueue.size,
      pending: highPriorityQueue.pending
    },
    medium: {
      size: mediumPriorityQueue.size,
      pending: mediumPriorityQueue.pending
    },
    low: {
      size: lowPriorityQueue.size,
      pending: lowPriorityQueue.pending
    }
  }
}
```

Usage:
```typescript
// High priority: session end summarization
enqueue(() => summarizeSession(sessionId, transcriptPath, projectId), 'high')

// Medium priority: memory consolidation
enqueue(() => consolidateMemory(projectId), 'medium')

// Low priority: memory decay
enqueue(() => applyMemoryDecay(projectId), 'low')
```

#### 6.2 Add Retry Logic with Backoff
**File:** `src/services/summarizer.ts`

```typescript
async function summarizeSessionWithRetry(
  sessionId: string,
  transcriptPath: string,
  projectId: string,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await summarizeSession(sessionId, transcriptPath, projectId)
      return // Success
    } catch (err) {
      lastError = err
      console.error(`[Summarizer] Attempt ${attempt}/${maxRetries} failed:`, err)
      
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delayMs = Math.pow(2, attempt) * 1000
        console.log(`[Summarizer] Retrying in ${delayMs}ms...`)
        await sleep(delayMs)
      }
    }
  }
  
  // All retries failed - fallback to transcript-only summary
  console.error('[Summarizer] All retries failed, using transcript-only fallback')
  await fallbackSummary(sessionId, transcriptPath, projectId)
}

async function fallbackSummary(
  sessionId: string,
  transcriptPath: string,
  projectId: string
) {
  // Generate basic summary from transcript without AI
  const turns = await readTranscript(transcriptPath)
  
  const toolCalls = turns.filter(t => t.type === 'tool_use')
  const files = [...new Set(toolCalls.map(t => t.input?.file_path).filter(Boolean))]
  
  queries.updateSession(sessionId, {
    summary_title: 'Session Summary (Fallback)',
    summary_status: 'completed',
    summary_what_we_did: JSON.stringify([`Used ${toolCalls.length} tools`]),
    summary_files_changed: JSON.stringify(files),
    summary_next_steps: JSON.stringify([]),
    summary_gotchas: JSON.stringify([])
  })
}
```

#### 6.3 Enhanced Health Endpoint
**File:** `src/api/health.ts`

```typescript
export const healthRouter = Router()

healthRouter.get('/', async (req, res) => {
  const uptime = process.uptime()
  const queueStats = getQueueStats()
  
  // Database stats
  const sessionCount = queries.getSessionCount()
  const activeSessionCount = queries.getActiveSessionCount()
  const projectCount = queries.getProjectCount()
  
  // Memory stats
  const memoryStats = queries.getMemoryStats()
  
  // Queue health
  const totalPending = queueStats.high.pending + queueStats.medium.pending + queueStats.low.pending
  const queueHealth = totalPending < 10 ? 'healthy' : totalPending < 50 ? 'degraded' : 'critical'
  
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime: Math.floor(uptime),
    
    database: {
      status: 'connected',
      sessions: {
        total: sessionCount,
        active: activeSessionCount
      },
      projects: projectCount
    },
    
    memory: {
      preferences: memoryStats.preferences,
      knowledge: memoryStats.knowledge,
      patterns: memoryStats.patterns,
      tasks: memoryStats.tasks,
      contacts: memoryStats.contacts,
      health_score: calculateMemoryHealthScore(memoryStats)
    },
    
    queue: {
      status: queueHealth,
      high: queueStats.high,
      medium: queueStats.medium,
      low: queueStats.low,
      total_pending: totalPending
    },
    
    api: {
      key_configured: !!CONFIG.apiKey,
      summaries_enabled: !CONFIG.disableSummaries
    }
  })
})

function calculateMemoryHealthScore(stats: MemoryStats): string {
  const total = stats.preferences + stats.knowledge + stats.patterns
  
  if (total === 0) return 'empty'
  if (total < 5) return 'sparse'
  if (total < 20) return 'building'
  if (total < 50) return 'good'
  return 'excellent'
}
```

#### 6.4 Structured Logging
**File:** `src/utils/logger.ts` (new)

```typescript
export class Logger {
  private context: string
  
  constructor(context: string) {
    this.context = context
  }
  
  private format(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString()
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`
  }
  
  info(message: string, meta?: any) {
    console.log(this.format('INFO', message, meta))
  }
  
  error(message: string, meta?: any) {
    console.error(this.format('ERROR', message, meta))
  }
  
  warn(message: string, meta?: any) {
    console.warn(this.format('WARN', message, meta))
  }
  
  debug(message: string, meta?: any) {
    if (process.env.DEBUG) {
      console.debug(this.format('DEBUG', message, meta))
    }
  }
}

// Usage
const logger = new Logger('Summarizer')
logger.info('Starting summarization', { sessionId, projectId })
logger.error('Summarization failed', { sessionId, error: err.message })
```

Replace all `console.log` with structured logging:
```typescript
// Before
console.log('[Summarizer] Starting summarization for session', sessionId)

// After
logger.info('Starting summarization', { sessionId, projectId })
```

#### 6.5 Add Monitoring Metrics
**File:** `src/services/metrics.ts` (new)

```typescript
interface Metrics {
  sessions_created: number
  sessions_completed: number
  summaries_generated: number
  summaries_failed: number
  memory_items_created: number
  consolidations_run: number
  decay_runs: number
}

const metrics: Metrics = {
  sessions_created: 0,
  sessions_completed: 0,
  summaries_generated: 0,
  summaries_failed: 0,
  memory_items_created: 0,
  consolidations_run: 0,
  decay_runs: 0
}

export function incrementMetric(key: keyof Metrics) {
  metrics[key]++
}

export function getMetrics(): Metrics {
  return { ...metrics }
}

export function resetMetrics() {
  Object.keys(metrics).forEach(key => {
    metrics[key as keyof Metrics] = 0
  })
}
```

Add metrics endpoint:
```typescript
app.get('/api/metrics', (req, res) => {
  res.json(getMetrics())
})
```

### Testing
- Test priority queue ordering
- Verify retry logic with simulated failures
- Test fallback summary generation
- Check health endpoint response
- Verify structured logging format
- Test metrics tracking

### Rollback Plan
- Priority queues are backward compatible
- Retry logic can be disabled
- Structured logging is non-breaking
- Metrics are optional

---

## Implementation Timeline

### Week 1: Foundation
- **Day 1-2:** Phase 1 - Database Schema Enhancements
- **Day 3-5:** Phase 2 - Enhanced Summarization

### Week 2: Core Features
- **Day 1-3:** Phase 3 - Memory Consolidation Engine
- **Day 4-5:** Phase 4 - Smart Context Injection

### Week 3: Advanced & Polish
- **Day 1-3:** Phase 5 - Advanced Features
- **Day 4-5:** Phase 6 - Performance & Monitoring

### Week 4: Testing & Documentation
- **Day 1-2:** Integration testing
- **Day 3-4:** Documentation updates
- **Day 5:** Release v2.0

---

## Testing Strategy

### Unit Tests
- Test each new function in isolation
- Mock database and AI calls
- Verify edge cases

### Integration Tests
- Test full session lifecycle
- Test memory consolidation end-to-end
- Test context injection with real data

### Manual Testing
- Create test sessions with various scenarios
- Verify summaries are accurate
- Check memory consolidation results
- Test context injection in new sessions

### Performance Testing
- Test with 100+ sessions
- Test with 1000+ memory items
- Measure queue processing time
- Check database query performance

---

## Rollback Strategy

### Database Rollback
```sql
-- Remove new columns
ALTER TABLE sessions DROP COLUMN summary_mood;
ALTER TABLE sessions DROP COLUMN summary_complexity;
ALTER TABLE sessions DROP COLUMN summary_blockers;
ALTER TABLE sessions DROP COLUMN summary_resolved;
ALTER TABLE sessions DROP COLUMN summary_key_insight;
ALTER TABLE sessions DROP COLUMN duration_seconds;
ALTER TABLE sessions DROP COLUMN embedding_summary;

-- Drop new indexes
DROP INDEX IF EXISTS idx_sessions_project_ended;
DROP INDEX IF EXISTS idx_sessions_status;
DROP INDEX IF EXISTS idx_sessions_summary_status;
DROP INDEX IF EXISTS idx_knowledge_confidence;
DROP INDEX IF EXISTS idx_patterns_success;

-- Remove scope columns
ALTER TABLE preferences DROP COLUMN scope;
ALTER TABLE learned_patterns DROP COLUMN scope;
```

### Code Rollback
```bash
# Revert to v1.0 tag
git checkout v1.0

# Rebuild
pnpm run build

# Restart worker
pkill -f "node dist/src/index.js"
ANTHROPIC_BASE_URL=http://localhost:20128/v1 \
ANTHROPIC_AUTH_TOKEN=sk_9router \
ANTHROPIC_DEFAULT_HAIKU_MODEL=AWS \
node dist/src/index.js > /tmp/claudectx.log 2>&1 &
```

### Feature Flags
Add environment variables to disable new features:
```bash
CLAUDECTX_DISABLE_CONSOLIDATION=1
CLAUDECTX_DISABLE_DECAY=1
CLAUDECTX_DISABLE_SMART_BRIEFING=1
CLAUDECTX_USE_V1_SUMMARIZATION=1
```

---

## Success Criteria

### Phase 1
- ✅ All new database columns added
- ✅ All indexes created
- ✅ No errors on migration
- ✅ Backward compatibility maintained

### Phase 2
- ✅ Smart compaction working
- ✅ All new summary fields extracted
- ✅ Mood classification accurate (>80%)
- ✅ Complexity scoring reasonable

### Phase 3
- ✅ Duplicate preferences merged
- ✅ Duplicate knowledge merged
- ✅ Conflicts detected and resolved
- ✅ Confidence increases on reconfirmation
- ✅ Tasks matched across sessions

### Phase 4
- ✅ Smart briefing generated
- ✅ Context markdown well-formatted
- ✅ Blockers appear first
- ✅ CLAUDE.md table renders correctly

### Phase 5
- ✅ Memory decay working
- ✅ Fuzzy task matching accurate (>80%)
- ✅ Global preferences working
- ✅ Soft-delete at threshold

### Phase 6
- ✅ Priority queues working
- ✅ Retry logic successful
- ✅ Fallback summary working
- ✅ Health endpoint comprehensive
- ✅ Structured logging consistent
- ✅ Metrics tracking accurate

---

## Post-Upgrade Tasks

### 1. Regenerate Summaries for Old Sessions
```bash
# Script to regenerate summaries with v2.0 format
node scripts/regenerate-summaries.js
```

### 2. Run Initial Consolidation
```bash
# Consolidate existing memory
node scripts/run-consolidation.js
```

### 3. Update Documentation
- Update README.md with v2.0 features
- Update API.md with new endpoints
- Update CLAUDE.md examples

### 4. Monitor for Issues
- Check logs for errors
- Monitor queue sizes
- Check memory health scores
- Verify context injection working

---

## Dependencies

### NPM Packages to Install
```bash
pnpm add fuse.js          # Fuzzy matching
pnpm add node-cron        # Scheduling
pnpm add @types/node-cron --save-dev
```

### System Requirements
- Node.js 18+
- SQLite 3.35+
- 9router running on port 20128
- At least 500MB disk space for database

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI prompt changes break summarization | Medium | High | Extensive testing, fallback to v1.0 prompt |
| Memory consolidation deletes important data | Low | High | Backup database before consolidation, soft-delete only |
| Performance degradation with large datasets | Medium | Medium | Add indexes, optimize queries, test with large data |
| Breaking changes in API | Low | Medium | Maintain backward compatibility, version endpoints |
| Migration fails on production | Low | High | Test migration on copy of production DB first |

---

## Support & Maintenance

### Monitoring
- Check `/api/health` daily
- Monitor queue sizes
- Check memory health scores
- Review error logs

### Maintenance Tasks
- Run consolidation weekly (automated)
- Run decay daily (automated)
- Backup database weekly
- Review and archive old sessions monthly

### Troubleshooting
- Check logs: `tail -f /tmp/claudectx.log`
- Check health: `curl http://localhost:8000/api/health`
- Check metrics: `curl http://localhost:8000/api/metrics`
- Check queue: Look for `queue_size` in health response

---

## Conclusion

This upgrade roadmap provides a clear path from ClaudeContext v1.0 to v2.0. Each phase is independent and can be rolled back if needed. The total effort is estimated at 22-29 hours spread over 3-4 weeks.

**Key Benefits of v2.0:**
- Richer session summaries with mood, complexity, blockers
- Automatic memory consolidation and conflict resolution
- Smart context injection with AI-generated briefings
- Memory decay to keep knowledge fresh
- Fuzzy task matching across sessions
- Priority queues for better performance
- Comprehensive monitoring and health checks

**Next Steps:**
1. Review this roadmap with the team
2. Set up development environment
3. Create feature branch: `git checkout -b feature/v2.0-upgrade`
4. Start with Phase 1
5. Test thoroughly after each phase
6. Deploy to production after all phases complete

