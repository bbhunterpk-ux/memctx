import { getDB } from './client'

function run(sql: string, ...params: any[]) {
  const db = getDB()
  const stmt = db.prepare(sql)
  return stmt.run(...params)
}

function get(sql: string, ...params: any[]): any {
  const db = getDB()
  const stmt = db.prepare(sql)
  return stmt.get(...params) ?? null
}

function all(sql: string, ...params: any[]): any[] {
  const db = getDB()
  const stmt = db.prepare(sql)
  return (stmt.all(...params) as any[]) ?? []
}

export const queries = {
  upsertProject(p: { id: string; name: string; root_path: string; git_remote: string | null }) {
    run(`
      INSERT INTO projects (id, name, root_path, git_remote, updated_at)
      VALUES (?, ?, ?, ?, unixepoch())
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        git_remote = excluded.git_remote,
        updated_at = unixepoch()
    `, p.id, p.name, p.root_path, p.git_remote)
  },

  getProject(id: string) {
    return get('SELECT * FROM projects WHERE id = ?', id)
  },

  getAllProjects() {
    return all(`
      SELECT p.*,
        COUNT(DISTINCT s.id) as session_count,
        MAX(s.started_at) as last_session_at
      FROM projects p
      LEFT JOIN sessions s ON s.project_id = p.id
      GROUP BY p.id
      ORDER BY last_session_at DESC
    `)
  },

  getProjectWithSessions(id: string) {
    const project = get('SELECT * FROM projects WHERE id = ?', id)
    if (!project) return null
    const sessions = all(`
      SELECT * FROM sessions WHERE project_id = ? ORDER BY started_at DESC LIMIT 50
    `, id)
    return { ...project, sessions }
  },

  upsertSession(s: { id: string; project_id: string; started_at: number; status: string }) {
    run(`
      INSERT INTO sessions (id, project_id, started_at, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status
    `, s.id, s.project_id, s.started_at, s.status)
  },

  updateSession(id: string, fields: Record<string, any>) {
    const keys = Object.keys(fields)
    if (keys.length === 0) return

    let attempts = 0
    while (attempts < 3) {
      try {
        const setClauses = keys.map(k => `${k} = ?`).join(', ')
        const values = keys.map(k => fields[k])
        run(`UPDATE sessions SET ${setClauses} WHERE id = ?`, ...values, id)
        return
      } catch (err: any) {
        if (err.message?.includes('SQLITE_BUSY') && attempts < 2) {
          attempts++
          const start = Date.now()
          while (Date.now() - start < 100) {}
        } else {
          throw err
        }
      }
    }
  },

  getSession(id: string) {
    return get('SELECT * FROM sessions WHERE id = ?', id)
  },

  getSessions(opts: { project_id?: string; limit?: number; offset?: number; status?: string }) {
    const conditions: string[] = ['1=1']
    const params: any[] = []
    if (opts.project_id) { conditions.push('project_id = ?'); params.push(opts.project_id) }
    if (opts.status) { conditions.push('status = ?'); params.push(opts.status) }
    params.push(opts.limit ?? 20, opts.offset ?? 0)
    return all(
      `SELECT * FROM sessions WHERE ${conditions.join(' AND ')} ORDER BY started_at DESC LIMIT ? OFFSET ?`,
      ...params
    )
  },

  getLastNCompletedSessions(project_id: string, n: number) {
    return all(`
      SELECT * FROM sessions
      WHERE project_id = ?
        AND status IN ('completed', 'compacted')
        AND summary_title IS NOT NULL
      ORDER BY started_at DESC
      LIMIT ?
    `, project_id, n)
  },

  getSessionWithObservations(id: string) {
    const session = get('SELECT * FROM sessions WHERE id = ?', id)
    if (!session) return null
    const observations = all(
      'SELECT * FROM observations WHERE session_id = ? ORDER BY created_at ASC',
      id
    )
    return { ...session, observations }
  },

  insertObservation(o: {
    session_id: string
    project_id: string
    event_type: string
    tool_name?: string
    file_path?: string
    content?: string
    metadata?: string
  }) {
    run(`
      INSERT INTO observations (session_id, project_id, event_type, tool_name, file_path, content, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      o.session_id, o.project_id, o.event_type,
      o.tool_name ?? null, o.file_path ?? null,
      o.content ?? null, o.metadata ?? '{}'
    )
  },

  incrementTurnStats(session_id: string, field: 'turns' | 'tool_calls') {
    const col = field === 'turns' ? 'total_turns' : 'total_tool_calls'
    run(`UPDATE sessions SET ${col} = COALESCE(${col}, 0) + 1 WHERE id = ?`, session_id)
  },

  addFileTouched(session_id: string, file_path: string) {
    const session = get('SELECT files_touched FROM sessions WHERE id = ?', session_id)
    if (!session) return
    let files: string[] = []
    try { files = JSON.parse(session.files_touched || '[]') } catch {}
    if (!files.includes(file_path)) {
      files.push(file_path)
      run('UPDATE sessions SET files_touched = ? WHERE id = ?', JSON.stringify(files), session_id)
    }
  },

  searchObservations(query: string, project_id?: string) {
    if (project_id) {
      return all(`
        SELECT o.*, s.summary_title as session_title, p.name as project_name,
               rank as relevance_rank
        FROM obs_fts
        JOIN observations o ON obs_fts.rowid = o.id
        JOIN sessions s ON o.session_id = s.id
        JOIN projects p ON o.project_id = p.id
        WHERE obs_fts MATCH ? AND o.project_id = ?
        ORDER BY rank
        LIMIT 50
      `, query, project_id)
    }
    return all(`
      SELECT o.*, s.summary_title as session_title, p.name as project_name,
             rank as relevance_rank
      FROM obs_fts
      JOIN observations o ON obs_fts.rowid = o.id
      JOIN sessions s ON o.session_id = s.id
      JOIN projects p ON o.project_id = p.id
      WHERE obs_fts MATCH ?
      ORDER BY rank
      LIMIT 50
    `, query)
  },

  getSetting(key: string): string | null {
    const row = get('SELECT value FROM settings WHERE key = ?', key)
    return row ? row.value : null
  },

  setSetting(key: string, value: string) {
    run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value)
  },

  getRecentActivity(days: number = 14) {
    return all(`
      SELECT date(started_at, 'unixepoch') as day, COUNT(*) as session_count
      FROM sessions
      WHERE started_at > unixepoch('now', '-${days} days')
      GROUP BY day
      ORDER BY day ASC
    `)
  }
}
