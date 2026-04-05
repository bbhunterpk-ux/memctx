import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import SearchBar from '../components/SearchBar'
import { format } from 'date-fns'
import { FileSearch } from 'lucide-react'

export default function Search() {
  const [query, setQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  })

  const { data: results, isLoading, isFetching } = useQuery({
    queryKey: ['search', query, selectedProject],
    queryFn: () => api.search(query, selectedProject || undefined),
    enabled: query.length >= 2,
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: '100%', width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Search</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Full-text search across all session observations
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            onSearch={setQuery}
            placeholder="Search sessions, decisions, file paths..."
            autoFocus
          />
        </div>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          style={{
            padding: '10px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text)',
            fontSize: 13,
            outline: 'none',
            minWidth: 140,
          }}
        >
          <option value="">All Projects</option>
          {projects?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {query.length < 2 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <FileSearch size={36} color="var(--border)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14 }}>Type at least 2 characters to search</div>
        </div>
      )}

      {isLoading && query.length >= 2 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>Searching...</div>
      )}

      {results?.results && (
        <>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            {results.results.length} result{results.results.length !== 1 ? 's' : ''} for "{query}"
          </div>

          {results.results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No results found
            </div>
          ) : (
            results.results.map((r: any) => (
              <Link key={r.observation_id} to={`/session/${r.session_id}`} style={{ display: 'block' }}>
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                      {r.project_name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {r.created_at ? format(new Date(r.created_at * 1000), 'MMM d, yyyy') : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                    {r.content}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {r.session_title || `Session ${r.session_id?.slice(0, 8)}`}
                  </div>
                </div>
              </Link>
            ))
          )}
        </>
      )}
    </div>
  )
}
