import { Link2, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from './Toast'

interface Props {
  sessionId: string
}

export default function ShareLinkButton({ sessionId }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/session/${sessionId}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <button
      onClick={handleCopyLink}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        background: copied ? 'var(--green)15' : 'var(--accent)15',
        color: copied ? 'var(--green)' : 'var(--accent)',
        border: '1px solid',
        borderColor: copied ? 'var(--green)30' : 'var(--accent)30',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        if (!copied) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)25'
        }
      }}
      onMouseLeave={e => {
        if (!copied) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)15'
        }
      }}
    >
      {copied ? <Check size={16} /> : <Link2 size={16} />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  )
}
