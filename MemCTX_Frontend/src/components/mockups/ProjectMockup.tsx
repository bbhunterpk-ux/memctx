const ProjectMockup = () => (
  <div className="w-full rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono ml-2">MemCTX — api-gateway</span>
    </div>

    <div className="p-4">
      <div className="text-[10px] text-primary mb-1">← Back to Projects</div>
      <div className="text-base font-bold text-foreground">api-gateway</div>
      <div className="text-[9px] text-muted-foreground mb-3">🔗 github.com/acme/api-gateway</div>

      {/* Quick stats */}
      <div className="flex gap-3 mb-4">
        {[
          { label: "Sessions", value: "34" },
          { label: "Files Changed", value: "189" },
          { label: "Completed", value: "34" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2 rounded-lg border border-border bg-secondary/20">
            <div className="text-sm font-bold text-primary">{s.value}</div>
            <div className="text-[8px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {["Select Sessions", "View Memory", "Resync New", "Consolidate Memory", "Show Analytics"].map((a) => (
          <div key={a} className="px-2.5 py-1 rounded-full border border-border text-[8px] text-muted-foreground hover:border-primary/40 transition-colors">
            {a}
          </div>
        ))}
      </div>

      {/* Today's productivity */}
      <div className="rounded-lg border border-border bg-secondary/20 p-3 mb-4">
        <div className="text-[10px] font-semibold text-foreground mb-2">📅 Today's Productivity</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "SESSIONS", value: "8", color: "text-primary" },
            { label: "TOOL CALLS", value: "412", color: "text-primary" },
            { label: "FILES TOUCHED", value: "14", color: "text-accent" },
            { label: "TIME SPENT", value: "2h 47m", color: "text-accent" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[7px] text-muted-foreground uppercase">{s.label}</div>
              <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Current Streak", value: "5", sub: "days in a row", color: "text-primary" },
          { label: "Longest Streak", value: "12", sub: "days record", color: "text-foreground" },
          { label: "Longest Session", value: "4h 23m", sub: "Refactored auth flow", color: "text-foreground" },
          { label: "Most Files Changed", value: "27 files", sub: "Database migration", color: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-secondary/20 p-2.5">
            <div className="text-[8px] text-muted-foreground">{s.label}</div>
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[7px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ProjectMockup;
