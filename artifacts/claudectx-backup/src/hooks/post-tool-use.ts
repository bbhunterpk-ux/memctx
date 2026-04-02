import { readStdin, postToWorker } from './utils'

async function main() {
  const input = await readStdin()

  try {
    await postToWorker('/api/hook', {
      event: 'PostToolUse',
      session_id: input.session_id,
      cwd: input.cwd,
      tool_name: input.tool_name,
      file_path: input.tool_input?.file_path || input.tool_input?.path || null,
      command: input.tool_input?.command?.slice(0, 200) || null,
      success: !input.tool_response?.error
    })
  } catch {
    // Never block Claude Code
  }

  process.exit(0)
}

main()
