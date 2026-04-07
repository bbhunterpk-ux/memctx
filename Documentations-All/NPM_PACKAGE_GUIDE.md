# ClaudeContext NPM Package Guide

## Overview
This guide explains how to package ClaudeContext as an NPM package that users can install globally and use with a simple `claudectx` command.

## Package Structure

```
claudectx/
├── package.json          # Main package config
├── bin/
│   └── claudectx.ts     # CLI entry point
├── src/
│   ├── index.ts         # Worker server
│   ├── hooks/           # Claude Code hooks
│   ├── api/             # API routes
│   ├── db/              # Database layer
│   └── services/        # Background services
├── dashboard/           # React dashboard
│   ├── src/
│   └── package.json
└── installer/           # Installation scripts
    ├── daemon.ts
    └── patch-settings.ts
```

## Step 1: Update package.json

```json
{
  "name": "claudectx",
  "version": "1.0.0",
  "description": "Autonomous session memory for Claude Code",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/claudectx.git"
  },
  "keywords": [
    "claude",
    "claude-code",
    "ai",
    "memory",
    "context",
    "session-tracking"
  ],
  "bin": {
    "claudectx": "./dist/bin/claudectx.js"
  },
  "main": "dist/index.js",
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "prepublishOnly": "pnpm run build",
    "build": "pnpm run build:worker && pnpm run build:dashboard",
    "build:worker": "tsc -p tsconfig.worker.json",
    "build:dashboard": "cd dashboard && pnpm install && pnpm run build"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.26.0",
    "better-sqlite3": "^12.8.0",
    "chokidar": "^3.6.0",
    "express": "^4.19.2",
    "p-queue": "^8.0.1",
    "ws": "^8.17.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.0",
    "@types/ws": "^8.5.10",
    "typescript": "~5.9.2"
  }
}
```

## Step 2: Prepare for Publishing

### 2.1 Create .npmignore

```
# Source files
src/
dashboard/src/
*.ts
tsconfig*.json

# Development
node_modules/
.git/
.github/
*.log
*.tmp

# Keep only dist
!dist/
```

### 2.2 Add README.md

Create a comprehensive README with:
- Installation instructions
- Quick start guide
- Configuration options
- CLI commands
- Dashboard features
- Troubleshooting

### 2.3 Add LICENSE

Choose a license (MIT recommended):

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy...
```

## Step 3: Build the Package

```bash
# Install dependencies
cd artifacts/claudectx-backup
pnpm install

# Build worker and dashboard
pnpm run build

# Verify dist/ contains:
# - dist/bin/claudectx.js (CLI)
# - dist/src/index.js (Worker)
# - dist/src/hooks/*.js (Hooks)
# - dashboard/dist/ (Built dashboard)
```

## Step 4: Test Locally

```bash
# Link package locally
npm link

# Test CLI commands
claudectx --help
claudectx install
claudectx status
claudectx open

# Unlink when done testing
npm unlink -g claudectx
```

## Step 5: Publish to NPM

### 5.1 Create NPM Account
```bash
npm login
```

### 5.2 Publish Package
```bash
# Dry run first (see what will be published)
npm publish --dry-run

# Publish for real
npm publish

# For scoped packages (e.g., @yourname/claudectx)
npm publish --access public
```

## Step 6: User Installation

Once published, users can install with:

```bash
# Global installation
npm install -g claudectx

# Or with pnpm
pnpm add -g claudectx

# Or with yarn
yarn global add claudectx
```

## Usage After Installation

```bash
# Install and setup
claudectx install

# Start the service
claudectx start

# Check status
claudectx status

# Open dashboard
claudectx open

# Stop service
claudectx stop

# Uninstall
claudectx uninstall
```

## Step 7: Version Updates

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Publish update
npm publish
```

## Important Considerations

### 1. Binary Dependencies
- `better-sqlite3` requires native compilation
- Users need build tools installed:
  - **Linux**: `build-essential`, `python3`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio Build Tools

### 2. Postinstall Script (Optional)
Add to package.json:
```json
{
  "scripts": {
    "postinstall": "node dist/bin/claudectx.js install"
  }
}
```

### 3. Environment Variables
Document required env vars:
- `ANTHROPIC_API_KEY` - For AI summaries
- `CLAUDECTX_PORT` - Custom port (default: 9999)
- `CLAUDECTX_DB_PATH` - Custom database location

### 4. Platform Support
Test on:
- Linux (Ubuntu, Debian, Arch)
- macOS (Intel, Apple Silicon)
- Windows (WSL recommended)

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
pnpm install
pnpm run build
```

### SQLite Compilation Issues
```bash
# Rebuild native modules
npm rebuild better-sqlite3
```

### Permission Errors
```bash
# Fix npm permissions
sudo chown -R $USER ~/.npm
```

## Advanced: CI/CD Publishing

### GitHub Actions Example
```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Package Maintenance

### Regular Updates
- Keep dependencies updated
- Monitor security vulnerabilities
- Respond to issues on GitHub
- Update documentation

### Deprecation
```bash
# Deprecate old version
npm deprecate claudectx@1.0.0 "Please upgrade to 1.1.0"

# Unpublish (within 72 hours only)
npm unpublish claudectx@1.0.0
```

## Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [NPM CLI Documentation](https://docs.npmjs.com/cli/)
