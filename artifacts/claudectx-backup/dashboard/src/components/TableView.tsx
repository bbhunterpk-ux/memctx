import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, FileText, Wrench, CheckCircle, Circle, ArrowUp, ArrowDown } from 'lucide-react'

interface Props {
  sessions: any[]
  selectionMode: boolean
  selectedSessions: Set<string>
  onSelectionChange: (id: string, selected: boolean) => void
}

type SortField = 'date' | 'title' | 'duration'
type SortDirection = 'asc' | 'desc'

export default function TableView({ sessions, selectionMode, selectedSessions, onSelectionChange }: Props) {
  const navigate = useNavigate()
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedSessions = [...sessions].sort((a, b) => {
    let comparison = 0

    if (sortField === 'date') {
      comparison = a.started_at - b.started_at
    } else if (sortField === 'title') {
      const titleA = (a.summary_title || '').toLowerCase()
      const titleB = (b.summary_title || '').toLowerCase()
      comparison = titleA.localeCompare(titleB)
    } else if (sortField === 'duration') {
      const durationA = a.ended_at ? a.ended_at - a.started_at : 0
      const durationB = b.ended_at ? b.ended_at - b.started_at : 0
      comparison = durationA - durationB
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)'
          }}>
            {selectionMode && (
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                width: 40
              }}>
                <input
                  type="checkbox"
                  checked={selectedSessions.size === sessions.length && sessions.length > 0}
                  onChange={(e) => {
                    sessions.forEach(s => onSelectionChange(s.id, e.target.checked))
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )}
            <th
              onClick={() => handleSort('date')}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                userSelect: 'none',
                width: 140
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Date <SortIcon field="date" />
              </div>
            </th>
            <th
              onClick={() => handleSort('title')}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Title <SortIcon field="title" />
              </div>
            </th>
            <th
              onClick={() => handleSort('duration')}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                userSelect: 'none',
                width: 100
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Duration <SortIcon field="duration" />
              </div>
            </th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: 80
            }}>
              Files
            </th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: 80
            }}>
              Tools
            </th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: 100
            }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSessions.map((session, index) => {
            const duration = session.ended_at ? session.ended_at - session.started_at : 0
            const filesCount = Array.isArray(session.summary_files_changed) ? session.summary_files_changed.length : 0
            const toolsCount = session.tool_use_count || 0
            const isCompleted = session.status === 'completed'

            return (
              <tr
                key={session.id}
                onClick={(e) => {
                  if (selectionMode) {
                    onSelectionChange(session.id, !selectedSessions.has(session.id))
                  } else {
                    navigate(`/session/${session.id}`)
                  }
                }}
                style={{
                  borderBottom: index < sortedSessions.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {selectionMode && (
                  <td style={{ padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedSessions.has(session.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        onSelectionChange(session.id, e.target.checked)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                )}
                <td style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  color: 'var(--text-muted)'
                }}>
                  {new Date(session.started_at * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </td>
                <td style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text)'
                }}>
                  {session.summary_title || 'Untitled Session'}
                </td>
                <td style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} />
                    {duration > 0 ? formatDuration(duration) : '-'}
                  </div>
                </td>
                <td style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} />
                    {filesCount}
                  </div>
                </td>
                <td style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Wrench size={14} />
                    {toolsCount}
                  </div>
                </td>
                <td style={{
                  padding: '12px 16px',
                  fontSize: 13
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: isCompleted ? 'var(--green)15' : 'var(--orange)15',
                    color: isCompleted ? 'var(--green)' : 'var(--orange)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600
                  }}>
                    {isCompleted ? <CheckCircle size={12} /> : <Circle size={12} />}
                    {isCompleted ? 'Done' : 'Active'}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
