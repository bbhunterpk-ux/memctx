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
import { ArrowLeft, Zap, AlertCircle, CheckCircle, RefreshCw, FileText } from 'lucide-react'
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

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const [resyncing, setResyncing] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!),
    enabled: !!id,
    refetchInterval: (data: any) => data?.status === 'active' ? 5000 : false,
  })

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

  const handleResync = async () => {
    if (!id) return
    setResyncing(true)
    const toastId = toast.loading('Queueing session for resync...')
    try {
      await api.resyncSession(id)
      toast.dismiss(toastId)
      toast.success('Session queued for resync. Summary will be regenerated.')
      setTimeout(() => refetch(), 2000)
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Resync failed: ' + error)
    } finally {
      setResyncing(false)
    }
  }

  if (isLoading) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>Loading session...</div>
  }

  if (!session) {
    return <div style={{ padding: 32, color: 'var(--red)', fontSize: 13 }}>Session not found</div>
  }

  const duration = session.ended_at
    ? formatDistanceStrict(new Date(session.ended_at * 1000), new Date(session.started_at * 1000))
    : null

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

        {/* 70-30 Split Layout */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Left Side - 70% */}
          <div style={{ flex: '0 0 70%' }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              <span>{format(new Date(session.started_at * 1000), 'PPpp')}</span>
              {duration && <span>Duration: {duration}</span>}
              {session.total_turns > 0 && <span>{session.total_turns} turns</span>}
              {session.total_tool_calls > 0 && <span>{session.total_tool_calls} tool calls</span>}
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

            {/* Resolved Card */}
            {(() => {
              const resolved = session.summary_resolved ? JSON.parse(session.summary_resolved) : []
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
              onClick={handleResync}
              disabled={resyncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: resyncing ? 'var(--surface)' : 'var(--surface2)',
                color: resyncing ? 'var(--text-muted)' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: resyncing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!resyncing) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
                }
              }}
              onMouseLeave={e => {
                if (!resyncing) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
                }
              }}
            >
              <RefreshCw size={16} style={{ animation: resyncing ? 'spin 1s linear infinite' : 'none' }} />
              {resyncing ? 'Resyncing...' : 'Resync Summary'}
            </button>
          )}
        </div>
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

      {session.observations && session.observations.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Timeline ({session.observations.length} events)
          </h2>
          <ObservationList observations={session.observations} />
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
