export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
    >
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="50" cy="50" r="45" fill="url(#grad)"/>

      {/* Memory chip icon */}
      <rect x="30" y="30" width="40" height="40" rx="4" fill="white" opacity="0.9"/>

      {/* Circuit lines */}
      <line x1="35" y1="40" x2="65" y2="40" stroke="#8B5CF6" strokeWidth="2"/>
      <line x1="35" y1="50" x2="65" y2="50" stroke="#8B5CF6" strokeWidth="2"/>
      <line x1="35" y1="60" x2="65" y2="60" stroke="#8B5CF6" strokeWidth="2"/>

      {/* Dots */}
      <circle cx="40" cy="40" r="2" fill="#EC4899"/>
      <circle cx="50" cy="50" r="2" fill="#EC4899"/>
      <circle cx="60" cy="60" r="2" fill="#EC4899"/>
    </svg>
  )
}
