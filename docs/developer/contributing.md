# 🤝 Contributing Guide

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [🏗️ Architecture](architecture.md) • [🔧 Development Setup](development.md)

</div>

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Community Guidelines](#community-guidelines)

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git
- Anthropic API key

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/memctx.git
cd memctx

# Add upstream remote
git remote add upstream https://github.com/bbhunterpk-ux/memctx.git
```

### Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Build all packages
pnpm run build
```

### Set Up Environment

```bash
# Copy example env file
cp .env.example .env

# Add your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

---

## Development Workflow

### Create a Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Make Changes

```bash
# Start development servers
pnpm run dev

# Worker (in one terminal)
cd artifacts/claudectx-backup
pnpm run dev:worker

# Dashboard (in another terminal)
cd artifacts/claudectx-backup
pnpm run dev:dashboard
```

### Test Your Changes

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @memctx/worker test

# Run with coverage
pnpm test:coverage
```

### Commit Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(worker): add batch summarization"
git commit -m "fix(dashboard): resolve session filter bug"
git commit -m "docs(api): update endpoint documentation"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

---

## Code Standards

### TypeScript

```typescript
// Use strict mode
"strict": true

// Prefer interfaces over types
interface Session {
  id: string
  projectId: string
}

// Use explicit return types
function getSession(id: string): Promise<Session | null> {
  // ...
}

// Avoid any, use unknown
function parseData(data: unknown): Session {
  // ...
}
```

### Naming Conventions

```typescript
// PascalCase for types/interfaces/classes
interface SessionData {}
class SessionManager {}

// camelCase for variables/functions
const sessionId = "abc123"
function getSessions() {}

// UPPER_SNAKE_CASE for constants
const MAX_SESSIONS = 100
const API_BASE_URL = "http://localhost:9999"

// kebab-case for files
session-manager.ts
api-client.ts
```

### File Organization

```
src/
├── types/          # TypeScript types
├── utils/          # Utility functions
├── services/       # Business logic
├── api/            # API routes
├── db/             # Database layer
└── index.ts        # Entry point
```

### Code Style

```typescript
// Use const by default
const sessions = await getSessions()

// Destructure when possible
const { id, projectId } = session

// Use async/await over promises
async function loadSession(id: string) {
  const session = await db.getSession(id)
  return session
}

// Early returns
function validateSession(session: Session): boolean {
  if (!session.id) return false
  if (!session.projectId) return false
  return true
}

// Avoid deep nesting
async function processSession(id: string) {
  const session = await getSession(id)
  if (!session) return null
  
  const summary = await summarize(session)
  if (!summary) return null
  
  return { session, summary }
}
```

---

## Testing

### Unit Tests

```typescript
// Use Vitest
import { describe, it, expect } from 'vitest'
import { SessionManager } from './session-manager'

describe('SessionManager', () => {
  it('should create a session', async () => {
    const manager = new SessionManager()
    const session = await manager.create({
      projectId: 'proj_xyz',
      startTime: Date.now()
    })
    
    expect(session.id).toBeDefined()
    expect(session.projectId).toBe('proj_xyz')
  })
})
```

### Integration Tests

```typescript
// Test API endpoints
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from './api'

describe('Sessions API', () => {
  it('GET /api/sessions should return sessions', async () => {
    const response = await request(app)
      .get('/api/sessions')
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })
})
```

### E2E Tests

```typescript
// Use Playwright
import { test, expect } from '@playwright/test'

test('dashboard loads sessions', async ({ page }) => {
  await page.goto('http://localhost:9999')
  
  await expect(page.locator('h1')).toContainText('Sessions')
  await expect(page.locator('.session-item')).toHaveCount(5)
})
```

### Test Coverage

Aim for 80%+ coverage:

```bash
# Run with coverage
pnpm test:coverage

# View coverage report
open coverage/index.html
```

---

## Pull Request Process

### Before Submitting

- [ ] Tests pass: `pnpm test`
- [ ] Linting passes: `pnpm lint`
- [ ] Types check: `pnpm typecheck`
- [ ] Build succeeds: `pnpm build`
- [ ] Documentation updated
- [ ] Changelog updated (if applicable)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Follows code standards
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks:** CI runs tests, linting, type checking
2. **Code Review:** Maintainer reviews code
3. **Feedback:** Address review comments
4. **Approval:** Maintainer approves PR
5. **Merge:** Squash and merge to main

### After Merge

```bash
# Update your fork
git checkout main
git pull upstream main
git push origin main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

### Communication

- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** Questions, ideas, general discussion
- **Discord:** Real-time chat, community support
- **Email:** security@memctx.dev for security issues

### Issue Guidelines

**Bug Reports:**

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Environment**
- OS: [e.g. macOS 14.0]
- Node: [e.g. 18.17.0]
- MemCTX: [e.g. 1.0.0]

**Additional context**
Logs, screenshots, etc.
```

**Feature Requests:**

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives**
Other approaches considered

**Additional Context**
Examples, mockups, etc.
```

---

## Development Tips

### Debugging

```bash
# Enable debug logging
MEMCTX_LOG_LEVEL=debug pnpm run dev:worker

# Use Node debugger
node --inspect artifacts/claudectx-backup/worker/dist/index.js

# Chrome DevTools
chrome://inspect
```

### Database Inspection

```bash
# Open database
sqlite3 ~/.memctx/sessions.db

# View schema
.schema

# Query sessions
SELECT * FROM sessions ORDER BY startTime DESC LIMIT 10;
```

### Hot Reload

```bash
# Worker auto-restarts on changes
pnpm run dev:worker

# Dashboard hot-reloads
pnpm run dev:dashboard
```

---

## Release Process

(For maintainers)

```bash
# Update version
pnpm version patch|minor|major

# Build all packages
pnpm run build

# Run tests
pnpm test

# Publish to NPM
pnpm publish -r

# Create GitHub release
gh release create v1.0.0 --generate-notes
```

---

## Next Steps

- [🔧 Development Setup](development.md) - Detailed setup guide
- [🏗️ Architecture](architecture.md) - Understand the codebase
- [🔌 API Reference](api-reference.md) - API documentation

---

## Recognition

Contributors are recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes

Thank you for contributing! 🎉

---

<div align="center">

**Questions?** [Open an issue](https://github.com/bbhunterpk-ux/memctx/issues) • [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</div>
