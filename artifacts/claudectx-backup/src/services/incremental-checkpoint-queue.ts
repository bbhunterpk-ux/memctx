import { incrementalSummarize } from './incremental-summarizer'
import { logger } from './logger'

interface CheckpointJob {
  sessionId: string
  projectId: string
  checkpointNumber: number
  turnRange: [number, number]
}

class IncrementalCheckpointQueue {
  private queue: CheckpointJob[] = []
  private processing = false
  private concurrency = 1
  private retryAttempts = 2
  private retryDelay = 5000

  async enqueue(job: CheckpointJob): Promise<void> {
    this.queue.push(job)
    logger.info('IncrementalCheckpointQueue', `Enqueued checkpoint ${job.checkpointNumber} for session ${job.sessionId}`)

    if (!this.processing) {
      this.processQueue()
    }
  }

  size(): number {
    return this.queue.length
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()
      if (!job) break

      await this.processJobWithRetry(job)
    }

    this.processing = false
  }

  private async processJobWithRetry(job: CheckpointJob, attempt = 0): Promise<void> {
    try {
      logger.info('IncrementalCheckpointQueue', `Processing checkpoint ${job.checkpointNumber} for session ${job.sessionId}`)

      await incrementalSummarize(
        job.sessionId,
        job.projectId,
        job.checkpointNumber,
        job.turnRange
      )

      logger.info('IncrementalCheckpointQueue', `Completed checkpoint ${job.checkpointNumber} for session ${job.sessionId}`)
    } catch (err) {
      logger.error('IncrementalCheckpointQueue', `Checkpoint ${job.checkpointNumber} failed for session ${job.sessionId}`, { error: err })

      if (attempt < this.retryAttempts) {
        logger.info('IncrementalCheckpointQueue', `Retrying checkpoint ${job.checkpointNumber} (attempt ${attempt + 1}/${this.retryAttempts})`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        await this.processJobWithRetry(job, attempt + 1)
      } else {
        logger.error('IncrementalCheckpointQueue', `Checkpoint ${job.checkpointNumber} failed after ${this.retryAttempts} retries`)
      }
    }
  }
}

export const incrementalCheckpointQueue = new IncrementalCheckpointQueue()
