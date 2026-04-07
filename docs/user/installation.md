# 📦 Installation Guide

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [⚙️ Configuration](configuration.md) • [💻 CLI Reference](cli-reference.md)

</div>

---

## 📋 Table of Contents

- [System Requirements](#-system-requirements)
- [Installation Methods](#-installation-methods)
- [First-Time Setup](#-first-time-setup)
- [Verification](#-verification)
- [Platform-Specific Instructions](#-platform-specific-instructions)
- [Troubleshooting Installation](#-troubleshooting-installation)

---

## 🖥️ System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Node.js** | 18.0.0 or higher |
| **npm** | 8.0.0 or higher (comes with Node.js) |
| **Claude Code** | Latest version |
| **Operating System** | Linux, macOS, or Windows (WSL) |
| **Disk Space** | 50 MB free space |
| **RAM** | 512 MB available |

### Build Tools Required

MemCTX uses native modules that require compilation during installation.

<details>
<summary><b>🐧 Linux (Ubuntu/Debian)</b></summary>

```bash
sudo apt update
sudo apt install build-essential python3
```

</details>

<details>
<summary><b>🍎 macOS</b></summary>

```bash
xcode-select --install
```

</details>

<details>
<summary><b>🪟 Windows</b></summary>

**Option 1: WSL (Recommended)**
```bash
# Install WSL first, then follow Linux instructions
wsl --install
```

**Option 2: Native Windows**
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- Select "Desktop development with C++"

</details>

---

## 📦 Installation Methods

### Method 1: npm (Recommended)

```bash
npm install -g memctx
```

### Method 2: pnpm (Faster)

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install memctx
pnpm add -g memctx
```

### Method 3: yarn

```bash
yarn global add memctx
```

### Method 4: From Source

```bash
# Clone repository
git clone https://github.com/bbhunterpk-ux/memctx.git
cd memctx/artifacts/claudectx-backup

# Install dependencies
pnpm install

# Build
pnpm run build

# Link globally
npm link
```

---

## ⚡ First-Time Setup

### Step 1: Install MemCTX

```bash
memctx install
```

This command will:
- ✅ Create `~/.memctx/` directory
- ✅ Copy hook scripts to `~/.memctx/hooks/`
- ✅ Register hooks in `~/.claude/settings.json`
- ✅ Start the worker daemon
- ✅ Initialize the database

**Expected Output:**
```
🚀 Installing MemCTX...

  Created /home/user/.memctx
  Created /home/user/.memctx/hooks
  Created /home/user/.memctx/logs
  Installed hook: session-start.js
  Installed hook: session-end.js
  Installed hook: post-tool-use.js
  Installed hook: stop.js
  Hooks registered in ~/.claude/settings.json
  Worker daemon started (PID: 12345)

✅ MemCTX installed!
   Dashboard: http://localhost:9999
   Claude Code will now automatically capture and summarize sessions.
```

### Step 2: Configure API Key (Optional)

For AI-powered summaries, configure your Anthropic API key:

**Option A: Settings Dashboard (Recommended)**
```bash
memctx open
# Navigate to Settings → API Configuration
```

**Option B: Environment Variable**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
memctx restart
```

### Step 3: Verify Installation

```bash
memctx status
```

**Expected Output:**
```
Daemon: running (PID: 12345)
Worker: online (uptime: 30s)
DB: connected
API Key: configured
Queue: 0 items pending
```

---

## ✅ Verification

### Test 1: Check CLI

```bash
memctx --help
```

Should display all available commands.

### Test 2: Check Dashboard

```bash
memctx open
```

Should open `http://localhost:9999` in your browser.

### Test 3: Check Hooks

```bash
cat ~/.claude/settings.json | grep memctx
```

Should show registered hooks.

### Test 4: Capture a Session

```bash
# Start a Claude Code session
claude

# Do something, then exit
# Check if session was captured
memctx open
# You should see the session in the dashboard
```

---

## 🖥️ Platform-Specific Instructions

### Linux

<details>
<summary><b>Ubuntu/Debian</b></summary>

```bash
# Install build tools
sudo apt update
sudo apt install build-essential python3

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MemCTX
npm install -g memctx

# Setup
memctx install
```

</details>

<details>
<summary><b>Arch Linux</b></summary>

```bash
# Install build tools
sudo pacman -S base-devel python

# Install Node.js (if not installed)
sudo pacman -S nodejs npm

# Install MemCTX
npm install -g memctx

# Setup
memctx install
```

</details>

<details>
<summary><b>Fedora/RHEL</b></summary>

```bash
# Install build tools
sudo dnf groupinstall "Development Tools"
sudo dnf install python3

# Install Node.js (if not installed)
sudo dnf install nodejs npm

# Install MemCTX
npm install -g memctx

# Setup
memctx install
```

</details>

### macOS

<details>
<summary><b>Intel & Apple Silicon</b></summary>

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Node.js (if not installed)
# Option 1: Using Homebrew
brew install node

# Option 2: Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20

# Install MemCTX
npm install -g memctx

# Setup
memctx install
```

</details>

### Windows

<details>
<summary><b>WSL (Recommended)</b></summary>

```bash
# Install WSL
wsl --install

# Inside WSL, follow Linux instructions
sudo apt update
sudo apt install build-essential python3 nodejs npm
npm install -g memctx
memctx install
```

</details>

<details>
<summary><b>Native Windows</b></summary>

```powershell
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/

# Install Node.js
# Download from: https://nodejs.org/

# Install MemCTX
npm install -g memctx

# Setup
memctx install
```

</details>

---

## 🔧 Troubleshooting Installation

### Issue: "Permission denied"

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $USER ~/.npm

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
npm install -g memctx
```

### Issue: "better-sqlite3 build failed"

**Solution:**
```bash
# Linux
sudo apt install build-essential python3

# macOS
xcode-select --install

# Then reinstall
npm uninstall -g memctx
npm install -g memctx
```

### Issue: "Command not found: memctx"

**Solution:**
```bash
# Check if npm global bin is in PATH
npm config get prefix

# Add to PATH (Linux/macOS)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Or use npx
npx memctx install
```

### Issue: "Port 9999 already in use"

**Solution:**
```bash
# Use custom port
export MEMCTX_PORT=8080
memctx restart

# Or kill process using port 9999
lsof -ti:9999 | xargs kill -9
memctx start
```

### Issue: "Claude Code not found"

**Solution:**
```bash
# Install Claude Code first
# Visit: https://claude.ai/code

# Verify installation
claude --version
```

---

## 🔄 Updating MemCTX

### Check Current Version

```bash
memctx --version
# or
npm list -g memctx
```

### Update to Latest Version

```bash
npm update -g memctx
memctx restart
```

### Update to Specific Version

```bash
npm install -g memctx@1.0.1
memctx restart
```

---

## 🗑️ Uninstalling MemCTX

### Complete Uninstall

```bash
# Remove hooks and stop daemon
memctx uninstall

# Uninstall package
npm uninstall -g memctx

# Optional: Remove data directory
rm -rf ~/.memctx
```

### Keep Data, Remove Package

```bash
# Stop daemon
memctx stop

# Uninstall package
npm uninstall -g memctx

# Data remains at ~/.memctx
```

---

## 📊 Installation Checklist

Use this checklist to ensure proper installation:

- [ ] Node.js 18+ installed
- [ ] Build tools installed
- [ ] Claude Code installed
- [ ] MemCTX installed globally
- [ ] `memctx install` completed successfully
- [ ] Daemon running (`memctx status`)
- [ ] Dashboard accessible (`memctx open`)
- [ ] Hooks registered in `~/.claude/settings.json`
- [ ] API key configured (optional)
- [ ] Test session captured successfully

---

## 🆘 Getting Help

If you're still having issues:

1. **Check logs:**
   ```bash
   tail -f /tmp/memctx.log
   ```

2. **Search existing issues:**
   - [GitHub Issues](https://github.com/bbhunterpk-ux/memctx/issues)

3. **Ask for help:**
   - [GitHub Discussions](https://github.com/bbhunterpk-ux/memctx/discussions)
   - Email: [info@memctx.dev](mailto:info@memctx.dev)

4. **Report a bug:**
   - [New Issue](https://github.com/bbhunterpk-ux/memctx/issues/new)

---

## ➡️ Next Steps

Now that MemCTX is installed:

1. **[Configure MemCTX](configuration.md)** - Set up API keys and preferences
2. **[Learn CLI Commands](cli-reference.md)** - Master the command line
3. **[Explore Dashboard](dashboard.md)** - Discover dashboard features

---

<div align="center">

[⬆ Back to Top](#-installation-guide) • [📚 Documentation Home](../README.md)

</div>
