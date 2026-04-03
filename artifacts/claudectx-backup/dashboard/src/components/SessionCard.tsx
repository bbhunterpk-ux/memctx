import { Link } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { Clock, FileText, Wrench, Lightbulb, AlertCircle, Smile, Frown, Meh, Zap, CheckCircle } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { api } from '../api/client'
import { useState } from 'react'

interface Props {
  session: any
  onSessionUpdated?: () => void
}

const moodIcons: Record<string, any> = {
  productive: Smile,
  frustrated: Frown,
  exploratory: Lightbulb,
  debugging: Wrench,
  blocked: AlertCircle,
}

const complexityColors: Record<string, string> = {
  trivial: 'var(--green)',
  simple: 'var(--green)',
  moderate: 'var(--yellow)',
  complex: 'var(--orange)',
  very_complex: 'var(--red)',
}

export default function SessionCard({ session, onSessionUpdated }: Props) {
  const [ending, setEnding] = useState(false)
  const startDate = new Date(session.started_at * 1000)
  const duration = session.duration_seconds
    ? Math.floor(session.duration_seconds / 60)
    : session.ended_at
    ? Math.floor((session.ended_at - session.started_at) / 60)
    : null

  const files = Array.isArray(session.summary_files_changed)
    ? session.summary_files_changed
    : []

  const MoodIcon = session.summary_mood ? moodIcons[session.summary_mood] : null
  const complexityColor = session.summary_complexity ? complexityColors[session.summary_complexity] : 'var(--text-muted)'

  const isActive = session.status === 'active' || (!session.status && !session.ended_at)

  const handleForceEnd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Force end this session? This will mark it as completed and trigger AI summarization.')) {
      return
    }

    setEnding(true)
    try {
      await api.forceEndSession(session.id)
      if (onSessionUpdated) {
        setTimeout(() => onSessionUpdated(), 1000)
      }
    } catch (error) {
      alert('Failed to end session: ' + error)
    } finally {
      setEnding(false)
    }
  }

  return (
    <Link to={`/session/${session.id}`} style={{ display: 'block' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {session.summary_title || 'Session ' + session.id.slice(0, 8)}
              </div>
              {MoodIcon && (
                <MoodIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              )}
            </div>

            {session.summary_what_we_did && Array.isArray(session.summary_what_we_did) && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {session.summary_what_we_did[0]}
              </div>
            )}

            {session.summary_key_insight && (
              <div style={{
                fontSize: 11,
                color: 'var(--accent)',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Zap size={11} />
                {session.summary_key_insight}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {formatDistanceToNow(startDate, { addSuffix: true })}
              </span>
              {duration !== null && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{duration}m</span>
              )}
              {session.summary_complexity && (
                <span style={{
                  fontSize: 10,
                  color: complexityColor,
                  padding: '2px 6px',
                  background: `${complexityColor}15`,
                  borderRadius: 4,
                  fontWeight: 600
                }}>
                  {session.summary_complexity.replace('_', ' ')}
                </span>
              )}
              {session.total_tool_calls > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wrench size={11} />
                  {session.total_tool_calls} calls
                </span>
              )}
              {files.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={11} />
                  {files.length} files
                </span>
              )}
            </div>
          </div>

          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isActive && (
              <button
                onClick={handleForceEnd}
                disabled={ending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  background: ending ? 'var(--surface)' : 'var(--green)15',
                  color: ending ? 'var(--text-muted)' : 'var(--green)',
                  border: '1px solid',
                  borderColor: ending ? 'var(--border)' : 'var(--green)30',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: ending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!ending) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--green)25'
                  }
                }}
                onMouseLeave={e => {
                  if (!ending) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--green)15'
                  }
                }}
              >
                <CheckCircle size={12} />
                {ending ? 'Ending...' : 'Force End'}
              </button>
            )}
            <StatusBadge status={session.summary_status || session.status} />
          </div>
        </div>
      </div>
    </Link>
  )
}
