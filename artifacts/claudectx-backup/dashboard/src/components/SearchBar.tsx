import { useState, useRef } from 'react'
import { Search } from 'lucide-react'

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

  return (
    <div style={{ position: 'relative' }}>
      <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '10px 12px 10px 36px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}
