import { queries } from '../db/queries'
import { broadcast } from '../ws/broadcast'
import { logger } from './logger'
import { summarizationQueue } from './summarization-queue'

const INACTIVITY_TIMEOUT = 5 * 60 // 5 minutes in seconds

export function startSessionTimeoutChecker() {
  setInterval(() => {
    try {
      const now = Math.floor(Date.now() / 1000)
      const cutoff = now - INACTIVITY_TIMEOUT

      // Find active sessions with no recent activity
      const activeSessions = queries.getActiveSessions()

      for (const session of activeSessions) {
        const lastActivity = session.last_activity || session.started_at

        if (lastActivity < cutoff) {
          console.log(`[SessionTimeout] Marking inactive session as completed: ${session.id.slice(0, 8)}`)
          console.log(`[SessionTimeout] Last activity: ${new Date(lastActivity * 1000).toISOString()}`)

          queries.updateSession(session.id, {
            ended_at: lastActivity + 60, // Mark as ended 1 minute after last activity
            status: 'completed'
          })

          broadcast({
            type: 'session_end',
            session_id: session.id,
            reason: 'inactivity_timeout'
          })

          // Queue for summarization if transcript exists
          if (session.transcript_path) {
            console.log(`[SessionTimeout] Queuing summarization for: ${session.id.slice(0, 8)}`)
            summarizationQueue.enqueue({
              sessionId: session.id,
              transcriptPath: session.transcript_path,
              projectId: session.project_id,
              priority: 'normal'
            })
          }

          logger.info('SessionTimeout', `Session ${session.id} marked as completed due to inactivity`)
        }
      }
    } catch (err) {
      console.error('[SessionTimeout] Error checking inactive sessions:', err)
    }
  }, 60 * 1000) // Check every minute

  console.log('[SessionTimeout] Session timeout checker started (5 minute inactivity threshold)')
}
