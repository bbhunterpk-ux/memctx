import PQueue from 'p-queue'

const queue = new PQueue({ concurrency: 1 })

export function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return queue.add(fn) as Promise<T>
}

export function getQueueSize(): number {
  return queue.size + queue.pending
}
