import fs from 'fs'
import path from 'path'
import { queries } from '../db/queries'

const MARKER_START = '<!-- CLAUDECTX:START -->'
const MARKER_END = '<!-- CLAUDECTX:END -->'

export async function updateClaudeMd(
  projectId: string,
  _sessionId: string,
  summary: any
): Promise<void> {
  const project = queries.getProject(projectId)
  if (!project) return

  const claudeMdPath = path.join(project.root_path, 'CLAUDE.md')

  const block = [
    MARKER_START,
    '## Recent session history (auto-updated by ClaudeContext)',
    '',
    `**Last session:** ${summary.title} — ${summary.status.toUpperCase()}`,
    summary.what_we_did?.length ? `**Completed:** ${summary.what_we_did.slice(0, 3).join(', ')}` : '',
    summary.next_steps?.length ? `**Up next:** ${summary.next_steps[0]}` : '',
    summary.gotchas?.length ? `**Remember:** ${summary.gotchas[0]}` : '',
    '',
    `_Updated automatically. View full history at http://localhost:9999_`,
    MARKER_END
  ].filter(Boolean).join('\n')

  let existing = ''
  if (fs.existsSync(claudeMdPath)) {
    existing = fs.readFileSync(claudeMdPath, 'utf8')
  }

  if (existing.includes(MARKER_START)) {
    const start = existing.indexOf(MARKER_START)
    const end = existing.indexOf(MARKER_END) + MARKER_END.length
    existing = existing.slice(0, start) + block + existing.slice(end)
  } else {
    existing = existing + '\n\n' + block
  }

  fs.writeFileSync(claudeMdPath, existing, 'utf8')
}
