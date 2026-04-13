import { Router, type Router as RouterType } from 'express'
import { detectProject } from '../services/project-detector'
import { enqueue } from '../services/queue'
import { summarizeSession, snapshotSession } from '../services/summarizer'
import { broadcast } from '../ws/broadcast'
import { queries } from '../db/queries'
import { summarizationQueue } from '../services/summarization-queue'
import { logger } from '../services/logger'
import { activityTracker } from '../services/activity-tracker'
import { incrementalCheckpointQueue } from '../services/incremental-checkpoint-queue'
import { CONFIG } from '../config'

export const hookRouter: RouterType = Router()

hookRouter.post('/', async (req, res) => {
  console.log('[Hook] Received event:', req.body.event, 'session:', req.body.session_id?.slice(0, 8))
  res.json({ ok: true }) // Always respond immediately

  const { event, session_id, cwd, ...data } = req.body
  if (!session_id || !cwd) {
    console.log('[Hook] Missing session_id or cwd, ignoring')
    return
  }

  try {
    const project = await detectProject(cwd)
    console.log('[Hook] Project detected:', project.name, 'id:', project.id.slice(0, 8))

    // Ensure session exists for all events (not just SessionStart)
    const existingSession = queries.getSession(session_id)
    if (!existingSession) {
      console.log('[Hook] Creating new session:', session_id.slice(0, 8))
      queries.upsertSession({
        id: session_id,
        project_id: project.id,
        started_at: Math.floor(Date.now() / 1000),
        status: 'active'
      })
    }

    switch (event) {
      case 'SessionStart': {
        console.log('[Hook] SessionStart:', session_id.slice(0, 8))
        const existingSession = queries.getSession(session_id)

        // If resuming a completed session, reactivate it
        if (existingSession && existingSession.status === 'completed') {
          console.log('[Hook] Resuming completed session - reactivating')
          queries.updateSession(session_id, {
            status: 'active',
            ended_at: null, // Clear ended_at since session is active again
            last_activity: Math.floor(Date.now() / 1000)
          })
        } else {
          // New session or already active
          queries.upsertSession({
            id: session_id,
            project_id: project.id,
            started_at: Math.floor(Date.now() / 1000),
            status: 'active'
          })
        }
        broadcast({ type: 'session_start', session_id, project })
        break
      }

      case 'SessionEnd': {
        console.log('[Hook] SessionEnd:', session_id.slice(0, 8), 'transcript:', data.transcript_path)
        queries.updateSession(session_id, {
          ended_at: Math.floor(Date.now() / 1000),
          status: 'completed',
          transcript_path: data.transcript_path || null
        })
        console.log('[Hook] Session marked as completed')
        if (data.transcript_path) {
          logger.info('Hook', `SessionEnd received for ${session_id}`, { projectId: project.id })
          console.log('[Hook] Queuing summarization for:', session_id.slice(0, 8))
          summarizationQueue.enqueue({
            sessionId: session_id,
            transcriptPath: data.transcript_path,
            projectId: project.id,
            priority: 'normal'
          })
        }
        broadcast({ type: 'session_end', session_id })
        console.log('[Hook] Broadcast session_end event')
        break
      }

      case 'PostToolUse': {
        console.log('[Hook] PostToolUse:', data.tool_name, 'file:', data.file_path)
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

        // Track session activity
        activityTracker.updateActivity(session_id)

        broadcast({ type: 'tool_use', session_id, tool_name: data.tool_name, file_path: data.file_path })
        break
      }

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
            const turnsSinceCheckpoint = session.total_turns - (session.last_checkpoint_turn || 0)
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
                turnRange: [session.last_checkpoint_turn || 0, session.total_turns]
              })
            }
          }
        }

        broadcast({ type: 'user_prompt', session_id, preview: data.prompt_preview })
        break
      }

      case 'Stop': {
        console.log('[Hook] Stop event - session:', session_id.slice(0, 8))
        // Log assistant response as observation
        const obs = {
          session_id,
          project_id: project.id,
          event_type: 'assistant_message',
          tool_name: null,
          file_path: null,
          content: data.message_preview || '',
          metadata: JSON.stringify({})
        }
        queries.insertObservation(obs)

        const now = Math.floor(Date.now() / 1000)

        // End the session immediately on Stop event
        const session = queries.getSession(session_id)
        if (session && session.status === 'active') {
          console.log('[Hook] Ending session on Stop event:', session_id.slice(0, 8))
          queries.updateSession(session_id, {
            ended_at: now,
            status: 'completed',
            last_activity: now
          })

          // Queue for summarization if transcript exists
          if (session.transcript_path) {
            console.log('[Hook] Queuing summarization for:', session_id.slice(0, 8))
            summarizationQueue.enqueue({
              sessionId: session_id,
              transcriptPath: session.transcript_path,
              projectId: project.id,
              priority: 'normal'
            })
          }

          broadcast({ type: 'session_end', session_id })
        } else {
          // Just update last_activity if already completed
          queries.updateSession(session_id, {
            last_activity: now
          })
        }

        broadcast({ type: 'stop', session_id, preview: data.message_preview })
        break
      }

      case 'PreCompact': {
        console.log('[Hook] PreCompact:', session_id.slice(0, 8))
        queries.updateSession(session_id, { status: 'compacted' })
        if (data.transcript_path) {
          enqueue(() => snapshotSession(session_id, data.transcript_path, project.id))
        }
        broadcast({ type: 'pre_compact', session_id })
        break
      }

      default: {
        console.log('[Hook] Unknown event:', event)
      }
    }
  } catch (err) {
    console.error('[Hook] Processing error:', err)
  }
})
