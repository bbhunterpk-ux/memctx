import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Brain, BookOpen, Lightbulb, CheckSquare, Users, TrendingUp, ArrowLeft, LayoutGrid } from 'lucide-react'

export default function Memory() {
  const { id: projectId } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: memory, isLoading, error } = useQuery({
    queryKey: ['memory', projectId],
    queryFn: () => api.getMemory(projectId!),
    refetchInterval: 15000,
    enabled: !!projectId,
  })

  if (isLoading) return <Loading />
  if (error) return <ErrorState message={String(error)} />

  const stats = memory?.stats || {}
  const hasData = stats.total_preferences > 0 || stats.total_knowledge > 0 ||
                  stats.total_patterns > 0 || stats.total_tasks > 0 || stats.total_contacts > 0

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid size={16} /> },
    { id: 'preferences', label: 'Preferences', icon: <TrendingUp size={16} />, count: memory?.preferences?.length || 0 },
    { id: 'knowledge', label: 'Knowledge', icon: <BookOpen size={16} />, count: memory?.knowledge?.length || 0 },
    { id: 'patterns', label: 'Patterns', icon: <Lightbulb size={16} />, count: memory?.patterns?.length || 0 },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} />, count: memory?.tasks?.length || 0 },
    { id: 'contacts', label: 'Contacts', icon: <Users size={16} />, count: memory?.contacts?.length || 0 },
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
      <Link
        to={`/project/${projectId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }}
        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text)'}
        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={14} /> Back to Project Home
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, letterSpacing: '-0.5px' }}>
            <div style={{ padding: 8, background: 'var(--accent)15', borderRadius: 12 }}>
              <Brain size={28} color="var(--accent)" />
            </div>
            Core Memory Bank
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 600, lineHeight: 1.5 }}>
            A persistent, cross-session intelligence layer. Claude learns and evolves your project constraints, patterns, and architectural mandates autonomously.
          </p>
        </div>
      </div>

      {!hasData ? (
        <EmptyMemoryState />
      ) : (
        <>
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            borderBottom: '1px solid var(--border)', 
            paddingBottom: 16, 
            marginBottom: 32,
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: activeTab === tab.id ? 'var(--surface-active, rgba(120, 120, 120, 0.1))' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span style={{
                    background: activeTab === tab.id ? 'var(--accent)' : 'var(--border)',
                    color: activeTab === tab.id ? '#fff' : 'inherit',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    marginLeft: 4,
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <StatCard icon={<TrendingUp size={22} />} label="Active Preferences" value={stats.total_preferences} color="var(--blue)" desc="Stored user constraints" />
                <StatCard icon={<BookOpen size={22} />} label="Domain Knowledge" value={stats.total_knowledge} color="var(--accent)" desc="Architectural facts" />
                <StatCard icon={<Lightbulb size={22} />} label="Learned Patterns" value={stats.total_patterns} color="var(--orange)" desc="Recurring solutions" />
                <StatCard icon={<CheckSquare size={22} />} label="Pending Tasks" value={stats.total_tasks} color="var(--green)" desc="Identified global debt" />
                <StatCard icon={<Users size={22} />} label="Key Contacts" value={stats.total_contacts} color="var(--red)" desc="Project stakeholders" />
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
                {memory.preferences?.map((pref: any) => (
                  <PreferenceCard key={pref.id} pref={pref} />
                ))}
              </div>
            )}

            {/* KNOWLEDGE TAB */}
            {activeTab === 'knowledge' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
                {memory.knowledge?.map((k: any) => (
                  <KnowledgeCard key={k.id} knowledge={k} />
                ))}
              </div>
            )}

            {/* PATTERNS TAB */}
            {activeTab === 'patterns' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
                {memory.patterns?.map((p: any) => (
                  <PatternCard key={p.id} pattern={p} />
                ))}
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
                {memory.tasks?.map((t: any) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            )}

            {/* CONTACTS TAB */}
            {activeTab === 'contacts' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {memory.contacts?.map((c: any) => (
                  <ContactCard key={c.id} contact={c} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function StatCard({ icon, label, value, color, desc }: { icon: React.ReactNode; label: string; value: number; color: string; desc: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '24px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color }}>
        <div style={{ padding: 8, background: `${color}15`, borderRadius: 10 }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 4, letterSpacing: '-1px' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</div>
    </div>
  )
}

function PreferenceCard({ pref }: { pref: any }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
          {pref.key}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
          {pref.category}
        </div>
      </div>
      <div style={{ fontSize: 14, color: 'var(--blue)', fontWeight: 600, background: 'var(--blue)10', padding: '6px 12px', borderRadius: 8 }}>
        {pref.value}
      </div>
    </div>
  )
}

function KnowledgeCard({ knowledge }: { knowledge: any }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{knowledge.topic}</div>
        <div style={{
          fontSize: 10,
          padding: '4px 10px',
          borderRadius: 8,
          background: 'var(--accent)15',
          color: 'var(--accent)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          flexShrink: 0,
        }}>
          {knowledge.category}
        </div>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>
        {knowledge.content}
      </div>
      {knowledge.confidence && (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)50' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Confidence</span>
          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${knowledge.confidence * 100}%`,
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 3,
            }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
            {Math.round(knowledge.confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

function PatternCard({ pattern }: { pattern: any }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{pattern.title}</div>
        <div style={{
          fontSize: 10,
          padding: '4px 10px',
          borderRadius: 8,
          background: 'var(--orange)15',
          color: 'var(--orange)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {pattern.pattern_type}
        </div>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
        {pattern.description}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--green)10', padding: '4px 10px', borderRadius: 6 }}>
          ✓ {pattern.success_count} successes
        </span>
        {pattern.failure_count > 0 && (
          <span style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--red)10', padding: '4px 10px', borderRadius: 6 }}>
            ✗ {pattern.failure_count} failures
          </span>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: any }) {
  const priorityStyles: Record<string, { color: string, bg: string }> = {
    urgent: { color: 'var(--red)', bg: 'var(--red)15' },
    high: { color: 'var(--orange)', bg: 'var(--orange)15' },
    medium: { color: 'var(--blue)', bg: 'var(--blue)15' },
    low: { color: 'var(--text-muted)', bg: 'var(--border)' },
  }

  const style = priorityStyles[task.priority] || priorityStyles.low

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
    }}>
      <div style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: style.color,
        flexShrink: 0,
        marginTop: 6
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
            {task.description}
          </div>
        )}
        <div style={{
          display: 'inline-block',
          fontSize: 10,
          padding: '4px 10px',
          borderRadius: 6,
          background: style.bg,
          color: style.color,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {task.priority} priority
        </div>
      </div>
    </div>
  )
}

