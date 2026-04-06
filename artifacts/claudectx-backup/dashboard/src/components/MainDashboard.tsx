import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { TrendingUp, Clock, FileText, Wrench, CheckCircle, Flame } from 'lucide-react'

interface Props {
  projects: any[]
}

export default function MainDashboard({ projects }: Props) {
  // Fetch all sessions across all projects
  const { data: allSessionsData } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      const sessionPromises = projects.map(p => api.getSessions({ project_id: p.id, limit: 1000 }))
      const results = await Promise.all(sessionPromises)
      return results.flat()
    },
    enabled: projects.length > 0
  })

  const allSessions = allSessionsData || []

  const totalSessions = allSessions.length
  const completedSessions = allSessions.filter(s => s.status === 'completed').length
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  const totalDuration = allSessions.reduce((acc, s) => {
    if (s.ended_at) {
      return acc + (s.ended_at - s.started_at)
    }
    return acc
  }, 0)
  const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60) : 0
  const totalHours = Math.round(totalDuration / 3600)

  const allFiles = new Set(
    allSessions.flatMap(s => {
      try {
        const files = typeof s.summary_files_changed === 'string'
          ? JSON.parse(s.summary_files_changed)
          : s.summary_files_changed
        return Array.isArray(files) ? files : []
      } catch {
        return []
      }
    })
  )
  const totalFiles = allFiles.size

  const totalTools = allSessions.reduce((acc, s) => acc + (s.tool_use_count || 0), 0)

  // Calculate streak
  const sessionDates = new Set(
    allSessions.map(s => {
      const date = new Date(s.started_at * 1000)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
  )
  const uniqueDates = Array.from(sessionDates).sort((a, b) => b - a)

  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()
  const yesterdayTime = todayTime - 86400000

  if (uniqueDates.includes(todayTime) || uniqueDates.includes(yesterdayTime)) {
    let checkDate = uniqueDates.includes(todayTime) ? todayTime : yesterdayTime
    while (uniqueDates.includes(checkDate)) {
      currentStreak++
      checkDate -= 86400000
    }
  }

  // Recent activity (last 7 days)
  const now = Date.now() / 1000
  const weekAgo = now - (7 * 24 * 60 * 60)
  const weekSessions = allSessions.filter(s => s.started_at >= weekAgo)

  const dailyActivity: Record<string, number> = {}
  weekSessions.forEach(s => {
    const date = new Date(s.started_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyActivity[date] = (dailyActivity[date] || 0) + 1
  })

  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    last7Days.push({ date: dateStr, count: dailyActivity[dateStr] || 0 })
  }

  const maxDailyCount = Math.max(...last7Days.map(d => d.count), 1)

  // Most active project
  const projectActivity = projects.map(p => ({
    name: p.name,
    sessions: (p.sessions || []).length
  })).sort((a, b) => b.sessions - a.sessions)

  const mostActiveProject = projectActivity[0]

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <TrendingUp size={20} />
        Overview Dashboard
      </h2>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle size={16} style={{ color: 'var(--green)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Sessions</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{totalSessions}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {completionRate}% completed
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Clock size={16} style={{ color: 'var(--blue)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Time</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{totalHours}h</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {avgDuration}m avg per session
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileText size={16} style={{ color: 'var(--purple)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Files Changed</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{totalFiles}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            across all projects
          </div>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Wrench size={16} style={{ color: 'var(--orange)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Tool Uses</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{totalTools}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            total actions
          </div>
        </div>

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
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 16
      }}>
        {/* Weekly Activity */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20
        }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <TrendingUp size={16} />
            Last 7 Days Activity
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {last7Days.map((day, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%',
                  height: Math.max((day.count / maxDailyCount) * 100, 4),
                  background: day.count > 0 ? 'var(--accent)' : 'var(--surface2)',
                  borderRadius: 4,
                  transition: 'all 0.3s',
                  position: 'relative'
                }}>
                  {day.count > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text)'
                    }}>
                      {day.count}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {day.date.split(' ')[1]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Project */}
        {mostActiveProject && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <TrendingUp size={16} />
              Most Active Projects
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projectActivity.slice(0, 5).map((project, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{project.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{project.sessions}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 6,
                    background: 'var(--surface2)',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(project.sessions / mostActiveProject.sessions) * 100}%`,
                      height: '100%',
                      background: 'var(--accent)',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
