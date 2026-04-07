# Maintainer Workflow Guide

<div align="center">

**Internal guide for MemCTX maintainers**

This document outlines processes for managing contributions, releases, and community engagement.

</div>

<br />

## 📋 Table of Contents

- [Maintainer Responsibilities](#-maintainer-responsibilities)
- [Issue Management](#-issue-management)
- [Pull Request Review](#-pull-request-review)
- [Release Process](#-release-process)
- [Community Management](#-community-management)
- [Security](#-security)
- [Automation](#-automation)

<br />

---

<br />

## 👥 Maintainer Responsibilities

### Core Responsibilities

1. **Code Review**: Review and merge pull requests
2. **Issue Triage**: Label, prioritize, and respond to issues
3. **Release Management**: Plan and execute releases
4. **Community Support**: Help users and contributors
5. **Documentation**: Keep docs up-to-date
6. **Security**: Address security vulnerabilities
7. **Quality**: Maintain code quality and test coverage

### Time Commitment

- **Daily**: Check notifications, respond to urgent issues
- **Weekly**: Review PRs, triage new issues, community engagement
- **Monthly**: Release planning, roadmap updates

### Communication

- **Response Time**: Within 48 hours for issues/PRs
- **Transparency**: Communicate decisions publicly
- **Respect**: Be kind, patient, and constructive

<br />

---

<br />

## 🐛 Issue Management

### Issue Triage Process

#### 1. Initial Review (within 24 hours)

```bash
# Check new issues
gh issue list --state open --label "needs-triage"
```

**Actions:**
- Read the issue carefully
- Verify it's not a duplicate
- Check if it's valid and actionable
- Add initial labels

#### 2. Labeling

**Priority Labels:**
- `P0` - Critical (security, data loss, complete breakage)
- `P1` - High (major features broken, significant bugs)
- `P2` - Medium (minor bugs, enhancements)
- `P3` - Low (nice-to-have, cosmetic issues)

**Type Labels:**
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `question` - Further information requested
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed

**Status Labels:**
- `needs-triage` - Needs initial review
- `needs-reproduction` - Can't reproduce the issue
- `needs-info` - Waiting for more information
- `blocked` - Blocked by external factors
- `wontfix` - Won't be fixed
- `duplicate` - Duplicate issue

#### 3. Response Template

**For Bug Reports:**
```markdown
Thank you for reporting this issue! 🐛

I've labeled this as a bug and will investigate. A few questions:

1. [Clarifying question]
2. [Request for additional info]

In the meantime, you might try [workaround if available].
```

**For Feature Requests:**
```markdown
Thanks for the suggestion! 💡

This is an interesting idea. I've labeled it as an enhancement for consideration.

A few thoughts:
- [Initial feedback]
- [Questions about use case]

We'll discuss this with the team and update you on our decision.
```

**For Questions:**
```markdown
Thanks for reaching out! 👋

[Answer the question or point to documentation]

Does this help? Let me know if you need more clarification!

For future questions, consider using [GitHub Discussions](link) for faster community responses.
```

#### 4. Assignment

- Assign to yourself if working on it
- Add `help wanted` if community help is welcome
- Add `good first issue` for beginner-friendly tasks

### Issue Lifecycle

```
New Issue
  ↓
Triage (label, prioritize)
  ↓
Needs Info? → Wait for response → Close if no response (7 days)
  ↓
Valid? → No → Close with explanation
  ↓
Yes → Assign or mark "help wanted"
  ↓
In Progress (PR opened)
  ↓
Review & Merge
  ↓
Close (reference PR)
```

### Closing Issues

**When to Close:**
- Fixed and merged
- Duplicate (link to original)
- Won't fix (explain why)
- Can't reproduce (after follow-up)
- Stale (no response after 7 days)

**Closing Message:**
```markdown
Closing this as [reason].

[Additional context or explanation]

Feel free to reopen if you have additional information!
```

<br />

---

<br />

## 🔀 Pull Request Review

### Review Checklist

#### 1. Automated Checks

- [ ] CI/CD passes (tests, linting, build)
- [ ] No merge conflicts
- [ ] Branch is up-to-date with main

#### 2. Code Quality

- [ ] Code follows style guidelines
- [ ] No unnecessary complexity
- [ ] Proper error handling
- [ ] No hardcoded values
- [ ] No console.log statements
- [ ] TypeScript types are correct
- [ ] No `any` types (unless justified)

#### 3. Testing

- [ ] Tests added for new features
- [ ] Tests updated for changes
- [ ] Edge cases covered
- [ ] Tests pass locally
- [ ] Coverage maintained (80%+)

#### 4. Documentation

- [ ] Code comments for complex logic
- [ ] README updated (if needed)
- [ ] API docs updated (if needed)
- [ ] CHANGELOG updated (if needed)

#### 5. Security

- [ ] No secrets in code
- [ ] Input validation present
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities
- [ ] Dependencies are safe

### Review Process

#### 1. Initial Review (within 48 hours)

```bash
# Checkout the PR
gh pr checkout 123

# Run tests
pnpm test

# Build
pnpm run build

# Test manually
memctx install
memctx start
```

#### 2. Provide Feedback

**For Minor Issues:**
```markdown
Thanks for the PR! 🎉

Just a few minor suggestions:

1. [Suggestion with code example]
2. [Another suggestion]

Otherwise looks good!
```

**For Major Issues:**
```markdown
Thanks for working on this! 

I've reviewed the changes and have some concerns:

1. **[Issue 1]**: [Explanation and suggestion]
2. **[Issue 2]**: [Explanation and suggestion]

Let's discuss these before moving forward. Happy to help if you have questions!
```

**For Excellent PRs:**
```markdown
Excellent work! 🌟

This is exactly what we needed. The code is clean, well-tested, and documented.

Merging now. Thanks for your contribution!
```

#### 3. Request Changes or Approve

- **Request Changes**: For issues that must be fixed
- **Comment**: For suggestions or questions
- **Approve**: When ready to merge

#### 4. Merge

**Merge Strategy:**
- Use **Squash and Merge** for clean history
- Edit commit message to follow convention
- Delete branch after merge

**Merge Message Format:**
```
feat(scope): description (#123)

- Change 1
- Change 2
- Change 3

Co-authored-by: Contributor Name <email>
```

#### 5. Post-Merge

- Thank the contributor
- Close related issues
- Update project board
- Consider adding to release notes

### Handling Difficult Situations

**Stale PRs (no activity for 14 days):**
```markdown
Hi! This PR has been inactive for a while. Are you still working on this?

If we don't hear back in 7 days, we'll close this PR. You can always reopen it later!
```

**Low-Quality PRs:**
```markdown
Thanks for your interest in contributing!

This PR needs significant work before it can be merged:
- [List major issues]

Would you like to continue working on this, or should we close it for now?

If you're new to contributing, check out our [good first issues](link) for easier starting points!
```

**Disagreements:**
```markdown
I understand your perspective, but here's why we're taking a different approach:

[Explain reasoning with technical justification]

Let's discuss this further if you have concerns. We want to make the best decision for the project.
```

<br />

---

<br />

## 🚀 Release Process

### Release Schedule

- **Patch releases** (1.0.x): As needed for bug fixes
- **Minor releases** (1.x.0): Monthly for new features
- **Major releases** (x.0.0): When breaking changes are needed

### Pre-Release Checklist

- [ ] All planned features merged
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] No open P0/P1 bugs

### Release Steps

#### 1. Prepare Release Branch

```bash
# Update main
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v1.1.0

# Update version
cd artifacts/claudectx-backup
npm version minor  # or patch, major
```

#### 2. Update CHANGELOG.md

```markdown
## [1.1.0] - 2026-04-07

### Added
- New feature X (#123)
- New feature Y (#124)

### Changed
- Improved Z (#125)

### Fixed
- Bug fix A (#126)
- Bug fix B (#127)

### Security
- Security fix C (#128)
```

#### 3. Build and Test

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Build
pnpm run build

# Test
pnpm test

# Test CLI
npm link
memctx --version
memctx install
memctx start
memctx status
```

#### 4. Commit and Tag

```bash
# Commit changes
git add .
git commit -m "chore: release v1.1.0"

# Create tag
git tag -a v1.1.0 -m "Release v1.1.0"

# Push
git push origin release/v1.1.0
git push origin v1.1.0
```

#### 5. Create PR to Main

```bash
# Create PR
gh pr create --title "Release v1.1.0" --body "Release v1.1.0

See CHANGELOG.md for details."
```

#### 6. Publish to NPM

```bash
# Login to NPM (if needed)
npm login

# Publish
cd artifacts/claudectx-backup
npm publish

# Verify
npm view memctx version
```

#### 7. Create GitHub Release

```bash
# Create release
gh release create v1.1.0 \
  --title "v1.1.0" \
  --notes-file CHANGELOG.md \
  --latest
```

#### 8. Announce Release

- Post on GitHub Discussions
- Tweet from @memctx
- Update Discord announcement
- Email newsletter (if applicable)

### Post-Release

- [ ] Verify NPM package works
- [ ] Monitor for issues
- [ ] Update documentation site
- [ ] Close milestone
- [ ] Plan next release

<br />

---

<br />

## 👥 Community Management

### GitHub Discussions

**Categories:**
- 💬 General - General discussions
- 💡 Ideas - Feature ideas and suggestions
- 🙏 Q&A - Questions and answers
- 📣 Announcements - Official announcements
- 🎉 Show and Tell - Share your projects

**Moderation:**
- Respond to questions within 48 hours
- Move off-topic discussions
- Lock resolved threads
- Pin important discussions

### Discord Management

**Channels:**
- #general - General chat
- #help - Support questions
- #development - Development discussions
- #announcements - Official announcements
- #showcase - User projects

**Moderation:**
- Welcome new members
- Answer questions
- Enforce code of conduct
- Organize events (if applicable)

### Social Media

**Twitter (@memctx):**
- Release announcements
- Feature highlights
- Community spotlights
- Tips and tricks

**Posting Schedule:**
- Releases: Immediately
- Features: Weekly
- Tips: 2-3 times per week

<br />

---

<br />

## 🔒 Security

### Security Vulnerability Process

#### 1. Receive Report

- Monitor security@memctx.dev
- Check GitHub Security Advisories
- Monitor dependency alerts

#### 2. Assess Severity

**Critical (P0):**
- Remote code execution
- Data loss
- Authentication bypass
- SQL injection

**High (P1):**
- XSS vulnerabilities
- CSRF vulnerabilities
- Information disclosure

**Medium (P2):**
- DoS vulnerabilities
- Minor information leaks

**Low (P3):**
- Theoretical vulnerabilities
- Low-impact issues

#### 3. Fix and Release

```bash
# Create security fix branch
git checkout -b security/fix-vulnerability

# Fix the issue
# ... make changes ...

# Test thoroughly
pnpm test

# Commit
git commit -m "security: fix [vulnerability description]"

# Create patch release
npm version patch

# Publish immediately
npm publish

# Create security advisory
gh security-advisory create
```

#### 4. Disclosure

- Publish security advisory
- Credit reporter (if they want)
- Notify users via email/Discord
- Update documentation

### Dependency Management

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

<br />

---

<br />

## 🤖 Automation

### GitHub Actions

**Current Workflows:**
- CI/CD (test, lint, build)
- Dependency updates (Dependabot)
- Stale issue management
- Release automation

### Useful Scripts

**Check PR status:**
```bash
gh pr list --state open --json number,title,author,updatedAt
```

**Find stale issues:**
```bash
gh issue list --state open --label "needs-info" --json number,title,updatedAt
```

**Generate release notes:**
```bash
gh release create v1.1.0 --generate-notes
```

### Bots and Tools

- **Dependabot**: Automated dependency updates
- **CodeQL**: Security scanning
- **Prettier**: Code formatting
- **ESLint**: Code linting

<br />

---

<br />

## 📊 Metrics to Track

### Repository Health

- Open issues count
- Open PRs count
- Average time to close issues
- Average time to merge PRs
- Test coverage percentage
- Build success rate

### Community Growth

- GitHub stars
- Forks
- Contributors
- NPM downloads
- Discord members

### Quality Metrics

- Bug report rate
- Security vulnerabilities
- Code quality score
- Documentation coverage

<br />

---

<br />

<div align="center">

## 🙏 Thank You for Maintaining MemCTX!

Your work keeps the project healthy and the community thriving.

**Questions?** Reach out to other maintainers or [info@memctx.dev](mailto:info@memctx.dev)

<br />

[⬆ Back to Top](#maintainer-workflow-guide)

</div>
