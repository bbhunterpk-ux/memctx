# 🔧 Development Setup

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [🏗️ Architecture](architecture.md) • [🤝 Contributing](contributing.md)

</div>

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Environment](#development-environment)
- [Running Locally](#running-locally)
- [Building](#building)
- [Testing](#testing)
- [Debugging](#debugging)

---

## Prerequisites

### Required

- **Node.js** 18.0.0 or higher
- **pnpm** 8.0.0 or higher
- **Git** 2.30.0 or higher

### Optional

- **VS Code** (recommended IDE)
- **SQLite Browser** (for database inspection)
- **Postman** or **Insomnia** (for API testing)

### Install Prerequisites

**macOS:**

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install pnpm
npm install -g pnpm

# Install Git
brew install git
```

**Linux:**

```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Git
sudo apt-get install git
```

**Windows:**

```powershell
# Install via Chocolatey
choco install nodejs-lts pnpm git

# Or download installers:
# Node.js: https://nodejs.org/
# Git: https://git-scm.com/
# pnpm: npm install -g pnpm
```

---

## Initial Setup

### 1. Clone Repository

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/memctx.git
cd memctx

# Add upstream remote
git remote add upstream https://github.com/bbhunterpk-ux/memctx.git
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm --version
node --version
```

### 3. Configure Environment

```bash
# Create environment file
cat > .env << EOF
ANTHROPIC_API_KEY=sk-ant-your-key-here
MEMCTX_PORT=9999
MEMCTX_LOG_LEVEL=debug
EOF

# Set permissions
chmod 600 .env
```

### 4. Build Packages

```bash
# Build all packages
pnpm run build

# Verify build
ls -la artifacts/claudectx-backup/worker/dist
ls -la artifacts/claudectx-backup/dashboard/dist
```

---

## Development Environment

### VS Code Setup

**Install Extensions:**

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
```

**Workspace Settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**Launch Configuration** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Worker",
      "program": "${workspaceFolder}/artifacts/claudectx-backup/worker/src/index.ts",
      "preLaunchTask": "npm: build:worker",
      "outFiles": ["${workspaceFolder}/artifacts/claudectx-backup/worker/dist/**/*.js"],
      "envFile": "${workspaceFolder}/.env"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Dashboard",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/artifacts/claudectx-backup/dashboard"
    }
  ]
}
```

### Project Structure

```
memctx/
├── artifacts/
│   └── claudectx-backup/
│       ├── worker/              # Background worker
│       │   ├── src/
│       │   │   ├── index.ts     # Entry point
│       │   │   ├── api.ts       # REST API
│       │   │   ├── db.ts        # Database layer
│       │   │   ├── summarizer.ts # AI summarization
│       │   │   └── types.ts     # TypeScript types
│       │   ├── package.json
│       │   └── tsconfig.json
│       └── dashboard/           # Web dashboard
│           ├── src/
│           │   ├── App.tsx      # Main component
│           │   ├── main.tsx     # Entry point
│           │   ├── components/  # React components
│           │   ├── hooks/       # Custom hooks
│           │   ├── utils/       # Utilities
│           │   └── types.ts     # TypeScript types
│           ├── package.json
│           └── vite.config.ts
├── docs/                        # Documentation
├── scripts/                     # Build scripts
├── package.json                 # Root package.json
├── pnpm-workspace.yaml          # Workspace config
└── README.md
```

---

## Running Locally

### Start Development Servers

**Terminal 1 - Worker:**

```bash
cd artifacts/claudectx-backup
pnpm run dev:worker
```

**Terminal 2 - Dashboard:**

```bash
cd artifacts/claudectx-backup
pnpm run dev:dashboard
```

**Terminal 3 - Watch Mode (optional):**

```bash
pnpm run dev
```

### Access Services

- **Dashboard:** http://localhost:5173
- **API:** http://localhost:9999/api
- **Health Check:** http://localhost:9999/api/health

### Hot Reload

Both worker and dashboard support hot reload:

- **Worker:** Auto-restarts on file changes
- **Dashboard:** Instant HMR updates

---

## Building

### Development Build

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm --filter @memctx/worker build
pnpm --filter @memctx/dashboard build
```

### Production Build

```bash
# Clean previous builds
pnpm run clean

# Build for production
NODE_ENV=production pnpm run build

# Verify build
ls -la artifacts/claudectx-backup/worker/dist
ls -la artifacts/claudectx-backup/dashboard/dist
```

### Build Scripts

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "build:worker": "pnpm --filter @memctx/worker build",
    "build:dashboard": "pnpm --filter @memctx/dashboard build",
    "clean": "pnpm -r clean && rm -rf dist",
    "dev": "pnpm -r --parallel dev",
    "dev:worker": "pnpm --filter @memctx/worker dev",
    "dev:dashboard": "pnpm --filter @memctx/dashboard dev"
  }
}
```

---

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @memctx/worker test
pnpm --filter @memctx/dashboard test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Test Structure

```
worker/
├── src/
│   ├── __tests__/
│   │   ├── api.test.ts
│   │   ├── db.test.ts
│   │   └── summarizer.test.ts
│   └── ...
└── vitest.config.ts

dashboard/
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       ├── SessionList.test.tsx
│   │       └── ProjectCard.test.tsx
│   └── ...
└── vitest.config.ts
```

### E2E Tests

```bash
# Install Playwright
pnpm --filter @memctx/dashboard exec playwright install

# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug
```

---

## Debugging

### Worker Debugging

**Node Inspector:**

```bash
# Start with inspector
node --inspect artifacts/claudectx-backup/worker/dist/index.js

# Open Chrome DevTools
# Navigate to: chrome://inspect
```

**VS Code Debugger:**

1. Set breakpoints in source files
2. Press F5 or select "Debug Worker"
3. Debugger attaches automatically

**Debug Logging:**

```bash
# Enable debug logs
MEMCTX_LOG_LEVEL=debug pnpm run dev:worker

# View logs
tail -f /tmp/memctx.log
```

### Dashboard Debugging

**React DevTools:**

```bash
# Install extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

**Browser DevTools:**

1. Open dashboard in browser
2. Press F12 to open DevTools
3. Use Console, Network, and React tabs

**Vite Debug Mode:**

```bash
# Start with debug output
DEBUG=vite:* pnpm run dev:dashboard
```

### Database Debugging

**SQLite CLI:**

```bash
# Open database
sqlite3 ~/.memctx/sessions.db

# View schema
.schema

# Query data
SELECT * FROM sessions ORDER BY startTime DESC LIMIT 10;

# Check integrity
PRAGMA integrity_check;

# Exit
.quit
```

**DB Browser for SQLite:**

```bash
# Install
brew install --cask db-browser-for-sqlite  # macOS
sudo apt install sqlitebrowser              # Linux

# Open database
sqlitebrowser ~/.memctx/sessions.db
```

### API Debugging

**cURL:**

```bash
# Health check
curl http://localhost:9999/api/health

# List sessions
curl http://localhost:9999/api/sessions

# Create session
curl -X POST http://localhost:9999/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj_xyz","startTime":1712491505984}'
```

**Postman/Insomnia:**

Import collection from `docs/api/postman-collection.json`

---

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :9999

# Kill process
kill -9 <PID>

# Or use different port
MEMCTX_PORT=9998 pnpm run dev:worker
```

### Build Failures

```bash
# Clear cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild
pnpm run clean
pnpm run build
```

### TypeScript Errors

```bash
# Check types
pnpm run typecheck

# Restart TS server (VS Code)
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Database Locked

```bash
# Stop all processes
pkill -f memctx

# Remove lock files
rm ~/.memctx/sessions.db-wal
rm ~/.memctx/sessions.db-shm

# Restart
pnpm run dev:worker
```

---

## Development Workflow

### Daily Workflow

```bash
# 1. Update from upstream
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Start development
pnpm run dev

# 4. Make changes and test
pnpm test

# 5. Commit changes
git add .
git commit -m "feat: add new feature"

# 6. Push to fork
git push origin feature/my-feature

# 7. Create pull request on GitHub
```

### Code Quality Checks

```bash
# Lint code
pnpm run lint

# Fix lint issues
pnpm run lint:fix

# Format code
pnpm run format

# Type check
pnpm run typecheck

# Run all checks
pnpm run check
```

---

## Next Steps

- [🤝 Contributing Guide](contributing.md) - Contribution guidelines
- [🏗️ Architecture](architecture.md) - System architecture
- [🔌 API Reference](api-reference.md) - API documentation

---

<div align="center">

**Questions?** [Open an issue](https://github.com/bbhunterpk-ux/memctx/issues) • [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</div>
