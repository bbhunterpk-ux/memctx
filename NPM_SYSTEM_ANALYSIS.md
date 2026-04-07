# NPM Build & Publish System Analysis

**Project:** MemCTX (formerly ClaudeContext)  
**Analysis Date:** 2026-04-07  
**Status:** Ready for NPM publication

---

## 1. Package Overview

### Package Identity
- **Name:** `memctx` (can be scoped as `@username/memctx`)
- **Version:** 1.0.0
- **Type:** Global CLI tool + background service
- **License:** MIT
- **Main Entry:** `dist/index.js` (worker)
- **Binary:** `dist/bin/claudectx.js` (CLI)

### What It Does
MemCTX is an autonomous session memory system for Claude Code that:
- Captures Claude Code sessions via hooks
- Generates AI-powered summaries using Anthropic API
- Provides a React dashboard for browsing history
- Injects relevant context into new sessions

---

## 2. Monorepo Structure

This is a **pnpm workspace monorepo** with multiple packages:

```
Claude-Context/
├── package.json                    # Root workspace config (private)
├── pnpm-workspace.yaml            # Workspace definition
├── artifacts/
│   ├── claudectx-backup/          # 📦 PUBLISHABLE PACKAGE
│   ├── api-server/                # Private workspace package
│   └── mockup-sandbox/            # Private workspace package
├── lib/
│   ├── db/                        # Private workspace package
│   ├── api-zod/                   # Private workspace package
│   ├── api-spec/                  # Private workspace package
│   └── api-client-react/          # Private workspace package
└── scripts/                       # Private workspace package
```

### Key Point
**Only `artifacts/claudectx-backup/` is intended for NPM publication.** All other packages are private workspace dependencies.

---

## 3. Build System Architecture

### 3.1 Root Level Build
```json
// Root package.json scripts
{
  "build": "pnpm run typecheck && pnpm -r --if-present run build",
  "typecheck": "pnpm run typecheck:libs && pnpm -r --filter \"./artifacts/**\" --filter \"./scripts\" --if-present run typecheck"
}
```

**What it does:**
1. Type-checks all TypeScript in workspace
2. Recursively builds all packages that have a `build` script

### 3.2 MemCTX Package Build
```json
// artifacts/claudectx-backup/package.json
{
  "scripts": {
    "prepublishOnly": "pnpm run build",
    "build": "pnpm run build:worker && pnpm run build:dashboard",
    "build:worker": "tsc -p tsconfig.worker.json",
    "build:dashboard": "cd dashboard && pnpm install && pnpm vite build"
  }
}
```

**Build Process:**

#### Step 1: Worker Build (`build:worker`)
- **Input:** TypeScript source files in `src/`, `bin/`, `installer/`
- **Compiler:** TypeScript (`tsc`)
- **Config:** `tsconfig.worker.json`
- **Output:** Compiled JavaScript in `dist/`
  ```
  dist/
  ├── bin/
  │   └── claudectx.js          # CLI entry point
  ├── src/
  │   ├── index.js              # Worker server
  │   ├── config.js
  │   ├── hooks/                # Claude Code hooks
  │   ├── api/                  # Express routes
  │   ├── db/                   # SQLite layer
  │   └── services/             # Background services
  └── installer/
      ├── daemon.js
      └── patch-settings.js
  ```

#### Step 2: Dashboard Build (`build:dashboard`)
- **Input:** React app in `dashboard/src/`
- **Bundler:** Vite
- **Output:** Static files in `dashboard/dist/`
  ```
  dashboard/dist/
  ├── index.html
  └── assets/
      ├── index-[hash].js
      └── index-[hash].css
  ```

### 3.3 TypeScript Configuration

**tsconfig.json** (base config):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",           // CommonJS for Node.js
    "moduleResolution": "node",
    "strict": false,                // Relaxed for faster dev
    "outDir": "dist",
    "rootDir": ".",
    "sourceMap": true,              // For debugging
    "declaration": true             // Generate .d.ts files
  },
  "include": ["src/**/*", "bin/**/*", "installer/**/*"],
  "exclude": ["node_modules", "dist", "dashboard"]
}
```

**tsconfig.worker.json** (extends base):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src/**/*", "bin/**/*", "installer/**/*"]
}
```

---

## 4. Package Files Configuration

### 4.1 What Gets Published

**package.json `files` field:**
```json
{
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ]
}
```

### 4.2 What Gets Excluded

**.npmignore:**
```
# Source files (not needed in published package)
src/
dashboard/src/
*.ts
!*.d.ts
tsconfig*.json

# Development files
node_modules/
.git/
*.log
.env

# Keep only dist/
!dist/
```

