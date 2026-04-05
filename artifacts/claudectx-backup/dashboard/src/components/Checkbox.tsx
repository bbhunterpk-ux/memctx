import { CheckSquare, Square } from 'lucide-react'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export default function Checkbox({ checked, onChange, disabled }: Props) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        background: 'transparent',
        color: checked ? 'var(--accent)' : 'var(--text-muted)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.color = checked ? 'var(--accent)' : 'var(--text-muted)'
        }
      }}
    >
      {checked ? <CheckSquare size={18} /> : <Square size={18} />}
    </button>
  )
}
