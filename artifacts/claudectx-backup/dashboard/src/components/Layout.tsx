import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { FolderOpen, Search, Radio, Activity, Zap, Brain, BarChart3, FileText, Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  })

  const nav = [
    { path: '/', icon: FolderOpen, label: 'Projects' },
    { path: '/memory', icon: Brain, label: 'Memory' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/live', icon: Radio, label: 'Live' },
    { path: '/metrics', icon: BarChart3, label: 'Metrics' },
    { path: '/logs', icon: FileText, label: 'Logs' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1001,
          display: 'none',
          padding: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text)',
          cursor: 'pointer',
        }}
        className="mobile-only"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'none',
          }}
          className="mobile-only"
        />
      )}

      <aside style={{
        width: 240,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 1000,
        transition: 'left 0.3s ease',
      }}
      className="sidebar"
      >
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={22} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>ClaudeContext</span>
          </div>
          <div style={{
            marginTop: 10,
            fontSize: 12,
            color: health?.status === 'ok' ? 'var(--green)' : 'var(--red)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: health?.status === 'ok' ? 'var(--green)' : 'var(--red)',
              display: 'inline-block'
            }} />
            {health?.status === 'ok' ? 'Worker online' : 'Connecting...'}
          </div>
        </div>

        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {nav.map(({ path, icon: Icon, label }) => {
            const active = loc.pathname === path || (path !== '/' && loc.pathname.startsWith(path))
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 4,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'var(--surface2)' : 'transparent',
                  transition: 'all 0.15s',
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          <ThemeToggle />
          {health && (
            <div style={{
              marginTop: 16,
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.8
            }}>
              <div>DB: {health.db}</div>
              <div>AI: {health.api_key ? 'enabled' : 'no key'}</div>
              <div>Queue: {health.queue_size ?? 0} pending</div>
              <div>v{health.version}</div>
            </div>
          )}
        </div>
      </aside>

      <main style={{
        flex: 1,
        overflow: 'auto',
        minWidth: 0,
        marginLeft: 240,
        transition: 'margin-left 0.3s ease',
      }}
      className="main-content"
      >
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-only {
            display: block !important;
          }
          .sidebar {
            left: ${mobileMenuOpen ? '0' : '-240px'} !important;
          }
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
