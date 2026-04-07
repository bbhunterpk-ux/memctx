# MemCTX NPM Package - Complete Flow Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MEMCTX NPM PACKAGE FLOW                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. DEVELOPMENT PHASE                                │
└─────────────────────────────────────────────────────────────────────────────┘

    Monorepo Structure
    ┌─────────────────────────────────────────────────────────────────┐
    │ Claude-Context/                                                 │
    │ ├── artifacts/                                                  │
    │ │   ├── claudectx-backup/  ◄─── PUBLISHABLE PACKAGE            │
    │ │   │   ├── src/           (TypeScript source)                 │
    │ │   │   ├── bin/           (CLI entry point)                   │
    │ │   │   ├── installer/     (Setup scripts)                     │
    │ │   │   ├── dashboard/     (React app)                         │
    │ │   │   ├── package.json   (Package metadata)                  │
    │ │   │   ├── tsconfig.json  (TypeScript config)                 │
    │ │   │   ├── .npmignore     (Exclude files)                     │
    │ │   │   ├── README.md      (User docs)                         │
    │ │   │   ├── LICENSE        (MIT)                               │
    │ │   │   ├── publish.sh     (Automated publish)                 │
    │ │   │   └── publish-check.sh (Pre-publish verify)              │
    │ │   ├── api-server/        (Private - not published)           │
    │ │   └── mockup-sandbox/    (Private - not published)           │
    │ ├── lib/                   (Private workspace packages)         │
    │ └── scripts/               (Private workspace package)          │
    └─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          2. BUILD PHASE                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    Command: pnpm run build
    
    ┌──────────────────────────────────────────────────────────────┐
    │ Step 1: build:worker                                         │
    │                                                              │
    │   Input:  src/**/*.ts, bin/**/*.ts, installer/**/*.ts       │
    │           ↓                                                  │
    │   Tool:   TypeScript Compiler (tsc)                         │
    │           ↓                                                  │
    │   Output: dist/**/*.js (CommonJS)                           │
    │           ├── dist/bin/claudectx.js    (CLI entry)          │
    │           ├── dist/src/index.js        (Worker server)      │
    │           ├── dist/src/hooks/*.js      (Claude hooks)       │
    │           ├── dist/src/api/*.js        (Express routes)     │
    │           ├── dist/src/db/*.js         (SQLite layer)       │
    │           ├── dist/src/services/*.js   (Background jobs)    │
    │           └── dist/installer/*.js      (Setup scripts)      │
    └──────────────────────────────────────────────────────────────┘
    
    ┌──────────────────────────────────────────────────────────────┐
    │ Step 2: build:dashboard                                      │
    │                                                              │
    │   Input:  dashboard/src/**/*.tsx                            │
    │           ↓                                                  │
    │   Tool:   Vite (bundler)                                    │
    │           ↓                                                  │
    │   Output: dashboard/dist/                                   │
    │           ├── index.html                                    │
    │           └── assets/                                       │
    │               ├── index-[hash].js                           │
    │               └── index-[hash].css                          │
    └──────────────────────────────────────────────────────────────┘

    Build Time: ~30-60 seconds
    Package Size: ~2-3 MB

┌─────────────────────────────────────────────────────────────────────────────┐
│                          3. PUBLISHING PHASE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    Option A: Automated Script
    ┌──────────────────────────────────────────────────────────────┐
    │ $ ./publish.sh                                               │
    │                                                              │
    │ 1. ✓ Verify directory                                       │
    │ 2. ✓ Check package.json metadata                            │
    │ 3. ✓ Rebuild (optional)                                     │
    │ 4. ✓ Verify build output                                    │
    │ 5. ✓ Check NPM login                                        │
    │ 6. ✓ Verify package name availability                       │
    │ 7. ✓ Dry run                                                │
    │ 8. ✓ Confirm & publish                                      │
    └──────────────────────────────────────────────────────────────┘

    Option B: Manual Steps
    ┌──────────────────────────────────────────────────────────────┐
    │ $ npm login                                                  │
    │ $ ./publish-check.sh                                         │
    │ $ npm publish --dry-run                                      │
    │ $ npm publish --access public                                │
    └──────────────────────────────────────────────────────────────┘

    What Gets Published:
    ┌──────────────────────────────────────────────────────────────┐
    │ memctx@1.0.0                                                 │
    │ ├── dist/                    (Compiled JS)                  │
    │ ├── dashboard/dist/          (Built React app)              │
    │ ├── README.md                (Documentation)                │
    │ ├── LICENSE                  (MIT)                          │
    │ └── package.json             (Metadata)                     │
    └──────────────────────────────────────────────────────────────┘

    Published to: https://www.npmjs.com/package/memctx

