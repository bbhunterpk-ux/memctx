import { useNavigate } from 'react-router-dom'
import { Clock, FileText, Wrench, Circle, CheckCircle } from 'lucide-react'

interface Props {
  sessions: any[]
  selectionMode: boolean
  selectedSessions: Set<string>
  onSelectionChange: (id: string, selected: boolean) => void
}

export default function TimelineView({ sessions, selectionMode, selectedSessions, onSelectionChange }: Props) {
  const navigate = useNavigate()

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => b.started_at - a.started_at)

  // Group sessions by date
  const groupedByDate: Record<string, any[]> = {}
  sortedSessions.forEach(session => {
    const date = new Date(session.started_at * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    if (!groupedByDate[date]) {
      groupedByDate[date] = []
    }
    groupedByDate[date].push(session)
  })

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div style={{ position: 'relative' }}>
      {Object.entries(groupedByDate).map(([date, dateSessions], dateIndex) => (
        <div key={date} style={{ marginBottom: 40 }}>
          {/* Date Header */}
          <div style={{
            position: 'sticky',
            top: 0,
            background: 'var(--background)',
            zIndex: 10,
            paddingBottom: 12,
            marginBottom: 20
          }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'var(--accent)'
              }} />
              {date}
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginLeft: 8
              }}>
                {dateSessions.length} {dateSessions.length === 1 ? 'session' : 'sessions'}
              </span>
            </h3>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative', paddingLeft: 40 }}>
            {/* Vertical Line */}
            <div style={{
              position: 'absolute',
              left: 5,
              top: 0,
              bottom: dateIndex === Object.keys(groupedByDate).length - 1 ? '50%' : 0,
              width: 2,
              background: 'var(--border)'
            }} />

            {dateSessions.map((session, index) => {
              const duration = session.ended_at ? session.ended_at - session.started_at : 0
              const filesCount = Array.isArray(session.summary_files_changed) ? session.summary_files_changed.length : 0
              const toolsCount = session.tool_use_count || 0
              const isCompleted = session.status === 'completed'

              return (
                <div
                  key={session.id}
                  style={{
                    position: 'relative',
                    marginBottom: index < dateSessions.length - 1 ? 24 : 0
                  }}
                >
                  {/* Timeline Dot */}
                  <div style={{
                    position: 'absolute',
                    left: -34,
                    top: 20,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--green)' : 'var(--orange)',
                    border: '3px solid var(--background)',
                    zIndex: 1
                  }} />

                  {/* Session Card */}
                  <div
                    onClick={(e) => {
                      if (selectionMode) {
                        onSelectionChange(session.id, !selectedSessions.has(session.id))
                      } else {
                        navigate(`/session/${session.id}`)
                      }
                    }}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface2)'
                      e.currentTarget.style.borderColor = 'var(--accent)30'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--surface)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedSessions.has(session.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            onSelectionChange(session.id, e.target.checked)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ marginTop: 4, cursor: 'pointer' }}
                        />
                      )}

                      <div style={{ flex: 1 }}>
                        {/* Time */}
                        <div style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginBottom: 8,
                          fontWeight: 600
                        }}>
                          {formatTime(session.started_at)}
                        </div>

                        {/* Title */}
                        <h4 style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--text)',
                          marginBottom: 8
                        }}>
                          {session.summary_title || 'Untitled Session'}
                        </h4>

                        {/* Stats */}
                        <div style={{
                          display: 'flex',
                          gap: 16,
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginBottom: 8
                        }}>
                          {duration > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} />
                              {formatDuration(duration)}
                            </div>
                          )}
                          {filesCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FileText size={12} />
                              {filesCount} files
                            </div>
                          )}
                          {toolsCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Wrench size={12} />
                              {toolsCount} tools
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          background: isCompleted ? 'var(--green)15' : 'var(--orange)15',
                          color: isCompleted ? 'var(--green)' : 'var(--orange)',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {isCompleted ? <CheckCircle size={10} /> : <Circle size={10} />}
                          {isCompleted ? 'Completed' : 'Active'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
