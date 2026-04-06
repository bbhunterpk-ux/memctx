import { Trophy, Clock, FileText, Wrench } from 'lucide-react'

interface Props {
  sessions: any[]
}

export default function PersonalBests({ sessions }: Props) {
  if (sessions.length === 0) {
    return null
  }

  // Find longest session
  let longestSession = { duration: 0, title: '', date: 0 }
  sessions.forEach(s => {
    if (s.ended_at) {
      const duration = s.ended_at - s.started_at
      if (duration > longestSession.duration) {
        longestSession = {
          duration,
          title: s.summary_title || 'Untitled',
          date: s.started_at
        }
      }
    }
  })

  // Find most files changed in one session
  let mostFiles = { count: 0, title: '', date: 0 }
  sessions.forEach(s => {
    const filesCount = Array.isArray(s.summary_files_changed) ? s.summary_files_changed.length : 0
    if (filesCount > mostFiles.count) {
      mostFiles = {
        count: filesCount,
        title: s.summary_title || 'Untitled',
        date: s.started_at
      }
    }
  })

  // Find most tools used in one session
  let mostTools = { count: 0, title: '', date: 0 }
  sessions.forEach(s => {
    const toolsCount = s.tool_use_count || 0
    if (toolsCount > mostTools.count) {
      mostTools = {
        count: toolsCount,
        title: s.summary_title || 'Untitled',
        date: s.started_at
      }
    }
  })

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <Trophy size={16} />
        Personal Bests
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16
      }}>
        {longestSession.duration > 0 && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Clock size={14} style={{ color: 'var(--blue)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Longest Session
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>
              {formatDuration(longestSession.duration)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {longestSession.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {formatDate(longestSession.date)}
            </div>
          </div>
        )}

        {mostFiles.count > 0 && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileText size={14} style={{ color: 'var(--purple)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Most Files Changed
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--purple)', marginBottom: 4 }}>
              {mostFiles.count} files
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {mostFiles.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {formatDate(mostFiles.date)}
            </div>
          </div>
        )}

        {mostTools.count > 0 && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Wrench size={14} style={{ color: 'var(--orange)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Most Tools Used
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--orange)', marginBottom: 4 }}>
              {mostTools.count} tools
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {mostTools.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {formatDate(mostTools.date)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
