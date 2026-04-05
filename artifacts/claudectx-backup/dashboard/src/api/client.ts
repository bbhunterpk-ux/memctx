const BASE = ''  // Same origin in production; proxied in dev

export async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers }
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  getProjects: () => apiFetch('/api/projects'),
  getProject: (id: string) => apiFetch(`/api/projects/${id}`),
  getSessions: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))
    return apiFetch(`/api/sessions?${q}`)
  },
  getSession: (id: string) => apiFetch(`/api/sessions/${id}`),
  getHealth: () => apiFetch('/api/health'),
  getContext: (cwd: string, n = 3) => apiFetch(`/api/context?cwd=${encodeURIComponent(cwd)}&n=${n}`),
  search: (query: string, project_id?: string) =>
    apiFetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query, project_id })
    }),
  getObservations: (session_id: string) => apiFetch(`/api/observations?session_id=${session_id}`),
  getMemory: (projectId: string) => apiFetch(`/api/memory?project_id=${projectId}`),
  getPreferences: (projectId: string) => apiFetch(`/api/memory/preferences?project_id=${projectId}`),
  getKnowledge: (projectId: string, category?: string) => apiFetch(`/api/memory/knowledge?project_id=${projectId}${category ? `&category=${category}` : ''}`),
  getPatterns: (projectId: string, type?: string) => apiFetch(`/api/memory/patterns?project_id=${projectId}${type ? `&type=${type}` : ''}`),
  getTasks: (projectId: string, status?: string) => apiFetch(`/api/memory/tasks?project_id=${projectId}${status ? `&status=${status}` : ''}`),
  getContacts: (projectId: string) => apiFetch(`/api/memory/contacts?project_id=${projectId}`),
  getMetrics: () => apiFetch('/api/metrics'),
  consolidateMemory: (projectId: string) => apiFetch(`/api/consolidate/${projectId}`, { method: 'POST' }),
  resyncProject: (projectId: string, force?: boolean) => apiFetch(`/api/resync/${projectId}${force ? '?force=true' : ''}`, { method: 'POST' }),
  resyncSession: (sessionId: string) => apiFetch(`/api/resync/session/${sessionId}`, { method: 'POST' }),
  resyncAll: (force?: boolean) => apiFetch(`/api/resync/all${force ? '?force=true' : ''}`, { method: 'POST' }),
  forceEndSession: (sessionId: string) => apiFetch(`/api/force-end-session/${sessionId}`, { method: 'POST' }),
  deleteSession: (sessionId: string) => apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' }),
  toggleBookmark: (sessionId: string, bookmarked: boolean) => apiFetch(`/api/sessions/${sessionId}/bookmark`, {
    method: 'POST',
    body: JSON.stringify({ bookmarked })
  }),
}

export function createWebSocket(): WebSocket {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return new WebSocket(`${proto}//${location.host}`)
}
