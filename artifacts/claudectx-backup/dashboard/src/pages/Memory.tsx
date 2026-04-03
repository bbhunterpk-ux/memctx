import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { Brain, BookOpen, Lightbulb, CheckSquare, Users, TrendingUp } from 'lucide-react'

export default function Memory() {
  const { id: projectId } = useParams<{ id: string }>()

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

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={24} color="var(--accent)" />
          Memory System
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Accumulated knowledge, preferences, patterns, and tasks across all sessions
        </p>
      </div>

      {!hasData ? (
        <EmptyMemoryState />
      ) : (
        <>
          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
            <StatCard icon={<TrendingUp size={18} />} label="Preferences" value={stats.total_preferences} color="#3b82f6" />
            <StatCard icon={<BookOpen size={18} />} label="Knowledge" value={stats.total_knowledge} color="#8b5cf6" />
            <StatCard icon={<Lightbulb size={18} />} label="Patterns" value={stats.total_patterns} color="#f59e0b" />
            <StatCard icon={<CheckSquare size={18} />} label="Tasks" value={stats.total_tasks} color="#10b981" />
            <StatCard icon={<Users size={18} />} label="Contacts" value={stats.total_contacts} color="#ec4899" />
          </div>

          {/* Preferences */}
          {memory.preferences && memory.preferences.length > 0 && (
            <Section title="Your Preferences" icon={<TrendingUp size={20} color="#3b82f6" />}>
              <div style={{ display: 'grid', gap: 10 }}>
                {memory.preferences.map((pref: any) => (
                  <PreferenceCard key={pref.id} pref={pref} />
                ))}
              </div>
            </Section>
          )}

          {/* Knowledge */}
          {memory.knowledge && memory.knowledge.length > 0 && (
            <Section title="Domain Knowledge" icon={<BookOpen size={20} color="#8b5cf6" />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {memory.knowledge.map((k: any) => (
                  <KnowledgeCard key={k.id} knowledge={k} />
                ))}
              </div>
            </Section>
          )}

          {/* Patterns */}
          {memory.patterns && memory.patterns.length > 0 && (
            <Section title="Learned Patterns" icon={<Lightbulb size={20} color="#f59e0b" />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {memory.patterns.map((p: any) => (
                  <PatternCard key={p.id} pattern={p} />
                ))}
              </div>
            </Section>
          )}

          {/* Tasks */}
          {memory.tasks && memory.tasks.length > 0 && (
            <Section title="Pending Tasks" icon={<CheckSquare size={20} color="#10b981" />}>
              <div style={{ display: 'grid', gap: 10 }}>
                {memory.tasks.map((t: any) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </Section>
          )}

          {/* Contacts */}
          {memory.contacts && memory.contacts.length > 0 && (
            <Section title="Contacts" icon={<Users size={20} color="#ec4899" />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {memory.contacts.map((c: any) => (
                  <ContactCard key={c.id} contact={c} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {title}
      </h2>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function PreferenceCard({ pref }: { pref: any }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
          {pref.key}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {pref.category}
        </div>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text)' }}>
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
      borderRadius: 10,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{knowledge.topic}</div>
        <div style={{
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 6,
          background: 'var(--accent-bg)',
          color: 'var(--accent)',
          fontWeight: 600,
        }}>
          {knowledge.category}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {knowledge.content}
      </div>
      {knowledge.confidence && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${knowledge.confidence * 100}%`,
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
      borderRadius: 10,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{pattern.title}</div>
        <div style={{
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 6,
          background: 'var(--accent-bg)',
          color: 'var(--accent)',
          fontWeight: 600,
        }}>
          {pattern.pattern_type}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
        {pattern.description}
      </div>
      {(pattern.success_count > 0 || pattern.failure_count > 0) && (
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>✓ {pattern.success_count} success</span>
          {pattern.failure_count > 0 && <span>✗ {pattern.failure_count} failed</span>}
        </div>
      )}
    </div>
  )
}

function TaskCard({ task }: { task: any }) {
  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#6b7280',
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: priorityColors[task.priority] || '#6b7280',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {task.description}
          </div>
        )}
      </div>
      <div style={{
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 6,
        background: 'var(--accent-bg)',
        color: 'var(--accent)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {task.priority}
      </div>
    </div>
  )
}

function ContactCard({ contact }: { contact: any }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
        {contact.name}
      </div>
      {contact.role && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          {contact.role}
        </div>
      )}
      <div style={{
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 6,
        background: 'var(--accent-bg)',
        color: 'var(--accent)',
        fontWeight: 600,
        display: 'inline-block',
      }}>
        {contact.type}
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
      border: '1px solid var(--border)',
      borderRadius: 12,
    }}>
      <Brain size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No Memory Data Yet</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 400, margin: '0 auto' }}>
        Memory is extracted from session summaries. Complete a few sessions and the system will start learning your preferences, patterns, and knowledge.
      </p>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading memory...</div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 8 }}>Failed to load memory</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{message}</div>
    </div>
  )
}
