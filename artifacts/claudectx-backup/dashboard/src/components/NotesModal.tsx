import { useState } from 'react'
import { X, FileText } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { toast } from './Toast'

interface Props {
  sessionId: string
  initialNotes?: string
  isOpen: boolean
  onClose: () => void
}

export default function NotesModal({ sessionId, initialNotes = '', isOpen, onClose }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [isSaving, setIsSaving] = useState(false)
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: () => api.updateSessionNotes(sessionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      toast.success('Notes saved')
      onClose()
    },
    onError: (error) => toast.error('Failed to save notes: ' + error),
  })

  const handleSave = async () => {
    setIsSaving(true)
    await saveMutation.mutateAsync()
    setIsSaving(false)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.15s',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 600,
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.2s',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="var(--accent)" />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Session Notes</h2>
          </div>
          <button
            onClick={onClose}
            style={{
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
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <X size={20} />
          </button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this session..."
          style={{
            flex: 1,
            padding: 12,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 14,
            color: 'var(--text)',
            fontFamily: 'inherit',
            resize: 'none',
            marginBottom: 16,
            minHeight: 200,
          }}
          autoFocus
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              background: isSaving ? 'var(--surface)' : 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              color: 'white',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!isSaving) (e.currentTarget.style.background = 'var(--accent-hover)')
            }}
            onMouseLeave={e => {
              if (!isSaving) (e.currentTarget.style.background = 'var(--accent)')
            }}
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  )
}
