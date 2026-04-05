import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Activity, Zap, Database, Clock, TrendingUp, AlertCircle } from 'lucide-react'

export default function MetricsDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: api.getMetrics,
    refetchInterval: 5000,
  })

  if (!metrics) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>Loading metrics...</div>
  }

  const { summarizations, sessions, memory, queue } = metrics

  const stats = [
    {
      label: 'Total Summarizations',
      value: summarizations.total,
      icon: Activity,
      color: 'var(--accent)',
    },
    {
      label: 'Success Rate',
      value: summarizations.total > 0
        ? `${Math.round((summarizations.successful / summarizations.total) * 100)}%`
        : '0%',
      icon: TrendingUp,
      color: 'var(--green)',
    },
    {
      label: 'Avg Duration',
      value: summarizations.avgDuration > 0
        ? `${(summarizations.avgDuration / 1000).toFixed(1)}s`
        : '0s',
      icon: Clock,
      color: 'var(--blue)',
    },
    {
      label: 'Failed',
      value: summarizations.failed,
      icon: AlertCircle,
      color: 'var(--red)',
    },
  ]

  const sessionStats = [
    { label: 'Total Sessions', value: sessions.total },
    { label: 'Active', value: sessions.active },
    { label: 'Completed', value: sessions.completed },
  ]

  const memoryStats = [
    { label: 'Preferences', value: memory.preferences },
    { label: 'Knowledge', value: memory.knowledge },
    { label: 'Patterns', value: memory.patterns },
    { label: 'Tasks', value: memory.tasks },
  ]

  const queueStats = [
    { label: 'High Priority', value: queue.high, color: 'var(--red)' },
    { label: 'Normal Priority', value: queue.normal, color: 'var(--yellow)' },
    { label: 'Low Priority', value: queue.low, color: 'var(--green)' },
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: '100%', width: '100%' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>System Metrics</h1>

      {/* Summarization Stats */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
          Summarization Performance
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon size={16} style={{ color: stat.color }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {stat.label}
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session Stats */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
          Sessions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {sessionStats.map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memory Stats */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
          Memory System
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {memoryStats.map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue Stats */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
          Summarization Queue
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {queueStats.map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          Last Updated
        </div>
        <div style={{ fontSize: 13, color: 'var(--text)' }}>
          {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  )
}
