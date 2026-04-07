# Publishing ClaudeContext to NPM - Step by Step

## Pre-Publishing Checklist

### 1. Verify Package Structure

```bash
cd artifacts/claudectx-backup

# Check all required files exist
ls -la README.md LICENSE .npmignore package.json

# Verify build output
ls -la dist/bin/claudectx.js
ls -la dist/src/index.js
ls -la dashboard/dist/
```

### 2. Update Package Metadata

Edit `package.json`:

```json
{
  "name": "claudectx",  // Or "@yourusername/claudectx" for scoped
  "version": "1.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/claudectx.git"  // Update this!
  },
  "author": "Your Name <your.email@example.com>",  // Update this!
}
```

### 3. Build Everything

```bash
# Clean previous builds
rm -rf dist/ dashboard/dist/

# Install dependencies
pnpm install

# Build worker and dashboard
pnpm run build

# Verify build succeeded
ls -la dist/
ls -la dashboard/dist/
```

### 4. Test Locally

```bash
# Link package locally
npm link

# Test installation
claudectx install

# Test commands
claudectx status
claudectx open

# Unlink when done
npm unlink -g claudectx
```

## Publishing Steps

### Step 1: Login to NPM

```bash
npm login
# Enter username, password, email, and 2FA code
```

### Step 2: Run Pre-publish Check

```bash
./publish-check.sh
```

This will verify:
- All required files exist
- Package.json is valid
- You're logged in to NPM
- Package name availability
- Dry-run publish output

### Step 3: Choose Package Name

**Option A: Unscoped Package** (requires unique name)
```json
{
  "name": "claudectx"
}
```

**Option B: Scoped Package** (recommended for first publish)
```json
{
  "name": "@yourusername/claudectx"
}
```

### Step 4: Dry Run

```bash
npm publish --dry-run
```

Review the output carefully:
- Check which files will be included
- Verify package size is reasonable
- Ensure no sensitive files are included

### Step 5: Publish!

**For unscoped package:**
```bash
npm publish
```

**For scoped package:**
```bash
npm publish --access public
```

### Step 6: Verify Publication

```bash
# Check on NPM
npm view claudectx

# Or visit
# https://www.npmjs.com/package/claudectx
```

### Step 7: Test Installation

```bash
# Install from NPM
npm install -g claudectx

# Test it works
claudectx --help
claudectx install
```

## Post-Publishing

### 1. Create Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Create GitHub Release

1. Go to GitHub repository
2. Click "Releases" → "Create a new release"
3. Select tag `v1.0.0`
4. Add release notes
5. Publish release

### 3. Update Documentation

- Add NPM badge to README
- Update installation instructions
- Share on social media

## Updating the Package

### Patch Release (1.0.0 → 1.0.1)

```bash
# Bug fixes only
npm version patch
npm publish
git push && git push --tags
```

### Minor Release (1.0.0 → 1.1.0)

```bash
# New features, backwards compatible
npm version minor
npm publish
git push && git push --tags
```

### Major Release (1.0.0 → 2.0.0)

```bash
# Breaking changes
npm version major
npm publish
git push && git push --tags
```

## Troubleshooting

### "Package name already taken"

**Solution 1:** Use scoped package
```bash
# Update package.json name to @yourusername/claudectx
npm publish --access public
```

**Solution 2:** Choose different name
```bash
# Update package.json name to claudectx-memory or similar
npm publish
```

### "You must be logged in"

```bash
npm login
# Or check: npm whoami
```

### "better-sqlite3 build failed"

Users need build tools:
- **Linux:** `sudo apt install build-essential python3`
- **macOS:** `xcode-select --install`
- **Windows:** Install Visual Studio Build Tools

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

## NPM Package Best Practices

### 1. Semantic Versioning

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes only

### 2. Keep Package Small

- Only include `dist/` folder
- Exclude source files, tests, docs
- Use `.npmignore` properly

### 3. Test Before Publishing

- Always test with `npm link` first
- Run on different platforms if possible
- Test installation from scratch

### 4. Good README

- Clear installation instructions
- Quick start guide
- API documentation
- Troubleshooting section

### 5. Changelog

Keep a CHANGELOG.md:
```markdown
# Changelog

## [1.0.0] - 2026-04-06
### Added
- Initial release
- Session tracking
- AI summaries
- Dashboard UI
```

## Quick Reference

```bash
# Build
pnpm run build

# Test locally
npm link

# Check before publish
./publish-check.sh

# Publish
npm publish

# Update version
npm version patch|minor|major

# View package info
npm view claudectx
```

## Support

If you encounter issues:
1. Check NPM documentation: https://docs.npmjs.com/
2. Search existing issues
3. Ask in NPM community forums
4. Contact NPM support for account issues

---

**Ready to publish?** Run `./publish-check.sh` to get started!
