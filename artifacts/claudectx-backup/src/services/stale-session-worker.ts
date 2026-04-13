import { queries } from '../db/queries'
import { summarizationQueue } from './summarization-queue'
import { broadcast } from '../ws/broadcast'
import { logger } from './logger'

export class StaleSessionWorker {
  private intervalId: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutes
  private readonly STALE_THRESHOLD = 8 * 60 * 60 // 8 hours
  private isRunning = false

  start() {
    if (this.isRunning) {
      console.log('[StaleSessionWorker] Already running')
      return
    }

    this.isRunning = true
    console.log('[StaleSessionWorker] Starting worker')

    // Run immediately on start
    this.checkStaleSessions()

    // Then run every CHECK_INTERVAL
    this.intervalId = setInterval(() => this.checkStaleSessions(), this.CHECK_INTERVAL)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('[StaleSessionWorker] Stopped')
  }

  private async checkStaleSessions() {
    try {
      const now = Math.floor(Date.now() / 1000)
      const staleThreshold = now - this.STALE_THRESHOLD

      console.log(`[StaleSessionWorker] Checking for stale sessions (threshold: ${new Date(staleThreshold * 1000).toISOString()})`)

      const staleSessions = queries.getStaleSessions(staleThreshold)

      if (staleSessions.length === 0) {
        console.log('[StaleSessionWorker] No stale sessions found')
        return
      }

      console.log(`[StaleSessionWorker] Found ${staleSessions.length} stale sessions`)

      for (const session of staleSessions) {
        await this.endStaleSession(session)
      }
    } catch (error: any) {
      logger.error('StaleSessionWorker', 'Check failed', { error: error.message })
      console.error('[StaleSessionWorker] Error:', error)
    }
  }

  private async endStaleSession(session: any) {
    try {
      console.log(`[StaleSessionWorker] Auto-ending session ${session.id.slice(0, 8)}`)

      // Mark as completed and auto-ended
      queries.updateSession(session.id, {
        status: 'completed',
        ended_at: session.last_activity || Math.floor(Date.now() / 1000),
        auto_ended: 1
      })

      // Queue for summarization
      if (session.transcript_path) {
        console.log(`[StaleSessionWorker] Queuing summarization for ${session.id.slice(0, 8)}`)
        summarizationQueue.enqueue({
          sessionId: session.id,
          transcriptPath: session.transcript_path,
          projectId: session.project_id,
          priority: 'normal'
        })
      }

      // Broadcast event
      broadcast({
        type: 'session_auto_ended',
        session_id: session.id
      })

      logger.info('StaleSessionWorker', `Auto-ended session ${session.id}`, {
        last_activity: session.last_activity,
        project_id: session.project_id
      })
    } catch (error: any) {
      logger.error('StaleSessionWorker', `Failed to end session ${session.id}`, { error: error.message })
      console.error(`[StaleSessionWorker] Failed to end session ${session.id}:`, error)
    }
  }
}

export const staleSessionWorker = new StaleSessionWorker()
