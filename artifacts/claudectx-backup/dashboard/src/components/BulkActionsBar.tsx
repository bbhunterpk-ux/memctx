import { Trash2, Star, Tag, X } from 'lucide-react'

interface Props {
  selectedCount: number
  onBulkDelete: () => void
  onBulkBookmark: () => void
  onBulkTag: () => void
  onClearSelection: () => void
}

export default function BulkActionsBar({
  selectedCount,
  onBulkDelete,
  onBulkBookmark,
  onBulkTag,
  onClearSelection,
}: Props) {
  if (selectedCount === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
        {selectedCount} selected
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onBulkBookmark}
          title="Bookmark selected"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--yellow)15',
            color: 'var(--yellow)',
            border: '1px solid var(--yellow)30',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--yellow)25')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--yellow)15')}
        >
          <Star size={14} />
          Bookmark
        </button>

        <button
          onClick={onBulkTag}
          title="Tag selected"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--accent)15',
            color: 'var(--accent)',
            border: '1px solid var(--accent)30',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)25')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)15')}
        >
          <Tag size={14} />
          Tag
        </button>

        <button
          onClick={onBulkDelete}
          title="Delete selected"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--red)15',
            color: 'var(--red)',
            border: '1px solid var(--red)30',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--red)25')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--red)15')}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      <button
        onClick={onClearSelection}
        title="Clear selection"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          background: 'transparent',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
