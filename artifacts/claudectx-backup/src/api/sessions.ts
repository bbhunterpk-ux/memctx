import { Router } from 'express'
import { queries } from '../db/queries'
import { activityTracker } from '../services/activity-tracker'
import { summarizationQueue } from '../services/summarization-queue'
import { logger } from '../services/logger'

export const sessionsRouter: import("express").Router = Router()

sessionsRouter.get('/', (req, res) => {
  try {
    const sessions = queries.getSessions({
      project_id: req.query.project_id as string | undefined,
      limit: parseInt(req.query.limit as string || '20'),
      offset: parseInt(req.query.offset as string || '0'),
      status: req.query.status as string | undefined,
    })

    // Parse JSON fields
    const result = sessions.map(s => ({
      ...s,
      summary_what_we_did: tryParse(s.summary_what_we_did),
      summary_decisions: tryParse(s.summary_decisions),
      summary_files_changed: tryParse(s.summary_files_changed),
      summary_next_steps: tryParse(s.summary_next_steps),
      summary_gotchas: tryParse(s.summary_gotchas),
      summary_tech_notes: tryParse(s.summary_tech_notes),
      files_touched: tryParse(s.files_touched),
      tools_used: tryParse(s.tools_used),
    }))

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

sessionsRouter.get('/:id', (req, res) => {
  try {
    const session = queries.getSessionWithObservations(req.params.id)
    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    // Get tags for this session
    const tags = queries.getSessionTags(req.params.id)

    res.json({
      ...session,
      summary_what_we_did: tryParse(session.summary_what_we_did),
      summary_decisions: tryParse(session.summary_decisions),
      summary_files_changed: tryParse(session.summary_files_changed),
      summary_next_steps: tryParse(session.summary_next_steps),
      summary_gotchas: tryParse(session.summary_gotchas),
      summary_tech_notes: tryParse(session.summary_tech_notes),
      files_touched: tryParse(session.files_touched),
      tools_used: tryParse(session.tools_used),
      tags,
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

sessionsRouter.delete('/:id', (req, res) => {
  try {
    const session = queries.getSession(req.params.id)
    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    // Delete session and all related data (observations, memory)
    queries.deleteSession(req.params.id)

    console.log(`[API] Deleted session: ${req.params.id.slice(0, 8)}`)
    res.json({ success: true, message: 'Session deleted' })
  } catch (err) {
    console.error('[API] Error deleting session:', err)
    res.status(500).json({ error: String(err) })
  }
})

sessionsRouter.post('/:id/bookmark', (req, res) => {
  try {
    const { bookmarked } = req.body
    const session = queries.getSession(req.params.id)

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    queries.updateSessionBookmark(req.params.id, bookmarked ? 1 : 0)

    console.log(`[API] ${bookmarked ? 'Bookmarked' : 'Unbookmarked'} session: ${req.params.id.slice(0, 8)}`)
    res.json({ success: true })
  } catch (err) {
    console.error('[API] Error updating bookmark:', err)
    res.status(500).json({ error: String(err) })
  }
})

sessionsRouter.post('/:id/notes', (req, res) => {
  try {
    const { notes } = req.body
    const session = queries.getSession(req.params.id)

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    queries.updateSessionNotes(req.params.id, notes || '')

    console.log(`[API] Updated notes for session: ${req.params.id.slice(0, 8)}`)
    res.json({ success: true })
  } catch (err) {
    console.error('[API] Error updating notes:', err)
    res.status(500).json({ error: String(err) })
  }
})

sessionsRouter.post('/:id/archive', (req, res) => {
  try {
    const { archived } = req.body
    const session = queries.getSession(req.params.id)

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    queries.updateSessionArchived(req.params.id, archived ? 1 : 0)

    console.log(`[API] ${archived ? 'Archived' : 'Unarchived'} session: ${req.params.id.slice(0, 8)}`)
    res.json({ success: true })
  } catch (err) {
    console.error('[API] Error updating archive status:', err)
    res.status(500).json({ error: String(err) })
  }
})

// POST /api/sessions/:id/sync
sessionsRouter.post('/:id/sync', async (req, res) => {
  try {
    const sessionId = req.params.id as string
    const session = queries.getSession(sessionId)

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      })
    }

    // Check if session has observations (fallback when transcript is missing)
    const observations = queries.getSessionObservations(sessionId)

    if (!session.transcript_path && observations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No transcript or observations available'
      })
    }

    // Update summary_requested_at
    queries.updateSession(session.id, {
      summary_requested_at: Math.floor(Date.now() / 1000)
    })

    // Queue for summarization with high priority
    // If no transcript_path, pass empty string - summarizer will use observations
    summarizationQueue.enqueue({
      sessionId: session.id,
      transcriptPath: session.transcript_path || '',
      projectId: session.project_id,
      priority: 'high'
    })

    res.json({
      success: true,
      message: 'Queued for summarization',
      using_observations: !session.transcript_path
    })
  } catch (error: any) {
    logger.error('Sessions', 'Sync failed', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/sessions/:id/activity
sessionsRouter.post('/:id/activity', async (req, res) => {
  try {
    const sessionId = req.params.id as string
    activityTracker.updateActivity(sessionId)
    res.json({ success: true })
  } catch (error: any) {
    logger.error('Sessions', 'Activity update failed', { error: error.message })
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

function tryParse(val: any): any {
  if (!val) return null
  try { return JSON.parse(val) } catch { return val }
}
