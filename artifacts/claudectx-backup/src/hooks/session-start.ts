import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()

  try {
    await postToWorker('/api/hook', {
      event: 'SessionStart',
      session_id: input.session_id,
      cwd: input.cwd,
      source: input.source || 'startup'
    })

    const context = await postToWorker('/api/context', {
      cwd: input.cwd,
      session_id: input.session_id
    })

    if (context && context.markdown) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: context.markdown
        }
      }))
    }
  } catch {
    // Never fail — if worker is down, Claude Code still starts normally
  }

  process.exit(0)
}

main()
