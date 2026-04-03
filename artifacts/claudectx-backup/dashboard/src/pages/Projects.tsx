import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { FolderGit2, Clock, Layers, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function Projects() {
  const [resyncingAll, setResyncingAll] = useState(false)

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
    refetchInterval: 15000,
  })

  const handleResyncAll = async (force: boolean = false) => {
    setResyncingAll(true)
    try {
      const result = await api.resyncAll(force)
      alert(result.result.message)
      refetch()
    } catch (error) {
      alert('Resync failed: ' + error)
    } finally {
      setResyncingAll(false)
    }
  }

  if (isLoading) return <Loading />
  if (error) return <ErrorState message={String(error)} />

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Projects</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              All tracked workspaces — {projects?.length ?? 0} total
            </p>
          </div>
          <button
            onClick={() => handleResyncAll(false)}
            disabled={resyncingAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: resyncingAll ? 'var(--surface)' : 'var(--blue)15',
              color: resyncingAll ? 'var(--text-muted)' : 'var(--blue)',
              border: '1px solid',
              borderColor: resyncingAll ? 'var(--border)' : 'var(--blue)30',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: resyncingAll ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={16} style={{ animation: resyncingAll ? 'spin 1s linear infinite' : 'none' }} />
            {resyncingAll ? 'Resyncing...' : 'Resync All'}
          </button>
        </div>
      </div>

      {!projects || projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {projects.map((p: any) => (
            <Link key={p.id} to={`/project/${p.id}`} style={{ display: 'block' }}>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <FolderGit2 size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    {p.git_remote && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.git_remote.replace(/^https?:\/\//, '').replace(/\.git$/, '')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Layers size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.session_count ?? 0} sessions
                    </span>
                  </div>
                  {p.last_session_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(p.last_session_at * 1000), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Loading() {
  return (
    <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
      Loading projects...
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ color: 'var(--red)', fontSize: 13 }}>Error: {message}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
        Make sure the ClaudeContext worker is running on port 9999.
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 32px',
      color: 'var(--text-muted)',
    }}>
      <FolderGit2 size={40} color="var(--border)" style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
        No projects yet
      </div>
      <div style={{ fontSize: 13, maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
        Start a Claude Code session in any project to begin tracking.
        ClaudeContext will automatically capture sessions when hooks fire.
      </div>
      <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, display: 'inline-block', fontFamily: 'monospace', fontSize: 12 }}>
        claudectx install
      </div>
    </div>
  )
}
