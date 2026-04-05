import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import path from 'path'
import { initDB } from './db/client'
import { hookRouter } from './api/hook'
import { sessionsRouter } from './api/sessions'
import { projectsRouter } from './api/projects'
import { contextRouter } from './api/context'
import { searchRouter } from './api/search'
import { healthRouter } from './api/health'
import { observationsRouter } from './api/observations'
import { memoryRouter } from './api/memory'
import consolidateRouter from './api/consolidate'
import metricsRouter from './api/metrics'
import resyncRouter from './api/resync'
import { forceEndSessionRouter } from './api/force-end-session'
import { logsRouter } from './api/logs'
import { tagsRouter } from './api/tags'
import { startWatcher } from './services/watcher'
import { broadcast, initWS } from './ws/broadcast'
import { CONFIG } from './config'
import { memoryDecay } from './services/memory-decay'
import { startSessionTimeoutChecker } from './services/session-timeout'

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
})

async function main() {
  initDB()

  const app = express()
  app.use(express.json({ limit: '10mb' }))

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    if (req.method === 'OPTIONS') { res.sendStatus(200); return }
    next()
  })

  app.use('/api/hook', hookRouter)
  app.use('/api/sessions', sessionsRouter)
  app.use('/api/projects', projectsRouter)
  app.use('/api/context', contextRouter)
  app.use('/api/search', searchRouter)
  app.use('/api/health', healthRouter)
  app.use('/api/observations', observationsRouter)
  app.use('/api/memory', memoryRouter)
  app.use('/api/consolidate', consolidateRouter)
  app.use('/api/metrics', metricsRouter)
  app.use('/api/resync', resyncRouter)
  app.use('/api/force-end-session', forceEndSessionRouter)
  app.use('/api/logs', logsRouter)
  app.use('/api/tags', tagsRouter)

  const dashboardDist = path.join(__dirname, '..', '..', 'dashboard', 'dist')
  app.use(express.static(dashboardDist))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(dashboardDist, 'index.html'))
    }
  })

  const server = createServer(app)
  const wss = new WebSocketServer({ server })
  initWS(wss)

  try {
    startWatcher()
  } catch (err) {
    console.error('Watcher failed to start:', err)
  }

  // Start memory decay scheduler
  memoryDecay.startDecayScheduler()

  // Start session timeout checker
  startSessionTimeoutChecker()

  server.listen(CONFIG.port, () => {
    console.log(`ClaudeContext running at http://localhost:${CONFIG.port}`)
    console.log(`API Key: ${CONFIG.apiKey ? 'configured' : 'NOT SET (summaries disabled)'}`)
  })
}

main().catch(console.error)
