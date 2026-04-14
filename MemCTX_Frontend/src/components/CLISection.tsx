import { useScrollReveal } from "@/hooks/useScrollReveal";

const cliCommands = [
  { cmd: "memctx init", desc: "Initialize MemCTX in your project" },
  { cmd: "memctx start", desc: "Start the background worker" },
  { cmd: "memctx stop", desc: "Stop the background worker" },
  { cmd: "memctx status", desc: "Check worker status and stats" },
  { cmd: "memctx sessions", desc: "List all captured sessions" },
  { cmd: "memctx graph", desc: "View knowledge graph statistics" },
  { cmd: "memctx export", desc: "Export sessions as JSON / Markdown" },
  { cmd: "memctx dashboard", desc: "Open the web dashboard" },
];

const CLISection = () => {
  const ref = useScrollReveal();

  return (
    <section id="docs" className="relative py-32">
      <div className="container mx-auto px-6">
        <div ref={ref} className="reveal-up max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full border border-primary/30 text-primary mb-4">
              CLI Reference
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Complete control from the terminal</h2>
          </div>

          <div className="terminal-window">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-accent/80" />
                <div className="w-3 h-3 rounded-full bg-primary/80" />
              </div>
              <span className="text-xs text-muted-foreground font-mono ml-2">memctx — CLI reference</span>
            </div>
            <div className="p-5 font-mono text-sm space-y-1">
              <div className="text-text-dim mb-3"># Available commands</div>
              {cliCommands.map((c, i) => (
                <div key={i} className="flex items-start gap-4 py-1.5 group">
                  <span className="text-primary font-medium whitespace-nowrap">{c.cmd}</span>
                  <span className="text-muted-foreground text-xs mt-0.5">— {c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CLISection;