**Result:** Published package contains only:
- `dist/` - Compiled JavaScript
- `dashboard/dist/` - Built React app (served by worker)
- `README.md` - Documentation
- `LICENSE` - MIT license

**Package size:** ~2-3 MB

---

## 5. Dependencies

### 5.1 Runtime Dependencies
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.26.0",      // AI summaries
    "@types/better-sqlite3": "^7.6.13",
    "better-sqlite3": "^12.8.0",         // ⚠️ Native module
    "chokidar": "^3.6.0",                // File watching
    "express": "^4.19.2",                // Web server
    "p-queue": "^8.0.1",                 // Queue management
    "ws": "^8.17.0"                      // WebSocket
  }
}
```

**Critical:** `better-sqlite3` requires native compilation. Users need build tools:
- **Linux:** `build-essential`, `python3`
- **macOS:** Xcode Command Line Tools
- **Windows:** Visual Studio Build Tools

### 5.2 Dev Dependencies
```json
{
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.0",
    "@types/ws": "^8.5.10",
    "tsx": "catalog:",                   // From workspace catalog
    "typescript": "~5.9.2"
  }
}
```

### 5.3 Workspace Catalog
The monorepo uses a **pnpm catalog** for version consistency:

```yaml
# pnpm-workspace.yaml
catalog:
  '@types/node': ^25.3.3
  react: 19.1.0
  tsx: ^4.21.0
  vite: ^7.3.0
  # ... etc