┌─────────────────────────────────────────────────────────────────────────────┐
│                          4. USER INSTALLATION                                │
└─────────────────────────────────────────────────────────────────────────────┘

    $ npm install -g memctx
    
    ┌──────────────────────────────────────────────────────────────┐
    │ NPM Registry                                                 │
    │   ↓ Download package                                         │
    │ Global node_modules                                          │
    │   ↓ Install dependencies                                     │
    │ Compile native modules (better-sqlite3)                      │
    │   ↓ Create symlink                                           │
    │ /usr/local/bin/memctx → node_modules/memctx/dist/bin/...    │
    └──────────────────────────────────────────────────────────────┘

    Result: `memctx` command available globally

┌─────────────────────────────────────────────────────────────────────────────┐
│                          5. USER SETUP                                       │
└─────────────────────────────────────────────────────────────────────────────┘

    $ memctx install
    
    ┌──────────────────────────────────────────────────────────────┐
    │ 1. Create directories                                        │
    │    ├── ~/.memctx/                                           │
    │    ├── ~/.memctx/hooks/                                     │
    │    └── ~/.memctx/logs/                                      │
    │                                                              │
    │ 2. Copy hook scripts                                         │
    │    dist/src/hooks/*.js → ~/.memctx/hooks/                   │
    │                                                              │
    │ 3. Patch Claude settings                                     │
    │    Register hooks in ~/.claude/settings.json                │
    │                                                              │
    │ 4. Start daemon                                              │
    │    node dist/src/index.js (background process)              │
    │                                                              │
    │ 5. Initialize database                                       │
    │    Create ~/.memctx/db.sqlite                               │
    └──────────────────────────────────────────────────────────────┘

    Result: MemCTX running on http://localhost:9999

┌─────────────────────────────────────────────────────────────────────────────┐
│                          6. RUNTIME ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │                    Claude Code CLI                          │
    │                  (User's terminal)                          │
    └────────────────────┬────────────────────────────────────────┘
                         │
                         │ Hooks fire on events:
                         │ - session-start
                         │ - session-end
                         │ - post-tool-use
                         │ - stop
                         │
                         ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              ~/.memctx/hooks/*.js                           │
    │         (Registered in ~/.claude/settings.json)             │
    └────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP POST to localhost:9999
                         │ (session data, observations)
                         │
                         ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                  MemCTX Worker                              │
    │              (node dist/src/index.js)                       │
    │                                                             │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │  Express Server (port 9999)                          │  │
    │  │  ├── GET  /                  → Dashboard HTML        │  │
    │  │  ├── GET  /api/sessions      → List sessions         │  │
    │  │  ├── POST /api/sessions      → Create session        │  │
    │  │  ├── GET  /api/health        → Health check          │  │
    │  │  └── WS   /ws                → Live updates          │  │
    │  └──────────────────────────────────────────────────────┘  │
    │                                                             │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │  Background Services                                 │  │
    │  │  ├── Session timeout checker (5 min idle)            │  │
    │  │  ├── Summarization queue (AI summaries)              │  │
    │  │  ├── Context builder (inject history)                │  │
    │  │  └── CLAUDE.md updater (auto-update)                 │  │
    │  └──────────────────────────────────────────────────────┘  │
    │                                                             │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │  SQLite Database (~/.memctx/db.sqlite)               │  │
    │  │  ├── sessions table                                  │  │
    │  │  ├── observations table                              │  │
    │  │  └── projects table                                  │  │
    │  └──────────────────────────────────────────────────────┘  │
    └────────────────────┬────────────────────────────────────────┘
                         │
                         │ Calls for AI summaries
                         │ (when session ends)
                         │
                         ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              Anthropic API / Proxy                          │
    │           (Claude Opus/Sonnet/Haiku)                        │
    │                                                             │
    │  POST /v1/messages                                          │
    │  {                                                          │
    │    "model": "claude-opus-4",                                │
    │    "messages": [{ "role": "user", "content": "..." }]      │
    │  }                                                          │
    │                                                             │
    │  Response: Structured summary                               │
    │  - Title                                                    │
    │  - What we did (bullet points)                              │
    │  - Next steps (bullet points)                               │
    │  - Gotchas (bullet points)                                  │
    └─────────────────────────────────────────────────────────────┘
                         ▲
                         │
                         │ User browses
                         │
    ┌─────────────────────────────────────────────────────────────┐
    │                  Dashboard (React)                          │
    │              http://localhost:9999                          │
    │                                                             │
    │  Pages:                                                     │
    │  ├── Projects    → Browse by project                        │
    │  ├── Search      → Full-text search                         │
    │  ├── Live        → Real-time monitoring                     │
    │  ├── Metrics     → Statistics                               │
    │  ├── Logs        → Service logs                             │
    │  └── Settings    → Configuration                            │
    │                                                             │
    │  Features:                                                  │
    │  ├── Session details with full transcript                   │
    │  ├── Tags and bookmarks                                     │
    │  ├── Custom notes                                           │
    │  ├── Export as markdown                                     │
    │  └── Dark/light theme                                       │
    └─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          7. DATA FLOW EXAMPLE                                │
└─────────────────────────────────────────────────────────────────────────────┘

    User starts Claude Code session
           ↓
    session-start hook fires
           ↓
    POST /api/sessions/start
           ↓
    Worker creates session record in SQLite
           ↓
    User interacts with Claude (writes code, asks questions)
           ↓
    post-tool-use hook fires (after each tool use)
           ↓
    POST /api/observations
           ↓
    Worker stores observations in SQLite
           ↓
    User ends session (Ctrl+C or closes terminal)
           ↓
    stop hook fires
           ↓
    POST /api/sessions/end
           ↓
    Worker marks session complete
           ↓
    Summarization queue picks up session
           ↓
    Worker calls Anthropic API with session transcript
           ↓
    AI generates structured summary
           ↓
    Worker stores summary in database
           ↓
    Worker updates CLAUDE.md with session history
           ↓
    Dashboard shows completed session with summary
           ↓
    Next session: relevant history auto-injected

┌─────────────────────────────────────────────────────────────────────────────┐
│                          8. VERSION UPDATES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    Bug Fix (1.0.0 → 1.0.1)
    ┌──────────────────────────────────────────────────────────────┐
    │ $ npm version patch                                          │
    │ $ npm publish                                                │
    │ $ git push && git push --tags                                │
    └──────────────────────────────────────────────────────────────┘

    New Feature (1.0.0 → 1.1.0)
    ┌──────────────────────────────────────────────────────────────┐
    │ $ npm version minor                                          │
    │ $ npm publish                                                │
    │ $ git push && git push --tags                                │
    └──────────────────────────────────────────────────────────────┘

    Breaking Change (1.0.0 → 2.0.0)
    ┌──────────────────────────────────────────────────────────────┐
    │ $ npm version major                                          │
    │ $ npm publish                                                │
    │ $ git push && git push --tags                                │
    └──────────────────────────────────────────────────────────────┘

    Users update:
    ┌──────────────────────────────────────────────────────────────┐
    │ $ npm update -g memctx                                       │
    │ $ memctx restart                                             │
    └──────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                              SUMMARY                                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Development → Build → Publish → Install → Setup → Runtime → Updates

✅ Monorepo with pnpm workspaces
✅ Two-stage build (TypeScript + Vite)
✅ Automated publishing scripts
✅ Global CLI tool with 10 commands
✅ Background worker service
✅ React dashboard
✅ SQLite database
✅ AI-powered summaries
✅ Comprehensive documentation

Status: PRODUCTION READY ✨
Time to publish: ~10 minutes
```
