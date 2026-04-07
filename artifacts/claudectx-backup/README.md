# ClaudeContext

> Autonomous session memory for Claude Code

ClaudeContext automatically captures, analyzes, and summarizes your Claude Code sessions, providing intelligent context injection and a beautiful dashboard to track your development history.

## Features

- 🧠 **Automatic Session Tracking** - Captures every Claude Code session automatically
- 🤖 **AI-Powered Summaries** - Generates structured summaries with what you did, next steps, and gotchas
- 📊 **Beautiful Dashboard** - Modern UI to browse sessions, search history, and view metrics
- 🔍 **Full-Text Search** - Search across all your sessions and conversations
- 📈 **Live Monitoring** - Real-time view of active sessions
- 🎯 **Smart Context Injection** - Automatically injects relevant session history into new sessions
- 🏷️ **Tags & Bookmarks** - Organize sessions with tags and bookmarks
- 📝 **Session Notes** - Add custom notes to any session
- 🌓 **Dark/Light Theme** - Beautiful themes for any preference

## Installation

```bash
# Install globally with npm
npm install -g claudectx

# Or with pnpm
pnpm add -g claudectx

# Or with yarn
yarn global add claudectx
```

## Quick Start

```bash
# Install and setup hooks
claudectx install

# Start the service
claudectx start

# Open the dashboard
claudectx open
```

That's it! ClaudeContext will now automatically capture all your Claude Code sessions.

## Requirements

- **Node.js** 18.0.0 or higher
- **Claude Code** CLI installed
- **Build tools** for native dependencies:
  - Linux: `build-essential`, `python3`
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools

## Configuration

### Settings Dashboard (Recommended)

The easiest way to configure ClaudeContext is through the Settings page in the dashboard:

1. Open `http://localhost:9999/settings`
2. Configure your preferences:
   - **API Provider**: Direct (Anthropic) or Proxy (9router, etc.)
   - **API Key**: Your Anthropic or proxy API key
   - **Base URL**: Custom proxy endpoint (if using proxy)
   - **Model**: Choose Claude Opus, Sonnet, Haiku, or AWS default
   - **Disable Summaries**: Toggle to save API costs
3. Click "Save Settings"
4. Restart worker: `claudectx restart`

Settings are saved to `~/.claudectx/settings.json` and persist across restarts.

### Environment Variables (Alternative)

You can also configure via environment variables:

```bash
# Required for AI summaries
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Use proxy (like 9router)
export ANTHROPIC_BASE_URL="https://your-proxy.com/v1"

# Optional: Custom port (default: 9999)
export CLAUDECTX_PORT=8080

# Optional: Custom database location
export CLAUDECTX_DB_PATH="/path/to/db.sqlite"

# Optional: Number of sessions to inject (default: 3)
export CLAUDECTX_CONTEXT_SESSIONS=5
```

**Configuration Priority:** Settings Dashboard > Environment Variables > Defaults

### Configuration Files

ClaudeContext stores its data in `~/.claudectx/`:

```
~/.claudectx/
├── db.sqlite          # Session database
├── settings.json      # User preferences (API key, model, etc.)
├── hooks/             # Claude Code hooks
└── logs/              # Service logs
```

## CLI Commands

```bash
# Installation & Setup
claudectx install      # Install hooks and start daemon
claudectx uninstall    # Remove hooks and stop daemon

# Service Management
claudectx start        # Start the worker daemon
claudectx stop         # Stop the worker daemon
claudectx restart      # Restart the worker daemon
claudectx status       # Show daemon status and health

# Usage
claudectx open         # Open dashboard in browser
claudectx search <query>  # Search sessions from terminal
claudectx export       # Export all sessions as markdown
claudectx config       # Show configuration

# Options
--port <number>        # Set custom port
--api-key <key>        # Set Anthropic API key
--sessions <number>    # Number of sessions to inject
```

## Dashboard

Access the dashboard at `http://localhost:9999` (or your custom port).

### Pages

- **Projects** - View all projects and their sessions
- **Search** - Full-text search across all sessions
- **Live** - Real-time monitoring of active sessions
- **Metrics** - System performance and statistics
- **Logs** - View service logs
- **Settings** - Configure API provider, model, and preferences

### Features

- **Session Details** - View full conversation history, summaries, and observations
- **Tags** - Create and assign tags to organize sessions
- **Bookmarks** - Mark important sessions for quick access
- **Notes** - Add custom notes to any session
- **Archive** - Archive old sessions to declutter
- **Export** - Export sessions as markdown or screenshots
- **Keyboard Shortcuts** - Press `?` to see all shortcuts

## How It Works

1. **Hooks** - ClaudeContext registers hooks in `~/.claude/settings.json` that trigger on session events
2. **Worker** - A background service captures session data and stores it in SQLite
3. **AI Summarization** - When a session ends, Claude analyzes it and generates a structured summary
4. **Context Injection** - On new sessions, relevant history is automatically injected into `CLAUDE.md`
5. **Dashboard** - A React app provides a beautiful interface to browse and search your history

## Architecture

```
┌─────────────────┐
│  Claude Code    │
│   (CLI/IDE)     │
└────────┬────────┘
         │ hooks
         ▼
┌─────────────────┐
│ ClaudeContext   │
│    Worker       │◄──── WebSocket ────┐
│  (Node.js)      │                    │
└────────┬────────┘                    │
         │                             │
         ▼                             │
┌─────────────────┐          ┌────────┴────────┐
│   SQLite DB     │          │   Dashboard     │
│  (Sessions)     │          │   (React)       │
└─────────────────┘          └─────────────────┘
```

## Troubleshooting

### Service won't start

```bash
# Check if port is in use
lsof -i :9999

# Check logs
tail -f /tmp/claudectx.log

# Restart service
claudectx restart
```

### Hooks not working

```bash
# Verify hooks are registered
cat ~/.claude/settings.json | grep claudectx

# Reinstall hooks
claudectx uninstall
claudectx install
```

### SQLite compilation errors

```bash
# Rebuild native modules
npm rebuild better-sqlite3

# Or reinstall
npm uninstall -g claudectx
npm install -g claudectx
```

### AI summaries not working

```bash
# Check API key is set
echo $ANTHROPIC_API_KEY

# Set API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Restart service
claudectx restart
```

## Development

```bash
# Clone repository
git clone https://github.com/yourusername/claudectx.git
cd claudectx

# Install dependencies
pnpm install

# Build
pnpm run build

# Link locally
npm link

# Test
claudectx install
claudectx start
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT © 2026

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/claudectx/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/claudectx/discussions)
- **Email**: your.email@example.com

## Acknowledgments

Built with:
- [Claude](https://claude.ai) - AI assistant by Anthropic
- [Express](https://expressjs.com/) - Web framework
- [SQLite](https://www.sqlite.org/) - Database
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool

---

Made with ❤️ for the Claude Code community
