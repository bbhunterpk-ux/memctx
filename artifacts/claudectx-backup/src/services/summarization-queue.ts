import { queries } from '../db/queries'

interface SummarizationJob {
  sessionId: string
  transcriptPath: string
  projectId: string
  priority: 'high' | 'normal' | 'low'
  attempts: number
  createdAt: number
}

/**
 * Priority Queue for Summarization Jobs
 * Manages job scheduling with retry logic
 */
export class SummarizationQueue {
  private highPriorityQueue: SummarizationJob[] = []
  private normalPriorityQueue: SummarizationJob[] = []
  private lowPriorityQueue: SummarizationJob[] = []
  private processing = false
  private maxRetries = 3
  private retryDelays = [5000, 15000, 60000] // 5s, 15s, 60s

  /**
   * Add job to appropriate queue
   */
  enqueue(job: Omit<SummarizationJob, 'attempts' | 'createdAt'>): void {
    const fullJob: SummarizationJob = {
      ...job,
      attempts: 0,
      createdAt: Date.now()
    }

    switch (job.priority) {
      case 'high':
        this.highPriorityQueue.push(fullJob)
        break
      case 'low':
        this.lowPriorityQueue.push(fullJob)
        break
      default:
        this.normalPriorityQueue.push(fullJob)
    }

    console.log(`[Queue] Enqueued ${job.priority} priority job for session ${job.sessionId}`)
    this.processNext()
  }

  /**
   * Get next job from highest priority queue
   */
  private dequeue(): SummarizationJob | null {
    if (this.highPriorityQueue.length > 0) {
      return this.highPriorityQueue.shift()!
    }
    if (this.normalPriorityQueue.length > 0) {
      return this.normalPriorityQueue.shift()!
    }
    if (this.lowPriorityQueue.length > 0) {
      return this.lowPriorityQueue.shift()!
    }
    return null
  }

  /**
   * Process next job in queue
   */
  private async processNext(): Promise<void> {
    if (this.processing) return

    const job = this.dequeue()
    if (!job) return

    this.processing = true

    try {
      console.log(`[Queue] Processing job for session ${job.sessionId} (attempt ${job.attempts + 1}/${this.maxRetries})`)

      // Import here to avoid circular dependency
      const { summarizeSession } = await import('./summarizer')
      await summarizeSession(job.sessionId, job.transcriptPath, job.projectId)

      console.log(`[Queue] Successfully processed session ${job.sessionId}`)
    } catch (error: any) {
      console.error(`[Queue] Job failed for session ${job.sessionId}:`, error.message)

      // Retry logic
      if (job.attempts < this.maxRetries - 1) {
        job.attempts++
        const delay = this.retryDelays[job.attempts - 1] || this.retryDelays[this.retryDelays.length - 1]

        console.log(`[Queue] Retrying session ${job.sessionId} in ${delay}ms (attempt ${job.attempts + 1}/${this.maxRetries})`)

        setTimeout(() => {
          // Re-enqueue with same priority
          switch (job.priority) {
            case 'high':
              this.highPriorityQueue.push(job)
              break
            case 'low':
              this.lowPriorityQueue.push(job)
              break
            default:
              this.normalPriorityQueue.push(job)
          }
          this.processing = false
          this.processNext()
        }, delay)
        return
      } else {
        console.error(`[Queue] Max retries reached for session ${job.sessionId}, giving up`)
        // Mark session as completed even if summarization failed
        queries.updateSession(job.sessionId, { status: 'completed' })
      }
    }

    this.processing = false
    this.processNext()
  }

  /**
   * Get queue stats
   */
  getStats(): { high: number; normal: number; low: number; processing: boolean } {
    return {
      high: this.highPriorityQueue.length,
      normal: this.normalPriorityQueue.length,
      low: this.lowPriorityQueue.length,
      processing: this.processing
    }
  }
}

export const summarizationQueue = new SummarizationQueue()
