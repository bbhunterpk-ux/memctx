const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 36 36" className="w-7 h-7">
              <defs>
                <linearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                  <stop offset="100%" stopColor="hsl(190, 95%, 55%)" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="32" height="32" rx="8" fill="none" stroke="url(#footerGrad)" strokeWidth="2" />
              <path d="M10 18 L14 14 L18 18 L22 12 L26 16" fill="none" stroke="url(#footerGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-foreground">MemCTX</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="https://github.com/bbhunterpk-ux/memctx" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="https://www.npmjs.com/package/memctx" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">npm</a>
            <a href="https://github.com/bbhunterpk-ux/memctx/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">MIT License</a>
          </div>

          <p className="text-xs text-text-dim">
            © {new Date().getFullYear()} Fahad Aziz Qureshi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