```

Dependencies marked `"catalog:"` pull versions from this central definition.

---

## 6. CLI System

### 6.1 Binary Entry Point

**package.json:**
```json
{
  "bin": {
    "memctx": "./dist/bin/claudectx.js"
  }
}
```

When installed globally (`npm install -g memctx`), this creates a `memctx` command.

### 6.2 CLI Commands

**bin/claudectx.ts** provides:

```bash
memctx install      # Install hooks, start daemon
memctx uninstall    # Remove hooks, stop daemon
memctx start        # Start worker daemon
memctx stop         # Stop worker daemon
memctx restart      # Restart daemon
memctx status       # Health check
memctx open         # Open dashboard in browser
memctx search       # Search sessions
memctx export       # Export as markdown
memctx config       # Show configuration
```

### 6.3 Installation Flow

When user runs `memctx install`:

1. **Create directories:**
   - `~/.memctx/` (data directory)
   - `~/.memctx/hooks/` (hook scripts)
   - `~/.memctx/logs/` (log files)

2. **Copy hooks:**
   - Copies `dist/src/hooks/*.js` to `~/.memctx/hooks/`

3. **Patch Claude settings:**
   - Modifies `~/.claude/settings.json`
   - Registers hooks for session events

4. **Start daemon:**
   - Spawns `node dist/src/index.js` as background process
   - Listens on port 9999 (default)

---

## 7. Publishing Workflow

### 7.1 Pre-Publish Checklist

**Automated script:** `publish-check.sh`

Verifies:
- ✅ All required files exist
- ✅ package.json metadata is updated
- ✅ Logged into NPM (`npm whoami`)
- ✅ Package name availability
- ✅ Build output is valid
- ✅ Dry-run publish succeeds

### 7.2 Publishing Steps

```bash
# 1. Navigate to package
cd artifacts/claudectx-backup

# 2. Update metadata (REQUIRED)
# Edit package.json:
#   - name: "memctx" or "@username/memctx"
#   - author: "Your Name <email>"
#   - repository.url: "https://github.com/username/memctx"

# 3. Build everything
pnpm run build

# 4. Test locally
npm link
memctx install
memctx status
npm unlink -g memctx

# 5. Login to NPM
npm login

# 6. Run pre-publish check
./publish-check.sh

# 7. Dry run
npm publish --dry-run

# 8. Publish!
npm publish                    # For unscoped package
# OR
npm publish --access public    # For scoped package (@username/memctx)
```

### 7.3 Automated Publishing Script

**publish.sh** provides interactive workflow:
- Guides through all steps
- Validates metadata
- Rebuilds if needed
- Checks NPM login
- Verifies package name
- Runs dry-run
- Confirms before publishing

Usage:
```bash
./publish.sh
```

---

## 8. Version Management

### 8.1 Semantic Versioning

```bash
# Patch release (1.0.0 → 1.0.1) - Bug fixes only
npm version patch
npm publish
git push && git push --tags

# Minor release (1.0.0 → 1.1.0) - New features, backwards compatible
npm version minor
npm publish
git push && git push --tags

# Major release (1.0.0 → 2.0.0) - Breaking changes
npm version major
npm publish
git push && git push --tags
```

### 8.2 prepublishOnly Hook

```json
{
  "scripts": {
    "prepublishOnly": "pnpm run build"
  }
}
```

**Automatically runs before `npm publish`** to ensure fresh build.

---

## 9. User Installation Experience

### 9.1 Installation

```bash
npm install -g memctx
```

**What happens:**
1. NPM downloads package from registry
2. Installs to global node_modules
3. Creates `memctx` symlink in PATH
4. Compiles native modules (`better-sqlite3`)

### 9.2 Setup

```bash
memctx install
```

**What happens:**
1. Creates `~/.memctx/` directory structure
2. Copies hook scripts
3. Patches `~/.claude/settings.json`
4. Starts worker daemon
5. Dashboard available at `http://localhost:9999`

### 9.3 Usage

```bash
# Claude Code sessions are now automatically captured
# View in dashboard
memctx open

# Or search from CLI
memctx search "authentication bug"
```

---

## 10. Configuration System

### 10.1 Configuration Sources (Priority Order)

1. **Settings Dashboard** (highest priority)
   - File: `~/.memctx/settings.json`
   - UI: `http://localhost:9999/settings`
   - Persists across restarts

2. **Environment Variables**
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   export ANTHROPIC_BASE_URL="https://proxy.com/v1"
   export CLAUDECTX_PORT=8080
   export CLAUDECTX_DB_PATH="/custom/path/db.sqlite"
   ```

3. **Defaults** (lowest priority)
   - Port: 9999
   - DB: `~/.memctx/db.sqlite`
   - Context sessions: 3

### 10.2 Configuration File

**~/.memctx/settings.json:**
```json
{
  "apiProvider": "direct",
  "apiKey": "sk-ant-...",
  "baseUrl": "",
  "model": "claude-opus-4",
  "disableSummaries": false
}
```

---

## 11. Architecture

### 11.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code CLI                       │
│                  (User's terminal)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Hooks fire on events:
                     │ - session-start
                     │ - session-end
                     │ - post-tool-use
                     │ - stop
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              ~/.memctx/hooks/*.js                        │
│         (Registered in ~/.claude/settings.json)          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP POST to localhost:9999
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  MemCTX Worker                           │
│              (node dist/src/index.js)                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Express Server (port 9999)                      │  │
│  │  - API routes (/api/*)                           │  │
│  │  - Serves dashboard (/)                          │  │
│  │  - WebSocket for live updates                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Background Services                             │  │
│  │  - Session timeout checker                       │  │
│  │  - Summarization queue                           │  │
│  │  - Context builder                               │  │
│  │  - CLAUDE.md updater                             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Database Layer (better-sqlite3)                 │  │
│  │  - sessions table                                │  │
│  │  - observations table                            │  │
│  │  - projects table                                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Calls Anthropic API
                     │ for summarization
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Anthropic API / Proxy                       │
│           (Claude Opus/Sonnet/Haiku)                     │
└─────────────────────────────────────────────────────────┘

                     ▲
                     │
                     │ User browses
                     │
┌─────────────────────────────────────────────────────────┐
│                  Dashboard (React)                       │
│              http://localhost:9999                       │
│                                                          │
│  Pages: Projects | Search | Live | Metrics | Settings   │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Data Flow

**Session Capture:**
1. User starts Claude Code session
2. `session-start` hook fires → POST to worker
3. Worker creates session record in SQLite
4. User interacts with Claude
5. `post-tool-use` hook fires → POST observations
6. Worker stores observations
7. User ends session
8. `stop` hook fires → POST session end
9. Worker marks session complete
10. Summarization queue picks up session
11. Worker calls Anthropic API for summary
12. Summary stored in database
13. CLAUDE.md updated with session history

---

## 12. Documentation

### 12.1 Included Documentation

**In package:**
- `README.md` - User-facing documentation
  - Installation instructions
  - Quick start guide
  - CLI commands
  - Configuration
  - Troubleshooting
  - Architecture diagram

**In repository (not published):**
- `NPM_PACKAGE_GUIDE.md` - How to package for NPM
- `PUBLISHING_GUIDE.md` - Step-by-step publishing
- `READY_TO_PUBLISH.md` - Pre-publish checklist
- `NPM_SYSTEM_ANALYSIS.md` - This document

### 12.2 README Structure

1. **Overview** - What it does
2. **Features** - Key capabilities
3. **Installation** - How to install
4. **Quick Start** - Get running in 3 commands
5. **Requirements** - Node.js, build tools
6. **Configuration** - Settings dashboard + env vars
7. **CLI Commands** - All available commands
8. **Dashboard** - UI features
9. **How It Works** - Architecture explanation
10. **Troubleshooting** - Common issues
11. **Development** - For contributors
12. **License** - MIT

---

## 13. Security Considerations

### 13.1 Sensitive Data

**API Keys:**
- Stored in `~/.memctx/settings.json`
- Masked in API responses (`sk-ant-***`)
- Never logged or exposed in UI
- Not included in published package

**Session Data:**
- Stored locally in `~/.memctx/db.sqlite`
- Never sent to external services (except Anthropic for summaries)
- User controls data retention

### 13.2 Supply Chain Security

**pnpm-workspace.yaml:**
```yaml
minimumReleaseAge: 1440  # 24 hours
```

Prevents installing npm packages published less than 24 hours ago (supply chain attack defense).

---

## 14. Platform Support

### 14.1 Supported Platforms

- ✅ **Linux** (Ubuntu, Debian, Arch, Fedora, etc.)
- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Windows** (WSL recommended, native possible with build tools)

### 14.2 Node.js Requirements

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Requires Node.js 18+ for:
- Native fetch API
- Top-level await
- Modern ES2022 features

---

## 15. Known Issues & Limitations

### 15.1 Native Module Compilation

**Issue:** `better-sqlite3` requires native compilation  
**Impact:** Users without build tools will see installation errors  
**Mitigation:** Clear documentation of requirements

### 15.2 Port Conflicts

**Issue:** Default port 9999 may be in use  
**Impact:** Worker fails to start  
**Mitigation:** Configurable via `CLAUDECTX_PORT` env var

### 15.3 API Costs

**Issue:** AI summaries cost money (Anthropic API)  
**Impact:** Users may incur unexpected costs  
**Mitigation:** 
- Disable summaries option in settings
- Clear documentation of API usage
- Queue system prevents spam

---

## 16. Testing Strategy

### 16.1 Local Testing

```bash
# Link package locally
cd artifacts/claudectx-backup
npm link

# Test installation
memctx install

# Test commands
memctx status
memctx open
memctx search "test"

# Unlink when done
npm unlink -g memctx
```

### 16.2 Dry Run Publishing

```bash
npm publish --dry-run
```

Shows exactly what will be published without uploading.

### 16.3 Test Installation from NPM

After publishing:
```bash
# Install from registry
npm install -g memctx

# Verify it works
memctx --help
memctx install
```

---

## 17. Maintenance & Updates

### 17.1 Dependency Updates

```bash
# Check for outdated dependencies
pnpm outdated

# Update dependencies
pnpm update

# Rebuild and test
pnpm run build
npm link
memctx install
```

### 17.2 Security Audits

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit --fix
```

### 17.3 Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run full build
- [ ] Test locally with `npm link`
- [ ] Run `publish-check.sh`
- [ ] Publish to NPM
- [ ] Create git tag
- [ ] Create GitHub release
- [ ] Test installation from NPM
- [ ] Update documentation if needed

---

## 18. Future Improvements

### 18.1 Potential Enhancements

1. **Pre-built binaries** - Avoid native compilation
2. **Docker image** - Easier deployment
3. **Cloud sync** - Sync sessions across machines
4. **Team features** - Share sessions with team
5. **Plugin system** - Extensible architecture
6. **VS Code extension** - Integrate with IDE

### 18.2 Build Optimizations

1. **Bundle size reduction** - Tree-shaking, minification
2. **Faster builds** - Incremental compilation
3. **CI/CD pipeline** - Automated testing and publishing
4. **Multi-platform binaries** - pkg or nexe

---

## 19. Summary

### Current State: ✅ Ready for Publication

**What's Complete:**
- ✅ Package structure configured
- ✅ Build system working
- ✅ CLI commands implemented
- ✅ Documentation written
- ✅ Publishing scripts created
- ✅ .npmignore configured
- ✅ LICENSE added (MIT)

**What's Needed Before Publishing:**
1. Update `package.json` metadata (author, repository URL)
2. Choose package name (check availability)
3. Run `./publish-check.sh`
4. Execute `npm publish`

**Estimated Time to Publish:** 10-15 minutes

---

## 20. Quick Reference

### Build Commands
```bash
pnpm run build              # Build everything
pnpm run build:worker       # Build worker only
pnpm run build:dashboard    # Build dashboard only
pnpm run typecheck          # Type check all code
```

### Publishing Commands
```bash
npm login                   # Login to NPM
./publish-check.sh          # Pre-publish verification
npm publish --dry-run       # Test publish
npm publish                 # Publish unscoped
npm publish --access public # Publish scoped
```

### Version Commands
```bash
npm version patch           # 1.0.0 → 1.0.1
npm version minor           # 1.0.0 → 1.1.0
npm version major           # 1.0.0 → 2.0.0
```

### Testing Commands
```bash
npm link                    # Link locally
memctx install              # Test installation
npm unlink -g memctx        # Unlink
```

---

**End of Analysis**
