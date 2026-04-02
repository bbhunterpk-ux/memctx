import { queries } from '../db/queries'
import { detectProject } from './project-detector'

export async function buildContextMarkdown(cwd: string, n: number = 3): Promise<string> {
  const project = await detectProject(cwd)
  const sessions = queries.getLastNCompletedSessions(project.id, n)

  if (sessions.length === 0) {
    return ''
  }

  const lines: string[] = [
    `=== ClaudeContext: Last ${sessions.length} session(s) for [${project.name}] ===`,
    ''
  ]

  for (const s of sessions) {
    const date = new Date(s.started_at * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    } as any)

    lines.push(`[${date}] ${s.summary_title || 'Untitled session'} — ${(s.summary_status || 'completed').toUpperCase()}`)

    if (s.summary_what_we_did) {
      try {
        const items = JSON.parse(s.summary_what_we_did) as string[]
        if (items.length > 0) {
          lines.push(`  Done: ${items.slice(0, 3).join(' • ')}`)
        }
      } catch {}
    }

    if (s.summary_files_changed) {
      try {
        const files = JSON.parse(s.summary_files_changed) as string[]
        if (files.length > 0) {
          lines.push(`  Files: ${files.slice(0, 4).join(', ')}`)
        }
      } catch {}
    }

    if (s.summary_next_steps) {
      try {
        const next = JSON.parse(s.summary_next_steps) as string[]
        if (next.length > 0) {
          lines.push(`  Next: ${next[0]}`)
        }
      } catch {}
    }

    if (s.summary_gotchas) {
      try {
        const gotchas = JSON.parse(s.summary_gotchas) as string[]
        if (gotchas.length > 0) {
          lines.push(`  Remember: ${gotchas[0]}`)
        }
      } catch {}
    }

    lines.push('')
  }

  lines.push('=== End of ClaudeContext ===')
  return lines.join('\n')
}
