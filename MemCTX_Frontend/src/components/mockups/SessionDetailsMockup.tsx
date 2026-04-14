const SessionDetailsMockup = () => (
  <div className="w-full rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono ml-2">MemCTX — Session Detail</span>
    </div>

    <div className="p-4">
      <div className="text-[10px] text-primary mb-1">← Back to Project</div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-foreground">Implemented Rate Limiter Middleware</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">Apr 14, 2026, 2:15 PM • Duration: 45 minutes • 12 turns • 89 tool calls</div>
        </div>
        <span className="text-[8px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">COMPLETED</span>
      </div>

      {/* Key insight & next session */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-2.5 mb-3">
        <div className="text-[8px] text-accent font-medium">✦ Key Insight:</div>
        <div className="text-[9px] text-foreground">Redis MULTI/EXEC is essential for atomic rate limit checks in distributed systems</div>
      </div>

      <div className="flex gap-3 mb-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "TOTAL EVENTS", value: "142", color: "text-primary" },
              { label: "FILES CHANGED", value: "6", color: "text-accent" },
              { label: "DECISIONS MADE", value: "4", color: "text-primary" },
              { label: "NEXT STEPS", value: "2", color: "text-foreground" },
              { label: "GOTCHAS", value: "1", color: "text-yellow-400" },
              { label: "TECH NOTES", value: "5", color: "text-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded border border-border bg-secondary/20 p-2">
                <div className="text-[7px] text-muted-foreground uppercase">{s.label}</div>
                <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Summary sections */}
          <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-2">Summary</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded border border-border bg-secondary/20 p-2">
              <div className="text-[8px] text-green-400 font-medium mb-1">✅ WHAT WE DID</div>
              <div className="space-y-0.5 text-[7px] text-muted-foreground">
                <div>• Created rate limiter middleware</div>
                <div>• Added Redis sliding window</div>
                <div>• Wrote integration tests</div>
                <div>• Updated API documentation</div>
              </div>
            </div>
            <div className="rounded border border-border bg-secondary/20 p-2">
              <div className="text-[8px] text-primary font-medium mb-1">🎯 DECISIONS MADE</div>
              <div className="space-y-0.5 text-[7px] text-muted-foreground">
                <div>• Sliding window over fixed</div>
                <div>• Per-tenant rate limits</div>
                <div>• Redis for distributed state</div>
              </div>
            </div>
            <div className="rounded border border-border bg-secondary/20 p-2">
              <div className="text-[8px] text-foreground font-medium mb-1">📁 FILES CHANGED</div>
              <div className="space-y-0.5 text-[7px] text-muted-foreground font-mono">
                <div>• src/middleware/rate-limit.ts</div>
                <div>• src/config/redis.ts</div>
                <div>• tests/rate-limit.test.ts</div>
                <div>• docs/api-limits.md</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded border border-border bg-secondary/20 p-2">
              <div className="text-[8px] text-accent font-medium mb-1">→ NEXT STEPS</div>
              <div className="space-y-0.5 text-[7px] text-muted-foreground">
                <div>• Add rate limit headers</div>
                <div>• Monitor Redis memory</div>
              </div>
            </div>
            <div className="rounded border border-border bg-yellow-500/10 p-2">
              <div className="text-[8px] text-yellow-400 font-medium mb-1">⚠ GOTCHAS</div>
              <div className="text-[7px] text-muted-foreground">Redis WATCH doesn't work with cluster mode — use MULTI/EXEC instead</div>
            </div>
            <div className="rounded border border-border bg-secondary/20 p-2">
              <div className="text-[8px] text-foreground font-medium mb-1">🧪 TESTING GAP</div>
              <div className="text-[7px] text-muted-foreground">No load tests for concurrent rate limit checks across nodes</div>
            </div>
          </div>
        </div>

        {/* Sidebar telemetry */}
        <div className="w-32 shrink-0 hidden lg:block space-y-2">
          <div className="rounded border border-border bg-secondary/20 p-2">
            <div className="text-[7px] text-muted-foreground uppercase mb-1">Mood</div>
            <div className="text-[10px] font-semibold text-green-400">Productive</div>
          </div>
          <div className="rounded border border-border bg-secondary/20 p-2">
            <div className="text-[7px] text-muted-foreground uppercase mb-1">Complexity</div>
            <div className="text-[10px] font-semibold text-foreground">Moderate</div>
          </div>
          <div className="rounded border border-border bg-secondary/20 p-2">
            <div className="text-[7px] text-muted-foreground uppercase mb-1">Session Telemetry</div>
            <div className="space-y-1 mt-1">
              {[
                { label: "Aha! Moments", value: "2" },
                { label: "Flow State", value: "38m" },
                { label: "Divergence", value: "6/100" },
                { label: "Style", value: "Methodical" },
              ].map((t) => (
                <div key={t.label} className="flex justify-between text-[7px]">
                  <span className="text-muted-foreground">{t.label}</span>
                  <span className="text-foreground font-medium">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SessionDetailsMockup;