function ContactCard({ contact }: { contact: any }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        background: 'var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontWeight: 700,
        fontSize: 18
      }}>
        {contact.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
          {contact.name}
        </div>
        {contact.role && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
            {contact.role}
          </div>
        )}
        <div style={{
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 6,
          background: 'var(--red)15',
          color: 'var(--red)',
          fontWeight: 700,
          display: 'inline-block',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {contact.type}
        </div>
      </div>
    </div>
  )
}

function EmptyMemoryState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '80px 20px',
      background: 'var(--surface)',
      border: '1px dashed var(--border)',
      borderRadius: 16,
    }}>
      <div style={{ background: 'var(--border)', width: 80, height: 80, borderRadius: 40, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Brain size={40} color="var(--text-muted)" style={{ opacity: 0.6 }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Memory Bank Empty</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 450, margin: '0 auto', lineHeight: 1.6 }}>
        Your memory bank will populate automatically as you complete sessions. Claude will begin extracting domain knowledge, core patterns, and specific architecture dependencies over time.
      </p>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Accessing Local Store...</div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ background: 'var(--red)15', padding: 24, borderRadius: 16, display: 'inline-block' }}>
        <div style={{ fontSize: 16, color: 'var(--red)', fontWeight: 700, marginBottom: 8 }}>Memory Fetch Failed</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{message}</div>
      </div>
    </div>
  )
}
