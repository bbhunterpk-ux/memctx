import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api, createWebSocket } from '../api/client'
import { format, formatDistanceStrict } from 'date-fns'
import StatusBadge from '../components/StatusBadge'
import SummaryView from '../components/SummaryView'
import ObservationList from '../components/ObservationList'
import CopyButton from '../components/CopyButton'
import DownloadButton from '../components/DownloadButton'
import PDFDownloadButton from '../components/PDFDownloadButton'
import ShareLinkButton from '../components/ShareLinkButton'
import TagInput from '../components/TagInput'
import NotesModal from '../components/NotesModal'
import { GraphViewer } from '../components/GraphViewer'
import { ArrowLeft, Zap, AlertCircle, CheckCircle, RefreshCw, FileText, ArrowRight, Terminal, FileEdit, MessageSquare, Brain, Wrench } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from '../components/Toast'

function buildCopyText(session: any): string {
  const lines = [
    `# ${session.summary_title || 'Session'}`,
    `Date: ${format(new Date(session.started_at * 1000), 'PPpp')}`,
    `Status: ${session.summary_status || session.status}`,
    '',
  ]

  if (session.summary_mood) {
    lines.push(`Mood: ${session.summary_mood}`)
  }
  if (session.summary_complexity) {
    lines.push(`Complexity: ${session.summary_complexity}`)
  }
  if (session.summary_key_insight) {
    lines.push(`Key Insight: ${session.summary_key_insight}`)
    lines.push('')
  }

  const parseArray = (field: any) => {
    if (!field) return []
    if (Array.isArray(field)) return field
    try {
      return JSON.parse(field)
    } catch {
      return []
    }
  }

  const whatWeDid = parseArray(session.summary_what_we_did)
  if (whatWeDid.length) {
    lines.push('## What We Did')
    whatWeDid.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  const decisions = parseArray(session.summary_decisions)
  if (decisions.length) {
    lines.push('## Decisions Made')
    decisions.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  const blockers = parseArray(session.summary_blockers)
  if (blockers.length) {
    lines.push('## Blockers')
    blockers.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  const resolved = parseArray(session.summary_resolved)
  if (resolved.length) {
    lines.push('## Resolved')
    resolved.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  const filesChanged = parseArray(session.summary_files_changed)
  if (filesChanged.length) {
    lines.push('## Files Changed')
    filesChanged.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  const nextSteps = parseArray(session.summary_next_steps)
  if (nextSteps.length) {
    lines.push('## Next Steps')
    nextSteps.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  const gotchas = parseArray(session.summary_gotchas)
  if (gotchas.length) {
    lines.push('## Gotchas / Remember')
    gotchas.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  const techNotes = parseArray(session.summary_tech_notes)
  if (techNotes.length) {
    lines.push('## Tech Notes')
    techNotes.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  return lines.join('\n')
}

interface Props {
  onOpenSession: (id: string, name: string, projectId: string) => void
}

export default function SessionDetail({ onOpenSession }: Props) {
  const { id } = useParams<{ id: string }>()
  const [syncing, setSyncing] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'graph'>('overview')

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!),
    enabled: !!id,
    refetchInterval: (data: any) => data?.status === 'active' ? 5000 : false,
  })

  // Add session to tabs when it loads
  useEffect(() => {
    if (session && id) {
      onOpenSession(id, session.summary_title || `Session ${id.slice(0, 8)}`, session.project_id)
    }
  }, [session, id, onOpenSession])

  // WebSocket listener for real-time updates
  useEffect(() => {
    if (!id) return

    let ws: WebSocket
    try {
      ws = createWebSocket()

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          // Refetch session on session_end, summary_ready, or any event for this session
          if (event.session_id === id && (event.type === 'session_end' || event.type === 'summary_ready' || event.type === 'tool_use' || event.type === 'stop')) {
            refetch()
          }
        } catch {}
      }

      ws.onerror = () => {
        console.log('[SessionDetail] WebSocket error, falling back to polling')
      }
    } catch (err) {
      console.log('[SessionDetail] WebSocket connection failed:', err)
    }

    return () => {
      ws?.close()
    }
  }, [id, refetch])

  // Track activity when viewing session detail
  useEffect(() => {
    if (id) {
      api.updateSessionActivity(id).catch(err => {
        console.error('Failed to update activity:', err)
      })
    }
  }, [id])

  const handleSyncSummary = async () => {
    if (!id) return
    const hasSummary = !!session?.summary_title
    setSyncing(true)
    const toastId = toast.loading(hasSummary ? 'Resyncing summary...' : 'Syncing summary...')
    try {
      if (hasSummary) {
        await api.resyncSession(id)
      } else {
        await api.syncSession(id)
      }
      toast.dismiss(toastId)
      toast.success('Session queued for summarization')
      setTimeout(() => refetch(), 2000)
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Failed to sync: ' + error)
    } finally {
      setSyncing(false)
    }
  }

  if (isLoading) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>Loading session...</div>
  }

  if (!session) {
    return <div style={{ padding: 32, color: 'var(--red)', fontSize: 13 }}>Session not found</div>
  }

  const duration = session.duration_seconds 
    ? `${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`
    : session.ended_at
      ? formatDistanceStrict(new Date(session.ended_at * 1000), new Date(session.started_at * 1000))
      : null

  const autoEndedBadge = session.auto_ended ? (
    <span style={{ fontSize: 11, padding: '2px 6px', background: 'var(--orange)15', color: 'var(--orange)', borderRadius: 4, marginLeft: 8 }}>
      Auto-Ended
    </span>
  ) : null

  const hasSummary = !!session.summary_title

  return (
    <div style={{ padding: '28px 32px', maxWidth: '100%', width: '100%' }}>
      <Link
        to={`/project/${session.project_id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}
      >
        <ArrowLeft size={13} /> Back to Project
      </Link>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, flex: 1 }}>
            {session.summary_title || 'Session ' + session.id.slice(0, 12)}
          </h1>
          <StatusBadge status={session.summary_status || session.status} />
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--border)',
          marginBottom: 24,
          marginTop: 20
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: -1
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'timeline' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'timeline' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: -1
            }}
          >
            Timeline ({session.observations?.length || 0} events)
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'graph' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'graph' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: -1
            }}
          >
            Knowledge Graph
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
        <>
        {/* 70-30 Split Layout */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Left Side - 70% */}
          <div style={{ flex: '0 0 70%' }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              <span>{format(new Date(session.started_at * 1000), 'PPpp')}</span>
              {duration && <span>Duration: {duration}</span>}
              {session.total_turns > 0 && <span>{session.total_turns} turns</span>}
              {session.total_tool_calls > 0 && <span>{session.total_tool_calls} tool calls</span>}
              {session.estimated_tokens > 0 && <span>~{session.estimated_tokens.toLocaleString()} tokens</span>}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 16 }}>
              <TagInput
                sessionId={session.id}
                projectId={session.project_id}
                sessionTags={session.tags || []}
                onUpdate={refetch}
              />
            </div>

            {/* Transcript Access */}
            {session.transcript_path && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                <FileText size={14} /> 
                <span>Transcript: </span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text)', background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>
                  {session.transcript_path}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(session.transcript_path);
                    toast.success('Transcript path copied!');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--blue)',
                    cursor: 'pointer',
                    fontSize: 12,
                    marginLeft: 4,
                    textDecoration: 'underline'
                  }}
                >
                  Copy Path
                </button>
              </div>
            )}

            {session.next_session_starting_point && (
              <div style={{
                padding: '12px 14px',
                background: 'var(--green)15',
                border: '1px solid var(--green)30',
                borderRadius: 8,
                fontSize: 15,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 16
              }}>
                <ArrowRight size={16} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: 'var(--green)' }}>Next Session Start:</strong> {session.next_session_starting_point}
                </div>
              </div>
            )}

            {session.summary_key_insight && (
              <div style={{
                padding: '10px 12px',
                background: 'var(--accent)15',
                border: '1px solid var(--accent)30',
                borderRadius: 8,
                fontSize: 15,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 16
              }}>
                <Zap size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: 'var(--accent)' }}>Key Insight:</strong> {session.summary_key_insight}
                </div>
              </div>
            )}

            {/* Info Cards Grid - 3 columns, 2 rows */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {/* Total Events */}
              {session.observations && session.observations.length > 0 && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                    Total Events
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>
                    {session.observations.length}
                  </div>
                </div>
              )}

              {/* Tool Uses */}
              {session.observations && session.observations.filter((o: any) => o.type === 'tool_use').length > 0 && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                    Tool Uses
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                    {session.observations.filter((o: any) => o.type === 'tool_use').length}
                  </div>
                </div>
              )}

              {/* User Prompts */}
              {session.observations && session.observations.filter((o: any) => o.type === 'user_prompt').length > 0 && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                    User Prompts
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>
                    {session.observations.filter((o: any) => o.type === 'user_prompt').length}
                  </div>
                </div>
              )}

              {/* Files Changed */}
              {(() => {
                const files = session.summary_files_changed
                  ? (Array.isArray(session.summary_files_changed)
                      ? session.summary_files_changed
                      : JSON.parse(session.summary_files_changed))
                  : []

                if (files.length === 0) return null

                return (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Files Changed
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--orange)' }}>
                      {files.length}
                    </div>
                  </div>
                )
              })()}

              {/* Decisions Made */}
              {(() => {
                const decisions = session.summary_decisions
                  ? (Array.isArray(session.summary_decisions)
                      ? session.summary_decisions
                      : JSON.parse(session.summary_decisions))
                  : []

                if (decisions.length === 0) return null

                return (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Decisions Made
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                      {decisions.length}
                    </div>
                  </div>
                )
              })()}

              {/* Next Steps */}
              {(() => {
                const nextSteps = session.summary_next_steps
                  ? (Array.isArray(session.summary_next_steps)
                      ? session.summary_next_steps
                      : JSON.parse(session.summary_next_steps))
                  : []

                if (nextSteps.length === 0) return null

                return (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Next Steps
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--yellow)' }}>
                      {nextSteps.length}
                    </div>
                  </div>
                )
              })()}

              {/* Gotchas */}
              {(() => {
                const gotchas = session.summary_gotchas
                  ? (Array.isArray(session.summary_gotchas)
                      ? session.summary_gotchas
                      : JSON.parse(session.summary_gotchas))
                  : []

                if (gotchas.length === 0) return null

                return (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Gotchas
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>
                      {gotchas.length}
                    </div>
                  </div>
                )
              })()}

              {/* Tech Notes */}
              {(() => {
                const techNotes = session.summary_tech_notes
                  ? (Array.isArray(session.summary_tech_notes)
                      ? session.summary_tech_notes
                      : JSON.parse(session.summary_tech_notes))
                  : []

                if (techNotes.length === 0) return null

                return (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Tech Notes
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>
                      {techNotes.length}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Learning, Emotional, Code Quality Notes */}
            {(session.learning_progression || session.emotional_context || session.code_quality_notes) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(1, 1fr)',
                gap: 12,
                marginTop: 12
              }}>
                {session.learning_progression && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--blue)', fontWeight: 600 }}>
                      <Brain size={16} />
                      Learning Progression
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{session.learning_progression}</div>
                  </div>
                )}
                {session.emotional_context && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--orange)', fontWeight: 600 }}>
                      <MessageSquare size={16} />
                      Emotional Context
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{session.emotional_context}</div>
                  </div>
                )}
                {session.code_quality_notes && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--green)', fontWeight: 600 }}>
                      <Terminal size={16} />
                      Code Quality Notes
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{session.code_quality_notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Missing Summary Fields */}
            {(session.testing_coverage_gap || session.architectural_drift || session.open_rabbit_holes || session.environmental_dependencies || session.unresolved_tech_debt) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(1, 1fr)',
                gap: 12,
                marginTop: 12
              }}>
                {session.testing_coverage_gap && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--orange)', fontWeight: 600 }}>
                      <AlertCircle size={16} />
                      Testing Coverage Gap
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{session.testing_coverage_gap}</div>
                  </div>
                )}
                {session.architectural_drift && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--red)', fontWeight: 600 }}>
                      <AlertCircle size={16} />
                      Architectural Drift
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{session.architectural_drift}</div>
                  </div>
                )}
                {session.unresolved_tech_debt && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--yellow)', fontWeight: 600 }}>
                      <AlertCircle size={16} />
                      Unresolved Tech Debt
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {(() => {
                        const debt = typeof session.unresolved_tech_debt === 'string' 
                          ? (session.unresolved_tech_debt.startsWith('[') ? JSON.parse(session.unresolved_tech_debt) : [session.unresolved_tech_debt])
                          : session.unresolved_tech_debt;
                        return Array.isArray(debt) ? (
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {debt.map((item: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
                          </ul>
                        ) : String(session.unresolved_tech_debt);
                      })()}
                    </div>
                  </div>
                )}
                {session.open_rabbit_holes && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--blue)', fontWeight: 600 }}>
                      <Zap size={16} />
                      Open Rabbit Holes
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {(() => {
                        const holes = typeof session.open_rabbit_holes === 'string' 
                          ? (session.open_rabbit_holes.startsWith('[') ? JSON.parse(session.open_rabbit_holes) : [session.open_rabbit_holes])
                          : session.open_rabbit_holes;
                        return Array.isArray(holes) ? (
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {holes.map((item: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
                          </ul>
                        ) : String(session.open_rabbit_holes);
                      })()}
                    </div>
                  </div>
                )}
                {session.environmental_dependencies && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--green)', fontWeight: 600 }}>
                      <Terminal size={16} />
                      Environmental Dependencies
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {(() => {
                        const deps = typeof session.environmental_dependencies === 'string' 
                          ? (session.environmental_dependencies.startsWith('[') ? JSON.parse(session.environmental_dependencies) : [session.environmental_dependencies])
                          : session.environmental_dependencies;
                        return Array.isArray(deps) ? (
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {deps.map((item: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
                          </ul>
                        ) : String(session.environmental_dependencies);
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side - 30% Stats Cards */}
          <div style={{ flex: '0 0 28%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Mood Card */}
            {session.summary_mood && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Mood
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>
                  {session.summary_mood}
                </div>
              </div>
            )}

            {/* Complexity Card */}
            {session.summary_complexity && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Complexity
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>
                  {session.summary_complexity.replace('_', ' ')}
                </div>
              </div>
            )}

            {(session.aha_moments_count > 0 || session.flow_state_duration_mins > 0 || session.cognitive_load_estimate > 0 || session.metric_momentum != null || session.metric_frustration != null || session.metric_productivity != null) && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  Session Telemetry
                </div>
                
                {session.metric_momentum != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Momentum</span>
                    <div style={{ width: 60, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, session.metric_momentum)}%`, height: '100%', background: session.metric_momentum > 70 ? 'var(--green)' : 'var(--blue)' }} />
                    </div>
                  </div>
                )}
                {session.metric_productivity != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Productivity</span>
                    <div style={{ width: 60, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, session.metric_productivity)}%`, height: '100%', background: session.metric_productivity > 70 ? 'var(--green)' : 'var(--blue)' }} />
                    </div>
                  </div>
                )}
                {session.metric_frustration != null && session.metric_frustration > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Frustration</span>
                    <div style={{ width: 60, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, session.metric_frustration)}%`, height: '100%', background: session.metric_frustration > 50 ? 'var(--red)' : 'var(--orange)' }} />
                    </div>
                  </div>
                )}
                {session.aha_moments_count > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aha! Moments</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--yellow)' }}>{session.aha_moments_count}</span>
                  </div>
                )}
                {session.flow_state_duration_mins > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Flow State</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue)' }}>{session.flow_state_duration_mins}m</span>
                  </div>
                )}
                {session.preferred_verbosity > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI Verbosity</span>
                    <div style={{ width: 60, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, session.preferred_verbosity)}%`, height: '100%', background: 'var(--blue)' }} />
                    </div>
                  </div>
                )}
                {session.cognitive_load_estimate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cognitive Load</span>
                    <div style={{ width: 60, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, session.cognitive_load_estimate)}%`, height: '100%', background: session.cognitive_load_estimate > 75 ? 'var(--red)' : session.cognitive_load_estimate > 50 ? 'var(--yellow)' : 'var(--green)' }} />
                    </div>
                  </div>
                )}
                {session.divergence_score > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Divergence</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>{session.divergence_score}/100</span>
                  </div>
                )}
                {session.collaboration_style && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Style</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{session.collaboration_style}</span>
                  </div>
                )}
              </div>
            )}

            {/* Resolved Card */}
            {(() => {
              const resolved = session.summary_resolved
                ? (Array.isArray(session.summary_resolved)
                    ? session.summary_resolved
                    : JSON.parse(session.summary_resolved))
                : []

              if (resolved.length === 0) return null

              return (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <CheckCircle size={14} style={{ color: 'var(--green)' }} />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Resolved
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {resolved.map((r: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                        • {r}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Token Usage Stats */}
            {(session.total_input_tokens > 0 || session.total_output_tokens > 0 || session.total_cost_usd > 0) && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                  Token Usage & Cost
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {session.total_input_tokens > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Input</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {session.total_input_tokens.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {session.total_output_tokens > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Output</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {session.total_output_tokens.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {(session.total_cache_creation_tokens > 0 || session.total_cache_read_tokens > 0) && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cache Created</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>
                          {session.total_cache_creation_tokens.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cache Read</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                          {session.total_cache_read_tokens.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}

                  {session.total_cost_usd > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Total Cost</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                        ${session.total_cost_usd.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Checkpoint Stats */}
            {(session.checkpoint_count > 0 || session.last_checkpoint_time) && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                marginTop: 12
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                  Checkpoints
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {session.checkpoint_count > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Count</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {session.checkpoint_count}
                      </span>
                    </div>
                  )}

                  {session.last_checkpoint_turn > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last Turn</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        #{session.last_checkpoint_turn}
                      </span>
                    </div>
                  )}
                  
                  {session.last_checkpoint_time && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last Saved</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {new Date(session.last_checkpoint_time * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Timing */}
            {(session.last_activity || session.summary_requested_at) && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                marginTop: 12
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                  Timing
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {session.last_activity && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last Activity</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {new Date(session.last_activity * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {session.summary_requested_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Summary Requested</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {new Date(session.summary_requested_at * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Blockers - Full Width Below */}
        {(() => {
          const blockers = session.summary_blockers ? JSON.parse(session.summary_blockers) : []
          if (blockers.length === 0) return null

          return (
            <div style={{ marginTop: 16 }}>
              <div style={{
                padding: '10px 12px',
                background: 'var(--red)10',
                border: '1px solid var(--red)30',
                borderRadius: 8,
                fontSize: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--red)', fontWeight: 600 }}>
                  <AlertCircle size={16} />
                  Blockers
                </div>
                {blockers.map((b: string, i: number) => (
                  <div key={i} style={{ color: 'var(--text-muted)', marginBottom: 4 }}>• {b}</div>
                ))}
              </div>
            </div>
          )
        })()}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
          <button
            onClick={() => setNotesModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
            }}
          >
            <FileText size={16} />
            {session.notes ? 'Edit Notes' : 'Add Notes'}
          </button>
          <ShareLinkButton sessionId={session.id} />
          {hasSummary && (
            <>
              <CopyButton text={buildCopyText(session)} label="Copy as Markdown" />
              <DownloadButton
                text={buildCopyText(session)}
                filename={`session-${session.id.slice(0, 8)}-${format(new Date(session.started_at * 1000), 'yyyy-MM-dd')}.md`}
                label="Download Markdown"
              />
              <PDFDownloadButton session={session} />
            </>
          )}
          {session.status !== 'active' && session.transcript_path && (
            <button
              onClick={handleSyncSummary}
              disabled={syncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: syncing ? 'var(--surface)' : 'var(--blue)15',
                color: syncing ? 'var(--text-muted)' : 'var(--blue)',
                border: '1px solid',
                borderColor: syncing ? 'var(--border)' : 'var(--blue)30',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!syncing) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)25'
                }
              }}
              onMouseLeave={e => {
                if (!syncing) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)15'
                }
              }}
            >
              <RefreshCw size={14} />
              {syncing ? 'Processing...' : (hasSummary ? 'Resync Summary' : 'Sync Summary')}
            </button>
          )}
        </div>

      {hasSummary && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Summary
          </h2>
          <SummaryView
            summary_what_we_did={session.summary_what_we_did}
            summary_decisions={session.summary_decisions}
            summary_files_changed={session.summary_files_changed}
            summary_next_steps={session.summary_next_steps}
            summary_gotchas={session.summary_gotchas}
            summary_tech_notes={session.summary_tech_notes}
            open_rabbit_holes={session.open_rabbit_holes ? JSON.parse(session.open_rabbit_holes) : undefined}
            environmental_dependencies={session.environmental_dependencies ? JSON.parse(session.environmental_dependencies) : undefined}
            unresolved_tech_debt={session.unresolved_tech_debt ? JSON.parse(session.unresolved_tech_debt) : undefined}
            testing_coverage_gap={session.testing_coverage_gap}
            architectural_drift={session.architectural_drift}
          />
        </div>
      )}

      {!hasSummary && session.status === 'active' && (
        <div style={{
          padding: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--text-muted)',
          marginBottom: 24
        }}>
          Session is active. Summary will be generated when the session ends.
        </div>
      )}
      </>
      )}
      </div>

      {/* Timeline Tab */}
      {activeTab === 'timeline' && session.observations && session.observations.length > 0 && (
        <div>
          <ObservationList observations={session.observations} />
        </div>
      )}

      {/* Graph Tab */}
      {activeTab === 'graph' && (
        <div style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
          <GraphViewer projectId={session.project_id} />
        </div>
      )}

      <NotesModal
        sessionId={session.id}
        initialNotes={session.notes || ''}
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
      />
    </div>
  )
}
