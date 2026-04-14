import { useState, useEffect } from "react";
import { useLenis } from "@/hooks/useLenis";
import { Link } from "react-router-dom";

type TabId = "api" | "architecture" | "plugins" | "development";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "api", label: "API Reference", icon: "🔌" },
  { id: "architecture", label: "Architecture", icon: "🏗️" },
  { id: "plugins", label: "Plugin System", icon: "🧩" },
  { id: "development", label: "Development", icon: "🔧" },
];

const Docs = () => {
  useLenis();
  const [activeTab, setActiveTab] = useState<TabId>("api");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabId;
    if (tabs.some((t) => t.id === hash)) setActiveTab(hash);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "glass border-b border-border/50" : "bg-background/80 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <defs>
                  <linearGradient id="logoGradDoc" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                    <stop offset="100%" stopColor="hsl(190, 95%, 55%)" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="32" height="32" rx="8" fill="none" stroke="url(#logoGradDoc)" strokeWidth="2" />
                <path d="M10 18 L14 14 L18 18 L22 12 L26 16" fill="none" stroke="url(#logoGradDoc)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="14" cy="24" r="2" fill="hsl(217, 91%, 60%)" opacity="0.6" />
                <circle cx="22" cy="22" r="2" fill="hsl(190, 95%, 55%)" opacity="0.6" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Mem<span className="gradient-text">CTX</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            to="/"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg hover:border-primary/30"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Mobile tabs */}
      <div className="md:hidden fixed top-[72px] left-0 right-0 z-40 glass border-b border-border/50 overflow-x-auto">
        <div className="flex px-4 py-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="pt-28 md:pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {activeTab === "api" && <APIReferenceContent />}
          {activeTab === "architecture" && <ArchitectureContent />}
          {activeTab === "plugins" && <PluginSystemContent />}
          {activeTab === "development" && <DevelopmentContent />}
        </div>
      </div>
    </div>
  );
};

/* ─── Shared Components ─── */

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-10">
      <span className="inline-block px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full border border-primary/30 text-primary mb-4">
        {icon} {title}
      </span>
      {subtitle && <p className="text-muted-foreground leading-relaxed mt-2">{subtitle}</p>}
    </div>
  );
}

