export default function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
          animation: 'fadeIn 0.3s',
          animationDelay: `${i * 0.1}s`,
        }}>
          <div style={{
            height: 16,
            width: '50%',
            background: 'var(--surface2)',
            borderRadius: 4,
            marginBottom: 10,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{
            height: 12,
            width: '30%',
            background: 'var(--surface2)',
            borderRadius: 4,
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.1s',
          }} />
        </div>
      ))}
    </div>
  )
}
