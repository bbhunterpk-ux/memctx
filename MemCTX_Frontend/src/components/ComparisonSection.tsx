import { useScrollReveal } from "@/hooks/useScrollReveal";

const stats = [
  { value: "312+", label: "Graph Nodes", desc: "per project avg" },
  { value: "47", label: "Sessions Tracked", desc: "with zero config" },
  { value: "87%", label: "Flow State", desc: "maintained across sessions" },
  { value: "<2s", label: "Context Injection", desc: "at session start" },
];

const comparison = [
  { without: "❌ Repeating Context every session", with: "✅ Automatic Injection of critical context" },
  { without: "❌ Lost History when closing terminal", with: "✅ Persistent Graph of all decisions" },
  { without: "❌ Manual Notes for handoffs", with: "✅ AI Handoffs with START HERE markers" },
  { without: "❌ Unnoticed Tech Debt accumulation", with: "✅ Telemetry & Metrics tracking" },
];

const ComparisonSection = () => {
  const statsRef = useScrollReveal();
  const tableRef = useScrollReveal();

  return (
    <section className="relative py-32">
      <div className="container mx-auto px-6">
        {/* Stats */}
        <div ref={statsRef} className="reveal-up grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-24">
          {stats.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-xl bg-secondary/30 border border-border/50">
              <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-sm font-semibold text-foreground mb-1">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div ref={tableRef} className="reveal-up max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full border border-primary/30 text-primary mb-4">
              The Difference
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Before & After MemCTX</h2>
          </div>

          <div className="gradient-border overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="p-4 border-b border-r border-border bg-destructive/5">
                <span className="text-sm font-bold text-destructive">😫 Without MemCTX</span>
              </div>
              <div className="p-4 border-b border-border bg-accent/5">
                <span className="text-sm font-bold text-accent">✨ With MemCTX</span>
              </div>
              {comparison.map((row, i) => (
                <ComparisonRow key={i} {...row} last={i === comparison.length - 1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function ComparisonRow({ without, with: withText, last }: { without: string; with: string; last: boolean }) {
  return (
    <>
      <div className={`p-4 text-sm text-muted-foreground ${!last ? "border-b" : ""} border-r border-border`}>{without}</div>
      <div className={`p-4 text-sm text-foreground ${!last ? "border-b border-border" : ""}`}>{withText}</div>
    </>
  );
}

export default ComparisonSection;
