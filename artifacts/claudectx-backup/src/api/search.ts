import { Router } from 'express'
import { queries } from '../db/queries'

export const searchRouter = Router()

searchRouter.post('/', (req, res) => {
  try {
    const { query, project_id } = req.body
    if (!query || query.trim().length < 2) {
      res.json({ results: [] })
      return
    }

    // Escape FTS5 special characters
    const safeQuery = query.trim().replace(/['"*]/g, ' ')
    const results = queries.searchObservations(safeQuery, project_id)

    res.json({
      results: results.map(r => ({
        observation_id: r.id,
        content: r.content,
        session_id: r.session_id,
        project_id: r.project_id,
        session_title: r.session_title,
        project_name: r.project_name,
        event_type: r.event_type,
        created_at: r.created_at,
        relevance_rank: r.relevance_rank
      }))
    })
  } catch (err) {
    // FTS5 can throw on malformed queries — return empty
    res.json({ results: [], error: String(err) })
  }
})
