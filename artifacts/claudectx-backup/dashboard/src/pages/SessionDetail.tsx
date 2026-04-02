import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { format, formatDistanceStrict } from 'date-fns'
import StatusBadge from '../components/StatusBadge'
import SummaryView from '../components/SummaryView'
import ObservationList from '../components/ObservationList'
import CopyButton from '../components/CopyButton'
import { ArrowLeft } from 'lucide-react'

function buildCopyText(session: any): string {
  const lines = [
    `# ${session.summary_title || 'Session'}`,
    `Date: ${format(new Date(session.started_at * 1000), 'PPpp')}`,
    `Status: ${session.summary_status || session.status}`,
    '',
  ]

  if (session.summary_what_we_did?.length) {
    lines.push('## What We Did')
    session.summary_what_we_did.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }
  if (session.summary_decisions?.length) {
    lines.push('## Decisions Made')
    session.summary_decisions.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }
  if (session.summary_files_changed?.length) {
    lines.push('## Files Changed')
    session.summary_files_changed.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }
  if (session.summary_next_steps?.length) {
    lines.push('## Next Steps')
    session.summary_next_steps.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }
  if (session.summary_gotchas?.length) {
    lines.push('## Gotchas / Remember')
    session.summary_gotchas.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }
  if (session.summary_tech_notes?.length) {
    lines.push('## Tech Notes')
    session.summary_tech_notes.forEach((i: string) => lines.push(`- ${i}`))
    lines.push('')
  }

  return lines.join('\n')
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!),
    enabled: !!id,
    refetchInterval: (data: any) => data?.status === 'active' ? 5000 : false,
  })

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
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <Link
        to={`/project/${session.project_id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}
      >
        <ArrowLeft size={13} /> Back to Project
      </Link>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>
            {session.summary_title || 'Session ' + session.id.slice(0, 12)}
          </h1>
          <StatusBadge status={session.summary_status || session.status} />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          <span>{format(new Date(session.started_at * 1000), 'PPpp')}</span>
          {duration && <span>Duration: {duration}</span>}
          {session.total_turns > 0 && <span>{session.total_turns} turns</span>}
          {session.total_tool_calls > 0 && <span>{session.total_tool_calls} tool calls</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hasSummary && (
            <CopyButton text={buildCopyText(session)} label="Copy as Markdown" />
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
    </div>
  )
}
