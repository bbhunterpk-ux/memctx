import { queries } from '../db/queries'
import { detectProject } from './project-detector'

export async function buildContextMarkdown(cwd: string, n: number = 3): Promise<string> {
  const project = await detectProject(cwd)
  const sessions = queries.getLastNCompletedSessions(project.id, n)

  if (sessions.length === 0) {
    return ''
  }

  const lines: string[] = [
    `=== ClaudeContext Memory ===`,
    ''
  ]

  // 1. User Preferences
  const prefs = queries.getPreferences()
  if (prefs.length > 0) {
    lines.push('## Your Preferences')
    prefs.forEach((p: any) => {
      lines.push(`- ${p.key}: ${p.value}`)
    })
    lines.push('')
  }

  // 2. Recent Sessions
  lines.push(`## Recent Sessions`)
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

    if (s.summary_next_steps) {
      try {
        const next = JSON.parse(s.summary_next_steps) as string[]
        if (next.length > 0) {
          lines.push(`  Next: ${next[0]}`)
        }
      } catch {}
    }

    lines.push('')
  }

  // 3. Pending Tasks
  const tasks = queries.getTasks('pending', project.id)
  if (tasks.length > 0) {
    lines.push('## Pending Tasks')
    tasks.slice(0, 5).forEach((t: any) => {
      lines.push(`- [${t.priority}] ${t.title}`)
    })
    lines.push('')
  }

  // 4. Domain Knowledge
  const knowledge = queries.getKnowledge(undefined, 5)
  if (knowledge.length > 0) {
    lines.push('## What You Know')
    knowledge.forEach((k: any) => {
      lines.push(`- ${k.topic}: ${k.content}`)
    })
    lines.push('')
  }

  // 5. Learned Patterns
  const patterns = queries.getPatterns(undefined, 5)
  if (patterns.length > 0) {
    lines.push('## Your Patterns')
    patterns.forEach((p: any) => {
      lines.push(`- ${p.title}: ${p.description}`)
    })
    lines.push('')
  }

  lines.push('=== End of ClaudeContext Memory ===')
  return lines.join('\n')
}
