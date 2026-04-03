import { queries } from '../db/queries'

/**
 * Fuzzy Task Matching
 * Finds similar tasks to avoid duplicates
 */
export class FuzzyTaskMatcher {

  /**
   * Calculate similarity between two strings (0-1)
   * Uses Levenshtein distance
   */
  private similarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b
    const shorter = a.length > b.length ? b : a

    if (longer.length === 0) return 1.0

    const distance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase())
    return (longer.length - distance) / longer.length
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }

  /**
   * Find similar tasks
   * Returns tasks with similarity > threshold (default 0.7)
   */
  findSimilarTasks(title: string, projectId: string, threshold: number = 0.7): any[] {
    const allTasks = queries.getTasks(undefined, projectId)
    const similar: Array<{ task: any; similarity: number }> = []

    for (const task of allTasks) {
      const sim = this.similarity(title, task.title)
      if (sim >= threshold) {
        similar.push({ task, similarity: sim })
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity).map(s => s.task)
  }

  /**
   * Check if task already exists (fuzzy match)
   * Returns existing task if found, null otherwise
   */
  findExistingTask(title: string, projectId: string): any | null {
    const similar = this.findSimilarTasks(title, projectId, 0.85)
    return similar.length > 0 ? similar[0] : null
  }

  /**
   * Add task with duplicate detection
   * Returns existing task if duplicate found, new task otherwise
   */
  addTaskSmart(task: { title: string; description?: string; priority?: string; projectId: string; sessionId?: string }): any {
    const existing = this.findExistingTask(task.title, task.projectId)

    if (existing) {
      console.log(`[FuzzyMatcher] Found similar task: "${existing.title}" (similarity > 85%)`)
      return existing
    }

    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    queries.addTask({
      id,
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      status: 'pending',
      projectId: task.projectId,
      sessionId: task.sessionId
    })

    return { id, ...task }
  }
}

export const fuzzyTaskMatcher = new FuzzyTaskMatcher()
