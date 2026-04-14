import { useScrollReveal } from "@/hooks/useScrollReveal";
import TerminalMockup from "./TerminalMockup";

const HeroSection = () => {
  const titleRef = useScrollReveal(0.1);
  const mockupRef = useScrollReveal(0.1);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />

      {/* Animated orbs */}
      <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
      <div className="absolute top-40 left-32 w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-40 right-40 w-1 h-1 rounded-full bg-primary/60 animate-pulse-glow" style={{ animationDelay: "2s" }} />

      <div className="container mx-auto px-6 relative z-10">
        <div ref={titleRef} className="reveal-up text-center max-w-4xl mx-auto mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/50 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Now on npm — v1.0
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6 text-balance">
            <span className="text-foreground">Your AI.</span>
            <br />
            <span className="gradient-text">World-Class</span>
            <br />
            <span className="text-foreground">Memory.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Autonomous session memory & context handoff for Claude Code.
            Never repeat yourself — your AI pair programmer now remembers everything.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-accent opacity-30 group-hover:opacity-50 blur-lg transition-opacity" />
              <a
                href="https://www.npmjs.com/package/memctx"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-transform hover:scale-[1.02]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Get Started
              </a>
            </div>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-secondary/50 transition-colors"
            >
              Explore Features
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Install command */}
          <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-lg bg-secondary/60 border border-border font-mono text-sm">
            <span className="text-muted-foreground">$</span>
            <span className="text-foreground">npx memctx init</span>
            <button
              onClick={() => navigator.clipboard.writeText("npx memctx init")}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy command"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Terminal Mockup */}
        <div ref={mockupRef} className="reveal-scale max-w-4xl mx-auto" style={{ transitionDelay: "0.2s" }}>
          <TerminalMockup />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/50 to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;
