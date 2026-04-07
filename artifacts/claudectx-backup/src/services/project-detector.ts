import { createHash } from 'crypto'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { queries } from '../db/queries'

export async function detectProject(cwd: string): Promise<{ id: string; name: string; root_path: string }> {
  // Sanitize and validate the path to prevent path traversal
  const sanitizedCwd = path.resolve(cwd)

  // Verify the path exists and is a directory
  try {
    const stats = fs.statSync(sanitizedCwd)
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory')
    }
  } catch (err) {
    throw new Error(`Invalid directory path: ${sanitizedCwd}`)
  }

  let rootPath = sanitizedCwd
  let gitRemote: string | null = null

  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      cwd: sanitizedCwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()

    // Validate git root is also a real path
    const sanitizedGitRoot = path.resolve(gitRoot)
    rootPath = sanitizedGitRoot

    try {
      gitRemote = execSync('git remote get-url origin', {
        cwd: sanitizedGitRoot,
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
