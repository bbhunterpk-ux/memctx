import { LayoutGrid, List, Clock } from 'lucide-react'

interface Props {
  viewMode: 'card' | 'table' | 'timeline'
  onToggle: (mode: 'card' | 'table' | 'timeline') => void
}

export default function ViewToggle({ viewMode, onToggle }: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      background: 'var(--surface2)',
      padding: 4,
      borderRadius: 8,
      border: '1px solid var(--border)'
    }}>
      <button
        onClick={() => onToggle('card')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: viewMode === 'card' ? 'var(--surface)' : 'transparent',
          color: viewMode === 'card' ? 'var(--text)' : 'var(--text-muted)',
          border: viewMode === 'card' ? '1px solid var(--border)' : '1px solid transparent',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'card') {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'card') {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }
        }}
      >
        <LayoutGrid size={16} />
        Cards
      </button>
      <button
        onClick={() => onToggle('table')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: viewMode === 'table' ? 'var(--surface)' : 'transparent',
          color: viewMode === 'table' ? 'var(--text)' : 'var(--text-muted)',
          border: viewMode === 'table' ? '1px solid var(--border)' : '1px solid transparent',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'table') {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'table') {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }
        }}
      >
        <List size={16} />
        Table
      </button>
      <button
        onClick={() => onToggle('timeline')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: viewMode === 'timeline' ? 'var(--surface)' : 'transparent',
          color: viewMode === 'timeline' ? 'var(--text)' : 'var(--text-muted)',
          border: viewMode === 'timeline' ? '1px solid var(--border)' : '1px solid transparent',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'timeline') {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'timeline') {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }
        }}
      >
        <Clock size={16} />
        Timeline
      </button>
    </div>
  )
}
