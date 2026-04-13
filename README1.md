<div align="center">

<br/>

```
███╗   ███╗███████╗███╗   ███╗ ██████╗████████╗██╗  ██╗
████╗ ████║██╔════╝████╗ ████║██╔════╝╚══██╔══╝╚██╗██╔╝
██╔████╔██║█████╗  ██╔████╔██║██║        ██║    ╚███╔╝ 
██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║██║        ██║    ██╔██╗ 
██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║╚██████╗   ██║   ██╔╝ ██╗
╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝
```

### Autonomous Session Memory & Context Handoff for Claude Code
**Give your AI pair programmer a photographic memory — zero repetition, infinite continuity.**

<br/>

[![npm version](https://img.shields.io/npm/v/memctx.svg?style=flat-square&logo=npm&color=6366f1)](https://www.npmjs.com/package/memctx)
[![npm downloads](https://img.shields.io/npm/dm/memctx.svg?style=flat-square&logo=npm&color=6366f1)](https://www.npmjs.com/package/memctx)
[![License: MIT](https://img.shields.io/badge/License-MIT-a3a3a3.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/memctx.svg?style=flat-square&logo=node.js&color=22c55e)](https://nodejs.org)
[![Stars](https://img.shields.io/github/stars/bbhunterpk-ux/memctx?style=flat-square&color=f59e0b)](https://github.com/bbhunterpk-ux/memctx/stargazers)

<br/>

[**Quick Start**](#-quick-start) · [**Features**](#-features) · [**Architecture**](#-architecture) · [**CLI**](#-cli-reference) · [**Config**](#-configuration)

<br/>

</div>

---

<br/>

## The Problem

Every Claude Code session starts from zero. You repeat yourself. History evaporates. Tech debt goes untracked. Context handoffs are manual, messy, and forgotten.

**MemCTX fixes all of that — automatically.**

<br/>

<div align="center">

| | Without MemCTX | With MemCTX |
|---|---|---|
| **Context** | Re-explained every session | Auto-injected at session start |
| **History** | Lost when terminal closes | Persisted in a local graph DB |
| **Handoffs** | Manual notes (if any) | AI-generated `START HERE` markers |
| **Tech Debt** | Silently accumulates | Tracked, flagged, surfaced |
| **Privacy** | Cloud-dependent | 100% local via SQLite |

</div>

<br/>

---

<br/>

## ✦ Features

<br/>

**`🧠` World-Class Memory**
Every Claude Code session is automatically captured, analyzed, and stored. MemCTX extracts gamified metrics — **Aha! moments**, **Flow State**, **Divergence scores** — so you understand not just *what* happened, but *how* the session went.

<br/>

**`🤖` Explicit AI Handoffs**
Claude analyzes each session end-to-end, then hands off to the next one with precision. Every new session receives:
- `START HERE` markers with immediate next steps
- Open **Rabbit Holes** worth revisiting
- Outstanding **Tech Debt** items
- **Architectural Drift** warnings

<br/>

**`🏗️` Knowledge Graph Architecture**
All context is unified into a persistent local graph database. File-function relationships, decision history, and dependency chains are extracted in a single optimized pass — no redundant re-analysis.

<br/>

**`📊` Beautiful React Dashboard**
Visualize session telemetry, tool usage patterns, and your full node/edge graph in a modern React SPA. Accessible at `http://localhost:9999` — no external services, no cloud.

<br/>

**`⚡` Incremental Snapshots**
Long sessions are safely chunked using a hybrid strategy: snapshots trigger every **10 turns** or every **5 minutes**, whichever comes first. Nothing is ever lost mid-session.

<br/>

---

<br/>

## 🚀 Quick Start

### Install

```bash
# Recommended
pnpm add -g memctx

# Alternatives
npm install -g memctx
yarn global add memctx
```

<br/>

### Setup in 30 seconds

```bash
memctx install   # Hook into Claude Code via ~/.claude/settings.json
memctx start     # Boot the local background daemon
memctx open      # Launch the dashboard in your browser
```

Then simply run `claude` — MemCTX is silently running in the background, capturing and injecting context on every session.

<br/>

---

<br/>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Claude Code CLI                                               │
│        │                                                        │
│        │  SessionStart hook → injects rich context payload      │
│        ▼                                                        │
│   MemCTX Daemon (:9999)                                         │
│        │                          │                             │
│        ▼                          ▼                             │
│   SQLite Graph DB         Anthropic Analysis                    │
│   (nodes, edges,          (session summaries,                   │
│    decisions, debt)        handoff generation)                  │
│        │                          │                             │
│        └──────────┬───────────────┘                             │
│                   ▼                                             │
│           React Dashboard                                       │
│           (telemetry, timelines, graph maps)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Flow:**

1. `memctx start` boots the local daemon on port `9999`
2. Hooks are injected into `~/.claude/settings.json` via `memctx install`
3. On **session start**, MemCTX computes prior context, open tech debt, and immediate next steps — piped directly into Claude's system prompt
4. A background worker monitors live streams using the hybrid snapshot strategy
5. On **session end**, Claude analyzes gamified stats and writes the handoff payload to SQLite
6. The **React dashboard** reads from SQLite and renders your full session history, metrics, and graph

<br/>

---

<br/>

## 💻 CLI Reference

```bash
memctx install              # Register hooks + start daemon
memctx start                # Boot background daemon
memctx stop                 # Stop background daemon
memctx status               # Daemon health + SQLite diagnostics
memctx open                 # Open React dashboard in browser
memctx search <query>       # Full-text session search from terminal
memctx export               # Export all sessions to Markdown files
memctx uninstall            # Remove all hooks + stop daemon cleanly
```

<br/>

---

<br/>

## 🔧 Configuration

MemCTX works out of the box. For custom setups, configure via the dashboard at `http://localhost:9999/settings` or using environment variables:

```bash
# Required for rich AI summaries and handoff generation
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional
export ANTHROPIC_BASE_URL="..."            # For proxy support (e.g. 9router)
export MEMCTX_PORT=8080                    # Custom daemon port (default: 9999)
export MEMCTX_DB_PATH="/path/to/db.sqlite" # Custom SQLite database path
```

<br/>

---

<br/>

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **CLI & Daemon** | Node.js |
| **Storage** | SQLite (local, private) |
| **Graph DB** | Custom node/edge schema over SQLite |
| **AI Analysis** | Anthropic Claude API |
| **Dashboard** | React SPA |
| **Hooks** | Claude Code `~/.claude/settings.json` |

<br/>

---

<br/>

<div align="center">

## Support the Project

If MemCTX saves you time, please consider giving it a star — it helps more than you'd think.

[![Star on GitHub](https://img.shields.io/github/stars/bbhunterpk-ux/memctx?style=for-the-badge&color=f59e0b&logo=github)](https://github.com/bbhunterpk-ux/memctx)

<br/>

[![GitHub Discussions](https://img.shields.io/badge/Discussions-24292e?style=flat-square&logo=github&logoColor=white)](https://github.com/bbhunterpk-ux/memctx/discussions)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/memctx)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=flat-square&logo=twitter&logoColor=white)](https://twitter.com/memctx)

<br/>

**MIT Licensed** · Built by [Fahad Aziz Qureshi](https://memctx.dev) · Contributions welcome via [CONTRIBUTING.md](https://github.com/bbhunterpk-ux/memctx/blob/main/CONTRIBUTING.md)

<br/>

</div>
