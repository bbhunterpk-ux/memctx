import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const

  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px', background: 'var(--surface2)', borderRadius: 8 }}>
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          style={{
            padding: '6px 8px',
            background: theme === value ? 'var(--accent)' : 'transparent',
            color: theme === value ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}
