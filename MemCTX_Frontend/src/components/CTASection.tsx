import { useScrollReveal } from "@/hooks/useScrollReveal";

const CTASection = () => {
  const ref = useScrollReveal();

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div ref={ref} className="reveal-up text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 text-balance">
            Give your AI <span className="gradient-text">perfect recall</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Start building with context that never expires. Install MemCTX and transform your Claude Code experience today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-accent opacity-30 group-hover:opacity-60 blur-lg transition-opacity" />
              <a
                href="https://www.npmjs.com/package/memctx"
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center gap-2 px-10 py-4 rounded-xl bg-primary text-primary-foreground font-semibold transition-transform hover:scale-[1.02]"
              >
                Install from npm
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
            <a
              href="https://github.com/bbhunterpk-ux/memctx"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-10 py-4 rounded-xl border border-border text-foreground font-medium hover:bg-secondary/50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
