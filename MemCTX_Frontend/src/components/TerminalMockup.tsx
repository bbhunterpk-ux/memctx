import { useState, useEffect } from "react";

const lines = [
  { type: "comment", text: "# MemCTX — Session Memory Active" },
  { type: "info", text: "🧠 Loading context from 47 previous sessions..." },
  { type: "success", text: "✅ Knowledge graph loaded (312 nodes, 891 edges)" },
  { type: "info", text: "📊 Project: memctx-app | Branch: main" },
  { type: "separator", text: "─".repeat(52) },
  { type: "header", text: "🎯 START HERE — Session #48 Handoff" },
  { type: "normal", text: "  • Last session: Fixed auth redirect + error handling" },
  { type: "normal", text: "  • Open rabbit holes: Rate limiter, WebSocket reconnect" },
  { type: "warning", text: "  ⚠ Tech debt: 3 items (suppress warnings in tests)" },
  { type: "normal", text: "  • Flow state: 87% | Aha! moments: 4" },
  { type: "separator", text: "─".repeat(52) },
  { type: "success", text: "✨ Context injected. Claude is ready." },
  { type: "accent", text: "▶ Session #48 started — you're in the zone." },
];

const TerminalMockup = () => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (i >= lines.length) clearInterval(interval);
          }, 120);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    const el = document.getElementById("terminal-mockup");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getColor = (type: string) => {
    switch (type) {
      case "comment": return "text-text-dim";
      case "info": return "text-primary";
      case "success": return "text-accent";
      case "warning": return "text-yellow-400";
      case "header": return "text-foreground font-bold";
      case "accent": return "gradient-text font-semibold";
      case "separator": return "text-border";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div id="terminal-mockup" className="terminal-window glow-primary relative">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-2">memctx — session handoff</span>
      </div>

      {/* Terminal content */}
      <div className="p-5 font-mono text-sm leading-relaxed min-h-[320px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`${getColor(line.type)} transition-opacity duration-300`}
            style={{ opacity: i < visibleLines ? 1 : 0 }}
          >
            {line.text}
          </div>
        ))}
        {visibleLines < lines.length && (
          <span className="inline-block w-2 h-4 bg-primary/80 animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default TerminalMockup;
