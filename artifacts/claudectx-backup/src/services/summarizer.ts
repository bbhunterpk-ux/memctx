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
    const response = await client.messages.create({
      model: CONFIG.summaryModel,
      max_tokens: CONFIG.summaryMaxTokens,
      system: `You are a technical session summarizer. Extract structured information from Claude Code session transcripts.
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
  "tech_stack_notes": ["framework/library/pattern note"]
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

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
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
