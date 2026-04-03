import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Download, Pause, Play, Filter, Search, X } from 'lucide-react'
import { toast } from '../components/Toast'

const TIME_FILTERS = [
  { label: 'Last 5 min', value: 5 },
  { label: 'Last 10 min', value: 10 },
  { label: 'Last 15 min', value: 15 },
  { label: 'Last 30 min', value: 30 },
  { label: 'Last 1 hour', value: 60 },
  { label: 'All', value: 0 },
]

const LEVEL_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Info', value: 'info', color: 'var(--blue)' },
  { label: 'Warn', value: 'warn', color: 'var(--yellow)' },
  { label: 'Error', value: 'error', color: 'var(--red)' },
  { label: 'Hook', value: 'hook', color: 'var(--purple)' },
  { label: 'Broadcast', value: 'broadcast', color: 'var(--green)' },
]

export default function Logs() {
  const [streaming, setStreaming] = useState(true)
  const [logs, setLogs] = useState<string[]>([])
  const [timeFilter, setTimeFilter] = useState(15) // Default 15 min
  const [levelFilter, setLevelFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch initial logs
  const { data: initialLogs } = useQuery({
    queryKey: ['logs', timeFilter, levelFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (timeFilter > 0) params.append('minutes', String(timeFilter))
      if (levelFilter) params.append('level', levelFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/logs?${params}`)
      const data = await res.json()
      return data.logs || []
    },
    refetchInterval: streaming ? false : 5000, // Poll every 5s when not streaming
  })

  // Update logs when initial data changes
  useEffect(() => {
    if (initialLogs) {
      setLogs(initialLogs)
    }
  }, [initialLogs])

  // Real-time streaming
  useEffect(() => {
    if (!streaming) {
      eventSourceRef.current?.close()
      return
    }

    const eventSource = new EventSource('/api/logs/stream')
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const newLog = data.log

      // Apply filters
      if (levelFilter && !newLog.toLowerCase().includes(`[${levelFilter.toLowerCase()}]`)) {
        return
      }
      if (searchQuery && !newLog.toLowerCase().includes(searchQuery.toLowerCase())) {
        return
      }

      setLogs(prev => [...prev.slice(-999), newLog]) // Keep last 1000 logs
    }

    eventSource.onerror = () => {
      console.error('SSE connection error')
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [streaming, levelFilter, searchQuery])

  // Auto-scroll to bottom
  useEffect(() => {
    if (streaming) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, streaming])

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'))
    toast.success('Logs copied to clipboard!')
  }

  const downloadLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claudectx-logs-${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs downloaded!')
  }

  const clearLogs = () => {
    setLogs([])
    toast.success('Logs cleared!')
  }

  const getLogColor = (log: string) => {
    if (log.includes('[ERROR]') || log.includes('error')) return 'var(--red)'
    if (log.includes('[WARN]') || log.includes('warn')) return 'var(--yellow)'
    if (log.includes('[INFO]') || log.includes('info')) return 'var(--blue)'
    if (log.includes('[Hook]')) return 'var(--purple)'
    if (log.includes('[Broadcast]')) return 'var(--green)'
    return 'var(--text)'
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>System Logs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Real-time streaming logs from ClaudeContext worker
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
      }}>
        {/* Time Filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              style={{
                padding: '6px 12px',
                background: timeFilter === filter.value ? 'var(--accent)' : 'var(--surface2)',
                color: timeFilter === filter.value ? 'white' : 'var(--text)',
                border: '1px solid',
                borderColor: timeFilter === filter.value ? 'var(--accent)' : 'var(--border)',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Level Filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {LEVEL_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setLevelFilter(filter.value)}
              style={{
                padding: '6px 12px',
                background: levelFilter === filter.value ? (filter.color || 'var(--accent)') : 'var(--surface2)',
                color: levelFilter === filter.value ? 'white' : 'var(--text)',
                border: '1px solid',
                borderColor: levelFilter === filter.value ? (filter.color || 'var(--accent)') : 'var(--border)',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 36px 8px 36px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 13,
              color: 'var(--text)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Actions */}
        <button
          onClick={() => setStreaming(!streaming)}
          style={{
            padding: '8px 12px',
            background: streaming ? 'var(--green)15' : 'var(--surface2)',
            color: streaming ? 'var(--green)' : 'var(--text)',
            border: '1px solid',
            borderColor: streaming ? 'var(--green)30' : 'var(--border)',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {streaming ? <Pause size={14} /> : <Play size={14} />}
          {streaming ? 'Pause' : 'Resume'}
        </button>

        <button
          onClick={copyLogs}
          style={{
            padding: '8px 12px',
            background: 'var(--surface2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Copy size={14} />
          Copy
        </button>

        <button
          onClick={downloadLogs}
          style={{
            padding: '8px 12px',
            background: 'var(--surface2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Download size={14} />
          Download
        </button>

        <button
          onClick={clearLogs}
          style={{
            padding: '8px 12px',
            background: 'var(--red)15',
            color: 'var(--red)',
            border: '1px solid var(--red)30',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      {/* Logs Display */}
      <div style={{
        background: '#1a1a1a',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        height: 'calc(100vh - 320px)',
        overflow: 'auto',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: 12,
        lineHeight: 1.6,
      }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No logs to display. Waiting for logs...
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              style={{
                color: getLogColor(log),
                marginBottom: 2,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {log}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Stats */}
      <div style={{
        marginTop: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        <div>
          {logs.length} logs displayed
          {streaming && <span style={{ color: 'var(--green)', marginLeft: 8 }}>● Live</span>}
        </div>
        <div>
          {timeFilter > 0 ? `Last ${timeFilter} minutes` : 'All time'}
          {levelFilter && ` • ${levelFilter}`}
          {searchQuery && ` • "${searchQuery}"`}
        </div>
      </div>
    </div>
  )
}
