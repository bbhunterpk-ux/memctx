import { useScrollReveal } from "@/hooks/useScrollReveal";
import DashboardMockup from "./mockups/DashboardMockup";
import ProjectMockup from "./mockups/ProjectMockup";
import SessionCardsMockup from "./mockups/SessionCardsMockup";
import SessionDetailsMockup from "./mockups/SessionDetailsMockup";

const showcaseItems = [
  {
    badge: "Dashboard",
    title: "Complete overview at a glance",
    description: "Track all your projects, sessions, streaks, and productivity metrics from a unified dashboard. See activity trends, most active projects, and jump into any workspace instantly.",
    features: ["Real-time worker status", "7-day activity heatmap", "Cross-project analytics", "Quick project navigation"],
    mockup: <DashboardMockup />,
    reverse: false,
  },
  {
    badge: "Project View",
    title: "Deep dive into every project",
    description: "Each project gets its own workspace with productivity stats, streak tracking, memory management, and session filtering. Search by content, filter by mood or complexity.",
    features: ["Today's productivity cards", "Streak & record tracking", "Memory consolidation", "Advanced session filters"],
    mockup: <ProjectMockup />,
    reverse: true,
  },
  {
    badge: "Session Cards",
    title: "Rich session intelligence",
    description: "Every session is automatically analyzed with AI-extracted insights, emotional telemetry, momentum scores, and key learnings. Sessions become searchable, tagged knowledge artifacts.",
    features: ["AI-generated key insights", "Momentum & frustration metrics", "Mood analysis per session", "Complexity classification"],
    mockup: <SessionCardsMockup />,
    reverse: false,
  },
  {
    badge: "Session Details",
    title: "Full session replay & analysis",
    description: "Drill into any session to see exactly what happened: decisions made, files changed, gotchas discovered, next steps identified, and testing gaps flagged — all auto-generated.",
    features: ["Structured summary sections", "Session telemetry sidebar", "Knowledge graph view", "Export as Markdown/PDF"],
    mockup: <SessionDetailsMockup />,
    reverse: true,
  },
];

const ProductShowcase = () => {
  return (
    <section id="product" className="relative py-32">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full border border-primary/30 text-primary mb-4">
            Product Tour
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            See what <span className="gradient-text">MemCTX</span> captures
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From high-level dashboard to granular session telemetry — every detail of your AI coding sessions, automatically organized.
          </p>
        </div>

        <div className="space-y-32">
          {showcaseItems.map((item, i) => (
            <ShowcaseRow key={i} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ShowcaseRow = ({
  badge,
  title,
  description,
  features,
  mockup,
  reverse,
  index,
}: {
  badge: string;
  title: string;
  description: string;
  features: string[];
  mockup: React.ReactNode;
  reverse: boolean;
  index: number;
}) => {
  const textRef = useScrollReveal(0.1);
  const mockupRef = useScrollReveal(0.1);

  return (
    <div className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-16`}>
      {/* Text */}
      <div ref={textRef} className="reveal-up flex-1 max-w-lg" style={{ transitionDelay: "0.1s" }}>
        <span className="inline-block px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase rounded-full border border-accent/30 text-accent mb-4">
          {badge}
        </span>
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{title}</h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
              <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Mockup */}
      <div ref={mockupRef} className="reveal-scale flex-1 w-full max-w-2xl" style={{ transitionDelay: `${0.2 + index * 0.05}s` }}>
        <div className="relative group">
          {/* Glow behind */}
          <div className={`absolute -inset-4 rounded-2xl bg-gradient-to-br ${index % 2 === 0 ? "from-primary/10 to-accent/5" : "from-accent/10 to-primary/5"} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-700`} />
          <div className="relative">
            {mockup}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShowcase;
