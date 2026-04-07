import { useQuery } from '@tanstack/react-query'
import { Clock, FileText, Wrench, Calendar } from 'lucide-react'
import { format, startOfDay } from 'date-fns'

interface Props {
  projectId: string
}

export default function ProductivityWidget({ projectId }: Props) {
  const { data: sessions } = useQuery({
    queryKey: ['sessions', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions?project_id=${projectId}&limit=100`)
      if (!res.ok) throw new Error('Failed to fetch sessions')
      return res.json()
    },
  })

  const todayStart = startOfDay(new Date()).getTime() / 1000

  const todaySessions = (sessions || []).filter((s: any) => s.started_at >= todayStart)

  const totalToolCalls = todaySessions.reduce((sum: number, s: any) => sum + (s.total_tool_calls || 0), 0)

  const filesChanged = new Set(
    todaySessions.flatMap((s: any) => {
      try {
        const files = s.summary_files_changed
        if (Array.isArray(files)) return files
        if (typeof files === 'string') return JSON.parse(files)
        return []
      } catch {
        return []
      }
    })
  ).size

  const totalMinutes = todaySessions.reduce((sum: number, s: any) => {
    const duration = s.duration_seconds
      ? Math.floor(s.duration_seconds / 60)
      : s.ended_at
      ? Math.floor((s.ended_at - s.started_at) / 60)
      : 0
    return sum + duration
  }, 0)

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Calendar size={18} style={{ color: 'var(--accent)' }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          Today's Productivity
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Calendar size={14} style={{ color: 'var(--accent)' }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Sessions
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
            {todaySessions.length}
          </div>
        </div>

        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Wrench size={14} style={{ color: 'var(--blue)' }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Tool Calls
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--blue)' }}>
            {totalToolCalls}
          </div>
        </div>

        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FileText size={14} style={{ color: 'var(--green)' }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Files Touched
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>
            {filesChanged}
          </div>
        </div>

        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Clock size={14} style={{ color: 'var(--orange)' }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Time Spent
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--orange)' }}>
            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
          </div>
        </div>
      </div>
    </div>
  )
}
