export default function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
      animation: 'fadeIn 0.3s',
    }}>
      <div style={{
        height: 20,
        width: '60%',
        background: 'var(--surface2)',
        borderRadius: 4,
        marginBottom: 12,
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{
        height: 14,
        width: '40%',
        background: 'var(--surface2)',
        borderRadius: 4,
        marginBottom: 16,
        animation: 'pulse 1.5s ease-in-out infinite',
        animationDelay: '0.1s',
      }} />
      <div style={{
        height: 14,
        width: '80%',
        background: 'var(--surface2)',
        borderRadius: 4,
        marginBottom: 8,
        animation: 'pulse 1.5s ease-in-out infinite',
        animationDelay: '0.2s',
      }} />
      <div style={{
        height: 14,
        width: '70%',
        background: 'var(--surface2)',
        borderRadius: 4,
        animation: 'pulse 1.5s ease-in-out infinite',
        animationDelay: '0.3s',
      }} />
    </div>
  )
}
