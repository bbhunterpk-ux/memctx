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

    // Allow force end if session is active OR if summary is still in progress
    const summaryInProgress = session.summary_status && session.summary_status.toLowerCase() === 'in_progress'
    if (session.status === 'completed' && !summaryInProgress) {
      return res.status(400).json({ error: 'Session already completed with summary' })
    }

    console.log(`[ForceEndSession] Forcing session end: ${sessionId.slice(0, 8)}`)

    // Find transcript path if not already set
    let transcriptPath = session.transcript_path
    if (!transcriptPath) {
      // Try to find the transcript file in the Claude projects directory
      const fs = require('fs')
      const path = require('path')
      const { homedir } = require('os')

      // Get project from database to find the correct path
      const project = queries.getProject(session.project_id)
      if (project && project.root_path) {
        // Convert root path to Claude projects directory format
        const projectDirName = project.root_path.replace(/\//g, '-')
        const claudeProjectsDir = path.join(homedir(), '.claude', 'projects', projectDirName)
        const possiblePath = path.join(claudeProjectsDir, `${sessionId}.jsonl`)

        if (fs.existsSync(possiblePath)) {
          transcriptPath = possiblePath
          console.log(`[ForceEndSession] Found transcript at: ${possiblePath}`)
        }
      }
    }

    // Mark session as completed
    const now = Math.floor(Date.now() / 1000)
    queries.updateSession(sessionId, {
      ended_at: session.ended_at || session.last_activity || now,
      status: 'completed',
      transcript_path: transcriptPath || null
    })

    // Queue for AI summarization if we have a transcript
    if (transcriptPath) {
      console.log(`[ForceEndSession] Queuing summarization for: ${sessionId.slice(0, 8)}`)
      summarizationQueue.enqueue({
        sessionId: session.id,
        transcriptPath: transcriptPath,
        projectId: session.project_id,
        priority: 'high' // Use high priority for manual force end
      })
    } else {
      console.log(`[ForceEndSession] No transcript found, skipping summarization`)
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
