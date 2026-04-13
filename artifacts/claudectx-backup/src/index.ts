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
import { settingsRouter } from './api/settings'
import graphRouter from './api/graph'
import { startWatcher } from './services/watcher'
import { broadcast, initWS } from './ws/broadcast'
import { CONFIG } from './config'
import { memoryDecay } from './services/memory-decay'
import { startSessionTimeoutChecker } from './services/session-timeout'
import { standardRateLimit } from './middleware/rate-limit'
import { staleSessionWorker } from './services/stale-session-worker'
import { logger } from './services/logger'
import { queries } from './db/queries'
import { summarizationQueue } from './services/summarization-queue'
import { incrementalCheckpointQueue } from './services/incremental-checkpoint-queue'

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
})

async function main() {
  initDB()

  // Recovery scan for incomplete checkpoints
  if (CONFIG.enableIncrementalCheckpoints) {
    logger.info('Startup', 'Running recovery scan for incomplete checkpoints')
    const incomplete = queries.getIncompleteCheckpoints(CONFIG.checkpointTurnThreshold)

    if (incomplete.length > 0) {
      logger.info('Startup', `Found ${incomplete.length} sessions needing checkpoints, queuing`)

      for (const session of incomplete) {
        incrementalCheckpointQueue.enqueue({
          sessionId: session.session_id,
          projectId: session.project_id,
          checkpointNumber: (session.checkpoint_count || 0) + 1,
          turnRange: [session.last_checkpoint_turn || 0, session.total_turns]
        })
      }
    } else {
      logger.info('Startup', 'No incomplete checkpoints found')
    }
  }

  const app = express()
  app.use(express.json({ limit: '10mb' }))

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    if (req.method === 'OPTIONS') { res.sendStatus(200); return }
    next()
  })

  // Apply rate limiting to all API routes
  app.use('/api', standardRateLimit)

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
  app.use('/api/settings', settingsRouter)
  app.use('/api/graph', graphRouter)

  const dashboardDist = path.resolve(__dirname, '..', '..', 'dashboard', 'dist')
  const indexPath = path.resolve(dashboardDist, 'index.html')

  app.use(express.static(dashboardDist))

  // Catch-all for SPA routing - serve index.html for non-API routes
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error serving index.html:', err)
          console.error('Attempted path:', indexPath)
          console.error('Request path:', req.path)
          // Don't send error if headers already sent
          if (!res.headersSent) {
            res.status(500).send('Failed to load application')
          }
        }
      })
    } else {
      next()
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

  // Start stale session worker
  staleSessionWorker.start()
  logger.info('Worker', 'Stale session worker started')

  // Startup recovery: queue unsummarized sessions
  try {
    logger.info('Startup', 'Running recovery scan for unsummarized sessions')
    const unsummarized = queries.getUnsummarizedSessions()

    if (unsummarized.length > 0) {
      logger.info('Startup', `Found ${unsummarized.length} unsummarized sessions, queuing for summarization`)

      for (const session of unsummarized) {
        summarizationQueue.enqueue({
          sessionId: session.id,
          transcriptPath: session.transcript_path,
          projectId: session.project_id,
          priority: 'low'
        })
      }
    } else {
      logger.info('Startup', 'No unsummarized sessions found')
    }
  } catch (err) {
    logger.error('Startup', 'Recovery scan failed', { error: err })
  }

  server.listen(CONFIG.port, () => {
    logger.info('Server', `ClaudeContext running at http://localhost:${CONFIG.port}`)
    logger.info('Server', `API Key: ${CONFIG.apiKey ? 'configured' : 'NOT SET (summaries disabled)'}`)
  })
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Worker', 'Stopping stale session worker...')
  staleSessionWorker.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Worker', 'Stopping stale session worker...')
  staleSessionWorker.stop()
  process.exit(0)
})

main().catch(console.error)
