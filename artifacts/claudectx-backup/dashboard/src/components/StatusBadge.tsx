type Status = 'completed' | 'in_progress' | 'blocked' | 'active' | 'compacted' | 'error' | string

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  completed:   { bg: '#16301e', color: '#22c55e', label: 'Completed' },
  in_progress: { bg: '#2d2505', color: '#eab308', label: 'In Progress' },
  blocked:     { bg: '#2d0808', color: '#ef4444', label: 'Blocked' },
  active:      { bg: '#0f1f3d', color: '#60a5fa', label: 'Active' },
  compacted:   { bg: '#1e1e24', color: '#7a7a99', label: 'Compacted' },
  error:       { bg: '#2d0808', color: '#ef4444', label: 'Error' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_COLORS[status] || { bg: '#1e1e24', color: '#7a7a99', label: status }
  const isPulse = status === 'active'

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 8px',
      borderRadius: 20,
      background: cfg.bg,
      color: cfg.color,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    }}>
      {isPulse && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: cfg.color,
          display: 'inline-block',
          animation: 'pulse 1.5s infinite',
        }} />
      )}
      {cfg.label}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </span>
  )
}
