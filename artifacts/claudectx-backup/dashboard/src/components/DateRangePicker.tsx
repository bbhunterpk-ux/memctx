import { Calendar, X } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

interface Props {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void
}

export default function DateRangePicker({ onDateRangeChange }: Props) {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const handleStartChange = (value: string) => {
    setStartDate(value)
    if (value && endDate) {
      onDateRangeChange(new Date(value), new Date(endDate))
    } else if (!value && !endDate) {
      onDateRangeChange(null, null)
    }
  }

  const handleEndChange = (value: string) => {
    setEndDate(value)
    if (startDate && value) {
      onDateRangeChange(new Date(startDate), new Date(value))
    } else if (!startDate && !value) {
      onDateRangeChange(null, null)
    }
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    onDateRangeChange(null, null)
  }

  const hasValue = startDate || endDate

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '6px 10px',
      maxWidth: 400,
    }}>
      <Calendar size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

      <input
        type="date"
        value={startDate}
        onChange={(e) => handleStartChange(e.target.value)}
        placeholder="Start date"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontSize: 13,
          fontWeight: 500,
          outline: 'none',
        }}
      />

      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>

      <input
        type="date"
        value={endDate}
        onChange={(e) => handleEndChange(e.target.value)}
        placeholder="End date"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontSize: 13,
          fontWeight: 500,
          outline: 'none',
        }}
      />

      {hasValue && (
        <button
          onClick={handleClear}
          style={{
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
            flexShrink: 0,
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
