import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()

  try {
    await postToWorker('/api/hook', {
      event: 'SessionEnd',
      session_id: input.session_id,
      transcript_path: input.transcript_path,
      cwd: input.cwd
    })
  } catch {
    // Ignore — worker will pick up transcript via file watcher
  }

  process.exit(0)
}

main()
