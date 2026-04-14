const sessions = [
  {
    title: "Implemented Rate Limiter Middleware",
    desc: "Added sliding window rate limiter with Redis backend",
    insight: "Redis MULTI/EXEC is essential for atomic rate limit checks in distributed systems",
    tags: ["Aha! x2", "Tech Debt"],
    momentum: 92,
    frustration: 8,
    productivity: 95,
    mood: "Focused and methodical, clean implementation with comprehensive edge case handling",
    time: "45m",
    complexity: "moderate",
    calls: 89,
    files: 6,
    status: "COMPLETED",
  },
  {
    title: "Fixed WebSocket Reconnection Logic",
    desc: "Resolved connection drops during server restarts",
    insight: "Exponential backoff with jitter prevents thundering herd on reconnect",
    tags: ["Tech Debt"],
    momentum: 78,
    frustration: 22,
    productivity: 88,
    mood: "Initial frustration with timing issues, resolved with systematic debugging approach",
    time: "1h 12m",
    complexity: "complex",
    calls: 134,
    files: 4,
    status: "COMPLETED",
  },
  {
    title: "Database Schema Migration v3",
    desc: "Added indexes and denormalized hot paths",
    insight: "Composite indexes on (tenant_id, created_at) reduced p99 query time by 73%",
    tags: ["Aha! x3", "Tech Debt"],
    momentum: 95,
    frustration: 5,
    productivity: 97,
    mood: "Highly productive, systematic approach with measurable performance gains",
    time: "38m",
    complexity: "simple",
    calls: 52,
    files: 3,
    status: "COMPLETED",
  },
];

const SessionCardsMockup = () => (
  <div className="w-full rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono ml-2">MemCTX — Sessions</span>
    </div>

    <div className="p-4">
      <div className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider">Sessions (34 • 2 Archived)</div>

      <div className="space-y-3">
        {sessions.map((s, i) => (
          <div key={i} className="rounded-lg border border-border bg-secondary/20 p-3 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <div className="text-[11px] font-semibold text-foreground">{s.title}</div>
                <div className="text-[9px] text-muted-foreground">{s.desc}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[8px] px-2 py-0.5 rounded border border-primary/30 text-primary">Resync</span>
                <span className="text-[8px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">{s.status}</span>
              </div>
            </div>

            <div className="text-[8px] text-accent mb-2">✦ {s.insight}</div>

            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {s.tags.map((t) => (
                <span key={t} className="text-[7px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
              ))}
              <span className="text-[7px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">⚡ Momentum: {s.momentum}</span>
              <span className="text-[7px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">● Frustration: {s.frustration}</span>
              <span className="text-[7px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">◉ Productivity: {s.productivity}</span>
            </div>

            <div className="text-[7px] text-muted-foreground/70 bg-secondary/40 rounded px-2 py-1 mb-2">
              💭 {s.mood}
            </div>

            <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
              <span>⏰ {s.time}</span>
              <span className={`${s.complexity === "simple" ? "text-green-400" : s.complexity === "moderate" ? "text-primary" : "text-yellow-400"}`}>{s.complexity}</span>
              <span>🔧 {s.calls} calls</span>
              <span>📄 {s.files} files</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SessionCardsMockup;
