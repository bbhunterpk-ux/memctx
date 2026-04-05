import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import { Brain, BookOpen, Lightbulb, CheckSquare, Users, TrendingUp, ArrowLeft } from 'lucide-react'

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
    <div style={{ padding: '28px 32px', maxWidth: '100%', width: '100%' }}>
      <Link
        to={`/project/${projectId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back to Project
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Brain size={28} color="var(--accent)" />
          Memory System
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          Accumulated knowledge, preferences, patterns, and tasks across all sessions
        </p>
      </div>

      {!hasData ? (
        <EmptyMemoryState />
      ) : (
        <>
          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 40 }}>
            <StatCard icon={<TrendingUp size={20} />} label="Preferences" value={stats.total_preferences} color="var(--blue)" />
            <StatCard icon={<BookOpen size={20} />} label="Knowledge" value={stats.total_knowledge} color="var(--accent)" />
            <StatCard icon={<Lightbulb size={20} />} label="Patterns" value={stats.total_patterns} color="var(--orange)" />
            <StatCard icon={<CheckSquare size={20} />} label="Tasks" value={stats.total_tasks} color="var(--green)" />
            <StatCard icon={<Users size={20} />} label="Contacts" value={stats.total_contacts} color="var(--red)" />
          </div>

          {/* Preferences */}
          {memory.preferences && memory.preferences.length > 0 && (
            <Section title="Your Preferences" icon={<TrendingUp size={20} color="var(--blue)" />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {memory.preferences.map((pref: any) => (
                  <PreferenceCard key={pref.id} pref={pref} />
                ))}
              </div>
            </Section>
          )}

          {/* Knowledge */}
          {memory.knowledge && memory.knowledge.length > 0 && (
            <Section title="Domain Knowledge" icon={<BookOpen size={20} color="var(--accent)" />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {memory.knowledge.map((k: any) => (
                  <KnowledgeCard key={k.id} knowledge={k} />
                ))}
              </div>
            </Section>
          )}

          {/* Patterns */}
          {memory.patterns && memory.patterns.length > 0 && (
            <Section title="Learned Patterns" icon={<Lightbulb size={20} color="var(--orange)" />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {memory.patterns.map((p: any) => (
                  <PatternCard key={p.id} pattern={p} />
                ))}
              </div>
            </Section>
          )}

          {/* Tasks */}
          {memory.tasks && memory.tasks.length > 0 && (
            <Section title="Pending Tasks" icon={<CheckSquare size={20} color="var(--green)" />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {memory.tasks.map((t: any) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </Section>
          )}

          {/* Contacts */}
          {memory.contacts && memory.contacts.length > 0 && (
            <Section title="Contacts" icon={<Users size={20} color="var(--red)" />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
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
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
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
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, color }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function PreferenceCard({ pref }: { pref: any }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px 18px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          {pref.key}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {pref.category}
        </div>
      </div>
      <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500 }}>
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
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{knowledge.topic}</div>
        <div style={{
          fontSize: 10,
          padding: '3px 10px',
          borderRadius: 6,
          background: 'var(--accent)15',
          color: 'var(--accent)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {knowledge.category}
        </div>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {knowledge.content}
      </div>
      {knowledge.confidence && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${knowledge.confidence * 100}%`,
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
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
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{pattern.title}</div>
        <div style={{
          fontSize: 10,
          padding: '3px 10px',
          borderRadius: 6,
          background: 'var(--orange)15',
          color: 'var(--orange)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {pattern.pattern_type}
        </div>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
        {pattern.description}
      </div>
      {(pattern.success_count > 0 || pattern.failure_count > 0) && (
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--green)' }}>✓ {pattern.success_count} success</span>
          {pattern.failure_count > 0 && <span style={{ color: 'var(--red)' }}>✗ {pattern.failure_count} failed</span>}
        </div>
      )}
    </div>
  )
}

function TaskCard({ task }: { task: any }) {
  const priorityColors: Record<string, string> = {
    urgent: 'var(--red)',
    high: 'var(--orange)',
    medium: 'var(--blue)',
    low: 'var(--text-muted)',
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: priorityColors[task.priority] || 'var(--text-muted)',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {task.description}
          </div>
        )}
      </div>
      <div style={{
        fontSize: 11,
        padding: '5px 12px',
        borderRadius: 6,
        background: `${priorityColors[task.priority] || 'var(--text-muted)'}15`,
        color: priorityColors[task.priority] || 'var(--text-muted)',
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
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
        {contact.name}
      </div>
      {contact.role && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
          {contact.role}
        </div>
      )}
      <div style={{
        fontSize: 10,
        padding: '3px 10px',
        borderRadius: 6,
        background: 'var(--red)15',
        color: 'var(--red)',
        fontWeight: 600,
        display: 'inline-block',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
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
