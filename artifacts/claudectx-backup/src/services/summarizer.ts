import Anthropic from '@anthropic-ai/sdk'
import { readTranscript } from './transcript-reader'
import { queries } from '../db/queries'
import { CONFIG } from '../config'
import { updateClaudeMd } from './claude-md-updater'
import { broadcast } from '../ws/broadcast'
import { fuzzyTaskMatcher } from './fuzzy-task-matcher'
import { logger } from './logger'
import { metricsTracker } from './metrics'

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
  preferences?: Array<{ category: string; key: string; value: string; confidence: number }>
  knowledge?: Array<{ category: string; topic: string; content: string; confidence: number }>
  patterns?: Array<{ type: string; title: string; description: string; example?: string }>
  tasks?: Array<{ title: string; description?: string; priority: string; status: string }>
  contacts?: Array<{ name: string; type: string; role?: string; context: string }>
}

function compactTranscriptSmart(turns: any[]): string {
  // Take last 80 turns for better context
  const recentTurns = turns.slice(-80)

  const lines: string[] = []
  let lastRole = ''

  for (const turn of recentTurns) {
    if (turn.role === 'user') {
      const content = (turn.content || '').slice(0, 500)
      if (content.trim()) {
        lines.push(`USER: ${content}`)
        lastRole = 'user'
      }
    } else if (turn.role === 'assistant') {
      // Keep full assistant responses for decisions/explanations
      const content = (turn.content || '').slice(0, 800)
      if (content.trim()) {
        lines.push(`CLAUDE: ${content}`)
        lastRole = 'assistant'
      }
    } else if (turn.type === 'tool_use') {
      // Compress repetitive tool calls
      const toolName = turn.name || 'unknown'
      const input = JSON.stringify(turn.input || {})

      if (toolName === 'Read' || toolName === 'Grep' || toolName === 'Glob') {
        lines.push(`TOOL(${toolName}): ${input.slice(0, 150)}`)
      } else if (toolName === 'Edit' || toolName === 'Write') {
        lines.push(`TOOL(${toolName}): ${input.slice(0, 300)}`)
      } else {
        lines.push(`TOOL(${toolName}): ${input.slice(0, 200)}`)
      }
    }
  }

  return lines.join('\n')
}

function getClient(): Anthropic {
  return new Anthropic({
    apiKey: CONFIG.apiKey,
    baseURL: CONFIG.apiBaseUrl
  })
}

