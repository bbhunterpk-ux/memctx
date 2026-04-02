import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()

  // CRITICAL: Check stop_hook_active to prevent infinite loop
  if (input.stop_hook_active) {
    process.exit(0)
  }

  try {
    await postToWorker('/api/hook', {
      event: 'Stop',
      session_id: input.session_id,
      cwd: input.cwd,
      message_preview: (input.last_assistant_message || '').slice(0, 300)
    })
  } catch {}

  process.exit(0)
}

main()
