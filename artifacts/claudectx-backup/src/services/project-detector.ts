import { createHash } from 'crypto'
import { execSync } from 'child_process'
import path from 'path'
import { queries } from '../db/queries'

export async function detectProject(cwd: string): Promise<{ id: string; name: string; root_path: string }> {
  let rootPath = cwd
  let gitRemote: string | null = null

  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
    rootPath = gitRoot

    try {
      gitRemote = execSync('git remote get-url origin', {
        cwd: gitRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
    } catch {}
  } catch {
    // Not a git repo — use cwd
  }

  const projectId = createHash('sha256').update(rootPath).digest('hex').slice(0, 16)
  const projectName = path.basename(rootPath)

  queries.upsertProject({
    id: projectId,
    name: projectName,
    root_path: rootPath,
    git_remote: gitRemote
  })

  return { id: projectId, name: projectName, root_path: rootPath }
}
