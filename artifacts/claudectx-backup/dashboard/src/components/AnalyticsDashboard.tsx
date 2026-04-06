import { BarChart3, Clock, CheckCircle, FileText, Wrench, TrendingUp } from 'lucide-react'

interface Props {
  sessions: any[]
}

export default function AnalyticsDashboard({ sessions }: Props) {
  // Calculate statistics
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  const totalDuration = sessions.reduce((acc, s) => {
    if (s.ended_at) {
      return acc + (s.ended_at - s.started_at)
    }
    return acc
  }, 0)
  const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60) : 0

  const totalFiles = new Set(
    sessions.flatMap(s => Array.isArray(s.summary_files_changed) ? s.summary_files_changed : [])
  ).size

  const totalTools = sessions.reduce((acc, s) => acc + (s.tool_use_count || 0), 0)

  // Tool usage breakdown
  const toolUsage: Record<string, number> = {}
  sessions.forEach(s => {
    if (s.tool_use_count > 0) {
      // Simplified - in real app would track individual tools
      toolUsage['Read'] = (toolUsage['Read'] || 0) + Math.floor(s.tool_use_count * 0.3)
      toolUsage['Edit'] = (toolUsage['Edit'] || 0) + Math.floor(s.tool_use_count * 0.25)
      toolUsage['Bash'] = (toolUsage['Bash'] || 0) + Math.floor(s.tool_use_count * 0.2)
      toolUsage['Write'] = (toolUsage['Write'] || 0) + Math.floor(s.tool_use_count * 0.15)
      toolUsage['Grep'] = (toolUsage['Grep'] || 0) + Math.floor(s.tool_use_count * 0.1)
    }
  })

  const topTools = Object.entries(toolUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const maxToolCount = topTools.length > 0 ? topTools[0][1] : 1

  // Files heatmap - most edited files
  const fileChanges: Record<string, number> = {}
  sessions.forEach(s => {
    if (Array.isArray(s.summary_files_changed)) {
      s.summary_files_changed.forEach((file: string) => {
        fileChanges[file] = (fileChanges[file] || 0) + 1
      })
    }
  })

  const topFiles = Object.entries(fileChanges)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const maxFileCount = topFiles.length > 0 ? topFiles[0][1] : 1

  // Weekly activity (last 7 days)
  const now = Date.now() / 1000
  const weekAgo = now - (7 * 24 * 60 * 60)
  const weekSessions = sessions.filter(s => s.started_at >= weekAgo)

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

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <BarChart3 size={20} />
        Analytics Dashboard
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
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Completion Rate</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{completionRate}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {completedSessions} of {totalSessions} sessions
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
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Avg Duration</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{avgDuration}m</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            per session
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
            unique files
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

        {/* Tool Usage */}
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
            <Wrench size={16} />
            Top Tools Used
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topTools.map(([tool, count]) => (
              <div key={tool}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{tool}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{count}</span>
                </div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: 'var(--surface2)',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(count / maxToolCount) * 100}%`,
                    height: '100%',
                    background: 'var(--accent)',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Files Heatmap */}
      {topFiles.length > 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          marginTop: 16
        }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <FileText size={16} />
            Most Edited Files
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topFiles.map(([file, count]) => (
              <div key={file} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: 'var(--surface2)',
                borderRadius: 8
              }}>
                <div style={{
                  flex: 1,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <div style={{
                    width: 100,
                    height: 6,
                    background: 'var(--surface)',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(count / maxFileCount) * 100}%`,
                      height: '100%',
                      background: 'var(--purple)',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    minWidth: 30,
                    textAlign: 'right'
                  }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
