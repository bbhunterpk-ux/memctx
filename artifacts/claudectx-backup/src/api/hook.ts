import { Router } from 'express'
import { detectProject } from '../services/project-detector'
import { enqueue } from '../services/queue'
import { summarizeSession, snapshotSession } from '../services/summarizer'
import { broadcast } from '../ws/broadcast'
import { queries } from '../db/queries'

export const hookRouter = Router()

hookRouter.post('/', async (req, res) => {
  res.json({ ok: true }) // Always respond immediately

  const { event, session_id, cwd, ...data } = req.body
  if (!session_id || !cwd) return

  try {
    const project = await detectProject(cwd)

    switch (event) {
      case 'SessionStart': {
        queries.upsertSession({
          id: session_id,
          project_id: project.id,
          started_at: Math.floor(Date.now() / 1000),
          status: 'active'
        })
        broadcast({ type: 'session_start', session_id, project })
        break
      }

      case 'SessionEnd': {
        queries.updateSession(session_id, {
          ended_at: Math.floor(Date.now() / 1000),
          status: 'completed',
          transcript_path: data.transcript_path || null
        })
        if (data.transcript_path) {
          enqueue(() => summarizeSession(session_id, data.transcript_path, project.id))
        }
        broadcast({ type: 'session_end', session_id })
        break
      }

      case 'PostToolUse': {
        const obs = {
          session_id,
          project_id: project.id,
          event_type: 'tool_call',
          tool_name: data.tool_name,
          file_path: data.file_path || null,
          content: data.command
            ? `${data.tool_name}: ${data.command}`
            : `${data.tool_name}${data.file_path ? ': ' + data.file_path : ''}`,
          metadata: JSON.stringify({ success: data.success })
        }
        queries.insertObservation(obs)
        queries.incrementTurnStats(session_id, 'tool_calls')

        if (data.file_path) {
          queries.addFileTouched(session_id, data.file_path)
        }

        broadcast({ type: 'tool_use', session_id, tool_name: data.tool_name, file_path: data.file_path })
        break
      }

      case 'UserPromptSubmit': {
        queries.incrementTurnStats(session_id, 'turns')
        broadcast({ type: 'user_prompt', session_id, preview: data.prompt_preview })
        break
      }

      case 'Stop': {
        broadcast({ type: 'stop', session_id, preview: data.message_preview })
        break
      }

      case 'PreCompact': {
        queries.updateSession(session_id, { status: 'compacted' })
        if (data.transcript_path) {
          enqueue(() => snapshotSession(session_id, data.transcript_path, project.id))
        }
        broadcast({ type: 'pre_compact', session_id })
        break
      }
    }
  } catch (err) {
    console.error('Hook processing error:', err)
  }
})
