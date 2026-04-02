import { useState, useEffect, useRef } from 'react'
import { createWebSocket } from '../api/client'
import { format } from 'date-fns'
import { Radio, Wrench, MessageSquare, Zap, CheckCircle2 } from 'lucide-react'

interface LiveEvent {
  type: string
  timestamp: number
  session_id?: string
  tool_name?: string
  file_path?: string
  preview?: string
  project?: { name: string }
  title?: string
}

const EVENT_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  session_start:  { icon: Zap, color: 'var(--green)', label: 'Session Started' },
  session_end:    { icon: CheckCircle2, color: 'var(--text-muted)', label: 'Session Ended' },
  tool_use:       { icon: Wrench, color: 'var(--accent)', label: 'Tool Use' },
  user_prompt:    { icon: MessageSquare, color: 'var(--blue)', label: 'User Prompt' },
  stop:           { icon: CheckCircle2, color: 'var(--text-muted)', label: 'Response' },
  pre_compact:    { icon: Radio, color: 'var(--yellow)', label: 'Pre-Compact' },
  summary_ready:  { icon: Zap, color: 'var(--green)', label: 'Summary Ready' },
  connected:      { icon: Radio, color: 'var(--green)', label: 'Connected' },
}

export default function Live() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string>('')
  const wsRef = useRef<WebSocket | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ws: WebSocket

    const connect = () => {
      try {
        ws = createWebSocket()
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          setError('')
        }

        ws.onmessage = (e) => {
          try {
            const event = JSON.parse(e.data) as LiveEvent
            setEvents(prev => [event, ...prev].slice(0, 200))
          } catch {}
        }

        ws.onclose = () => {
          setConnected(false)
          setTimeout(connect, 3000)
        }

        ws.onerror = () => {
          setError('WebSocket connection failed')
          setConnected(false)
        }
      } catch (err) {
        setError(String(err))
      }
    }

    connect()

    return () => {
      ws?.close()
    }
  }, [])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Live Feed</h1>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? 'var(--green)' : 'var(--red)',
            display: 'inline-block',
            animation: connected ? 'pulse 1.5s infinite' : 'none',
          }} />
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {connected ? 'Real-time events from active Claude Code sessions' : 'Connecting...'}
        </p>
        {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{error}</p>}
      </div>

      {events.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 0',
          color: 'var(--text-muted)',
        }}>
          <Radio size={36} color="var(--border)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14 }}>Waiting for events...</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>Start a Claude Code session to see live activity</div>
        </div>
      )}

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map((event, i) => {
          const cfg = EVENT_CONFIG[event.type] || { icon: Radio, color: 'var(--text-muted)', label: event.type }
          const Icon = cfg.icon

          return (
            <div key={i} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              opacity: i > 50 ? 0.6 : 1,
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `${cfg.color}15`,
                border: `1px solid ${cfg.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={12} color={cfg.color} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {event.timestamp ? format(new Date(event.timestamp), 'HH:mm:ss') : ''}
                  </span>
                </div>

                {event.tool_name && (
                  <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2, fontFamily: 'monospace' }}>
                    {event.tool_name}
                    {event.file_path && <span style={{ color: 'var(--text-muted)' }}> {event.file_path}</span>}
                  </div>
                )}

                {event.preview && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.preview}
                  </div>
                )}

                {event.session_id && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                    {event.session_id.slice(0, 16)}...
                  </div>
                )}

                {event.project && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Project: {event.project.name}
                  </div>
                )}

                {event.title && (
                  <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 2 }}>
                    {event.title}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
