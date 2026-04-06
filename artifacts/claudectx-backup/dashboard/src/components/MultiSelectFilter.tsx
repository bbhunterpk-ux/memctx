import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Props {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export default function MultiSelectFilter({ label, options, selected, onChange, placeholder }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: 200 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          background: selected.length > 0 ? 'var(--accent)15' : 'var(--surface2)',
          color: selected.length > 0 ? 'var(--accent)' : 'var(--text)',
          border: '1px solid',
          borderColor: selected.length > 0 ? 'var(--accent)30' : 'var(--border)',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
          width: '100%'
        }}
        onMouseEnter={e => {
          if (selected.length === 0) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
          }
        }}
        onMouseLeave={e => {
          if (selected.length === 0) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
          }
        }}
      >
        <span>
          {selected.length > 0 ? `${label} (${selected.length})` : placeholder || label}
        </span>
        <ChevronDown size={14} style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          maxHeight: 300,
          overflowY: 'auto'
        }}>
          {selected.length > 0 && (
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {selected.length} selected
              </span>
              <button
                onClick={handleClear}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
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
                <X size={12} />
                Clear
              </button>
            </div>
          )}

          {options.map(option => (
            <label
              key={option}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'background 0.15s',
                fontSize: 13
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLLabelElement).style.background = 'var(--surface2)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLLabelElement).style.background = 'transparent'
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => handleToggle(option)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--text)' }}>{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
