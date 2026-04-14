const stats = [
  { icon: "✅", label: "TOTAL SESSIONS", value: "127", sub: "100% completed", color: "text-accent" },
  { icon: "⏱", label: "TOTAL TIME", value: "384h", sub: "182m avg per session", color: "text-primary" },
  { icon: "📁", label: "FILES CHANGED", value: "2,847", sub: "across all projects", color: "text-foreground" },
  { icon: "🔥", label: "CURRENT STREAK", value: "21", sub: "days in a row", color: "text-primary" },
];

const activityData = [5, 3, 8, 12, 7, 15, 11];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const projects = [
  { name: "api-gateway", sessions: 34, time: "2 hours ago" },
  { name: "mobile-app", sessions: 28, time: "5 hours ago" },
  { name: "ml-pipeline", sessions: 21, time: "1 day ago" },
  { name: "web-dashboard", sessions: 18, time: "1 day ago" },
  { name: "auth-service", sessions: 15, time: "3 days ago" },
  { name: "data-sync", sessions: 11, time: "4 days ago" },
];

const DashboardMockup = () => (
  <div className="w-full rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
    {/* Top bar */}
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono ml-2">MemCTX Dashboard</span>
    </div>

    <div className="flex">
      {/* Sidebar */}
      <div className="w-36 border-r border-border bg-secondary/30 p-3 hidden sm:block">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[8px] text-primary-foreground font-bold">M</div>
          <span className="text-[11px] font-semibold text-foreground">MemCTX</span>
        </div>
        <div className="text-[9px] text-accent mb-4">● Worker online</div>
        {["Projects", "Search", "Live", "Metrics", "Logs", "Settings"].map((item, i) => (
          <div key={item} className={`text-[10px] py-1.5 px-2 rounded mb-0.5 ${i === 0 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-4 min-w-0">
        <div className="text-sm font-bold text-foreground mb-0.5">Projects</div>
        <div className="text-[10px] text-muted-foreground mb-3">All tracked workspaces — {projects.length} total</div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-secondary/20 p-2.5">
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">{s.icon} {s.label}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[8px] text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Activity chart */}
        <div className="rounded-lg border border-border bg-secondary/20 p-3 mb-4">
          <div className="text-[10px] font-semibold text-foreground mb-3">📈 Last 7 Days Activity</div>
          <div className="flex items-end gap-2 h-16">
            {activityData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[7px] text-muted-foreground">{v}</div>
                <div className="w-full rounded-t bg-primary/70" style={{ height: `${(v / 15) * 100}%` }} />
                <div className="text-[7px] text-muted-foreground">{days[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Project cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {projects.map((p) => (
            <div key={p.name} className="rounded-lg border border-border bg-secondary/20 p-2.5 hover:border-primary/30 transition-colors">
              <div className="text-[10px] font-semibold text-foreground mb-1">📦 {p.name}</div>
              <div className="text-[8px] text-muted-foreground">🔗 {p.sessions} sessions • ⏰ {p.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardMockup;
