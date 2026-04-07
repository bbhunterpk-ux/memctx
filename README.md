<div align="center">

# 🧠 MemCTX

### Autonomous Session Memory for Claude Code

*Never lose context. Never repeat yourself. Your AI pair programmer, now with perfect memory.*

[![npm version](https://img.shields.io/npm/v/memctx.svg?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/memctx)
[![npm downloads](https://img.shields.io/npm/dm/memctx.svg?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/memctx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/memctx.svg?style=for-the-badge&logo=node.js&color=339933)](https://nodejs.org)

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [✨ Features](#-features) • [🎯 Demo](#-demo) • [💬 Community](#-community)

<img src="https://raw.githubusercontent.com/bbhunterpk-ux/memctx/main/assets/hero.png" alt="MemCTX Dashboard" width="800" />

</div>

---

## 🎯 What is MemCTX?

MemCTX transforms Claude Code into a **context-aware development companion** by automatically capturing, analyzing, and intelligently injecting your development history. Think of it as giving Claude a **photographic memory** of your entire project journey.

<table>
<tr>
<td width="50%">

### 😫 Before MemCTX
- ❌ Repeat context every session
- ❌ Lost conversation history
- ❌ Manual session notes
- ❌ Forgotten decisions
- ❌ Context switching overhead

</td>
<td width="50%">

### ✨ With MemCTX
- ✅ Automatic context injection
- ✅ Searchable session history
- ✅ AI-powered summaries
- ✅ Decision tracking
- ✅ Seamless continuity

</td>
</tr>
</table>

---

## ✨ Features

<table>
<tr>
<td width="33%" align="center">

### 🧠 Smart Memory
Automatically captures every Claude Code session with full context preservation

</td>
<td width="33%" align="center">

### 🤖 AI Summaries
Claude analyzes each session and generates structured summaries with key insights

</td>
<td width="33%" align="center">

### 📊 Beautiful Dashboard
Modern, responsive UI to browse, search, and analyze your development history

</td>
</tr>
<tr>
<td width="33%" align="center">

### 🔍 Full-Text Search
Lightning-fast search across all sessions, conversations, and code snippets

</td>
<td width="33%" align="center">

### 📈 Live Monitoring
Real-time view of active sessions with WebSocket updates

</td>
<td width="33%" align="center">

### 🎯 Context Injection
Automatically injects relevant history into new sessions for perfect continuity

</td>
</tr>
<tr>
<td width="33%" align="center">

### 🏷️ Tags & Bookmarks
Organize sessions with custom tags and bookmark important moments

</td>
<td width="33%" align="center">

### 📝 Session Notes
Add custom notes and annotations to any session

</td>
<td width="33%" align="center">

### 🌓 Dark/Light Theme
Beautiful themes that adapt to your preference

</td>
</tr>
</table>

---

## 🚀 Quick Start

<details open>
<summary><b>📦 Installation</b></summary>

```bash
# Install globally with npm
npm install -g memctx

# Or with pnpm (recommended)
pnpm add -g memctx

# Or with yarn
yarn global add memctx
```

</details>

<details open>
<summary><b>⚡ Setup (30 seconds)</b></summary>

```bash
# 1. Install and configure hooks
memctx install

# 2. Start the service
memctx start

# 3. Open the dashboard
memctx open
```

**That's it!** MemCTX is now capturing your Claude Code sessions automatically. 🎉

</details>

<details>
<summary><b>🔧 Configuration</b></summary>

### Settings Dashboard (Recommended)

Open `http://localhost:9999/settings` and configure:

- **API Provider**: Direct (Anthropic) or Proxy (9router, etc.)
- **API Key**: Your Anthropic or proxy API key
- **Model**: Choose Claude Opus, Sonnet, Haiku, or AWS default
- **Disable Summaries**: Toggle to save API costs

### Environment Variables (Alternative)

```bash
# Required for AI summaries
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Use proxy
export ANTHROPIC_BASE_URL="https://your-proxy.com/v1"

# Optional: Custom port (default: 9999)
export MEMCTX_PORT=8080

# Optional: Custom database location
export MEMCTX_DB_PATH="/path/to/db.sqlite"
```

</details>

---

## 💻 CLI Commands

<table>
<tr>
<th width="30%">Command</th>
<th width="70%">Description</th>
</tr>
<tr>
<td><code>memctx install</code></td>
<td>Install hooks and start daemon</td>
</tr>
<tr>
<td><code>memctx start</code></td>
<td>Start the worker daemon</td>
</tr>
<tr>
<td><code>memctx stop</code></td>
<td>Stop the worker daemon</td>
</tr>
<tr>
<td><code>memctx restart</code></td>
<td>Restart the worker daemon</td>
</tr>
<tr>
<td><code>memctx status</code></td>
<td>Show daemon status and health check</td>
</tr>
<tr>
<td><code>memctx open</code></td>
<td>Open dashboard in browser</td>
</tr>
<tr>
<td><code>memctx search &lt;query&gt;</code></td>
<td>Search sessions from terminal</td>
</tr>
<tr>
<td><code>memctx export</code></td>
<td>Export all sessions as markdown</td>
</tr>
<tr>
<td><code>memctx config</code></td>
<td>Show configuration</td>
</tr>
<tr>
<td><code>memctx uninstall</code></td>
<td>Remove hooks and stop daemon</td>
</tr>
</table>

---

## 🎯 Demo

<div align="center">

### Dashboard Overview

<img src="https://raw.githubusercontent.com/bbhunterpk-ux/memctx/main/assets/dashboard.png" alt="Dashboard" width="800" />

### Session Details

<img src="https://raw.githubusercontent.com/bbhunterpk-ux/memctx/main/assets/session-detail.png" alt="Session Detail" width="800" />

### Search & Filter

<img src="https://raw.githubusercontent.com/bbhunterpk-ux/memctx/main/assets/search.png" alt="Search" width="800" />

</div>

---

## 🏗️ How It Works

```mermaid
graph LR
    A[Claude Code CLI] -->|Hooks| B[MemCTX Worker]
    B -->|Store| C[SQLite Database]
    B -->|Summarize| D[Anthropic API]
    D -->|AI Summary| C
    C -->|Serve| E[React Dashboard]
    B -->|Inject Context| F[CLAUDE.md]
    F -->|Auto-load| A
    
    style A fill:#4A90E2
    style B fill:#50C878
    style C fill:#FFB347
    style D fill:#9B59B6
    style E fill:#E74C3C
    style F fill:#3498DB
```

<details>
<summary><b>📋 Detailed Flow</b></summary>

1. **Session Start**: Claude Code session begins → `session-start` hook fires
2. **Capture**: MemCTX worker creates session record in SQLite
3. **Observe**: Every tool use is captured via `post-tool-use` hook
4. **End**: Session ends → `stop` hook fires
5. **Summarize**: Worker sends transcript to Claude for AI analysis
6. **Store**: Summary stored in database
7. **Inject**: Next session auto-loads relevant context from `CLAUDE.md`
8. **Browse**: View everything in the beautiful dashboard

</details>

---

## 📖 Documentation

<table>
<tr>
<td width="50%">

### 📚 For Users
- [Installation Guide](https://memctx.dev/docs/installation)
- [Configuration](https://memctx.dev/docs/configuration)
- [CLI Reference](https://memctx.dev/docs/cli)
- [Dashboard Guide](https://memctx.dev/docs/dashboard)
- [Troubleshooting](https://memctx.dev/docs/troubleshooting)

</td>
<td width="50%">

### 🛠️ For Developers
- [Architecture](https://memctx.dev/docs/architecture)
- [API Reference](https://memctx.dev/docs/api)
- [Contributing Guide](https://github.com/bbhunterpk-ux/memctx/blob/main/CONTRIBUTING.md)
- [Development Setup](https://memctx.dev/docs/development)
- [Plugin System](https://memctx.dev/docs/plugins)

</td>
</tr>
</table>

---

## 🔧 Requirements

<table>
<tr>
<td width="50%">

### System Requirements
- **Node.js**: 18.0.0 or higher
- **Claude Code**: CLI installed
- **OS**: Linux, macOS, or Windows (WSL)

</td>
<td width="50%">

### Build Tools (for installation)
- **Linux**: `build-essential`, `python3`
- **macOS**: Xcode Command Line Tools
- **Windows**: Visual Studio Build Tools

</td>
</tr>
</table>

<details>
<summary><b>🔨 Installing Build Tools</b></summary>

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

</details>

---

## 🎨 Dashboard Features

<table>
<tr>
<td width="33%" align="center">

### 📊 Projects View
Browse all projects and their sessions organized by directory

</td>
<td width="33%" align="center">

### 🔍 Search
Full-text search with filters, tags, and date ranges

</td>
<td width="33%" align="center">

### 📈 Live Monitor
Real-time view of active sessions with WebSocket updates

</td>
</tr>
<tr>
<td width="33%" align="center">

### 📝 Session Details
View full conversation history, summaries, and observations

</td>
<td width="33%" align="center">

### 🏷️ Tags & Notes
Organize with custom tags and add notes to sessions

</td>
<td width="33%" align="center">

### 📊 Metrics
System performance, API usage, and statistics

</td>
</tr>
<tr>
<td width="33%" align="center">

### 🌓 Themes
Beautiful dark and light themes

</td>
<td width="33%" align="center">

### ⌨️ Shortcuts
Keyboard shortcuts for power users (press `?`)

</td>
<td width="33%" align="center">

### 📤 Export
Export sessions as markdown or screenshots

</td>
</tr>
</table>

---

## 🚨 Troubleshooting

<details>
<summary><b>Service won't start</b></summary>

```bash
# Check if port is in use
lsof -i :9999

# Check logs
tail -f /tmp/memctx.log

# Restart service
memctx restart
```

</details>

<details>
<summary><b>Hooks not working</b></summary>

```bash
# Verify hooks are registered
cat ~/.claude/settings.json | grep memctx

# Reinstall hooks
memctx uninstall
memctx install
```

</details>

<details>
<summary><b>SQLite compilation errors</b></summary>

```bash
# Rebuild native modules
npm rebuild better-sqlite3

# Or reinstall
npm uninstall -g memctx
npm install -g memctx
```

</details>

<details>
<summary><b>AI summaries not working</b></summary>

```bash
# Check API key is set
echo $ANTHROPIC_API_KEY

# Set API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Or configure in dashboard
memctx open
# Navigate to Settings
```

</details>

---

## 🤝 Contributing

We love contributions! MemCTX is open source and community-driven.

<table>
<tr>
<td width="33%" align="center">

### 🐛 Report Bugs
[Open an issue](https://github.com/bbhunterpk-ux/memctx/issues/new?template=bug_report.md)

</td>
<td width="33%" align="center">

### 💡 Request Features
[Suggest a feature](https://github.com/bbhunterpk-ux/memctx/issues/new?template=feature_request.md)

</td>
<td width="33%" align="center">

### 🔧 Submit PRs
[Contributing Guide](https://github.com/bbhunterpk-ux/memctx/blob/main/CONTRIBUTING.md)

</td>
</tr>
</table>

<details>
<summary><b>Development Setup</b></summary>

```bash
# Clone repository
git clone https://github.com/bbhunterpk-ux/memctx.git
cd memctx

# Install dependencies
pnpm install

# Build
pnpm run build

# Link locally
npm link

# Test
memctx install
memctx start
```

</details>

---

## 💬 Community

<div align="center">

[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github)](https://github.com/bbhunterpk-ux/memctx/discussions)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/memctx)
[![Twitter](https://img.shields.io/badge/Twitter-Follow-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/memctx)

</div>

- **GitHub Discussions**: Ask questions, share ideas
- **Discord**: Real-time chat with the community
- **Twitter**: Follow for updates and tips

---

## 📊 Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/bbhunterpk-ux/memctx?style=social)
![GitHub forks](https://img.shields.io/github/forks/bbhunterpk-ux/memctx?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/bbhunterpk-ux/memctx?style=social)

</div>

---

## 🗺️ Roadmap

<table>
<tr>
<th width="33%">✅ v1.0 (Current)</th>
<th width="33%">🚧 v1.1 (Next)</th>
<th width="33%">🔮 v2.0 (Future)</th>
</tr>
<tr>
<td valign="top">

- [x] Session capture
- [x] AI summaries
- [x] Dashboard UI
- [x] Search & filter
- [x] Tags & bookmarks
- [x] Export functionality

</td>
<td valign="top">

- [ ] Team collaboration
- [ ] Cloud sync
- [ ] VS Code extension
- [ ] Advanced analytics
- [ ] Custom plugins
- [ ] API webhooks

</td>
<td valign="top">

- [ ] Multi-user support
- [ ] Enterprise features
- [ ] Advanced AI insights
- [ ] Integration marketplace
- [ ] Mobile app
- [ ] Self-hosted option

</td>
</tr>
</table>

---

## 📄 License

MemCTX is [MIT licensed](LICENSE).

```
MIT License

Copyright (c) 2026 Fahad Aziz Qureshi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

Built with ❤️ using:

<div align="center">

[![Claude](https://img.shields.io/badge/Claude-AI%20Assistant-8A2BE2?style=for-the-badge)](https://claude.ai)
[![Express](https://img.shields.io/badge/Express-Web%20Framework-000000?style=for-the-badge&logo=express)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-UI%20Framework-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org)
[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

</div>

Special thanks to:
- [Anthropic](https://anthropic.com) for Claude AI
- The Claude Code community
- All our contributors and users

---

## 📞 Support

<table>
<tr>
<td width="50%" align="center">

### 📧 Email
[info@memctx.dev](mailto:info@memctx.dev)

</td>
<td width="50%" align="center">

### 🌐 Website
[memctx.dev](https://memctx.dev)

</td>
</tr>
<tr>
<td width="50%" align="center">

### 🐛 Issues
[GitHub Issues](https://github.com/bbhunterpk-ux/memctx/issues)

</td>
<td width="50%" align="center">

### 💬 Discussions
[GitHub Discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</td>
</tr>
</table>

---

<div align="center">

### ⭐ Star us on GitHub — it motivates us a lot!

[![Star History Chart](https://api.star-history.com/svg?repos=bbhunterpk-ux/memctx&type=Date)](https://star-history.com/#bbhunterpk-ux/memctx&Date)

---

**Made with ❤️ by [Fahad Aziz Qureshi](https://memctx.dev)**

*Empowering developers with perfect AI memory*

[⬆ Back to Top](#-memctx)

</div>
