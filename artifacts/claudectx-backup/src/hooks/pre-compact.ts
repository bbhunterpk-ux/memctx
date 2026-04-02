import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()

  try {
    await postToWorker('/api/hook', {
      event: 'PreCompact',
      session_id: input.session_id,
      cwd: input.cwd,
      transcript_path: input.transcript_path
    })
  } catch {}

  process.exit(0)
}

main()
