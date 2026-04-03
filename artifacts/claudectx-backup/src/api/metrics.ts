import { Router, Request, Response } from 'express'
import { metricsTracker } from '../services/metrics'
import { summarizationQueue } from '../services/summarization-queue'
import { queries } from '../db/queries'

const router: Router = Router()

/**
 * GET /api/metrics
 * Get system metrics
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Update queue metrics
    const queueStats = summarizationQueue.getStats()
    metricsTracker.updateQueueCounts(queueStats.high, queueStats.normal, queueStats.low)

    // Update session metrics
    const allSessions = queries.getSessions({})
    const activeSessions = allSessions.filter((s: any) => s.status === 'active')
    const completedSessions = allSessions.filter((s: any) => s.status === 'completed')
    metricsTracker.updateSessionCounts(allSessions.length, activeSessions.length, completedSessions.length)

    // Get metrics
    const metrics = metricsTracker.getMetrics()

    res.json({
      success: true,
      metrics,
      timestamp: Date.now()
    })
  } catch (error: any) {
    console.error('[API] Failed to get metrics:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/metrics/reset
 * Reset metrics
 */
router.post('/reset', (req: Request, res: Response) => {
  try {
    metricsTracker.reset()
    res.json({
      success: true,
      message: 'Metrics reset'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