function CodeBlock({ title, language, children }: { title?: string; language?: string; children: string }) {
  return (
    <div className="terminal-window my-4 text-sm">
      {title && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">{title}</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  description,
  children,
}: {
  method: string;
  path: string;
  description: string;
  children?: React.ReactNode;
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="gradient-border p-5 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-2 py-0.5 text-xs font-bold rounded border ${methodColors[method] || ""}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {children}
    </div>
  );
}

function ParamTable({ params }: { params: { name: string; type: string; desc: string }[] }) {
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Parameter</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border/50">
              <td className="py-2 px-3 font-mono text-primary">{p.name}</td>
              <td className="py-2 px-3 font-mono text-accent">{p.type}</td>
              <td className="py-2 px-3 text-muted-foreground">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="gradient-border p-5 mb-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── API Reference ─── */

function APIReferenceContent() {
  return (
    <div>
      <SectionTitle
        icon="🔌"
        title="API Reference"
        subtitle="Complete REST & WebSocket API documentation for MemCTX. Base URL: http://localhost:9999/api"
      />

      <div className="gradient-border p-5 mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-2">Base URL & Authentication</h3>
        <CodeBlock>{`Base URL: http://localhost:9999/api
Port: 9999 (configurable via MEMCTX_PORT)

# Currently no auth required (local-only)
# Future: Authorization: Bearer <api-key>`}</CodeBlock>
      </div>

      {/* Sessions API */}
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-primary">📡</span> Sessions API
      </h3>

      <EndpointCard method="GET" path="/api/sessions" description="List all sessions with optional filters">
        <ParamTable
          params={[
            { name: "project", type: "string", desc: "Filter by project ID" },
            { name: "tags", type: "string", desc: "Comma-separated tags" },
            { name: "from", type: "string", desc: "Start date (ISO 8601)" },
            { name: "to", type: "string", desc: "End date (ISO 8601)" },
            { name: "limit", type: "number", desc: "Results per page (default: 20)" },
            { name: "offset", type: "number", desc: "Pagination offset" },
            { name: "sort", type: "string", desc: "Sort field (startTime, duration)" },
            { name: "order", type: "string", desc: "Sort order (asc, desc)" },
          ]}
        />
        <CodeBlock title="Response">{`{
  success: true,
  data: [{
    id: "abc123",
    projectId: "proj_xyz",
    startTime: 1712491505984,
    duration: 3600,
    branch: "main",
    summary: {
      title: "Fixed authentication bug",
      completed: ["Fixed login redirect", "Added error handling"],
      nextSteps: ["Add tests", "Deploy to staging"],
      decisions: ["Use JWT instead of sessions"]
    },
    tags: ["bugfix", "auth"],
    metadata: { filesChanged: 5, linesAdded: 120, linesRemoved: 45 }
  }],
  meta: { total: 150, page: 1, limit: 20 }
}`}</CodeBlock>
      </EndpointCard>

      <EndpointCard method="GET" path="/api/sessions/:id" description="Get a single session by ID" />

      <EndpointCard method="POST" path="/api/sessions" description="Create a new session">
        <CodeBlock title="Request Body">{`{
  projectId: "proj_xyz",
  startTime: 1712491505984,
  branch: "feature/new-auth",
  tags: ["feature", "auth"],
  notes: "Implementing new authentication system"
}`}</CodeBlock>
      </EndpointCard>

      <EndpointCard method="PUT" path="/api/sessions/:id" description="Update an existing session" />
      <EndpointCard method="DELETE" path="/api/sessions/:id" description="Delete a session" />

      <EndpointCard method="POST" path="/api/sessions/:id/end" description="End a session and optionally trigger summarization">
        <CodeBlock title="Request Body">{`{
  summarize?: boolean  // Trigger immediate summarization
}`}</CodeBlock>
      </EndpointCard>

      {/* Projects API */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10 flex items-center gap-2">
        <span className="text-accent">📁</span> Projects API
      </h3>

      <EndpointCard method="GET" path="/api/projects" description="List all projects">
        <ParamTable
          params={[
            { name: "tags", type: "string", desc: "Filter by tags" },
            { name: "limit", type: "number", desc: "Results per page" },
            { name: "offset", type: "number", desc: "Pagination offset" },
          ]}
        />
      </EndpointCard>
      <EndpointCard method="GET" path="/api/projects/:id" description="Get project details with recent sessions" />
      <EndpointCard method="POST" path="/api/projects" description="Create a new project">
        <CodeBlock title="Request Body">{`{
  name: "My App",
  path: "/home/user/projects/my-app",
  description: "Production web application",
  tags: ["frontend", "react"],
  config: {
    excludePaths: ["node_modules", "dist"],
    summarization: { enabled: true, minDuration: 300 }
  }
}`}</CodeBlock>
      </EndpointCard>
      <EndpointCard method="PUT" path="/api/projects/:id" description="Update project details" />
      <EndpointCard method="DELETE" path="/api/projects/:id" description="Delete project (optionally keep sessions via ?keepSessions=true)" />

      {/* Summarization API */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10 flex items-center gap-2">
        <span className="text-primary">🧠</span> Summarization API
      </h3>

      <EndpointCard method="POST" path="/api/summarize/:sessionId" description="Trigger AI summarization for a session">
        <CodeBlock title="Request Body">{`{
  model?: "claude-opus-4" | "claude-haiku-4",
  force?: boolean  // Force re-summarization
}`}</CodeBlock>
      </EndpointCard>

      <EndpointCard method="GET" path="/api/summarize/status/:jobId" description="Check summarization job status">
        <CodeBlock title="Response">{`{
  success: true,
  data: {
    jobId: "job_abc123",
    status: "completed" | "queued" | "processing" | "failed",
    progress: 100,
    result?: { title, completed, nextSteps, blockers, decisions }
  }
}`}</CodeBlock>
      </EndpointCard>

      <EndpointCard method="POST" path="/api/summarize/batch" description="Batch summarize multiple sessions" />

      {/* Config API */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10 flex items-center gap-2">
        <span className="text-accent">⚙️</span> Configuration API
      </h3>

      <EndpointCard method="GET" path="/api/config" description="Get current configuration" />
      <EndpointCard method="PUT" path="/api/config" description="Update configuration" />
      <EndpointCard method="POST" path="/api/config/reset" description="Reset configuration to defaults" />

      {/* WebSocket */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10 flex items-center gap-2">
        <span className="text-primary">⚡</span> WebSocket API
      </h3>

      <div className="gradient-border p-5 mb-4">
        <p className="text-sm text-muted-foreground mb-3">Connect to <code className="text-primary font-mono text-xs">ws://localhost:9999/ws</code> for real-time events.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { event: "session.started", desc: "New session begins" },
            { event: "session.ended", desc: "Session completed" },
            { event: "summarization.complete", desc: "AI summary ready" },
            { event: "worker.status", desc: "Worker health updates" },
          ].map((e) => (
            <div key={e.event} className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <code className="text-xs font-mono text-accent">{e.event}</code>
              <p className="text-xs text-muted-foreground mt-1">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error Codes */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10 flex items-center gap-2">
        <span className="text-destructive">❌</span> Error Codes
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Code</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["INVALID_REQUEST", "400", "Invalid request body or parameters"],
              ["NOT_FOUND", "404", "Resource not found"],
              ["CONFLICT", "409", "Resource already exists"],
              ["RATE_LIMIT", "429", "Rate limit exceeded"],
              ["INTERNAL_ERROR", "500", "Internal server error"],
              ["API_ERROR", "502", "Claude API error"],
              ["TIMEOUT", "504", "Request timeout"],
            ].map(([code, status, desc]) => (
              <tr key={code} className="border-b border-border/50">
                <td className="py-2 px-3 font-mono text-destructive">{code}</td>
                <td className="py-2 px-3 font-mono text-foreground">{status}</td>
                <td className="py-2 px-3 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rate Limits */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10 flex items-center gap-2">
        <span className="text-accent">🚦</span> Rate Limits
      </h3>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Endpoint</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Limit</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["GET /api/sessions", "100/min"],
              ["POST /api/summarize", "10/min"],
              ["POST /api/summarize/batch", "5/min"],
              ["All other endpoints", "60/min"],
            ].map(([ep, limit]) => (
              <tr key={ep} className="border-b border-border/50">
                <td className="py-2 px-3 font-mono text-foreground">{ep}</td>
                <td className="py-2 px-3 text-accent">{limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Code Examples */}
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-primary">💻</span> Code Examples
      </h3>

      <CodeBlock title="JavaScript / TypeScript">{`// Fetch sessions
const response = await fetch('http://localhost:9999/api/sessions?project=proj_xyz')
const { data } = await response.json()

// Create session
await fetch('http://localhost:9999/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'proj_xyz',
    startTime: Date.now(),
    tags: ['feature']
  })
})

// Summarize session
await fetch('http://localhost:9999/api/summarize/abc123', { method: 'POST' })`}</CodeBlock>

      <CodeBlock title="Python">{`import requests

# Fetch sessions
response = requests.get('http://localhost:9999/api/sessions', params={
    'project': 'proj_xyz', 'limit': 10
})
sessions = response.json()['data']

# Summarize session
job = requests.post('http://localhost:9999/api/summarize/abc123')`}</CodeBlock>

      <CodeBlock title="cURL">{`# Fetch sessions
curl http://localhost:9999/api/sessions?project=proj_xyz

# Create session
curl -X POST http://localhost:9999/api/sessions \\
  -H "Content-Type: application/json" \\
  -d '{"projectId":"proj_xyz","startTime":1712491505984,"tags":["feature"]}'`}</CodeBlock>
    </div>
  );
}

/* ─── Architecture ─── */

function ArchitectureContent() {
  return (
    <div>
      <SectionTitle
        icon="🏗️"
        title="Architecture"
        subtitle="Three-layer architecture: Claude Code Hooks → Background Worker → Web Dashboard"
      />

      {/* System Overview Diagram */}
      <div className="gradient-border p-6 mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-4">System Overview</h3>
        <svg viewBox="0 0 700 380" className="w-full" fill="none">
          <defs>
            <linearGradient id="docArchG1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(217,91%,60%)" />
              <stop offset="100%" stopColor="hsl(190,95%,55%)" />
            </linearGradient>
          </defs>
          {/* Claude Code */}
          <rect x="175" y="10" width="350" height="55" rx="10" fill="hsl(228,14%,10%)" stroke="url(#docArchG1)" strokeWidth="1.5" />
          <text x="350" y="35" textAnchor="middle" fill="hsl(210,20%,95%)" fontSize="13" fontWeight="600" fontFamily="Inter">Claude Code (SessionStart Hook)</text>
          
          <line x1="350" y1="65" x2="350" y2="95" stroke="url(#docArchG1)" strokeWidth="2" strokeDasharray="4 4">
            <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite" />
          </line>
          <polygon points="344,93 356,93 350,103" fill="hsl(217,91%,60%)" />

          {/* Worker */}
          <rect x="40" y="105" width="620" height="145" rx="14" fill="hsl(228,14%,8%)" stroke="hsl(228,14%,18%)" strokeWidth="1" />
          <text x="350" y="128" textAnchor="middle" fill="hsl(215,15%,55%)" fontSize="10" fontFamily="Inter" fontWeight="500">BACKGROUND WORKER</text>
          
          {[
            { x: 75, label: "📡 Session Tracker" },
            { x: 275, label: "🧠 AI Summarizer" },
            { x: 475, label: "💾 Database Manager" },
          ].map((box, i) => (
            <g key={i}>
              <rect x={box.x} y="142" width="150" height="45" rx="8" fill="hsl(228,14%,12%)" stroke="hsl(217,91%,60%)" strokeWidth="0.5" strokeOpacity="0.3" />
              <text x={box.x + 75} y="170" textAnchor="middle" fill="hsl(210,20%,90%)" fontSize="11" fontFamily="Inter">{box.label}</text>
              {i < 2 && (
                <line x1={box.x + 150} y1="165" x2={box.x + 200} y2="165" stroke="url(#docArchG1)" strokeWidth="1.5" opacity="0.6" />
              )}
            </g>
          ))}

          <rect x="140" y="200" width="420" height="28" rx="6" fill="hsl(228,14%,12%)" stroke="hsl(228,14%,18%)" strokeWidth="0.5" />
          <text x="350" y="219" textAnchor="middle" fill="hsl(215,15%,55%)" fontSize="10" fontFamily="Inter">REST API Server — localhost:9999</text>

          <line x1="350" y1="250" x2="350" y2="280" stroke="url(#docArchG1)" strokeWidth="2" strokeDasharray="4 4">
            <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite" />
          </line>
          <polygon points="344,278 356,278 350,288" fill="hsl(190,95%,55%)" />

          {/* Dashboard */}
          <rect x="40" y="292" width="620" height="80" rx="14" fill="hsl(228,14%,8%)" stroke="hsl(190,95%,55%)" strokeWidth="1" strokeOpacity="0.4" />
          <text x="350" y="315" textAnchor="middle" fill="hsl(215,15%,55%)" fontSize="10" fontFamily="Inter" fontWeight="500">WEB DASHBOARD</text>
          {[
            { x: 75, label: "📋 Session View" },
            { x: 275, label: "📁 Project Manager" },
            { x: 475, label: "⚙️ Settings Editor" },
          ].map((box, i) => (
            <g key={i}>
              <rect x={box.x} y="328" width="150" height="35" rx="8" fill="hsl(228,14%,12%)" stroke="hsl(190,95%,55%)" strokeWidth="0.5" strokeOpacity="0.3" />
              <text x={box.x + 75} y="350" textAnchor="middle" fill="hsl(190,95%,55%)" fontSize="11" fontFamily="Inter">{box.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Components */}
      <h3 className="text-xl font-bold text-foreground mb-4">Components</h3>

      <InfoCard
        title="1. Claude Code Hook"
        items={[
          "Location: ~/.claude/settings.json",
          "Captures SessionStart and SessionEnd lifecycle events",
          "Records session timestamp, project path, Git branch, initial context",
          "Non-blocking hooks — no performance impact on Claude Code",
        ]}
      />

      <CodeBlock title="Hook Configuration (~/.claude/settings.json)">{`{
  "hooks": {
    "SessionStart": {
      "command": "memctx-hook session-start",
      "blocking": false
    },
    "SessionEnd": {
      "command": "memctx-hook session-end",
      "blocking": false
    }
  }
}`}</CodeBlock>

      <InfoCard
        title="2. Background Worker"
        items={[
          "SessionTracker — manages session lifecycle (start, end, update)",
          "AISummarizer — generates AI-powered session summaries with Claude",
          "DatabaseManager — persists sessions, projects, and summaries to SQLite",
          "REST API Server — exposes data on localhost:9999",
        ]}
      />

      <InfoCard
        title="3. Web Dashboard"
        items={[
          "Built with React 18, TypeScript, Vite, TailwindCSS",
          "Real-time session updates via WebSocket",
          "AI summary display with task tracking",
          "Project filtering, tag management, export functionality",
        ]}
      />

      {/* Data Flow */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Session Lifecycle</h3>

      <div className="gradient-border p-5 mb-6">
        <div className="space-y-3">
          {[
            { step: "1", label: "Receive session start event from Claude Code hook", color: "text-primary" },
            { step: "2", label: "Create session record in SQLite database", color: "text-primary" },
            { step: "3", label: "Track session activity (files, commands, git changes)", color: "text-accent" },
            { step: "4", label: "On session end — calculate duration and queue summarization", color: "text-accent" },
            { step: "5", label: "Generate AI summary via Claude API", color: "text-primary" },
            { step: "6", label: "Save summary and inject context into CLAUDE.md for next session", color: "text-accent" },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-4">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border border-border ${s.color} bg-muted/30`}>
                {s.step}
              </span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Database Schema */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Database Schema</h3>
      <p className="text-sm text-muted-foreground mb-4">SQLite database stored at <code className="text-primary font-mono text-xs">~/.memctx/sessions.db</code></p>

      <CodeBlock title="sessions table">{`CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  startTime INTEGER NOT NULL,
  endTime INTEGER,
  duration INTEGER,
  branch TEXT,
  summary TEXT,
  tags TEXT,        -- JSON array
  notes TEXT,
  metadata TEXT,    -- JSON object
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id)
);`}</CodeBlock>

      <CodeBlock title="projects table">{`CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  description TEXT,
  tags TEXT,        -- JSON array
  config TEXT,      -- JSON object
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);`}</CodeBlock>

      <CodeBlock title="summaries table">{`CREATE TABLE summaries (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  completed TEXT,   -- JSON array
  nextSteps TEXT,   -- JSON array
  blockers TEXT,    -- JSON array
  decisions TEXT,   -- JSON array
  model TEXT NOT NULL,
  tokens INTEGER,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
);`}</CodeBlock>

      {/* Security */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Security</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Data Storage" items={["All data stored locally in ~/.memctx/", "SQLite with file permissions 600", "No external data sharing (except Claude API)"]} />
        <InfoCard title="Input Validation" items={["All inputs validated with Zod schemas", "Parameterized SQL queries", "Path traversal prevention"]} />
        <InfoCard title="API Key Handling" items={["Stored with 600 permissions", "Never logged or exposed in responses", "Environment variable or config loading"]} />
        <InfoCard title="Process Isolation" items={["Worker runs as separate process", "No elevated privileges required", "Graceful shutdown on SIGTERM/SIGINT"]} />
      </div>
    </div>
  );
}

/* ─── Plugin System ─── */

function PluginSystemContent() {
  return (
    <div>
      <SectionTitle
        icon="🧩"
        title="Plugin System"
        subtitle="Extend MemCTX with custom summarizers, exporters, integrations, and dashboard widgets."
      />

      {/* What you can build */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {[
          { icon: "🧠", title: "Summarizers", desc: "Custom AI prompts and models" },
          { icon: "📤", title: "Exporters", desc: "PDF, HTML, Notion, custom formats" },
          { icon: "💬", title: "Integrations", desc: "Slack, Notion, webhooks" },
          { icon: "📊", title: "Widgets", desc: "Custom dashboard components" },
          { icon: "🔗", title: "Context Injectors", desc: "Custom injection formats" },
        ].map((p) => (
          <div key={p.title} className="gradient-border p-4">
            <span className="text-xl">{p.icon}</span>
            <h4 className="text-sm font-semibold text-foreground mt-2">{p.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Plugin Structure */}
      <h3 className="text-xl font-bold text-foreground mb-4">Plugin Structure</h3>

      <CodeBlock title="Directory Layout">{`my-memctx-plugin/
├── package.json          # Plugin manifest with memctx config
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── summarizer.ts     # Custom summarizer (optional)
│   ├── exporter.ts       # Custom exporter (optional)
│   └── widget.tsx        # Dashboard widget (optional)
├── README.md
└── LICENSE`}</CodeBlock>

      <CodeBlock title="package.json manifest">{`{
  "name": "memctx-plugin-custom",
  "version": "1.0.0",
  "main": "dist/index.js",
  "keywords": ["memctx", "memctx-plugin"],
  "memctx": {
    "type": "plugin",
    "provides": ["summarizer", "exporter"],
    "requires": "^1.0.0"
  },
  "peerDependencies": { "memctx": "^1.0.0" }
}`}</CodeBlock>

      {/* Creating Plugins */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Creating a Plugin</h3>

      <CodeBlock title="1. Initialize">{`mkdir memctx-plugin-custom && cd memctx-plugin-custom
pnpm init
pnpm add -D memctx typescript @types/node`}</CodeBlock>

      <CodeBlock title="2. Entry Point (src/index.ts)">{`import { Plugin, PluginContext } from 'memctx'

export default class CustomPlugin implements Plugin {
  name = 'custom-plugin'
  version = '1.0.0'

  async initialize(context: PluginContext): Promise<void> {
    console.log('Custom plugin initialized')
    if (this.summarizer) context.registerSummarizer(this.summarizer)
    if (this.exporter) context.registerExporter(this.exporter)
  }

  async destroy(): Promise<void> {
    console.log('Custom plugin destroyed')
  }
}`}</CodeBlock>

      <CodeBlock title="3. Custom Summarizer (src/summarizer.ts)">{`import { Summarizer, Session, Summary } from 'memctx'

export class CustomSummarizer implements Summarizer {
  name = 'custom'

  async summarize(session: Session): Promise<Summary> {
    const prompt = \`Analyze this coding session:
      Duration: \${session.duration}s
      Files changed: \${session.metadata.filesChanged}
      
      Provide: 1. Accomplishments  2. Decisions  3. Next steps\`
    
    const response = await this.callAI(prompt)
    return this.parseResponse(response)
  }
}`}</CodeBlock>

      <CodeBlock title="4. Custom Exporter (src/exporter.ts)">{`import { Exporter, Session } from 'memctx'

export class CustomExporter implements Exporter {
  name = 'custom'
  extension = '.custom'

  async export(sessions: Session[]): Promise<Buffer> {
    const data = sessions.map(s =>
      \`Session: \${s.id} | Duration: \${s.duration}s | \${s.summary?.title}\`
    ).join('\\n---\\n')
    return Buffer.from(data)
  }
}`}</CodeBlock>

      {/* Plugin API Interfaces */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Plugin API Interfaces</h3>

      <CodeBlock title="Core Interfaces">{`interface Plugin {
  name: string
  version: string
  initialize(context: PluginContext): Promise<void>
  destroy(): Promise<void>
}

interface PluginContext {
  registerSummarizer(summarizer: Summarizer): void
  registerInjector(injector: Injector): void
  registerExporter(exporter: Exporter): void
  registerWidget(widget: Widget): void
  getDatabase(): Database
  getConfig(): Config
  getLogger(): Logger
  emit(event: string, data: any): void
  on(event: string, handler: (data: any) => void): void
}

interface Summarizer {
  name: string
  summarize(session: Session): Promise<Summary>
}

interface Exporter {
  name: string
  extension: string
  export(sessions: Session[]): Promise<Buffer>
}

interface Widget extends React.FC<WidgetProps> {
  name: string
  title: string
  size?: 'small' | 'medium' | 'large'
}`}</CodeBlock>

      {/* Example Plugins */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Example Plugins</h3>

      <CodeBlock title="Slack Integration Plugin">{`import { Plugin, PluginContext, Session } from 'memctx'
import { WebClient } from '@slack/web-api'

export default class SlackPlugin implements Plugin {
  name = 'slack'
  version = '1.0.0'
  private slack: WebClient

  async initialize(context: PluginContext): Promise<void> {
    this.slack = new WebClient(context.getConfig().slackToken)
    context.on('session.ended', (session) => this.notifySlack(session))
  }

  private async notifySlack(session: Session): Promise<void> {
    await this.slack.chat.postMessage({
      channel: '#dev-updates',
      text: \`Session completed: \${session.summary?.title}\`
    })
  }
}`}</CodeBlock>

      <CodeBlock title="OpenAI Summarizer Plugin">{`import { Summarizer, Session, Summary } from 'memctx'
import OpenAI from 'openai'

export class OpenAISummarizer implements Summarizer {
  name = 'openai'
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async summarize(session: Session): Promise<Summary> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a coding session analyzer.' },
        { role: 'user', content: \`Analyze: Duration \${session.duration}s, \${session.metadata.filesChanged} files\` }
      ]
    })
    return this.parseResponse(response.choices[0].message.content)
  }
}`}</CodeBlock>

      {/* Publishing */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Publishing & Installing</h3>

      <CodeBlock title="Publish to npm">{`# Build
pnpm run build

# Publish
npm publish`}</CodeBlock>

      <CodeBlock title="Install & Enable">{`# Install
pnpm add -g memctx-plugin-custom

# Enable in ~/.memctx/config.json
{
  "plugins": ["memctx-plugin-custom"]
}`}</CodeBlock>
    </div>
  );
}

/* ─── Development ─── */

function DevelopmentContent() {
  return (
    <div>
      <SectionTitle
        icon="🔧"
        title="Development Setup"
        subtitle="Set up your local development environment for contributing to MemCTX."
      />

      {/* Prerequisites */}
      <h3 className="text-xl font-bold text-foreground mb-4">Prerequisites</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { name: "Node.js", version: "≥ 18.0.0", icon: "⬢" },
          { name: "pnpm", version: "≥ 8.0.0", icon: "📦" },
          { name: "Git", version: "≥ 2.30.0", icon: "🔀" },
        ].map((p) => (
          <div key={p.name} className="gradient-border p-4 text-center">
            <span className="text-2xl">{p.icon}</span>
            <h4 className="text-sm font-semibold text-foreground mt-2">{p.name}</h4>
            <p className="text-xs text-accent mt-1">{p.version}</p>
          </div>
        ))}
      </div>

      {/* Setup */}
      <h3 className="text-xl font-bold text-foreground mb-4">Initial Setup</h3>

      <CodeBlock title="Clone & Install">{`# Clone your fork
git clone https://github.com/YOUR_USERNAME/memctx.git
cd memctx

# Add upstream remote
git remote add upstream https://github.com/bbhunterpk-ux/memctx.git

# Install dependencies
pnpm install

# Configure environment
cat > .env << EOF
ANTHROPIC_API_KEY=sk-ant-your-key-here
MEMCTX_PORT=9999
MEMCTX_LOG_LEVEL=debug
EOF
chmod 600 .env

# Build all packages
pnpm run build`}</CodeBlock>

      {/* Project Structure */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Project Structure</h3>

      <CodeBlock title="Directory Layout">{`memctx/
├── artifacts/
│   └── claudectx-backup/
│       ├── worker/              # Background worker
│       │   └── src/
│       │       ├── index.ts     # Entry point
│       │       ├── api.ts       # REST API
│       │       ├── db.ts        # Database layer
│       │       ├── summarizer.ts # AI summarization
│       │       └── types.ts     # TypeScript types
│       └── dashboard/           # Web dashboard
│           └── src/
│               ├── App.tsx      # Main component
│               ├── components/  # React components
│               ├── hooks/       # Custom hooks
│               └── utils/       # Utilities
├── docs/                        # Documentation
├── scripts/                     # Build scripts
└── README.md`}</CodeBlock>

      {/* Running Locally */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Running Locally</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <InfoCard title="Terminal 1 — Worker" items={["cd artifacts/claudectx-backup", "pnpm run dev:worker"]} />
        <InfoCard title="Terminal 2 — Dashboard" items={["cd artifacts/claudectx-backup", "pnpm run dev:dashboard"]} />
        <InfoCard title="Terminal 3 — Watch" items={["pnpm run dev", "(optional — runs all)"]} />
      </div>

      <div className="gradient-border p-5 mb-6">
        <h4 className="text-sm font-semibold text-foreground mb-3">Access Points</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Dashboard", url: "http://localhost:5173" },
            { label: "API", url: "http://localhost:9999/api" },
            { label: "Health Check", url: "http://localhost:9999/api/health" },
          ].map((a) => (
            <div key={a.label} className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-xs text-muted-foreground">{a.label}</span>
              <code className="block text-xs font-mono text-primary mt-1">{a.url}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Testing */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Testing</h3>

      <CodeBlock title="Test Commands">{`# Run all tests
pnpm test

# Specific package
pnpm --filter @memctx/worker test
pnpm --filter @memctx/dashboard test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e`}</CodeBlock>

      {/* Building */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Building</h3>

      <CodeBlock title="Build Commands">{`# Development build
pnpm run build

# Build specific package
pnpm --filter @memctx/worker build
pnpm --filter @memctx/dashboard build

# Production build
pnpm run clean
NODE_ENV=production pnpm run build`}</CodeBlock>

      {/* Debugging */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Debugging</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InfoCard
          title="Worker Debugging"
          items={[
            "node --inspect dist/index.js → chrome://inspect",
            "VS Code: F5 with 'Debug Worker' config",
            "MEMCTX_LOG_LEVEL=debug pnpm run dev:worker",
          ]}
        />
        <InfoCard
          title="Dashboard Debugging"
          items={[
            "React DevTools browser extension",
            "Browser DevTools (F12) — Console, Network tabs",
            "DEBUG=vite:* pnpm run dev:dashboard",
          ]}
        />
        <InfoCard
          title="Database Debugging"
          items={[
            "sqlite3 ~/.memctx/sessions.db",
            ".schema to view tables",
            "PRAGMA integrity_check for validation",
          ]}
        />
        <InfoCard
          title="API Debugging"
          items={[
            "curl http://localhost:9999/api/health",
            "Import Postman collection from docs/api/",
            "Check /tmp/memctx.log for detailed logs",
          ]}
        />
      </div>

      {/* Common Issues */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Common Issues</h3>

      <CodeBlock title="Port Already in Use">{`lsof -i :9999
kill -9 <PID>
# Or use: MEMCTX_PORT=9998 pnpm run dev:worker`}</CodeBlock>

      <CodeBlock title="Build Failures">{`pnpm store prune
rm -rf node_modules
pnpm install
pnpm run clean && pnpm run build`}</CodeBlock>

      <CodeBlock title="Database Locked">{`pkill -f memctx
rm ~/.memctx/sessions.db-wal ~/.memctx/sessions.db-shm
pnpm run dev:worker`}</CodeBlock>

      {/* Daily Workflow */}
      <h3 className="text-xl font-bold text-foreground mb-4 mt-10">Development Workflow</h3>

      <CodeBlock title="Daily Workflow">{`# 1. Update from upstream
git checkout main && git pull upstream main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Develop
pnpm run dev

# 4. Test & lint
pnpm test && pnpm run lint && pnpm run typecheck

# 5. Commit & push
git add . && git commit -m "feat: add new feature"
git push origin feature/my-feature

# 6. Create PR on GitHub`}</CodeBlock>
    </div>
  );
}

export default Docs;
