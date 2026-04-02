import chokidar from 'chokidar'
import path from 'path'
import { CONFIG } from '../config'
import { queries } from '../db/queries'
import { enqueue } from './queue'
import { summarizeSession } from './summarizer'

export function startWatcher(): void {
  if (!CONFIG.claudeProjectsDir) return

  const watchPath = path.join(CONFIG.claudeProjectsDir, '**', '*.jsonl')

  const watcher = chokidar.watch(watchPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 }
  })

  watcher.on('change', (filePath: string) => {
    // Check if this transcript belongs to a known session
    const transcriptName = path.basename(filePath, '.jsonl')

    const session = queries.getSession(transcriptName)
    if (session && session.status === 'active') {
      // File was written — update transcript path
      queries.updateSession(transcriptName, { transcript_path: filePath })
    }
  })

  watcher.on('error', (err: Error) => {
    console.error('Watcher error:', err)
  })

  console.log('File watcher started for', CONFIG.claudeProjectsDir)
}
