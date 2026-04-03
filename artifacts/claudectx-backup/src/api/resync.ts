import { Router, Request, Response } from 'express'
import { queries } from '../db/queries'
import { summarizationQueue } from '../services/summarization-queue'
import { logger } from '../services/logger'
import { consolidator } from '../services/memory-consolidator'

const router: Router = Router()

/**
 * POST /api/resync/:projectId
 * Resync all sessions for a project
 * - Regenerate summaries for sessions with transcripts
 * - Extract memory from all summaries
 * - Consolidate memory
 */
router.post('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { force } = req.query // force=true to regenerate existing summaries

    logger.info('Resync', `Starting resync for project ${projectId}`, { force })

    // Get all sessions for project
    const sessions = queries.getSessions({ project_id: projectId, limit: 1000 })

    let queued = 0
    let skipped = 0

    for (const session of sessions) {
      // Skip active sessions
      if (session.status === 'active') {
        skipped++
        continue
      }

      // Skip sessions without transcripts
      if (!session.transcript_path) {
        skipped++
        continue
      }

      // Skip sessions that already have summaries (unless force=true)
      if (session.summary_title && force !== 'true') {
        skipped++
        continue
      }

      // Queue for summarization
      summarizationQueue.enqueue({
        sessionId: session.id,
        transcriptPath: session.transcript_path,
        projectId: projectId,
        priority: 'low' // Use low priority for bulk resyncs
      })
      queued++
    }

    // Consolidate memory after all summaries are done
    // Note: This runs immediately, but summaries are queued
    // In production, you'd want to wait for queue to empty
    setTimeout(async () => {
      try {
        await consolidator.consolidateProject(projectId)
        logger.info('Resync', `Memory consolidation complete for project ${projectId}`)
      } catch (error) {
        logger.error('Resync', `Memory consolidation failed for project ${projectId}`, { error })
      }
    }, 5000) // Wait 5s for summaries to start processing

    res.json({
      success: true,
      result: {
        total: sessions.length,
        queued,
        skipped,
        message: `Queued ${queued} sessions for resync. Skipped ${skipped} sessions.`
      }
    })
  } catch (error: any) {
    logger.error('Resync', 'Resync failed', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/resync/session/:sessionId
 * Resync a single session
 */
router.post('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    const session = queries.getSession(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      })
    }

    if (!session.transcript_path) {
      return res.status(400).json({
        success: false,
        error: 'Session has no transcript'
      })
    }

    if (session.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Cannot resync active session'
      })
    }

    // Queue for summarization with high priority
    summarizationQueue.enqueue({
      sessionId: session.id,
      transcriptPath: session.transcript_path,
      projectId: session.project_id,
      priority: 'high'
    })

    res.json({
      success: true,
      message: 'Session queued for resync'
    })
  } catch (error: any) {
    logger.error('Resync', 'Session resync failed', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/resync/all
 * Resync all projects
 */
router.post('/all', async (req: Request, res: Response) => {
  try {
    const { force } = req.query

    logger.info('Resync', 'Starting resync for all projects', { force })

    const projects = queries.getAllProjects()
    let totalQueued = 0
    let totalSkipped = 0

    for (const project of projects) {
      const sessions = queries.getSessions({ project_id: project.id, limit: 1000 })

      for (const session of sessions) {
        if (session.status === 'active' || !session.transcript_path) {
          totalSkipped++
          continue
        }

        if (session.summary_title && force !== 'true') {
          totalSkipped++
          continue
        }

        summarizationQueue.enqueue({
          sessionId: session.id,
          transcriptPath: session.transcript_path,
          projectId: project.id,
          priority: 'low'
        })
        totalQueued++
      }
    }

    res.json({
      success: true,
      result: {
        projects: projects.length,
        queued: totalQueued,
        skipped: totalSkipped,
        message: `Queued ${totalQueued} sessions across ${projects.length} projects`
      }
    })
  } catch (error: any) {
    logger.error('Resync', 'Global resync failed', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
