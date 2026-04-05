import { CheckCircle2, GitBranch, FileText, ArrowRight, AlertTriangle, Code2 } from 'lucide-react'

interface Props {
  summary_what_we_did?: string[]
  summary_decisions?: string[]
  summary_files_changed?: string[]
  summary_next_steps?: string[]
  summary_gotchas?: string[]
  summary_tech_notes?: string[]
}

function Panel({ icon: Icon, title, items, color }: {
  icon: any
  title: string
  items?: string[]
  color: string
}) {
  if (!items || items.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{
            padding: '4px 0',
            fontSize: 13,
            color: 'var(--text)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ color: color, marginTop: 2, flexShrink: 0 }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function SummaryView(props: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
    }}>
      <Panel icon={CheckCircle2} title="What We Did" items={props.summary_what_we_did} color="var(--green)" />
      <Panel icon={GitBranch} title="Decisions Made" items={props.summary_decisions} color="var(--accent)" />
      <Panel icon={FileText} title="Files Changed" items={props.summary_files_changed} color="var(--blue)" />
      <Panel icon={ArrowRight} title="Next Steps" items={props.summary_next_steps} color="var(--yellow)" />
      <Panel icon={AlertTriangle} title="Gotchas" items={props.summary_gotchas} color="var(--red)" />
      <Panel icon={Code2} title="Tech Notes" items={props.summary_tech_notes} color="var(--text-muted)" />
    </div>
  )
}
