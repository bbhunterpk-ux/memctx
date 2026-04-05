import { Router } from 'express'
import { queries } from '../db/queries'

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

function tryParse(val: any): any {
  if (!val) return null
  try { return JSON.parse(val) } catch { return val }
}
