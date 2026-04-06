import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  sessions: any[]
  onDateClick: (date: Date) => void
  selectedDate: Date | null
}

export default function CalendarView({ sessions, onDateClick, selectedDate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toDateString()
    return sessions.filter(s => {
      const sessionDate = new Date(s.started_at * 1000)
      return sessionDate.toDateString() === dateStr
    })
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const today = new Date()
  const isToday = (day: number) => {
    return today.getDate() === day &&
           today.getMonth() === month &&
           today.getFullYear() === year
  }

  const isSameDate = (date1: Date | null, date2: Date) => {
    if (!date1) return false
    return date1.toDateString() === date2.toDateString()
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} style={{ padding: 8 }} />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const sessionsOnDay = getSessionsForDate(date)
    const hasSessions = sessionsOnDay.length > 0
    const isSelected = isSameDate(selectedDate, date)
    const isTodayDate = isToday(day)

    days.push(
      <div
        key={day}
        onClick={() => onDateClick(date)}
        style={{
          padding: 8,
          minHeight: 60,
          background: isSelected ? 'var(--accent)15' : 'transparent',
          border: '1px solid',
          borderColor: isTodayDate ? 'var(--accent)' : 'var(--border)',
          borderRadius: 8,
          cursor: hasSessions ? 'pointer' : 'default',
          transition: 'all 0.15s',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
        onMouseEnter={(e) => {
          if (hasSessions) {
            e.currentTarget.style.background = isSelected ? 'var(--accent)20' : 'var(--surface2)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isSelected ? 'var(--accent)15' : 'transparent'
        }}
      >
        <div style={{
          fontSize: 13,
          fontWeight: isTodayDate ? 700 : 500,
          color: isTodayDate ? 'var(--accent)' : 'var(--text)'
        }}>
          {day}
        </div>
        {hasSessions && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            marginTop: 'auto'
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--accent)15',
              padding: '2px 6px',
              borderRadius: 4
            }}>
              {sessionsOnDay.length}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <button
          onClick={previousMonth}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text)',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface2)'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text)'
        }}>
          {monthNames[month]} {year}
        </h3>

        <button
          onClick={nextMonth}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text)',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface2)'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        marginBottom: 8
      }}>
        {dayNames.map(day => (
          <div
            key={day}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '4px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8
      }}>
        {days}
      </div>

      {selectedDate && (
        <div style={{
          marginTop: 16,
          padding: '8px 12px',
          background: 'var(--accent)10',
          border: '1px solid var(--accent)30',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>
            Showing sessions from <strong>{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
          </span>
          <button
            onClick={() => onDateClick(selectedDate)}
            style={{
              padding: '4px 8px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface2)'
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
