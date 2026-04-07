import { Router } from 'express'
import { CONFIG } from '../config'
import { getDB } from '../db/client'
import { getQueueSize } from '../services/queue'
import { standardRateLimit } from '../middleware/rate-limit'

export const healthRouter: import("express").Router = Router()
const startTime = Date.now()

healthRouter.get('/', standardRateLimit, (_req, res) => {
  let dbConnected = false
  try {
    getDB().prepare('SELECT 1').get()
    dbConnected = true
  } catch {}

  res.json({
    status: 'ok',
    version: '1.0.0',
    db: dbConnected ? 'connected' : 'error',
    api_key: !!CONFIG.apiKey,
    summaries_enabled: !CONFIG.disableSummaries,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    queue_size: getQueueSize()
  })
})
