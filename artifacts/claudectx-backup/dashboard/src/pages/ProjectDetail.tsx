import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api, createWebSocket } from '../api/client'
import SessionCard from '../components/SessionCard'
import ActivityChart from '../components/ActivityChart'
import BulkActionsBar from '../components/BulkActionsBar'
import BulkTagModal from '../components/BulkTagModal'
import ConfirmDialog from '../components/ConfirmDialog'
import ProductivityWidget from '../components/ProductivityWidget'
import SearchBar from '../components/SearchBar'
import DateRangePicker from '../components/DateRangePicker'
import ViewToggle from '../components/ViewToggle'
import TableView from '../components/TableView'
import CalendarView from '../components/CalendarView'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import StatsRow from '../components/StatsRow'
import MultiSelectFilter from '../components/MultiSelectFilter'
import TimelineView from '../components/TimelineView'
import { ArrowLeft, GitBranch, FolderOpen, Brain, RefreshCw, CheckSquare, Square, Calendar, BarChart3 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from '../components/Toast'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [consolidating, setConsolidating] = useState(false)
  const [resyncing, setResyncing] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [showBulkTagModal, setShowBulkTagModal] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showBookmarked, setShowBookmarked] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [selectedComplexity, setSelectedComplexity] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'timeline'>(() => {
    const saved = localStorage.getItem('sessionViewMode')
    return (saved === 'card' || saved === 'table' || saved === 'timeline') ? saved : 'card'
  })
  const [showCalendar, setShowCalendar] = useState(() => {
    const saved = localStorage.getItem('showCalendar')
    return saved === 'true'
  })
  const [showAnalytics, setShowAnalytics] = useState(() => {
    const saved = localStorage.getItem('showAnalytics')
    return saved === 'true'
  })
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    confirmText: string
    confirmColor: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmColor: 'var(--accent)',
  })

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  })

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => api.getSessions({ project_id: id!, limit: 50 }),
    enabled: !!id,
    refetchInterval: 15000,
  })

  const { data: health } = useQuery({ queryKey: ['health'], queryFn: api.getHealth })

  // WebSocket listener for real-time updates
  useEffect(() => {
    if (!id) return

    let ws: WebSocket
    try {
      ws = createWebSocket()

      ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          // Refetch sessions on session_start, session_end, or summary_ready events
          if (event.type === 'session_start' || event.type === 'session_end' || event.type === 'summary_ready') {
            refetchSessions()
          }
        } catch {}
      }

      ws.onerror = () => {
        console.log('[ProjectDetail] WebSocket error, falling back to polling')
      }
    } catch (err) {
      console.log('[ProjectDetail] WebSocket connection failed:', err)
    }

    return () => {
      ws?.close()
    }
  }, [id, refetchSessions])

  const handleConsolidate = async () => {
    if (!id) return
    setConsolidating(true)
    const toastId = toast.loading('Consolidating memory...')
    try {
      await api.consolidateMemory(id)
      toast.dismiss(toastId)
      toast.success('Memory consolidation complete!')
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Consolidation failed: ' + error)
    } finally {
      setConsolidating(false)
    }
  }

  const handleResync = async (force: boolean = false) => {
    if (!id) return

    setConfirmDialog({
      isOpen: true,
      title: force ? 'Force Resync All Sessions' : 'Resync New Sessions',
      message: force
        ? 'This will regenerate ALL summaries with v2.0 fields (mood, complexity, blockers, resolved, key insights). This may take several minutes. Continue?'
        : 'This will only process sessions without summaries. To regenerate existing summaries with v2.0 fields, use "Force Resync All". Continue?',
      confirmText: force ? 'Force Resync' : 'Resync',
      confirmColor: force ? 'var(--orange)' : 'var(--blue)',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        setResyncing(true)
        const toastId = toast.loading('Queueing sessions for resync...', 0)
        try {
          const result = await api.resyncProject(id, force)
          toast.update(toastId, `Queued ${result.result.queued} sessions. Processing...`, 50)
          setTimeout(() => {
            toast.dismiss(toastId)
            toast.success(result.result.message)
          }, 2000)
          refetchSessions()
        } catch (error) {
          toast.dismiss(toastId)
          toast.error('Resync failed: ' + error)
        } finally {
          setResyncing(false)
        }
      }
    })
  }

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    setSelectedSessions(new Set())
  }

  const handleSelectAll = () => {
    if (selectedSessions.size === calendarFilteredSessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(calendarFilteredSessions.map((s: any) => s.id)))
    }
  }

  const handleSessionSelectionChange = (sessionId: string, selected: boolean) => {
    const newSelection = new Set(selectedSessions)
    if (selected) {
      newSelection.add(sessionId)
    } else {
      newSelection.delete(sessionId)
    }
    setSelectedSessions(newSelection)
  }

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Sessions',
      message: `This will permanently delete ${selectedSessions.size} sessions and all their data. This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: 'var(--red)',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        const toastId = toast.loading(`Deleting ${selectedSessions.size} sessions...`)
        try {
          await Promise.all(
            Array.from(selectedSessions).map(sessionId => api.deleteSession(sessionId))
          )
          toast.dismiss(toastId)
          toast.success(`Deleted ${selectedSessions.size} sessions`)
          setSelectedSessions(new Set())
          setSelectionMode(false)
          refetchSessions()
        } catch (error) {
          toast.dismiss(toastId)
          toast.error('Failed to delete sessions: ' + error)
        }
      }
    })
  }

  const handleBulkBookmark = async () => {
    const toastId = toast.loading(`Bookmarking ${selectedSessions.size} sessions...`)
    try {
      await Promise.all(
        Array.from(selectedSessions).map(sessionId => api.toggleBookmark(sessionId, true))
      )
      toast.dismiss(toastId)
      toast.success(`Bookmarked ${selectedSessions.size} sessions`)
      setSelectedSessions(new Set())
      setSelectionMode(false)
      refetchSessions()
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Failed to bookmark sessions: ' + error)
    }
  }

  const handleBulkTag = () => {
    setShowBulkTagModal(true)
  }

  const handleBulkExport = async () => {
    const toastId = toast.loading(`Exporting ${selectedSessions.size} sessions...`)
    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Fetch all selected sessions
      const sessionPromises = Array.from(selectedSessions).map(sessionId =>
        api.getSession(sessionId)
      )
      const sessionsData = await Promise.all(sessionPromises)

      // Add each session as a markdown file
      sessionsData.forEach((session: any) => {
        const title = session.summary_title || 'Untitled Session'
        const date = new Date(session.started_at * 1000).toISOString().split('T')[0]
        const filename = `${date}_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`

        const content = `# ${title}

