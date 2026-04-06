import { Flame, TrendingUp, Clock, FileText } from 'lucide-react'

interface Props {
  sessions: any[]
}

export default function StatsRow({ sessions }: Props) {
  // Sort sessions by date
  const sortedSessions = [...sessions]
    .filter(s => s.started_at)
    .sort((a, b) => b.started_at - a.started_at)

  if (sortedSessions.length === 0) {
    return null
  }

  // Calculate current streak
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get unique dates with sessions
  const sessionDates = new Set(
    sortedSessions.map(s => {
      const date = new Date(s.started_at * 1000)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
  )

  const uniqueDates = Array.from(sessionDates).sort((a, b) => b - a)

  // Calculate current streak (consecutive days from today or yesterday)
  const todayTime = today.getTime()
  const yesterdayTime = todayTime - 86400000

  if (uniqueDates.includes(todayTime) || uniqueDates.includes(yesterdayTime)) {
    let checkDate = uniqueDates.includes(todayTime) ? todayTime : yesterdayTime

    while (uniqueDates.includes(checkDate)) {
      currentStreak++
      checkDate -= 86400000 // Go back one day
    }
  }

  // Calculate longest streak
  if (uniqueDates.length > 0) {
    tempStreak = 1
    longestStreak = 1

    for (let i = 1; i < uniqueDates.length; i++) {
      const dayDiff = (uniqueDates[i - 1] - uniqueDates[i]) / 86400000

      if (dayDiff === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginBottom: 24
    }}>
      {/* Current Streak */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Flame size={16} style={{ color: currentStreak > 0 ? 'var(--orange)' : 'var(--text-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Current Streak</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: currentStreak > 0 ? 'var(--orange)' : 'var(--text)' }}>
          {currentStreak}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {currentStreak === 1 ? 'day' : 'days'} in a row
        </div>
      </div>

      {/* Longest Streak */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Longest Streak</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
          {longestStreak}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {longestStreak === 1 ? 'day' : 'days'} record
        </div>
      </div>

      {/* Longest Session */}
      {longestSession.duration > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Clock size={16} style={{ color: 'var(--blue)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Longest Session</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {formatDuration(longestSession.duration)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {longestSession.title}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {formatDate(longestSession.date)}
          </div>
        </div>
      )}

      {/* Most Files Changed */}
      {mostFiles.count > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileText size={16} style={{ color: 'var(--purple)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Most Files Changed</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {mostFiles.count} files
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mostFiles.title}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {formatDate(mostFiles.date)}
          </div>
        </div>
      )}
    </div>
  )
}
