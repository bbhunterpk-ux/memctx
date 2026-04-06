import { Flame, TrendingUp } from 'lucide-react'

interface Props {
  sessions: any[]
}

export default function StreakCounter({ sessions }: Props) {
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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16,
      marginBottom: 20
    }}>
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
    </div>
  )
}
