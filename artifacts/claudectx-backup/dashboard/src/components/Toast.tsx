import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'loading'
  message: string
  progress?: number
}

let toastId = 0
const listeners = new Set<(toasts: Toast[]) => void>()
let toasts: Toast[] = []

function notify(listeners: Set<(toasts: Toast[]) => void>) {
  listeners.forEach(fn => fn([...toasts]))
}

export const toast = {
  show: (message: string, type: Toast['type'] = 'info', progress?: number) => {
    const id = `toast-${toastId++}`
    toasts.push({ id, type, message, progress })
    notify(listeners)
    if (type !== 'loading') {
      setTimeout(() => toast.dismiss(id), 5000)
    }
    return id
  },
  loading: (message: string, progress?: number) => {
    return toast.show(message, 'loading', progress)
  },
  success: (message: string) => {
    return toast.show(message, 'success')
  },
  error: (message: string) => {
    return toast.show(message, 'error')
  },
  update: (id: string, message: string, progress?: number) => {
    const t = toasts.find(t => t.id === id)
    if (t) {
      t.message = message
      if (progress !== undefined) t.progress = progress
      notify(listeners)
    }
  },
  dismiss: (id: string) => {
    toasts = toasts.filter(t => t.id !== id)
    notify(listeners)
  }
}

export default function ToastContainer() {
  const [state, setState] = useState<Toast[]>([])

  useEffect(() => {
    listeners.add(setState)
    return () => { listeners.delete(setState) }
  }, [])

  if (state.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 400,
    }}>
      {state.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => toast.dismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = {
    success: { bg: 'var(--green)15', border: 'var(--green)', icon: 'var(--green)' },
    error: { bg: 'var(--red)15', border: 'var(--red)', icon: 'var(--red)' },
    info: { bg: 'var(--blue)15', border: 'var(--blue)', icon: 'var(--blue)' },
    loading: { bg: 'var(--accent)15', border: 'var(--accent)', icon: 'var(--accent)' },
  }

  const c = colors[t.type]

  const Icon = t.type === 'success' ? CheckCircle
    : t.type === 'error' ? AlertCircle
    : Loader

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: '14px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      minWidth: 300,
      animation: 'slideIn 0.3s ease-out',
    }}>
      <Icon
        size={20}
        style={{
          color: c.icon,
          flexShrink: 0,
          animation: t.type === 'loading' ? 'spin 1s linear infinite' : 'none'
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: t.progress !== undefined ? 8 : 0 }}>
          {t.message}
        </div>
        {t.progress !== undefined && (
          <div style={{
            height: 4,
            background: 'var(--border)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: c.icon,
              width: `${t.progress}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}
      </div>
      {t.type !== 'loading' && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
