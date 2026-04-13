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

  // 1. User Preferences (project-specific)
  const prefs = queries.getPreferences(project.id)
  if (prefs.length > 0) {
    lines.push('## Your Preferences')
    prefs.forEach((p: any) => {
      lines.push(`- ${p.key}: ${p.value}`)
    })
    lines.push('')
  }

  // 2. Recent Sessions with enhanced fields
  lines.push(`## Recent Sessions`)
  for (const s of sessions) {
    const date = new Date(s.started_at * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    } as any)

    const status = (s.summary_status || 'completed').toUpperCase()
    const mood = s.summary_mood ? ` [${s.summary_mood}]` : ''
    const complexity = s.summary_complexity ? ` (${s.summary_complexity})` : ''

    lines.push(`[${date}] ${s.summary_title || 'Untitled session'}${mood} — ${status}${complexity}`)

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

    if (s.summary_key_insight) {
      lines.push(`  Key Insight: ${s.summary_key_insight}`)
    }

    if (s.next_session_starting_point) {
      lines.push(`  START HERE: ${s.next_session_starting_point}`)
    }

    if (s.unresolved_tech_debt) {
      try {
        const debt = JSON.parse(s.unresolved_tech_debt) as string[]
        if (debt.length > 0) {
          lines.push(`  Tech Debt: ${debt.join(', ')}`)
        }
      } catch {}
    }

    if (s.open_rabbit_holes) {
      try {
        const holes = JSON.parse(s.open_rabbit_holes) as string[]
        if (holes.length > 0) {
          lines.push(`  Rabbit Holes: ${holes.join(', ')}`)
        }
      } catch {}
    }

    if (s.testing_coverage_gap) {
      lines.push(`  Testing Gap: ${s.testing_coverage_gap}`)
    }

    if (s.architectural_drift) {
      lines.push(`  Arch Drift: ${s.architectural_drift}`)
    }

    if (s.collaboration_style) {
      lines.push(`  Style: ${s.collaboration_style}`)
    }

    if (s.summary_blockers) {
      try {
        const blockers = JSON.parse(s.summary_blockers) as string[]
        if (blockers.length > 0) {
          lines.push(`  Blockers: ${blockers.join(', ')}`)
        }
      } catch {}
    }

    lines.push('')
  }

  // 3. Pending Tasks (project-specific)
  const tasks = queries.getTasks('pending', project.id)
  if (tasks.length > 0) {
    lines.push('## Pending Tasks')
    tasks.slice(0, 5).forEach((t: any) => {
      lines.push(`- [${t.priority}] ${t.title}`)
    })
    lines.push('')
  }

  // 4. Domain Knowledge (project-specific)
  const knowledge = queries.getKnowledge(undefined, 5, project.id)
  if (knowledge.length > 0) {
    lines.push('## What You Know')
    knowledge.forEach((k: any) => {
      lines.push(`- ${k.topic}: ${k.content}`)
    })
    lines.push('')
  }

  // 5. Learned Patterns (project-specific)
  const patterns = queries.getPatterns(undefined, 5, project.id)
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
