import { Link } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { Clock, FileText, Wrench, Lightbulb, AlertCircle, Smile, Frown, Meh, Zap, CheckCircle, Trash2, Star, Archive, ArchiveRestore, RefreshCw } from 'lucide-react'
import StatusBadge from './StatusBadge'
import ConfirmDialog from './ConfirmDialog'
import Checkbox from './Checkbox'
import { api } from '../api/client'
import { useState } from 'react'
import { toast } from './Toast'

interface Props {
  session: any
  onSessionUpdated?: () => void
  selectionMode?: boolean
  selected?: boolean
  onSelectionChange?: (selected: boolean) => void
}

const moodIcons: Record<string, any> = {
  productive: Smile,
  frustrated: Frown,
  exploratory: Lightbulb,
  debugging: Wrench,
  blocked: AlertCircle,
}

const complexityColors: Record<string, string> = {
  trivial: 'var(--green)',
  simple: 'var(--green)',
  moderate: 'var(--yellow)',
  complex: 'var(--orange)',
  very_complex: 'var(--red)',
}

export default function SessionCard({ session, onSessionUpdated, selectionMode, selected, onSelectionChange }: Props) {
  const [ending, setEnding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showForceEndDialog, setShowForceEndDialog] = useState(false)
  const startDate = new Date(session.started_at * 1000)
  const duration = session.duration_seconds
    ? Math.floor(session.duration_seconds / 60)
    : session.ended_at
    ? Math.floor((session.ended_at - session.started_at) / 60)
    : null

  const files = Array.isArray(session.summary_files_changed)
    ? session.summary_files_changed
    : []

  const MoodIcon = session.summary_mood ? moodIcons[session.summary_mood] : null
  const complexityColor = session.summary_complexity ? complexityColors[session.summary_complexity] : 'var(--text-muted)'

  const isActive = session.status === 'active' ||
                   !session.status ||
                   (session.summary_status && session.summary_status.toLowerCase() === 'in_progress')

  const hasSummary = !!session.summary_title

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBookmarking(true)
    try {
      await api.toggleBookmark(session.id, !session.is_bookmarked)
      if (onSessionUpdated) {
        onSessionUpdated()
      }
    } catch (error) {
      toast.error('Failed to update bookmark: ' + error)
    } finally {
      setBookmarking(false)
    }
  }

  const handleForceEnd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowForceEndDialog(true)
  }

  const confirmForceEnd = async () => {
    setShowForceEndDialog(false)
    setEnding(true)
    const toastId = toast.loading('Ending session...')
    try {
      await api.forceEndSession(session.id)
      toast.dismiss(toastId)
      toast.success('Session ended successfully')
      if (onSessionUpdated) {
        setTimeout(() => onSessionUpdated(), 1000)
      }
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Failed to end session: ' + error)
    } finally {
      setEnding(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleToggleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setArchiving(true)
    try {
      await api.toggleArchive(session.id, !session.is_archived)
      toast.success(session.is_archived ? 'Session unarchived' : 'Session archived')
      if (onSessionUpdated) {
        onSessionUpdated()
      }
    } catch (error) {
      toast.error('Failed to update archive status: ' + error)
    } finally {
      setArchiving(false)
    }
  }

  const handleSyncSummary = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSyncing(true)
    const toastId = toast.loading(hasSummary ? 'Resyncing summary...' : 'Syncing summary...')
    try {
      if (hasSummary) {
        await api.resyncSession(session.id)
      } else {
        await api.syncSession(session.id)
      }
      toast.dismiss(toastId)
      toast.success('Session queued for summarization')
      if (onSessionUpdated) {
        setTimeout(() => onSessionUpdated(), 2000)
      }
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Failed to sync: ' + error)
    } finally {
      setSyncing(false)
    }
  }

  const confirmDelete = async () => {
    setShowDeleteDialog(false)
    setDeleting(true)
    const toastId = toast.loading('Deleting session...')
    try {
      await api.deleteSession(session.id)
      toast.dismiss(toastId)
      toast.success('Session deleted successfully')
      if (onSessionUpdated) {
        setTimeout(() => onSessionUpdated(), 500)
      }
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Failed to delete session: ' + error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Link to={`/session/${session.id}`} style={{ display: 'block' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          {selectionMode && (
            <div style={{ paddingTop: 2, marginRight: 8 }}>
              <Checkbox
                checked={selected || false}
                onChange={(checked) => onSelectionChange?.(checked)}
              />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {session.summary_title || 'Session ' + session.id.slice(0, 8)}
              </div>
              {MoodIcon && (
                <MoodIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              )}
            </div>

            {session.summary_what_we_did && Array.isArray(session.summary_what_we_did) && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {session.summary_what_we_did[0]}
              </div>
            )}

            {session.summary_key_insight && (
              <div style={{
                fontSize: 11,
                color: 'var(--accent)',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Zap size={11} />
                {session.summary_key_insight}
              </div>
            )}

            {(session.metric_momentum !== undefined || session.metric_frustration !== undefined) && (
              <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 8,
                fontSize: 10,
                flexWrap: 'wrap'
              }}>
                {session.metric_momentum != null && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: session.metric_momentum > 70 ? 'var(--green)20' : 'var(--blue)15',
                    color: session.metric_momentum > 70 ? 'var(--green)' : 'var(--blue)',
                    border: '1px solid',
                    borderColor: session.metric_momentum > 70 ? 'var(--green)30' : 'var(--blue)30',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    ⚡ Momentum: {session.metric_momentum}
                  </span>
                )}
                {session.metric_frustration != null && session.metric_frustration > 0 && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: session.metric_frustration > 50 ? 'var(--red)20' : 'var(--orange)15',
                    color: session.metric_frustration > 50 ? 'var(--red)' : 'var(--orange)',
                    border: '1px solid',
                    borderColor: session.metric_frustration > 50 ? 'var(--red)30' : 'var(--orange)30',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    🔴 Frustration: {session.metric_frustration}
                  </span>
                )}
                {session.metric_productivity != null && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--accent)20',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)30',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    🎯 Productivity: {session.metric_productivity}
                  </span>
                )}
                {session.emotional_context && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--surface)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={session.emotional_context}>
                    💬 {session.emotional_context}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {formatDistanceToNow(startDate, { addSuffix: true })}
              </span>
              {duration !== null && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{duration}m</span>
              )}
              {session.summary_complexity && (
                <span style={{
                  fontSize: 10,
                  color: complexityColor,
                  padding: '2px 6px',
                  background: `${complexityColor}15`,
                  borderRadius: 4,
                  fontWeight: 600
                }}>
                  {session.summary_complexity.replace('_', ' ')}
                </span>
              )}
              {session.total_tool_calls > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wrench size={11} />
                  {session.total_tool_calls} calls
                </span>
              )}
              {files.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={11} />
                  {files.length} files
                </span>
              )}
            </div>
          </div>

          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleToggleBookmark}
              disabled={bookmarking}
              title={session.is_bookmarked ? 'Remove bookmark' : 'Bookmark session'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                background: 'transparent',
                color: session.is_bookmarked ? 'var(--yellow)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: bookmarking ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!bookmarking) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--yellow)15'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--yellow)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--yellow)30'
                }
              }}
              onMouseLeave={e => {
                if (!bookmarking) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = session.is_bookmarked ? 'var(--yellow)' : 'var(--text-muted)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                }
              }}
            >
              <Star size={14} fill={session.is_bookmarked ? 'var(--yellow)' : 'none'} />
            </button>
            <button
              onClick={handleToggleArchive}
              disabled={archiving}
              title={session.is_archived ? 'Unarchive session' : 'Archive session'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                background: 'transparent',
                color: session.is_archived ? 'var(--blue)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: archiving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!archiving) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)15'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--blue)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)30'
                }
              }}
              onMouseLeave={e => {
                if (!archiving) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = session.is_archived ? 'var(--blue)' : 'var(--text-muted)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                }
              }}
            >
              {session.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            </button>
            {isActive && (
              <button
                onClick={handleForceEnd}
                disabled={ending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  background: ending ? 'var(--surface)' : 'var(--green)15',
                  color: ending ? 'var(--text-muted)' : 'var(--green)',
                  border: '1px solid',
                  borderColor: ending ? 'var(--border)' : 'var(--green)30',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: ending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!ending) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--green)25'
                  }
                }}
                onMouseLeave={e => {
                  if (!ending) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--green)15'
                  }
                }}
              >
                <CheckCircle size={12} />
                {ending ? 'Ending...' : 'Force End'}
              </button>
            )}
            <button
              onClick={handleSyncSummary}
              disabled={syncing}
              title={hasSummary ? 'Resync summary' : (!session.transcript_path ? 'Sync from observations' : 'Sync summary')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: syncing ? 'var(--surface)' : (!hasSummary && !session.transcript_path ? 'var(--orange)15' : 'var(--blue)15'),
                color: syncing ? 'var(--text-muted)' : (!hasSummary && !session.transcript_path ? 'var(--orange)' : 'var(--blue)'),
                border: '1px solid',
                borderColor: syncing ? 'var(--border)' : (!hasSummary && !session.transcript_path ? 'var(--orange)30' : 'var(--blue)30'),
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!syncing) {
                  const bgColor = !hasSummary && !session.transcript_path ? 'var(--orange)25' : 'var(--blue)25'
                  ;(e.currentTarget as HTMLButtonElement).style.background = bgColor
                }
              }}
              onMouseLeave={e => {
                if (!syncing) {
                  const bgColor = !hasSummary && !session.transcript_path ? 'var(--orange)15' : 'var(--blue)15'
                  ;(e.currentTarget as HTMLButtonElement).style.background = bgColor
                }
              }}
            >
              <RefreshCw size={12} />
              {syncing ? 'Syncing...' : (hasSummary ? 'Resync' : 'Sync')}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete session"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                background: deleting ? 'var(--surface)' : 'transparent',
                color: deleting ? 'var(--text-muted)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!deleting) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--red)15'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)30'
                }
              }}
              onMouseLeave={e => {
                if (!deleting) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                }
              }}
            >
              <Trash2 size={14} />
            </button>
            <StatusBadge status={session.summary_status || session.status} />
          </div>
        </div>
      </div>
    </Link>

    {/* Force End Confirmation Dialog */}
    <ConfirmDialog
      isOpen={showForceEndDialog}
      title="Force End Session"
      message="This will mark the session as completed and trigger AI summarization. The session will be processed and added to your project history."
      confirmText="Force End"
      cancelText="Cancel"
      confirmColor="var(--green)"
      onConfirm={confirmForceEnd}
      onCancel={() => setShowForceEndDialog(false)}
    />

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      isOpen={showDeleteDialog}
      title="Delete Session"
      message="This will permanently remove the session and all its data including observations, preferences, knowledge, and tasks. This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      confirmColor="var(--red)"
      onConfirm={confirmDelete}
      onCancel={() => setShowDeleteDialog(false)}
    />
    </>
  )
}
