import { createHash } from 'crypto'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { queries } from '../db/queries'

export async function detectProject(cwd: string): Promise<{ id: string; name: string; root_path: string }> {
  // Sanitize and validate the path to prevent path traversal
  const sanitizedCwd = path.resolve(cwd)

  // Additional security: ensure path doesn't contain suspicious patterns
  if (sanitizedCwd.includes('\0') || sanitizedCwd.includes('..')) {
    throw new Error('Invalid path: contains suspicious characters')
  }

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

    // Validate git root is also a real path and doesn't contain suspicious patterns
    if (gitRoot.includes('\0') || gitRoot.includes('..')) {
      throw new Error('Invalid git root path')
    }
    const sanitizedGitRoot = path.resolve(gitRoot)

    // Verify git root exists and is a directory
    const gitStats = fs.statSync(sanitizedGitRoot)
    if (!gitStats.isDirectory()) {
      throw new Error('Git root is not a directory')
    }

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
