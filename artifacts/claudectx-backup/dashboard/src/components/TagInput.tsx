import { useState, useRef, useEffect } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { toast } from './Toast'

interface Tag {
  id: number
  name: string
  color?: string
  project_id: string
}

interface Props {
  sessionId: string
  projectId: string
  sessionTags: Tag[]
  onUpdate?: () => void
}

const TAG_COLORS = [
  '#7c6cfc', // purple
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
]

export default function TagInput({ sessionId, projectId, sessionTags, onUpdate }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: allTags = [] } = useQuery({
    queryKey: ['tags', projectId],
    queryFn: () => api.getTags(projectId),
    enabled: !!projectId,
  })

  const addTagMutation = useMutation({
    mutationFn: ({ tagId }: { tagId: number }) => api.addSessionTag(sessionId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      if (onUpdate) onUpdate()
      setSearchTerm('')
    },
    onError: (error) => toast.error('Failed to add tag: ' + error),
  })

  const removeTagMutation = useMutation({
    mutationFn: ({ tagId }: { tagId: number }) => api.removeSessionTag(sessionId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      if (onUpdate) onUpdate()
    },
    onError: (error) => toast.error('Failed to remove tag: ' + error),
  })

  const createTagMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      api.createTag(projectId, name, color),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags', projectId] })
      addTagMutation.mutate({ tagId: newTag.id })
      setSearchTerm('')
      setShowColorPicker(false)
    },
    onError: (error) => toast.error('Failed to create tag: ' + error),
  })

  const filteredTags = allTags.filter((tag: Tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !sessionTags.some(st => st.id === tag.id)
  )

  const handleCreateTag = () => {
    if (!searchTerm.trim()) return
    createTagMutation.mutate({ name: searchTerm.trim(), color: selectedColor })
  }

  const exactMatch = allTags.find((tag: Tag) =>
    tag.name.toLowerCase() === searchTerm.toLowerCase()
  )

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {sessionTags.map(tag => (
          <div
            key={tag.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              background: tag.color ? `${tag.color}15` : 'var(--surface2)',
              border: '1px solid',
              borderColor: tag.color ? `${tag.color}30` : 'var(--border)',
              borderRadius: 6,
              fontSize: 12,
              color: tag.color || 'var(--text)',
            }}
          >
            <TagIcon size={11} />
            {tag.name}
            <button
              onClick={() => removeTagMutation.mutate({ tagId: tag.id })}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                color: 'inherit',
                opacity: 0.6,
              }}
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <Plus size={12} />
          Add tag
        </button>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 12,
          minWidth: 280,
          maxWidth: 400,
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search or create tag..."
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 13,
              color: 'var(--text)',
              marginBottom: 8,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm && !exactMatch) {
                handleCreateTag()
              }
              if (e.key === 'Escape') {
                setIsOpen(false)
              }
            }}
          />

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredTags.length > 0 ? (
              filteredTags.map((tag: Tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTagMutation.mutate({ tagId: tag.id })}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: tag.color || 'var(--border)',
                  }} />
                  {tag.name}
                </button>
              ))
            ) : searchTerm && !exactMatch ? (
              <div>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: 'var(--accent)15',
                    border: '1px solid var(--accent)30',
                    borderRadius: 6,
                    fontSize: 13,
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    marginBottom: showColorPicker ? 8 : 0,
                  }}
                >
                  <Plus size={14} />
                  Create "{searchTerm}"
                </button>

                {showColorPicker && (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Choose color:
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {TAG_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setSelectedColor(color)
                            handleCreateTag()
                          }}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            background: color,
                            border: selectedColor === color ? '2px solid var(--text)' : 'none',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>
                {searchTerm ? 'No matching tags' : 'Start typing to search or create'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
