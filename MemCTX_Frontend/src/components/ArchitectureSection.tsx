import { useScrollReveal } from "@/hooks/useScrollReveal";

const ArchitectureSection = () => {
  const ref = useScrollReveal();
  const diagramRef = useScrollReveal();

  return (
    <section id="architecture" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/3 blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        <div ref={ref} className="reveal-up text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full border border-accent/30 text-accent mb-4">
            Architecture
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Built for reliability & speed</h2>
          <p className="text-muted-foreground leading-relaxed">
            Three-layer architecture: Claude Code hooks → Background Worker with AI summarization → Web Dashboard for visualization.
          </p>
        </div>

        <div ref={diagramRef} className="reveal-scale max-w-4xl mx-auto">
          <ArchitectureDiagram />
        </div>
      </div>
    </section>
  );
};

function ArchitectureDiagram() {
  return (
    <div className="gradient-border p-8 md:p-12">
      <svg viewBox="0 0 800 420" className="w-full" fill="none">
        <defs>
          <linearGradient id="archGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(217,91%,60%)" />
            <stop offset="100%" stopColor="hsl(190,95%,55%)" />
          </linearGradient>
          <linearGradient id="archGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(217,91%,60%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(190,95%,55%)" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Claude Code Layer */}
        <rect x="200" y="20" width="400" height="70" rx="12" fill="hsl(228,14%,10%)" stroke="url(#archGrad1)" strokeWidth="1.5" />
        <text x="400" y="48" textAnchor="middle" fill="hsl(210,20%,95%)" fontSize="14" fontWeight="600" fontFamily="Inter">Claude Code</text>
        <text x="400" y="68" textAnchor="middle" fill="hsl(215,15%,55%)" fontSize="11" fontFamily="Inter">(SessionStart Hook)</text>

        {/* Arrow */}
        <line x1="400" y1="90" x2="400" y2="130" stroke="url(#archGrad1)" strokeWidth="2" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite" />
        </line>
        <polygon points="394,128 406,128 400,140" fill="hsl(217,91%,60%)" />

        {/* Worker Layer */}
        <rect x="60" y="145" width="680" height="160" rx="16" fill="hsl(228,14%,8%)" stroke="hsl(228,14%,18%)" strokeWidth="1" />
        <text x="400" y="170" textAnchor="middle" fill="hsl(215,15%,55%)" fontSize="11" fontFamily="Inter" fontWeight="500">BACKGROUND WORKER</text>

        {/* Worker boxes */}
        {[
          { x: 100, label: "Session", sublabel: "Tracker", icon: "📡" },
          { x: 320, label: "AI", sublabel: "Summarizer", icon: "🧠" },
          { x: 540, label: "Database", sublabel: "Manager", icon: "💾" },
        ].map((box, i) => (
          <g key={i}>
            <rect x={box.x} y="190" width="160" height="65" rx="10" fill="hsl(228,14%,12%)" stroke="url(#archGrad2)" strokeWidth="1" />
            <text x={box.x + 80} y="215" textAnchor="middle" fill="hsl(210,20%,95%)" fontSize="12" fontWeight="500" fontFamily="Inter">
              {box.icon} {box.label}
            </text>
            <text x={box.x + 80} y="235" textAnchor="middle" fill="hsl(215,15%,55%)" fontSize="11" fontFamily="Inter">{box.sublabel}</text>
            {i < 2 && (
              <>
                <line x1={box.x + 160} y1="222" x2={box.x + 160 + (i === 0 ? 60 : 60)} y2="222" stroke="url(#archGrad1)" strokeWidth="1.5" filter="url(#glow)">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
                </line>
                <polygon points={`${box.x + 160 + (i === 0 ? 55 : 55)},218 ${box.x + 160 + (i === 0 ? 55 : 55)},226 ${box.x + 160 + (i === 0 ? 62 : 62)},222`} fill="hsl(217,91%,60%)" opacity="0.8" />
              </>
            )}
          </g>
        ))}

        {/* REST API */}
        <rect x="180" y="270" width="440" height="25" rx="6" fill="hsl(228,14%,12%)" stroke="hsl(228,14%,18%)" strokeWidth="0.5" />
        <text x="400" y="287" textAnchor="middle" fill="hsl(215,15%,55%)" fontSize="10" fontFamily="Inter">REST API Server — localhost:9999</text>

        {/* Arrow to Dashboard */}
        <line x1="400" y1="305" x2="400" y2="340" stroke="url(#archGrad1)" strokeWidth="2" strokeDasharray="4 4">
          <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite" />
        </line>
        <polygon points="394,338 406,338 400,350" fill="hsl(190,95%,55%)" />

        {/* Dashboard */}
        <rect x="200" y="355" width="400" height="50" rx="12" fill="hsl(228,14%,10%)" stroke="hsl(190,95%,55%)" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="400" y="385" textAnchor="middle" fill="hsl(190,95%,55%)" fontSize="14" fontWeight="600" fontFamily="Inter">🖥 Web Dashboard</text>
      </svg>
    </div>
  );
}

export default ArchitectureSection;
