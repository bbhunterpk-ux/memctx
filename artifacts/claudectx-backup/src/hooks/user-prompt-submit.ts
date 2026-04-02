import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()

  try {
    await postToWorker('/api/hook', {
      event: 'UserPromptSubmit',
      session_id: input.session_id,
      cwd: input.cwd,
      prompt_preview: (input.prompt || '').slice(0, 500)
    })
  } catch {}

  process.exit(0)
}

main()
