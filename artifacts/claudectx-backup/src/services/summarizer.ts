import Anthropic from '@anthropic-ai/sdk'
import { readTranscript } from './transcript-reader'
import { queries } from '../db/queries'
import { CONFIG } from '../config'
import { updateClaudeMd } from './claude-md-updater'
import { broadcast } from '../ws/broadcast'

interface SessionSummary {
  title: string
  status: 'completed' | 'in_progress' | 'blocked'
  what_we_did: string[]
  decisions_made: string[]
  files_changed: string[]
  next_steps: string[]
  gotchas: string[]
  tech_stack_notes: string[]
  preferences?: Array<{ category: string; key: string; value: string; confidence: number }>
  knowledge?: Array<{ category: string; topic: string; content: string; confidence: number }>
  patterns?: Array<{ type: string; title: string; description: string; example?: string }>
  tasks?: Array<{ title: string; description?: string; priority: string; status: string }>
  contacts?: Array<{ name: string; type: string; role?: string; context: string }>
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
    const turns = await readTranscript(transcriptPath)
    if (turns.length === 0) return

    const recentTurns = turns.slice(-60)
    const compactTranscript = recentTurns.map(t => {
      if (t.role === 'user') return `USER: ${(t.content || '').slice(0, 300)}`
      if (t.role === 'assistant') return `CLAUDE: ${(t.content || '').slice(0, 400)}`
      if (t.type === 'tool_use') return `TOOL(${t.name}): ${JSON.stringify(t.input || {}).slice(0, 200)}`
      return null
    }).filter(Boolean).join('\n')

    const client = getClient()

    console.log(`[Summarizer] Starting summarization for session ${sessionId}`)
    console.log(`[Summarizer] Using model: ${CONFIG.summaryModel}`)
    console.log(`[Summarizer] API Base URL: ${CONFIG.apiBaseUrl}`)

    const response = await client.messages.create({
      model: CONFIG.summaryModel,
      max_tokens: CONFIG.summaryMaxTokens,
      stream: false,
      system: `You are a memory extraction system. Analyze the session and extract:
1. Session summary (what was done)
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

    queries.updateSession(sessionId, {
      summary_title: summary.title,
      summary_status: summary.status,
      summary_what_we_did: JSON.stringify(summary.what_we_did),
      summary_decisions: JSON.stringify(summary.decisions_made),
      summary_files_changed: JSON.stringify(summary.files_changed),
      summary_next_steps: JSON.stringify(summary.next_steps),
      summary_gotchas: JSON.stringify(summary.gotchas),
      summary_tech_notes: JSON.stringify(summary.tech_stack_notes),
      status: 'completed'
    })

    // Store extracted memory
    if (summary.preferences) {
      for (const pref of summary.preferences) {
        queries.setPreference(pref.category, pref.key, pref.value, pref.confidence, sessionId)
      }
    }

    if (summary.knowledge) {
      for (const k of summary.knowledge) {
        const id = `${k.category}_${k.topic}`.replace(/\s+/g, '_').toLowerCase()
        queries.addKnowledge({ id, category: k.category, topic: k.topic, content: k.content, confidence: k.confidence, sessionId })
      }
    }

    if (summary.patterns) {
      for (const p of summary.patterns) {
        const id = `${p.type}_${p.title}`.replace(/\s+/g, '_').toLowerCase()
        queries.addPattern({ id, type: p.type, title: p.title, description: p.description, example: p.example })
      }
    }

    if (summary.tasks) {
      for (const t of summary.tasks) {
        const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        queries.addTask({ id, title: t.title, description: t.description, priority: t.priority, status: t.status, projectId, sessionId })
      }
    }

    if (summary.contacts) {
      for (const c of summary.contacts) {
        const id = c.name.replace(/\s+/g, '_').toLowerCase()
        queries.addContact({ id, name: c.name, type: c.type, role: c.role })
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
    console.log(`Summary saved for session ${sessionId}: "${summary.title}"`)

  } catch (err) {
    console.error('Summarization failed for session', sessionId, err)
    queries.updateSession(sessionId, { status: 'completed' })
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
