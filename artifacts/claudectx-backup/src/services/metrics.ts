/**
 * Metrics Tracking System
 * Tracks performance and usage metrics
 */

interface Metrics {
  summarizations: {
    total: number
    successful: number
    failed: number
    avgDuration: number
  }
  sessions: {
    total: number
    active: number
    completed: number
  }
  memory: {
    preferences: number
    knowledge: number
    patterns: number
    tasks: number
  }
  queue: {
    high: number
    normal: number
    low: number
  }
}

export class MetricsTracker {
  private metrics: Metrics = {
    summarizations: {
      total: 0,
      successful: 0,
      failed: 0,
      avgDuration: 0
    },
    sessions: {
      total: 0,
      active: 0,
      completed: 0
    },
    memory: {
      preferences: 0,
      knowledge: 0,
      patterns: 0,
      tasks: 0
    },
    queue: {
      high: 0,
      normal: 0,
      low: 0
    }
  }

  private summarizationDurations: number[] = []

  /**
   * Record summarization attempt
   */
  recordSummarization(success: boolean, duration: number): void {
    this.metrics.summarizations.total++
    if (success) {
      this.metrics.summarizations.successful++
      this.summarizationDurations.push(duration)

      // Keep only last 100 durations for average
      if (this.summarizationDurations.length > 100) {
        this.summarizationDurations.shift()
      }

      // Calculate average
      const sum = this.summarizationDurations.reduce((a, b) => a + b, 0)
      this.metrics.summarizations.avgDuration = Math.round(sum / this.summarizationDurations.length)
    } else {
      this.metrics.summarizations.failed++
    }
  }

  /**
   * Update session counts
   */
  updateSessionCounts(total: number, active: number, completed: number): void {
    this.metrics.sessions.total = total
    this.metrics.sessions.active = active
    this.metrics.sessions.completed = completed
  }

  /**
   * Update memory counts
   */
  updateMemoryCounts(preferences: number, knowledge: number, patterns: number, tasks: number): void {
    this.metrics.memory.preferences = preferences
    this.metrics.memory.knowledge = knowledge
    this.metrics.memory.patterns = patterns
    this.metrics.memory.tasks = tasks
  }

  /**
   * Update queue counts
   */
  updateQueueCounts(high: number, normal: number, low: number): void {
    this.metrics.queue.high = high
    this.metrics.queue.normal = normal
    this.metrics.queue.low = low
  }

  /**
   * Get all metrics
   */
  getMetrics(): Metrics {
    return { ...this.metrics }
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      summarizations: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
      sessions: { total: 0, active: 0, completed: 0 },
      memory: { preferences: 0, knowledge: 0, patterns: 0, tasks: 0 },
      queue: { high: 0, normal: 0, low: 0 }
    }
    this.summarizationDurations = []
  }
}

export const metricsTracker = new MetricsTracker()
