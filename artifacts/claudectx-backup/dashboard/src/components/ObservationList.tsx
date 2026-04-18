import { format } from 'date-fns'
import { Terminal, FileEdit, MessageSquare, Brain, Wrench } from 'lucide-react'

interface Observation {
  id: number
  event_type: string
  tool_name?: string
  file_path?: string
  content?: string
  metadata?: string
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
              {obs.metadata && (
                <div style={{
                  marginTop: 6,
                  padding: '8px 10px',
                  background: 'var(--surface2)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'var(--text-muted)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {(() => {
                    try {
                      // Format JSON if it is JSON
                      const parsed = JSON.parse(obs.metadata)
                      return JSON.stringify(parsed, null, 2)
                    } catch (e) {
                      return obs.metadata
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {sortedObservations.map((obs, i) => (
        <div key={obs.id} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--surface2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              zIndex: 1,
            }}>
              <Terminal size={16} color="var(--text-muted)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
                marginTop: 6
              }}>
                <div style={{ padding: '16px' }}>
                  <div style={{
                    margin: 0,
                    color: 'var(--text)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>{obs.content}</div>
                </div>
                
                {/* Token & Metadata Summary */}
                {(() => {
                  if (!obs.metadata) return null;
                  let meta: any = {};
                  try {
                    meta = typeof obs.metadata === 'string' ? JSON.parse(obs.metadata) : obs.metadata;
                  } catch (e) {
                    return null;
                  }

                  if (Object.keys(meta).length === 0) return null;

                  return (
                    <div style={{
                      padding: '10px 16px',
                      borderTop: '1px solid var(--border)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}>
                      {meta.input_tokens > 0 && (
                        <span><span style={{opacity: 0.7}}>In:</span> <strong>{meta.input_tokens.toLocaleString()}</strong></span>
                      )}
                      {meta.output_tokens > 0 && (
                        <span><span style={{opacity: 0.7}}>Out:</span> <strong>{meta.output_tokens.toLocaleString()}</strong></span>
                      )}
                      {meta.cache_creation_tokens > 0 && (
                        <span style={{color: 'var(--blue)'}}><span style={{opacity: 0.7}}>Cache In:</span> <strong>{meta.cache_creation_tokens.toLocaleString()}</strong></span>
                      )}
                      {meta.cache_read_tokens > 0 && (
                        <span style={{color: 'var(--green)'}}><span style={{opacity: 0.7}}>Cache Out:</span> <strong>{meta.cache_read_tokens.toLocaleString()}</strong></span>
                      )}
                      {meta.cost_usd > 0 && (
                        <span style={{color: 'var(--accent)'}}><strong>${meta.cost_usd.toFixed(4)}</strong></span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
