import { Router } from 'express'
import { buildContextMarkdown } from '../services/context-builder'
import { CONFIG } from '../config'

export const contextRouter = Router()

async function handleContext(req: any, res: any) {
  try {
    const cwd = req.query.cwd || req.body?.cwd
    const n = parseInt(req.query.n || req.body?.n || String(CONFIG.defaultContextSessions))
    const session_id = req.query.session_id || req.body?.session_id

    if (!cwd) {
      res.json({ markdown: '' })
      return
    }

    const markdown = await buildContextMarkdown(cwd as string, n)
    res.json({ markdown, session_id })
  } catch (err) {
    res.json({ markdown: '' })
  }
}

contextRouter.get('/', handleContext)
contextRouter.post('/', handleContext)
