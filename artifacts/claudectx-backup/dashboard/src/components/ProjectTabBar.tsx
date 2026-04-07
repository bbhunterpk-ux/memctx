import { X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface OpenTab {
  id: string
  name: string
  type: 'project' | 'session'
  projectId?: string // For sessions, to know which project they belong to
}

interface Props {
  openTabs: OpenTab[]
  onCloseTab: (id: string) => void
}

export default function ProjectTabBar({ openTabs, onCloseTab }: Props) {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active tab from current URL
  const activeTabId = location.pathname.match(/\/(project|session)\/([^/]+)/)?.[2]

  if (openTabs.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 240,
      right: 0,
      height: 48,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '0 12px',
      overflowX: 'auto',
      overflowY: 'hidden',
      zIndex: 100,
      scrollbarWidth: 'thin'
    }}>
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTabId

        return (
          <div
            key={tab.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: isActive ? 'var(--surface2)' : 'transparent',
              border: '1px solid',
              borderColor: isActive ? 'var(--accent)' : 'var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 120,
              maxWidth: 200,
              whiteSpace: 'nowrap'
            }}
            onClick={() => navigate(`/${tab.type}/${tab.id}`)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--surface2)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <span style={{
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--accent)' : 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1
            }}>
              {tab.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(tab.id)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--red)20'
                e.currentTarget.style.color = 'var(--red)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