export async function summarizeSession(
  sessionId: string,
  transcriptPath: string,
  projectId: string
): Promise<void> {
  if (!CONFIG.apiKey || CONFIG.disableSummaries) {
    console.log('No API key or summaries disabled — skipping AI summary for session', sessionId)
    return
  }

  try {
    const startTime = Date.now()
    const turns = await readTranscript(transcriptPath)
    if (turns.length === 0) return

    // Smart transcript compaction
    const compactTranscript = compactTranscriptSmart(turns)

    const client = getClient()

    logger.info('Summarizer', `Starting summarization for session ${sessionId}`, {
      model: CONFIG.summaryModel,
      transcriptLength: turns.length
    })

    const response = await client.messages.create({
      model: CONFIG.summaryModel,
      max_tokens: CONFIG.summaryMaxTokens,
      stream: false,
      system: `You are a memory extraction system. Analyze the session and extract:
1. Session summary (what was done, mood, complexity, blockers, resolutions, key insight)
2. User preferences discovered (coding style, workflow, communication)
3. Domain knowledge learned (technologies, patterns, gotchas)
4. Problem-solving patterns used
5. Pending tasks identified
6. People/teams mentioned

Always respond with ONLY valid JSON matching the exact schema provided. No preamble, no markdown, no explanation.`,
      messages: [{
        role: 'user',
        content: `Summarize this Claude Code coding session transcript. Return ONLY JSON.

TRANSCRIPT:
${compactTranscript}

Return this exact JSON schema:
{
  "title": "5-8 word title describing the main work done",
  "status": "completed OR in_progress OR blocked",
  "what_we_did": ["specific thing 1", "specific thing 2", "specific thing 3"],
  "decisions_made": ["architectural or technical decision made"],
  "files_changed": ["relative/path/to/file.ts"],
  "next_steps": ["concrete next thing to do"],
  "gotchas": ["important warning or thing to remember"],
  "tech_stack_notes": ["framework/library/pattern note"],
  "mood": "productive OR frustrated OR exploratory OR debugging OR blocked",
  "complexity": "trivial OR simple OR moderate OR complex OR very_complex",
  "blockers": ["thing that blocked progress"],
  "resolved": ["problem that was solved"],
  "key_insight": "single most important learning or realization from this session",
  "preferences": [{"category": "coding", "key": "style", "value": "TypeScript", "confidence": 0.9}],
  "knowledge": [{"category": "technology", "topic": "9router", "content": "Returns OpenAI format", "confidence": 0.8}],
  "patterns": [{"type": "debugging", "title": "Check logs first", "description": "Always check logs before diving into code"}],
  "tasks": [{"title": "Fix bug", "description": "Details", "priority": "high", "status": "pending"}],
  "contacts": [{"name": "John", "type": "person", "role": "engineer", "context": "discussed API"}]
}

Rules:
- what_we_did: max 5 items, be specific (not "wrote code")
- decisions_made: only real decisions, skip trivial ones
- files_changed: only files actually modified/created
- next_steps: max 3 items, most important first
- gotchas: only truly important things (bugs found, footguns)
- tech_stack_notes: language/framework specifics future sessions need
- mood: overall emotional tone of the session
- complexity: technical difficulty level
- blockers: things that prevented progress (empty array if none)
- resolved: problems that were fixed (empty array if none)
- key_insight: most valuable takeaway (empty string if none)
- If nothing significant happened, use status "in_progress"`
      }]
    })

    console.log(`[Summarizer] Response received:`, JSON.stringify(response, null, 2))

    // Handle both Anthropic format (content array) and OpenAI format (choices array)
    let raw = ''
    if (response.content && response.content[0]) {
      // Anthropic format
      raw = response.content[0].type === 'text' ? response.content[0].text : ''
    } else if ((response as any).choices && (response as any).choices[0]) {
      // OpenAI format (from 9router)
      raw = (response as any).choices[0].message.content || ''
    } else {
      throw new Error(`Invalid API response: ${JSON.stringify(response)}`)
    }

    console.log(`[Summarizer] Raw content:`, raw)

    const summary: SessionSummary = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())

    // Calculate session duration
    const session = queries.getSession(sessionId)
    const durationSeconds = session?.ended_at && session?.started_at
      ? session.ended_at - session.started_at
      : null

    queries.updateSession(sessionId, {
      summary_title: summary.title,
      summary_status: 'completed', // Always mark summary as completed after successful AI processing
      summary_what_we_did: JSON.stringify(summary.what_we_did),
      summary_decisions: JSON.stringify(summary.decisions_made),
      summary_files_changed: JSON.stringify(summary.files_changed),
      summary_next_steps: JSON.stringify(summary.next_steps),
      summary_gotchas: JSON.stringify(summary.gotchas),
      summary_tech_notes: JSON.stringify(summary.tech_stack_notes),
      summary_mood: summary.mood || null,
      summary_complexity: summary.complexity || null,
      summary_blockers: summary.blockers ? JSON.stringify(summary.blockers) : null,
      summary_resolved: summary.resolved ? JSON.stringify(summary.resolved) : null,
      summary_key_insight: summary.key_insight || null,
      duration_seconds: durationSeconds,
      status: 'completed'
    })

    // Store extracted memory
    if (summary.preferences) {
      for (const pref of summary.preferences) {
        queries.setPreference(pref.category, pref.key, pref.value, pref.confidence, sessionId, projectId)
      }
    }

    if (summary.knowledge) {
      for (const k of summary.knowledge) {
        const id = `${k.category}_${k.topic}`.replace(/\s+/g, '_').toLowerCase()
        queries.addKnowledge({ id, category: k.category, topic: k.topic, content: k.content, confidence: k.confidence, sessionId, projectId })
      }
    }

    if (summary.patterns) {
      for (const p of summary.patterns) {
        const id = `${p.type}_${p.title}`.replace(/\s+/g, '_').toLowerCase()
        queries.addPattern({ id, type: p.type, title: p.title, description: p.description, example: p.example, projectId })
      }
    }

    if (summary.tasks) {
      for (const t of summary.tasks) {
        // Use fuzzy matching to avoid duplicate tasks
        fuzzyTaskMatcher.addTaskSmart({
          title: t.title,
          description: t.description,
          priority: t.priority,
          projectId,
          sessionId
        })
      }
    }

    if (summary.contacts) {
      for (const c of summary.contacts) {
        const id = c.name.replace(/\s+/g, '_').toLowerCase()
        queries.addContact({ id, name: c.name, type: c.type, role: c.role, projectId })
        queries.addInteraction(id, sessionId, 'mentioned', c.context)
      }
    }

    for (const item of [...summary.what_we_did, ...summary.decisions_made]) {
      queries.insertObservation({
        session_id: sessionId,
        project_id: projectId,
        event_type: 'decision',
        content: item,
        metadata: '{}'
      })
    }

    await updateClaudeMd(projectId, sessionId, summary)
    broadcast({ type: 'summary_ready', session_id: sessionId, title: summary.title })

    const duration = Date.now() - startTime
    logger.info('Summarizer', `Summary saved for session ${sessionId}`, {
      title: summary.title,
      duration: `${duration}ms`
    })
    metricsTracker.recordSummarization(true, duration)

  } catch (err) {
    logger.error('Summarizer', `Summarization failed for session ${sessionId}`, { error: err })
    metricsTracker.recordSummarization(false, 0)
    queries.updateSession(sessionId, { status: 'completed' })
    throw err // Re-throw for queue retry logic
  }
}

export async function snapshotSession(
  sessionId: string,
  transcriptPath: string,
  projectId: string
): Promise<void> {
  await summarizeSession(sessionId, transcriptPath, projectId)
  queries.updateSession(sessionId, { status: 'compacted' })
}
