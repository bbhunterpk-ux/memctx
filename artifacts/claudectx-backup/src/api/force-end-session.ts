import { Router, type Router as RouterType } from 'express'
import { queries } from '../db/queries'
import { summarizationQueue } from '../services/summarization-queue'
import { broadcast } from '../ws/broadcast'
import { logger } from '../services/logger'

export const forceEndSessionRouter: RouterType = Router()

forceEndSessionRouter.post('/:sessionId', async (req, res) => {
  const { sessionId } = req.params

  try {
    const session = queries.getSession(sessionId)

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session already completed' })
    }

    console.log(`[ForceEndSession] Forcing session end: ${sessionId.slice(0, 8)}`)

    // Mark session as completed
    const now = Math.floor(Date.now() / 1000)
    queries.updateSession(sessionId, {
      ended_at: session.last_activity || now,
      status: 'completed'
    })

    // Queue for AI summarization if we have a transcript
    if (session.transcript_path) {
      console.log(`[ForceEndSession] Queuing summarization for: ${sessionId.slice(0, 8)}`)
      summarizationQueue.enqueue({
        sessionId: session.id,
        transcriptPath: session.transcript_path,
        projectId: session.project_id,
        priority: 'normal'
      })
    } else {
      console.log(`[ForceEndSession] No transcript path, skipping summarization`)
    }

    // Broadcast session end event
    broadcast({
      type: 'session_end',
      session_id: sessionId,
      reason: 'manual_force_end'
    })

    logger.info('ForceEndSession', `Session ${sessionId} manually ended and queued for summarization`)

    res.json({
      success: true,
      message: 'Session marked as completed and queued for summarization',
      session_id: sessionId
    })
  } catch (err) {
    console.error('[ForceEndSession] Error:', err)
    res.status(500).json({ error: 'Failed to end session' })
  }
})
