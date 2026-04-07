# Contributing to MemCTX

<div align="center">

**Thank you for considering contributing to MemCTX!** 🎉

We welcome contributions from the community and are excited to have you here.

</div>

<br />

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Coding Standards](#-coding-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Issue Guidelines](#-issue-guidelines)
- [Community](#-community)

<br />

---

<br />

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with newcomers
- **Focus on what is best** for the community
- **Show empathy** towards other community members

<br />

---

<br />

## 🤝 How Can I Contribute?

### 1. 🐛 Reporting Bugs

Found a bug? Help us fix it!

**Before submitting:**
- Check the [issue tracker](https://github.com/bbhunterpk-ux/memctx/issues) for existing reports
- Try the latest version to see if it's already fixed
- Collect relevant information (logs, screenshots, steps to reproduce)

**Submit a bug report:**
1. Go to [Issues](https://github.com/bbhunterpk-ux/memctx/issues/new?template=bug_report.md)
2. Use the bug report template
3. Provide detailed information:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, MemCTX version)
   - Logs from `/tmp/memctx.log`
   - Screenshots if applicable

### 2. 💡 Suggesting Features

Have an idea? We'd love to hear it!

**Before suggesting:**
- Check [existing feature requests](https://github.com/bbhunterpk-ux/memctx/issues?q=is%3Aissue+label%3Aenhancement)
- Consider if it fits the project's scope and vision
- Think about how it benefits the community

**Submit a feature request:**
1. Go to [Issues](https://github.com/bbhunterpk-ux/memctx/issues/new?template=feature_request.md)
2. Use the feature request template
3. Provide:
   - Clear use case and problem statement
   - Proposed solution
   - Alternative solutions considered
   - Mockups or examples (if applicable)

### 3. 📝 Improving Documentation

Documentation is crucial! Help us make it better:

- Fix typos or unclear explanations
- Add missing documentation
- Create tutorials or guides
- Improve code comments
- Translate documentation

### 4. 🔧 Contributing Code

Ready to code? Awesome!

**Good first issues:**
- Look for issues labeled [`good first issue`](https://github.com/bbhunterpk-ux/memctx/labels/good%20first%20issue)
- These are beginner-friendly and well-documented

**Areas needing help:**
- Bug fixes
- Feature implementation
- Performance improvements
- Test coverage
- UI/UX enhancements

<br />

---

<br />

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher (recommended)
- **Git**: Latest version
- **Claude Code CLI**: Installed and configured

### Build Tools

**Linux (Ubuntu/Debian):**
```bash
sudo apt install build-essential python3
```

**macOS:**
```bash
xcode-select --install
```

**Windows:**
Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/memctx.git
   cd memctx
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/bbhunterpk-ux/memctx.git
   ```

### Install Dependencies

```bash
# Install all dependencies
pnpm install

# Build the project
pnpm run build
```

### Link Locally

```bash
# Link for local testing
npm link

# Verify installation
memctx --version
```

### Start Development

```bash
# Terminal 1: Start worker in dev mode
cd artifacts/claudectx-backup
pnpm run dev

# Terminal 2: Start dashboard in dev mode
cd artifacts/claudectx-backup/dashboard
pnpm run dev

# Terminal 3: Test CLI commands
memctx status
memctx open
```

<br />

---

<br />

## 📁 Project Structure

```
memctx/
├── artifacts/
│   └── claudectx-backup/          # Main package
│       ├── src/                   # Worker source code
│       │   ├── index.ts          # Main entry point
│       │   ├── db.ts             # Database layer
│       │   ├── summarizer.ts     # AI summarization
│       │   ├── hooks/            # Hook handlers
│       │   └── routes/           # API routes
│       ├── dashboard/            # React dashboard
│       │   ├── src/
│       │   │   ├── components/   # React components
│       │   │   ├── pages/        # Page components
│       │   │   ├── hooks/        # Custom hooks
│       │   │   └── utils/        # Utilities
│       │   └── public/           # Static assets
│       ├── bin/                  # CLI entry point
│       │   └── claudectx.ts
│       └── installer/            # Installation scripts
├── docs/                         # Documentation
│   ├── user/                     # User guides
│   └── developer/                # Developer docs
├── scripts/                      # Build scripts
└── package.json                  # Workspace config
```

### Key Files

- **`src/index.ts`**: Worker daemon entry point
- **`src/db.ts`**: SQLite database schema and queries
- **`src/summarizer.ts`**: Claude API integration for summaries
- **`src/routes/`**: Express API endpoints
- **`dashboard/src/App.tsx`**: Dashboard main component
- **`bin/claudectx.ts`**: CLI command handler

<br />

---

<br />

## 🔄 Development Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add tests for new features
- Update documentation as needed
- Test your changes thoroughly

### 3. Test Your Changes

```bash
# Run type checking
pnpm run typecheck

# Build the project
pnpm run build

# Test CLI commands
memctx install
memctx start
memctx status
memctx open

# Test in a real Claude Code session
claude "test memctx integration"
```

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add session export to PDF"
```

See [Commit Guidelines](#-commit-guidelines) for details.

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

<br />

---

<br />

## 📏 Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Enable strict mode
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Use type aliases for unions/intersections

**Example:**
```typescript
// Good
interface Session {
  id: string
  projectId: string
  startTime: number
  endTime: number | null
}

// Bad
const session: any = { ... }
```

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: Max 100 characters
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and types
  - `UPPER_SNAKE_CASE` for constants

### React Components

- Use **functional components** with hooks
- Use **TypeScript** for props
- Keep components small and focused
- Extract reusable logic into custom hooks

**Example:**
```typescript
interface SessionCardProps {
  session: Session
  onSelect: (id: string) => void
}

export function SessionCard({ session, onSelect }: SessionCardProps) {
  return (
    <div onClick={() => onSelect(session.id)}>
      {session.title}
    </div>
  )
}
```

### File Organization

- One component per file
- Group related files in folders
- Use index files for clean imports
- Keep files under 300 lines

### Comments

- Write self-documenting code
- Add comments for complex logic
- Use JSDoc for public APIs
- Explain "why", not "what"

**Example:**
```typescript
/**
 * Summarizes a session using Claude API.
 * Retries up to 3 times on failure to handle rate limits.
 */
async function summarizeSession(sessionId: string): Promise<Summary> {
  // Implementation
}
```

<br />

---

<br />

## 🧪 Testing Guidelines

### Test Structure

```bash
artifacts/claudectx-backup/
├── src/
│   └── __tests__/
│       ├── db.test.ts
│       ├── summarizer.test.ts
│       └── routes.test.ts
└── dashboard/
    └── src/
        └── __tests__/
            ├── components/
            └── hooks/
```

### Writing Tests

- Test behavior, not implementation
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies
- Aim for 80%+ coverage

**Example:**
```typescript
describe('SessionDatabase', () => {
  it('should create a new session with valid data', () => {
    // Arrange
    const db = new SessionDatabase(':memory:')
    const sessionData = { projectId: 'test', startTime: Date.now() }
    
    // Act
    const session = db.createSession(sessionData)
    
    // Assert
    expect(session.id).toBeDefined()
    expect(session.projectId).toBe('test')
  })
})
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test db.test.ts

# Watch mode
pnpm test:watch
```

<br />

---

<br />

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
# Feature
feat(dashboard): add session export to PDF

# Bug fix
fix(worker): handle missing API key gracefully

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(db): simplify query builder logic

# Breaking change
feat(api)!: change session endpoint response format

BREAKING CHANGE: Session API now returns ISO timestamps
```

### Commit Message Rules

- Use imperative mood ("add" not "added")
- Don't capitalize first letter
- No period at the end
- Keep subject under 72 characters
- Separate subject from body with blank line
- Wrap body at 72 characters
- Explain what and why, not how

<br />

---

<br />

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No console.log statements
- [ ] TypeScript compiles without errors
- [ ] Commits follow convention

### PR Title Format

Use the same format as commit messages:

```
feat(dashboard): add dark mode toggle
fix(worker): resolve memory leak in summarizer
docs(contributing): add testing guidelines
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123
Closes #456

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainer reviews your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, PR will be merged
5. **Merge**: Maintainer merges your PR

### After Merge

- Delete your feature branch
- Update your fork:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

<br />

---

<br />

## 🐛 Issue Guidelines

### Issue Templates

We provide templates for:
- **Bug reports**: Report a bug
- **Feature requests**: Suggest a feature
- **Documentation**: Improve docs
- **Question**: Ask a question

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested
- `wontfix` - This will not be worked on
- `duplicate` - This issue already exists
- `invalid` - This doesn't seem right

### Issue Lifecycle

1. **Open**: Issue created
2. **Triaged**: Maintainer reviews and labels
3. **Assigned**: Someone is working on it
4. **In Progress**: Work has started
5. **Review**: PR submitted
6. **Closed**: Issue resolved

<br />

---

<br />

## 💬 Community

### Communication Channels

- **GitHub Discussions**: General discussions, Q&A
- **GitHub Issues**: Bug reports, feature requests
- **Discord**: Real-time chat (coming soon)
- **Twitter**: Updates and announcements

### Getting Help

- Check the [documentation](./docs/README.md)
- Search [existing issues](https://github.com/bbhunterpk-ux/memctx/issues)
- Ask in [GitHub Discussions](https://github.com/bbhunterpk-ux/memctx/discussions)
- Join our Discord community

### Recognition

Contributors are recognized in:
- README contributors section
- Release notes
- GitHub contributors page

<br />

---

<br />

## 🎯 Maintainer Guidelines

### For Project Maintainers

#### Reviewing PRs

1. **Check CI/CD**: Ensure all checks pass
2. **Review Code**: Check for quality, style, tests
3. **Test Locally**: Pull and test the changes
4. **Provide Feedback**: Be constructive and helpful
5. **Approve or Request Changes**: Clear communication
6. **Merge**: Use squash merge for clean history

#### Triaging Issues

1. **Reproduce**: Verify the issue
2. **Label**: Add appropriate labels
3. **Prioritize**: Set priority (P0-P3)
4. **Assign**: Assign to someone or mark "help wanted"
5. **Respond**: Acknowledge within 48 hours

#### Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog**: Update CHANGELOG.md
3. **Tag**: Create git tag
4. **Build**: Run production build
5. **Publish**: Publish to npm
6. **Announce**: Post release notes

<br />

---

<br />

<div align="center">

## 🙏 Thank You!

Your contributions make MemCTX better for everyone.

**Questions?** Open a [discussion](https://github.com/bbhunterpk-ux/memctx/discussions) or reach out to [info@memctx.dev](mailto:info@memctx.dev)

**Ready to contribute?** Check out [good first issues](https://github.com/bbhunterpk-ux/memctx/labels/good%20first%20issue)!

<br />

[⬆ Back to Top](#contributing-to-memctx)

</div>
