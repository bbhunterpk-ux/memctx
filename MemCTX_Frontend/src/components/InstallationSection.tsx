import { useScrollReveal } from "@/hooks/useScrollReveal";

const InstallationSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="installation" className="relative py-32">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="container mx-auto px-6 relative z-10">
        <div ref={ref} className="reveal-up max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full border border-accent/30 text-accent mb-4">
              Quick Start
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Up and running in 60 seconds</h2>
            <p className="text-muted-foreground">Three commands. That's all it takes.</p>
          </div>

          <div className="space-y-4">
            <Step number="1" title="Install globally" command="npm install -g memctx" />
            <Step number="2" title="Initialize in your project" command="cd your-project && memctx init" />
            <Step number="3" title="Start the worker" command="memctx start" />
          </div>

          <div className="mt-10 gradient-border p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">That's it! MemCTX now runs in the background.</p>
            <p className="text-sm text-foreground font-medium">Every Claude Code session is automatically captured, summarized, and ready for handoff.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

function Step({ number, title, command }: { number: string; title: string; command: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/40 border border-border/50 group hover:border-primary/30 transition-colors">
      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">{title}</div>
        <code className="text-sm font-mono text-foreground">{command}</code>
      </div>
      <button
        onClick={() => navigator.clipboard.writeText(command)}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Copy"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      </button>
    </div>
  );
}

export default InstallationSection;