**Date:** ${new Date(session.started_at * 1000).toLocaleString()}
**Status:** ${session.status}
**Duration:** ${session.ended_at ? Math.round((session.ended_at - session.started_at) / 60) : 0} minutes

## What We Did
${Array.isArray(session.summary_what_we_did) ? session.summary_what_we_did.map((item: string) => `- ${item}`).join('\n') : 'N/A'}

## Decisions Made
${Array.isArray(session.summary_decisions) ? session.summary_decisions.map((item: string) => `- ${item}`).join('\n') : 'N/A'}

## Files Changed
${Array.isArray(session.summary_files_changed) ? session.summary_files_changed.map((file: string) => `- ${file}`).join('\n') : 'N/A'}

## Next Steps
${Array.isArray(session.summary_next_steps) ? session.summary_next_steps.map((item: string) => `- ${item}`).join('\n') : 'N/A'}

## Gotchas
${Array.isArray(session.summary_gotchas) ? session.summary_gotchas.map((item: string) => `- ${item}`).join('\n') : 'N/A'}
`
        zip.file(filename, content)
      })

      // Generate ZIP file
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sessions_export_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.dismiss(toastId)
      toast.success(`Exported ${selectedSessions.size} sessions as ZIP`)
      setSelectedSessions(new Set())
      setSelectionMode(false)
    } catch (error) {
      toast.dismiss(toastId)
      toast.error('Failed to export sessions: ' + error)
    }
  }

  const handleBulkTagComplete = () => {
    setSelectedSessions(new Set())
    setSelectionMode(false)
    refetchSessions()
  }

  const activityData = health?.uptime ? [] : [] // placeholder

  if (isLoading) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
  }

  if (!project) {
    return <div style={{ padding: 32, color: 'var(--red)', fontSize: 13 }}>Project not found</div>
  }

  const allSessions = sessions || project.sessions || []
  const parsed = allSessions.map((s: any) => ({
    ...s,
    summary_what_we_did: tryParse(s.summary_what_we_did),
    summary_decisions: tryParse(s.summary_decisions),
    summary_files_changed: tryParse(s.summary_files_changed),
    summary_next_steps: tryParse(s.summary_next_steps),
    summary_gotchas: tryParse(s.summary_gotchas),
  }))

  const filteredSessions = showArchived
    ? parsed
    : parsed.filter((s: any) => !s.is_archived)

  // Apply bookmark filter
  const bookmarkFilteredSessions = showBookmarked
    ? filteredSessions.filter((s: any) => s.is_bookmarked)
    : filteredSessions

  // Apply search filter
  const searchedSessions = searchQuery
    ? bookmarkFilteredSessions.filter((s: any) => {
        const query = searchQuery.toLowerCase()
        const title = (s.summary_title || '').toLowerCase()
        const whatWeDid = Array.isArray(s.summary_what_we_did)
          ? s.summary_what_we_did.join(' ').toLowerCase()
          : ''
        const files = Array.isArray(s.summary_files_changed)
          ? s.summary_files_changed.join(' ').toLowerCase()
          : ''

        return title.includes(query) || whatWeDid.includes(query) || files.includes(query)
      })
    : bookmarkFilteredSessions

  // Apply multi-select filters (mood, complexity, status)
  const multiFilteredSessions = searchedSessions.filter((s: any) => {
    const moodMatch = selectedMoods.length === 0 || (s.summary_mood && selectedMoods.includes(s.summary_mood))
    const complexityMatch = selectedComplexity.length === 0 || (s.summary_complexity && selectedComplexity.includes(s.summary_complexity))
    const statusMatch = selectedStatus.length === 0 || selectedStatus.includes(s.status)

    // Technology filter - check file extensions
    let techMatch = true
    if (selectedTech.length > 0 && Array.isArray(s.summary_files_changed)) {
      techMatch = s.summary_files_changed.some((file: string) =>
        selectedTech.some(tech => file.endsWith(tech))
      )
    }

    return moodMatch && complexityMatch && statusMatch && techMatch
  })

  // Apply date range filter
  const dateFilteredSessions = (dateRange.start || dateRange.end)
    ? multiFilteredSessions.filter((s: any) => {
        const sessionDate = new Date(s.started_at * 1000)
        const startMatch = !dateRange.start || sessionDate >= dateRange.start
        const endMatch = !dateRange.end || sessionDate <= new Date(dateRange.end.getTime() + 86400000) // Add 1 day to include end date
        return startMatch && endMatch
      })
    : searchedSessions

  // Apply calendar date filter
  const calendarFilteredSessions = calendarSelectedDate
    ? dateFilteredSessions.filter((s: any) => {
        const sessionDate = new Date(s.started_at * 1000)
        return sessionDate.toDateString() === calendarSelectedDate.toDateString()
      })
    : dateFilteredSessions

  const totalFiles = new Set(
    parsed.flatMap((s: any) => Array.isArray(s.summary_files_changed) ? s.summary_files_changed : [])
  ).size

  const archivedCount = parsed.filter((s: any) => s.is_archived).length
  const bookmarkedCount = parsed.filter((s: any) => s.is_bookmarked).length

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end })
  }

  const handleViewToggle = (mode: 'card' | 'table' | 'timeline') => {
    setViewMode(mode)
    localStorage.setItem('sessionViewMode', mode)
  }

  const handleCalendarToggle = () => {
    const newValue = !showCalendar
    setShowCalendar(newValue)
    localStorage.setItem('showCalendar', String(newValue))
  }

  const handleAnalyticsToggle = () => {
    const newValue = !showAnalytics
    setShowAnalytics(newValue)
    localStorage.setItem('showAnalytics', String(newValue))
  }

  const handleCalendarDateClick = (date: Date) => {
    if (calendarSelectedDate && calendarSelectedDate.toDateString() === date.toDateString()) {
      // Clicking same date clears the filter
      setCalendarSelectedDate(null)
    } else {
      setCalendarSelectedDate(date)
    }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '100%', width: '100%' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
        <ArrowLeft size={13} /> Back to Projects
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{project.name}</h1>

        {project.git_remote && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
            <GitBranch size={12} />
            {project.git_remote.replace(/^https?:\/\//, '').replace(/\.git$/, '')}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          <FolderOpen size={12} />
          {project.root_path}
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[
            { label: 'Sessions', value: allSessions.length },
            { label: 'Files Changed', value: totalFiles },
            { label: 'Completed', value: allSessions.filter((s: any) => s.status === 'completed').length },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 16px',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleToggleSelectionMode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: selectionMode ? 'var(--accent)' : 'var(--surface2)',
              color: selectionMode ? 'white' : 'var(--text)',
              border: '1px solid',
              borderColor: selectionMode ? 'var(--accent)' : 'var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!selectionMode) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
              }
            }}
            onMouseLeave={e => {
              if (!selectionMode) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
              }
            }}
          >
            {selectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
            {selectionMode ? 'Exit Selection' : 'Select Sessions'}
          </button>

          {selectionMode && parsed.length > 0 && (
            <button
              onClick={handleSelectAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: 'var(--surface2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
            >
              {selectedSessions.size === filteredSessions.length ? 'Deselect All' : 'Select All'}
            </button>
          )}

          <Link
            to={`/project/${id}/memory`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
          >
            <Brain size={16} />
            View Memory
          </Link>

          <button
            onClick={() => handleResync(false)}
            disabled={resyncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: resyncing ? 'var(--surface)' : 'var(--surface2)',
              color: resyncing ? 'var(--text-muted)' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: resyncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!resyncing) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
              }
            }}
            onMouseLeave={e => {
              if (!resyncing) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
              }
            }}
          >
            <RefreshCw size={16} style={{ animation: resyncing ? 'spin 1s linear infinite' : 'none' }} />
            {resyncing ? 'Resyncing...' : 'Resync New'}
          </button>

          <button
            onClick={() => handleResync(true)}
            disabled={resyncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: resyncing ? 'var(--surface)' : 'var(--surface2)',
              color: resyncing ? 'var(--text-muted)' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: resyncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!resyncing) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
              }
            }}
            onMouseLeave={e => {
              if (!resyncing) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
              }
            }}
          >
            <RefreshCw size={16} style={{ animation: resyncing ? 'spin 1s linear infinite' : 'none' }} />
            {resyncing ? 'Resyncing...' : 'Force Resync All'}
          </button>

          <button
            onClick={handleConsolidate}
            disabled={consolidating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: consolidating ? 'var(--surface)' : 'var(--surface2)',
              color: consolidating ? 'var(--text-muted)' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: consolidating ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!consolidating) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
              }
            }}
            onMouseLeave={e => {
              if (!consolidating) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
              }
            }}
          >
            <RefreshCw size={16} style={{ animation: consolidating ? 'spin 1s linear infinite' : 'none' }} />
            {consolidating ? 'Consolidating...' : 'Consolidate Memory'}
          </button>

          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background: showArchived ? 'var(--accent)15' : 'var(--surface2)',
                color: showArchived ? 'var(--accent)' : 'var(--text)',
                border: '1px solid',
                borderColor: showArchived ? 'var(--accent)30' : 'var(--border)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {showArchived ? 'Hide Archived' : `Show Archived (${archivedCount})`}
            </button>
          )}

          {bookmarkedCount > 0 && (
            <button
              onClick={() => setShowBookmarked(!showBookmarked)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background: showBookmarked ? 'var(--accent)15' : 'var(--surface2)',
                color: showBookmarked ? 'var(--accent)' : 'var(--text)',
                border: '1px solid',
                borderColor: showBookmarked ? 'var(--accent)30' : 'var(--border)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {showBookmarked ? 'Show All' : `Show Bookmarked (${bookmarkedCount})`}
            </button>
          )}

          <button
            onClick={handleCalendarToggle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: showCalendar ? 'var(--accent)15' : 'var(--surface2)',
              color: showCalendar ? 'var(--accent)' : 'var(--text)',
              border: '1px solid',
              borderColor: showCalendar ? 'var(--accent)30' : 'var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!showCalendar) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
              }
            }}
            onMouseLeave={e => {
              if (!showCalendar) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
              }
            }}
          >
            <Calendar size={16} />
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </button>

          <button
            onClick={handleAnalyticsToggle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: showAnalytics ? 'var(--accent)15' : 'var(--surface2)',
              color: showAnalytics ? 'var(--accent)' : 'var(--text)',
              border: '1px solid',
              borderColor: showAnalytics ? 'var(--accent)30' : 'var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!showAnalytics) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
              }
            }}
            onMouseLeave={e => {
              if (!showAnalytics) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
              }
            }}
          >
            <BarChart3 size={16} />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>
      </div>

      {parsed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          No sessions recorded yet
        </div>
      ) : (
        <>
          <ProductivityWidget projectId={id!} />

          <StatsRow sessions={parsed} />

          {showAnalytics && (
            <AnalyticsDashboard sessions={parsed} />
          )}

          {showCalendar && (
            <CalendarView
              sessions={dateFilteredSessions}
              onDateClick={handleCalendarDateClick}
              selectedDate={calendarSelectedDate}
            />
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <SearchBar onSearch={setSearchQuery} placeholder="Search by title, content, or files..." />
            <DateRangePicker onDateRangeChange={handleDateRangeChange} />
            <MultiSelectFilter
              label="Mood"
              options={['productive', 'struggling', 'learning', 'blocked', 'flow']}
              selected={selectedMoods}
              onChange={setSelectedMoods}
              placeholder="Filter by mood"
            />
            <MultiSelectFilter
              label="Complexity"
              options={['simple', 'moderate', 'complex', 'very-complex']}
              selected={selectedComplexity}
              onChange={setSelectedComplexity}
              placeholder="Filter by complexity"
            />
            <MultiSelectFilter
              label="Status"
              options={['active', 'completed']}
              selected={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Filter by status"
            />
            <MultiSelectFilter
              label="Technology"
              options={['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs', '.md', '.json']}
              selected={selectedTech}
              onChange={setSelectedTech}
              placeholder="Filter by file type"
            />
            <div style={{ marginLeft: 'auto' }}>
              <ViewToggle viewMode={viewMode} onToggle={handleViewToggle} />
            </div>
          </div>

          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Sessions ({calendarFilteredSessions.length}{!showArchived && archivedCount > 0 ? ` • ${archivedCount} archived` : ''})
            {searchQuery && ` • Filtered by "${searchQuery}"`}
            {(dateRange.start || dateRange.end) && ` • Date filtered`}
            {calendarSelectedDate && ` • ${calendarFilteredSessions.length} on ${calendarSelectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {showBookmarked && ` • Bookmarked only`}
          </h2>
          {calendarFilteredSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No sessions match your filters
            </div>
          ) : viewMode === 'table' ? (
            <TableView
              sessions={calendarFilteredSessions}
              selectionMode={selectionMode}
              selectedSessions={selectedSessions}
              onSelectionChange={handleSessionSelectionChange}
            />
          ) : viewMode === 'timeline' ? (
            <TimelineView
              sessions={calendarFilteredSessions}
              selectionMode={selectionMode}
              selectedSessions={selectedSessions}
              onSelectionChange={handleSessionSelectionChange}
            />
          ) : (
            calendarFilteredSessions.map((s: any) => (
              <SessionCard
                key={s.id}
                session={s}
                onSessionUpdated={refetchSessions}
                selectionMode={selectionMode}
                selected={selectedSessions.has(s.id)}
                onSelectionChange={(selected) => handleSessionSelectionChange(s.id, selected)}
              />
            ))
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <BulkActionsBar
        selectedCount={selectedSessions.size}
        onBulkDelete={handleBulkDelete}
        onBulkBookmark={handleBulkBookmark}
        onBulkTag={handleBulkTag}
        onBulkExport={handleBulkExport}
        onClearSelection={() => {
          setSelectedSessions(new Set())
          setSelectionMode(false)
        }}
      />

      <BulkTagModal
        isOpen={showBulkTagModal}
        sessionIds={Array.from(selectedSessions)}
        onClose={() => setShowBulkTagModal(false)}
        onComplete={handleBulkTagComplete}
      />
    </div>
  )
}

function tryParse(val: any): any {
  if (!val || Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return null }
}
