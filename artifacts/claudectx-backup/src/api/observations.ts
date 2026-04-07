import { Router } from 'express'
import { getDB } from '../db/client'
import { standardRateLimit } from '../middleware/rate-limit'

export const observationsRouter: import("express").Router = Router()

observationsRouter.get('/', standardRateLimit, (req, res) => {
  try {
    const db = getDB()
    const session_id = req.query.session_id as string
    const limit = parseInt(req.query.limit as string || '100')
    const offset = parseInt(req.query.offset as string || '0')

    let rows: any[]
    if (session_id) {
      rows = db.prepare(`
        SELECT * FROM observations WHERE session_id = ?
        ORDER BY created_at ASC LIMIT ? OFFSET ?
      `).all(session_id, limit, offset) as any[]
    } else {
      rows = db.prepare(`
        SELECT * FROM observations ORDER BY created_at DESC LIMIT ? OFFSET ?
      `).all(limit, offset) as any[]
    }

    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})
