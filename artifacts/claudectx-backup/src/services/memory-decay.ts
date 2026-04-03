import { queries } from '../db/queries'

/**
 * Memory Decay System
 * Gradually reduces confidence of unused memories
 */
export class MemoryDecay {

  /**
   * Apply daily decay to all memories
   * Reduces confidence by 1% per day for unused items
   */
  async applyDailyDecay(projectId: string): Promise<void> {
    const decayRate = 0.01 // 1% per day
    const softDeleteThreshold = 0.2 // Delete when confidence drops below 20%

    // Decay preferences
    const prefs = queries.getPreferences(projectId)
    for (const pref of prefs) {
      const daysSinceUpdate = Math.floor((Date.now() / 1000 - (pref.updated_at || pref.created_at)) / 86400)
      if (daysSinceUpdate > 0) {
        const newConfidence = Math.max((pref.confidence || 1.0) - (decayRate * daysSinceUpdate), 0)

        if (newConfidence < softDeleteThreshold) {
          console.log(`[Decay] Soft-deleting preference: ${pref.category}:${pref.key} (confidence: ${newConfidence})`)
          queries.deletePreference(pref.id)
        } else if (newConfidence < pref.confidence) {
          queries.setPreference(pref.category, pref.key, pref.value, newConfidence, pref.source_session_id, projectId)
        }
      }
    }

    // Decay knowledge
    const knowledge = queries.getKnowledge(undefined, 1000, projectId)
    for (const item of knowledge) {
      const daysSinceUpdate = Math.floor((Date.now() / 1000 - (item.updated_at || item.created_at)) / 86400)
      if (daysSinceUpdate > 0) {
        const newConfidence = Math.max((item.confidence || 0.5) - (decayRate * daysSinceUpdate), 0)

        if (newConfidence < softDeleteThreshold) {
          console.log(`[Decay] Soft-deleting knowledge: ${item.topic} (confidence: ${newConfidence})`)
          queries.deleteKnowledge(item.id)
        } else if (newConfidence < item.confidence) {
          queries.addKnowledge({
            id: item.id,
            category: item.category,
            topic: item.topic,
            content: item.content,
            confidence: newConfidence,
            sessionId: item.source_session_id,
            projectId
          })
        }
      }
    }

    console.log(`[Decay] Applied daily decay to project ${projectId}`)
  }

  /**
   * Schedule daily decay job
   */
  startDecayScheduler(): void {
    // Run decay every 24 hours
    setInterval(async () => {
      console.log('[Decay] Running scheduled decay job')
      const projects = queries.getAllProjects()

      for (const project of projects) {
        try {
          await this.applyDailyDecay(project.id)
        } catch (error) {
          console.error(`[Decay] Failed for project ${project.id}:`, error)
        }
      }
    }, 24 * 60 * 60 * 1000) // 24 hours

    console.log('[Decay] Decay scheduler started (runs every 24 hours)')
  }
}

export const memoryDecay = new MemoryDecay()
