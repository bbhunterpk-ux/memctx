import { queries } from '../db/queries'

interface ConsolidationResult {
  merged: number
  conflicts: number
  reinforced: number
}

/**
 * Memory Consolidation Engine
 * Merges duplicate memories, detects conflicts, and reinforces patterns
 */
export class MemoryConsolidator {

  /**
   * Consolidate all memory types for a project
   */
  async consolidateProject(projectId: string): Promise<ConsolidationResult> {
    const result: ConsolidationResult = {
      merged: 0,
      conflicts: 0,
      reinforced: 0
    }

    // Consolidate preferences
    result.merged += await this.consolidatePreferences(projectId)

    // Consolidate knowledge
    result.merged += await this.consolidateKnowledge(projectId)

    // Reinforce patterns
    result.reinforced += await this.reinforcePatterns(projectId)

    return result
  }

  /**
   * Merge duplicate preferences
   * Strategy: Keep highest confidence, average if similar
   */
  private async consolidatePreferences(projectId: string): Promise<number> {
    const prefs = queries.getPreferences(projectId)
    const groups = new Map<string, any[]>()

    // Group by category + key
    for (const pref of prefs) {
      const key = `${pref.category}:${pref.key}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(pref)
    }

    let merged = 0

    for (const [key, items] of groups) {
      if (items.length <= 1) continue

      // Check if values are similar
      const values = items.map(i => i.value)
      const uniqueValues = [...new Set(values)]

      if (uniqueValues.length === 1) {
        // Same value, merge by averaging confidence
        const avgConfidence = items.reduce((sum, i) => sum + (i.confidence || 1.0), 0) / items.length
        const maxConfidence = Math.min(avgConfidence * 1.1, 1.0) // Boost slightly, cap at 1.0

        // Keep the most recent one, update confidence
        const latest = items.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))[0]
        queries.setPreference(
          latest.category,
          latest.key,
          latest.value,
          maxConfidence,
          latest.source_session_id,
          projectId
        )

        // Delete older duplicates
        for (const item of items) {
          if (item.id !== latest.id) {
            queries.deletePreference(item.id)
          }
        }

        merged += items.length - 1
      } else {
        // Conflicting values - keep highest confidence
        const sorted = items.sort((a, b) => (b.confidence || 1.0) - (a.confidence || 1.0))
        const winner = sorted[0]

        // Log conflict for review
        console.log(`[Consolidator] Preference conflict: ${key}`)
        console.log(`  Winner: ${winner.value} (confidence: ${winner.confidence})`)
        console.log(`  Losers: ${sorted.slice(1).map(i => `${i.value} (${i.confidence})`).join(', ')}`)

        // Delete lower confidence items
        for (const item of sorted.slice(1)) {
          queries.deletePreference(item.id)
        }

        merged += items.length - 1
      }
    }

    return merged
  }

  /**
   * Merge duplicate knowledge items
   * Strategy: Combine content, boost confidence
   */
  private async consolidateKnowledge(projectId: string): Promise<number> {
    const knowledge = queries.getKnowledge(undefined, 1000, projectId)
    const groups = new Map<string, any[]>()

    // Group by category + topic
    for (const item of knowledge) {
      const key = `${item.category}:${item.topic}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }

    let merged = 0

    for (const [key, items] of groups) {
      if (items.length <= 1) continue

      // Merge content from all items
      const contents = items.map(i => i.content)
      const uniqueContents = [...new Set(contents)]

      if (uniqueContents.length === 1) {
        // Same content, boost confidence
        const avgConfidence = items.reduce((sum, i) => sum + (i.confidence || 0.5), 0) / items.length
        const boostedConfidence = Math.min(avgConfidence * 1.15, 1.0)

        const latest = items.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))[0]
        queries.addKnowledge({
          id: latest.id,
          category: latest.category,
          topic: latest.topic,
          content: latest.content,
          confidence: boostedConfidence,
          sessionId: latest.source_session_id,
          projectId
        })

        for (const item of items) {
          if (item.id !== latest.id) {
            queries.deleteKnowledge(item.id)
          }
        }

        merged += items.length - 1
      } else {
        // Different content - combine into richer description
        const combined = uniqueContents.join('; ')
        const avgConfidence = items.reduce((sum, i) => sum + (i.confidence || 0.5), 0) / items.length

        const latest = items.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))[0]
        queries.addKnowledge({
          id: latest.id,
          category: latest.category,
          topic: latest.topic,
          content: combined.slice(0, 500), // Cap length
          confidence: avgConfidence,
          sessionId: latest.source_session_id,
          projectId
        })

        for (const item of items) {
          if (item.id !== latest.id) {
            queries.deleteKnowledge(item.id)
          }
        }

        merged += items.length - 1
      }
    }

    return merged
  }

  /**
   * Reinforce patterns seen multiple times
   * Strategy: Boost confidence for repeated patterns
   */
  private async reinforcePatterns(projectId: string): Promise<number> {
    const patterns = queries.getPatterns(undefined, 1000, projectId)
    const groups = new Map<string, any[]>()

    // Group by type + title
    for (const pattern of patterns) {
      const key = `${pattern.pattern_type}:${pattern.title}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(pattern)
    }

    let reinforced = 0

    for (const [key, items] of groups) {
      if (items.length <= 1) continue

      // Pattern seen multiple times - reinforce it
      const latest = items.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))[0]
      const reinforcementBoost = Math.min(items.length * 0.1, 0.3) // Max 30% boost

      queries.addPattern({
        id: latest.id,
        type: latest.pattern_type,
        title: latest.title,
        description: latest.description,
        example: latest.example,
        projectId
      })

      // Increment success count for reinforcement
      for (let i = 0; i < items.length - 1; i++) {
        queries.incrementPatternSuccess(latest.id)
      }

      // Delete duplicates
      for (const item of items) {
        if (item.id !== latest.id) {
          queries.deletePattern(item.id)
        }
      }

      reinforced += items.length - 1
    }

    return reinforced
  }
}

export const consolidator = new MemoryConsolidator()
