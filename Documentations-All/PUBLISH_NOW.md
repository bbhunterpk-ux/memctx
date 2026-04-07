# Publish MemCTX to NPM - Quick Start

**Ready to publish in 10 minutes!**

---

## Prerequisites

- [ ] NPM account created (https://www.npmjs.com/signup)
- [ ] Git repository created (optional but recommended)
- [ ] Package built and tested locally

---

## Step-by-Step Publishing

### 1. Update Package Metadata (2 minutes)

```bash
cd artifacts/claudectx-backup
```

Edit `package.json` and update these fields:

```json
{
  "name": "memctx",  // Or "@yourusername/memctx" for scoped
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/memctx.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/memctx/issues"
  },
  "homepage": "https://github.com/yourusername/memctx#readme"
}
```

**Package Name Options:**
- `memctx` - Unscoped (requires unique name on NPM)
- `@yourusername/memctx` - Scoped (always available under your username)

### 2. Build Everything (2 minutes)

```bash
# Clean previous builds
rm -rf dist/ dashboard/dist/

# Install dependencies
pnpm install

# Build worker and dashboard
pnpm run build
```

**Verify build output:**
```bash
ls -la dist/bin/claudectx.js        # CLI entry point
ls -la dist/src/index.js            # Worker entry point
ls -la dashboard/dist/index.html    # Dashboard
```

### 3. Test Locally (3 minutes)

```bash
# Link package locally
npm link

# Test installation
memctx install

# Test commands
memctx status
memctx open

# Verify dashboard opens at http://localhost:9999

# Unlink when done
memctx stop
npm unlink -g memctx
```

### 4. Pre-Publish Verification (1 minute)

```bash
# Run automated checks
./publish-check.sh
```

This verifies:
- All required files exist
- Package metadata is valid
- You're logged into NPM
- Package name availability

### 5. Login to NPM (1 minute)

```bash
npm login
```

Enter:
- Username
- Password
- Email
- 2FA code (if enabled)

Verify login:
```bash
npm whoami
```

### 6. Dry Run (1 minute)

```bash
npm publish --dry-run
```

**Review the output carefully:**
- Check which files will be included
- Verify package size (~2-3 MB expected)
- Ensure no sensitive files (.env, secrets, etc.)

### 7. Publish! (30 seconds)

**For unscoped package (`memctx`):**
```bash
npm publish
```

**For scoped package (`@username/memctx`):**
```bash
npm publish --access public
```

**Success!** Your package is now live on NPM! 🎉

---

## Post-Publishing Steps

### 1. Verify Publication

```bash
# Check package on NPM
npm view memctx

# Or visit
# https://www.npmjs.com/package/memctx
```

### 2. Test Installation from NPM

```bash
# Install from registry
npm install -g memctx

# Test it works
memctx --help
memctx install
memctx status
```

### 3. Create Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 4. Create GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Select tag `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description:
   ```markdown
   ## 🎉 Initial Release
   
   MemCTX is now available on NPM!
   
   ### Installation
   ```bash
   npm install -g memctx
   memctx install
   ```
   
   ### Features
   - 🧠 Automatic session tracking
   - 🤖 AI-powered summaries
   - 📊 Beautiful dashboard
   - 🔍 Full-text search
   - 📈 Live monitoring
   
   ### Documentation
   - [README](README.md)
   - [NPM Package](https://www.npmjs.com/package/memctx)
   ```
6. Click "Publish release"

### 5. Update README Badge (Optional)

Add NPM badge to your README:

```markdown
[![npm version](https://badge.fury.io/js/memctx.svg)](https://www.npmjs.com/package/memctx)
[![npm downloads](https://img.shields.io/npm/dm/memctx.svg)](https://www.npmjs.com/package/memctx)
```

---

## Alternative: Automated Publishing

Use the interactive script:

```bash
cd artifacts/claudectx-backup
./publish.sh
```

This script will:
1. ✅ Verify you're in the right directory
2. ✅ Check package.json metadata
3. ✅ Offer to rebuild
4. ✅ Verify build output
5. ✅ Check NPM login
6. ✅ Verify package name availability
7. ✅ Run dry-run
8. ✅ Confirm before publishing
9. ✅ Publish to NPM
10. ✅ Show next steps

---

## Troubleshooting

### "Package name already taken"

**Solution 1:** Use scoped package
```bash
# Update package.json name to @yourusername/memctx
npm publish --access public
```

**Solution 2:** Choose different name
```bash
# Update package.json name to memctx-memory or similar
npm publish
```

### "You must be logged in"

```bash
npm login
# Or check: npm whoami
```

### "better-sqlite3 build failed" (for users)

Users need build tools:
- **Linux:** `sudo apt install build-essential python3`
- **macOS:** `xcode-select --install`
- **Windows:** Install Visual Studio Build Tools

Document this in your README's Requirements section.

### "Permission denied"

```bash
# Fix npm permissions
sudo chown -R $USER ~/.npm
```

### "Package size too large"

```bash
# Check what's being included
npm pack --dry-run

# Update .npmignore to exclude more files
```

---

## Version Updates (Future)

### Patch Release (Bug Fixes)

```bash
npm version patch  # 1.0.0 → 1.0.1
npm publish
git push && git push --tags
```

### Minor Release (New Features)

```bash
npm version minor  # 1.0.0 → 1.1.0
npm publish
git push && git push --tags
```

### Major Release (Breaking Changes)

```bash
npm version major  # 1.0.0 → 2.0.0
npm publish
git push && git push --tags
```

---

## Quick Command Reference

```bash
# Build
pnpm run build

# Test locally
npm link
memctx install
npm unlink -g memctx

# Publish
npm login
./publish-check.sh
npm publish --dry-run
npm publish

# Update version
npm version patch|minor|major
npm publish
git push --tags
```

---

## Support After Publishing

### Monitor Issues

- Watch GitHub issues
- Respond to user questions
- Fix bugs promptly

### Keep Dependencies Updated

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Rebuild and test
pnpm run build
npm link
memctx install
```

### Security Audits

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit --fix
```

---

## Success Checklist

After publishing, verify:

- [ ] Package appears on NPM: https://www.npmjs.com/package/memctx
- [ ] Installation works: `npm install -g memctx`
- [ ] CLI commands work: `memctx --help`
- [ ] Dashboard loads: `memctx open`
- [ ] Git tag created: `git tag -l`
- [ ] GitHub release created
- [ ] README updated with NPM badge
- [ ] Documentation is accurate

---

## What's Next?

1. **Share your package:**
   - Post on Twitter/X
   - Share in Claude Code community
   - Post on Reddit (r/ClaudeAI, r/node)
   - Share on Hacker News

2. **Gather feedback:**
   - Monitor GitHub issues
   - Ask users for feedback
   - Track download stats

3. **Iterate:**
   - Fix bugs
   - Add requested features
   - Improve documentation
   - Release updates

---

**Ready to publish?** 🚀

```bash
cd artifacts/claudectx-backup
./publish.sh
```

Good luck! 🎉
