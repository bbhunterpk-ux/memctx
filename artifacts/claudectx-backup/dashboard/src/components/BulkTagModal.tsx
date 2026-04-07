import { useState } from 'react'
import { X } from 'lucide-react'
import TagInput from './TagInput'
import { toast } from './Toast'

interface Props {
  isOpen: boolean
  sessionIds: string[]
  onClose: () => void
  onComplete: () => void
}

export default function BulkTagModal({ isOpen, sessionIds, onClose, onComplete }: Props) {
  const [selectedTags, setSelectedTags] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag')
      return
    }

    setSaving(true)
    const toastId = toast.loading(`Tagging ${sessionIds.length} sessions...`)

    try {
      // Apply tags to all selected sessions
      await Promise.all(
        sessionIds.map(sessionId =>
          Promise.all(
            selectedTags.map(tag =>
              fetch(`/api/sessions/${sessionId}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag_id: tag.id }),
              })
            )
          )
        )
      )

      toast.dismiss(toastId)
      toast.success(`Tagged ${sessionIds.length} sessions`)
      onComplete()
      onClose()
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Failed to tag sessions: ' + error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 500,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            Tag {sessionIds.length} Sessions
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            Select Tags
          </label>
          <TagInput
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedTags.length === 0}
            style={{
              padding: '8px 16px',
              background: saving || selectedTags.length === 0 ? 'var(--surface2)' : 'var(--accent)',
              color: saving || selectedTags.length === 0 ? 'var(--text-muted)' : 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving || selectedTags.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Tagging...' : 'Apply Tags'}
          </button>
        </div>
      </div>
    </div>
  )
}
