import { format } from 'date-fns'
import { Terminal, FileEdit, MessageSquare, Brain, Wrench } from 'lucide-react'

interface Observation {
  id: number
  event_type: string
  tool_name?: string
  file_path?: string
  content?: string
  created_at: number
}

const EVENT_ICONS: Record<string, any> = {
  tool_call: Wrench,
  file_edit: FileEdit,
  user_message: MessageSquare,
  assistant_message: Brain,
  decision: Brain,
}

const EVENT_COLORS: Record<string, string> = {
  tool_call: 'var(--accent)',
  file_edit: 'var(--blue)',
  user_message: 'var(--green)',
  assistant_message: 'var(--text-muted)',
  decision: 'var(--yellow)',
}

export default function ObservationList({ observations }: { observations: Observation[] }) {
  if (!observations || observations.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        No observations recorded
      </div>
    )
  }

  // Sort observations by created_at descending (newest first)
  const sortedObservations = [...observations].sort((a, b) => b.created_at - a.created_at)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute',
        left: 16,
        top: 0,
        bottom: 0,
        width: 1,
        background: 'var(--border)',
      }} />

      {sortedObservations.map((obs, i) => {
        const Icon = EVENT_ICONS[obs.event_type] || Terminal
        const color = EVENT_COLORS[obs.event_type] || 'var(--text-muted)'
        const time = format(new Date(obs.created_at * 1000), 'HH:mm:ss')

        return (
          <div key={obs.id} style={{
            display: 'flex',
            gap: 14,
            paddingLeft: 0,
            marginBottom: 12,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--surface2)',
              border: `1px solid ${color}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              zIndex: 1,
            }}>
              <Icon size={13} color={color} />
            </div>

            <div style={{ flex: 1, paddingTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color }}>
                  {obs.tool_name || obs.event_type}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{time}</span>
              </div>
              {obs.content && (
                <div style={{
                  fontSize: 12,
                  color: 'var(--text)',
                  fontFamily: obs.event_type === 'tool_call' ? 'monospace' : 'inherit',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}>
                  {obs.content}
                </div>
              )}
              {obs.file_path && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                  {obs.file_path}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
