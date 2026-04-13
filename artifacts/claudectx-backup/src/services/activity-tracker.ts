import { queries } from '../db/queries'

export class ActivityTracker {
  private lastUpdate: Map<string, number> = new Map()
  private readonly DEBOUNCE_MS = 60 * 1000 // 1 minute

  updateActivity(sessionId: string) {
    const now = Date.now()
    const lastUpdate = this.lastUpdate.get(sessionId) || 0

    if (now - lastUpdate < this.DEBOUNCE_MS) {
      return // Skip if updated recently
    }

    try {
      queries.updateSessionActivity(sessionId, Math.floor(now / 1000))
      this.lastUpdate.set(sessionId, now)
    } catch (error) {
      console.error('[ActivityTracker] Failed to update activity:', error)
    }
  }

  // Clear old entries to prevent memory leak
  cleanup() {
    const now = Date.now()
    const threshold = 24 * 60 * 60 * 1000 // 24 hours

    for (const [sessionId, timestamp] of this.lastUpdate.entries()) {
      if (now - timestamp > threshold) {
        this.lastUpdate.delete(sessionId)
      }
    }
  }
}

export const activityTracker = new ActivityTracker()

// Run cleanup every hour
setInterval(() => activityTracker.cleanup(), 60 * 60 * 1000)
