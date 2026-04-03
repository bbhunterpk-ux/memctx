import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api, createWebSocket } from '../api/client'
import SessionCard from '../components/SessionCard'
import ActivityChart from '../components/ActivityChart'
import { ArrowLeft, GitBranch, FolderOpen, Brain, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import { toast } from '../components/Toast'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [consolidating, setConsolidating] = useState(false)
  const [resyncing, setResyncing] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    confirmText: string
    confirmColor: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmColor: 'var(--accent)',
  })

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

  // WebSocket listener for real-time updates
  useEffect(() => {
    if (!id) return

    let ws: WebSocket
    try {
      ws = createWebSocket()

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          // Refetch sessions on session_start, session_end, or summary_ready events
          if (event.type === 'session_start' || event.type === 'session_end' || event.type === 'summary_ready') {
            refetchSessions()
          }
        } catch {}
      }

      ws.onerror = () => {
        console.log('[ProjectDetail] WebSocket error, falling back to polling')
      }
    } catch (err) {
      console.log('[ProjectDetail] WebSocket connection failed:', err)
    }

    return () => {
      ws?.close()
    }
  }, [id, refetchSessions])

  const handleConsolidate = async () => {
    if (!id) return
    setConsolidating(true)
    const toastId = toast.loading('Consolidating memory...')
    try {
      await api.consolidateMemory(id)
      toast.dismiss(toastId)
      toast.success('Memory consolidation complete!')
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Consolidation failed: ' + error)
    } finally {
      setConsolidating(false)
    }
  }

  const handleResync = async (force: boolean = false) => {
    if (!id) return

    setConfirmDialog({
      isOpen: true,
      title: force ? 'Force Resync All Sessions' : 'Resync New Sessions',
      message: force
        ? 'This will regenerate ALL summaries with v2.0 fields (mood, complexity, blockers, resolved, key insights). This may take several minutes. Continue?'
        : 'This will only process sessions without summaries. To regenerate existing summaries with v2.0 fields, use "Force Resync All". Continue?',
      confirmText: force ? 'Force Resync' : 'Resync',
      confirmColor: force ? 'var(--orange)' : 'var(--blue)',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        setResyncing(true)
        const toastId = toast.loading('Queueing sessions for resync...', 0)
        try {
          const result = await api.resyncProject(id, force)
          toast.update(toastId, `Queued ${result.result.queued} sessions. Processing...`, 50)
          setTimeout(() => {
            toast.dismiss(toastId)
            toast.success(result.result.message)
          }, 2000)
          refetchSessions()
        } catch (error) {
          toast.dismiss(toastId)
          toast.error('Resync failed: ' + error)
        } finally {
          setResyncing(false)
        }
      }
    })
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
          {parsed.map((s: any) => <SessionCard key={s.id} session={s} onSessionUpdated={refetchSessions} />)}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  )
}

function tryParse(val: any): any {
  if (!val || Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return null }
}
