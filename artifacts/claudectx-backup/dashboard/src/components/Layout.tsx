import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { FolderOpen, Search, Radio, Activity, Zap } from 'lucide-react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  })

  const nav = [
    { path: '/', icon: FolderOpen, label: 'Projects' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/live', icon: Radio, label: 'Live' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>ClaudeContext</span>
          </div>
          <div style={{
            marginTop: 8,
            fontSize: 11,
            color: health?.status === 'ok' ? 'var(--green)' : 'var(--red)',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: health?.status === 'ok' ? 'var(--green)' : 'var(--red)',
              display: 'inline-block'
            }} />
            {health?.status === 'ok' ? 'Worker online' : 'Connecting...'}
          </div>
        </div>

        <nav style={{ padding: '8px 8px', flex: 1 }}>
          {nav.map(({ path, icon: Icon, label }) => {
            const active = loc.pathname === path || (path !== '/' && loc.pathname.startsWith(path))
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginBottom: 2,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'var(--surface2)' : 'transparent',
                  transition: 'all 0.15s',
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        {health && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.8
          }}>
            <div>DB: {health.db}</div>
            <div>AI: {health.api_key ? 'enabled' : 'no key'}</div>
            <div>Queue: {health.queue_size ?? 0} pending</div>
            <div>v{health.version}</div>
          </div>
        )}
      </aside>

      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
