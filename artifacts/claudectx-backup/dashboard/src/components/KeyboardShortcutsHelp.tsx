import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleShow = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)

    document.addEventListener('show-shortcuts', handleShow)
    document.addEventListener('close-modal', handleClose)

    return () => {
      document.removeEventListener('show-shortcuts', handleShow)
      document.removeEventListener('close-modal', handleClose)
    }
  }, [])

  if (!isOpen) return null

  const shortcuts = [
    { keys: ['j'], description: 'Next item' },
    { keys: ['k'], description: 'Previous item' },
    { keys: ['/'], description: 'Focus search' },
    { keys: ['Esc'], description: 'Close modal' },
    { keys: ['?'], description: 'Show shortcuts' },
    { keys: ['g', 'h'], description: 'Go to home' },
    { keys: ['g', 's'], description: 'Go to search' },
    { keys: ['g', 'l'], description: 'Go to live' },
    { keys: ['g', 'm'], description: 'Go to metrics' },
    { keys: ['g', 'b'], description: 'Go to memory' },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.15s',
    }} onClick={() => setIsOpen(false)}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 24,
        maxWidth: 500,
        width: '90%',
        animation: 'scaleIn 0.2s',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Keyboard Shortcuts</h2>
          <button onClick={() => setIsOpen(false)} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 4,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {shortcuts.map((shortcut, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{shortcut.description}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {shortcut.keys.map((key, j) => (
                  <kbd key={j} style={{
                    padding: '4px 8px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    color: 'var(--text)',
                  }}>{key}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
