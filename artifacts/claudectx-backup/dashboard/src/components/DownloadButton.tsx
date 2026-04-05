import { Download } from 'lucide-react'

interface Props {
  text: string
  filename: string
  label?: string
}

export default function DownloadButton({ text, filename, label = 'Download' }: Props) {
  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: 'var(--surface2)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)15'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)30'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--blue)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
      }}
    >
      <Download size={13} />
      {label}
    </button>
  )
}
