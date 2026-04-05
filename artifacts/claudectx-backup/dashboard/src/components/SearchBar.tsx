import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  onSearch: (query: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export default function SearchBar({ onSearch, placeholder = 'Search sessions...', autoFocus }: Props) {
  const [value, setValue] = useState('')
  const timeout = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)
    clearTimeout(timeout.current)
    if (q.length >= 2) {
      timeout.current = setTimeout(() => onSearch(q), 300)
    } else if (q.length === 0) {
      onSearch('')
    }
  }

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <Search size={16} style={{
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)',
        pointerEvents: 'none'
      }} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '8px 36px 8px 36px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text)',
          fontSize: 13,
          fontWeight: 500,
          outline: 'none',
          transition: 'all 0.15s',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--accent)'
          e.target.style.background = 'var(--surface)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)'
          e.target.style.background = 'var(--surface2)'
        }}
      />
      {value && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            background: 'transparent',
            color: 'var(--text-muted)',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
