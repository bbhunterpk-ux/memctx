import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import SessionCard from '../components/SessionCard'
import ActivityChart from '../components/ActivityChart'
import { ArrowLeft, GitBranch, FolderOpen, Brain, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [consolidating, setConsolidating] = useState(false)
  const [resyncing, setResyncing] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  })

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => api.getSessions({ project_id: id!, limit: 50 }),
    enabled: !!id,
    refetchInterval: 15000,
  })

  const { data: health } = useQuery({ queryKey: ['health'], queryFn: api.getHealth })

  const handleConsolidate = async () => {
    if (!id) return
    setConsolidating(true)
    try {
      await api.consolidateMemory(id)
      alert('Memory consolidation complete!')
    } catch (error) {
      alert('Consolidation failed: ' + error)
    } finally {
      setConsolidating(false)
    }
  }

  const handleResync = async (force: boolean = false) => {
    if (!id) return

    const confirmMsg = force
      ? 'Force resync will regenerate ALL summaries with v2.0 fields. This may take a while. Continue?'
      : 'Resync will only process sessions without summaries. Use Force Resync to regenerate existing summaries. Continue?'

    if (!confirm(confirmMsg)) return

    setResyncing(true)
    try {
      const result = await api.resyncProject(id, force)
      alert(result.result.message)
      refetchSessions()
    } catch (error) {
      alert('Resync failed: ' + error)
    } finally {
      setResyncing(false)
    }
  }

  const activityData = health?.uptime ? [] : [] // placeholder

  if (isLoading) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
  }

  if (!project) {
    return <div style={{ padding: 32, color: 'var(--red)', fontSize: 13 }}>Project not found</div>
  }

  const allSessions = sessions || project.sessions || []
  const parsed = allSessions.map((s: any) => ({
    ...s,
    summary_what_we_did: tryParse(s.summary_what_we_did),
    summary_decisions: tryParse(s.summary_decisions),
    summary_files_changed: tryParse(s.summary_files_changed),
    summary_next_steps: tryParse(s.summary_next_steps),
    summary_gotchas: tryParse(s.summary_gotchas),
  }))

  const totalFiles = new Set(
    parsed.flatMap((s: any) => Array.isArray(s.summary_files_changed) ? s.summary_files_changed : [])
  ).size

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
        <ArrowLeft size={13} /> Back to Projects
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{project.name}</h1>

        {project.git_remote && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
            <GitBranch size={12} />
            {project.git_remote.replace(/^https?:\/\//, '').replace(/\.git$/, '')}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          <FolderOpen size={12} />
          {project.root_path}
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[
            { label: 'Sessions', value: allSessions.length },
            { label: 'Files Changed', value: totalFiles },
            { label: 'Completed', value: allSessions.filter((s: any) => s.status === 'completed').length },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 16px',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            to={`/project/${id}/memory`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Brain size={16} />
            View Memory
          </Link>

          <button
            onClick={() => handleResync(false)}
            disabled={resyncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: resyncing ? 'var(--surface)' : 'var(--blue)15',
              color: resyncing ? 'var(--text-muted)' : 'var(--blue)',
              border: '1px solid',
              borderColor: resyncing ? 'var(--border)' : 'var(--blue)30',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: resyncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={16} style={{ animation: resyncing ? 'spin 1s linear infinite' : 'none' }} />
            {resyncing ? 'Resyncing...' : 'Resync New'}
          </button>

          <button
            onClick={() => handleResync(true)}
            disabled={resyncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: resyncing ? 'var(--surface)' : 'var(--orange)15',
              color: resyncing ? 'var(--text-muted)' : 'var(--orange)',
              border: '1px solid',
              borderColor: resyncing ? 'var(--border)' : 'var(--orange)30',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: resyncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={16} style={{ animation: resyncing ? 'spin 1s linear infinite' : 'none' }} />
            {resyncing ? 'Resyncing...' : 'Force Resync All'}
          </button>

          <button
            onClick={handleConsolidate}
            disabled={consolidating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: consolidating ? 'var(--surface)' : 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: consolidating ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={16} style={{ animation: consolidating ? 'spin 1s linear infinite' : 'none' }} />
            {consolidating ? 'Consolidating...' : 'Consolidate Memory'}
          </button>
        </div>
      </div>

      {parsed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          No sessions recorded yet
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Sessions ({parsed.length})
          </h2>
          {parsed.map((s: any) => <SessionCard key={s.id} session={s} />)}
        </>
      )}
    </div>
  )
}

function tryParse(val: any): any {
  if (!val || Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return null }
}
