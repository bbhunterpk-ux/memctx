# 💻 CLI Reference

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [⚙️ Configuration](configuration.md) • [🎨 Dashboard](dashboard.md)

</div>

---

## 📋 Table of Contents

- [Global Commands](#global-commands)
- [Session Management](#session-management)
- [Project Management](#project-management)
- [Worker Control](#worker-control)
- [Configuration](#configuration)
- [Utilities](#utilities)

---

## Global Commands

### `memctx --help`

Display help information.

```bash
memctx --help
memctx -h
```

### `memctx --version`

Show version information.

```bash
memctx --version
memctx -v
```

---

## Session Management

### `memctx start`

Start a new session (auto-tracked by Claude Code hook).

```bash
memctx start [project-path]

# Options
-p, --project <path>    Project directory (default: current)
-t, --tags <tags>       Comma-separated tags
-n, --note <text>       Session note
```

**Examples:**

```bash
# Start in current directory
memctx start

# Start in specific project
memctx start ~/projects/my-app

# Start with tags
memctx start --tags "bugfix,urgent"

# Start with note
memctx start --note "Fixing authentication issue"
```

### `memctx end`

End current session.

```bash
memctx end [session-id]

# Options
-f, --force             Force end without confirmation
-s, --summarize         Trigger immediate summarization
```

**Examples:**

```bash
# End current session
memctx end

# Force end specific session
memctx end abc123 --force

# End and summarize
memctx end --summarize
```

### `memctx list`

List sessions.

```bash
memctx list [options]

# Options
-p, --project <name>    Filter by project
-t, --tags <tags>       Filter by tags
-l, --limit <n>         Limit results (default: 20)
-a, --all               Show all sessions
--json                  Output as JSON
```

**Examples:**

```bash
# List recent sessions
memctx list

# List all sessions for project
memctx list --project my-app --all

# List sessions with specific tags
memctx list --tags "bugfix,urgent"

# Export as JSON
memctx list --json > sessions.json
```

### `memctx show`

Show session details.

```bash
memctx show <session-id>

# Options
--json                  Output as JSON
-v, --verbose           Show full details
```

**Examples:**

```bash
# Show session summary
memctx show abc123

# Show full details
memctx show abc123 --verbose

# Export as JSON
memctx show abc123 --json
```

---

## Project Management

### `memctx projects`

List tracked projects.

```bash
memctx projects [options]

# Options
-a, --all               Show all projects
--json                  Output as JSON
```

### `memctx project add`

Add project to tracking.

```bash
memctx project add <path>

# Options
-n, --name <name>       Project name
-d, --desc <text>       Description
-t, --tags <tags>       Tags
```

**Examples:**

```bash
# Add current directory
memctx project add .

# Add with metadata
memctx project add ~/projects/my-app \
  --name "My App" \
  --desc "Production web application" \
  --tags "frontend,react"
```

### `memctx project remove`

Remove project from tracking.

```bash
memctx project remove <project-id>

# Options
-f, --force             Force removal without confirmation
--keep-sessions         Keep session data
```

---

## Worker Control

### `memctx worker start`

Start background worker.

```bash
memctx worker start

# Options
-p, --port <port>       API port (default: 9999)
-d, --daemon            Run as daemon
```

### `memctx worker stop`

Stop background worker.

```bash
memctx worker stop

# Options
-f, --force             Force stop
```

### `memctx worker status`

Check worker status.

```bash
memctx worker status

# Options
--json                  Output as JSON
```

### `memctx worker restart`

Restart background worker.

```bash
memctx worker restart
```

### `memctx worker logs`

View worker logs.

```bash
memctx worker logs [options]

# Options
-f, --follow            Follow log output
-n, --lines <n>         Number of lines (default: 50)
--level <level>         Filter by level (debug, info, warn, error)
```

**Examples:**

```bash
# View recent logs
memctx worker logs

# Follow logs in real-time
memctx worker logs --follow

# Show last 100 lines
memctx worker logs --lines 100

# Show only errors
memctx worker logs --level error
```

---

## Configuration

### `memctx config`

Show current configuration.

```bash
memctx config [key]

# Options
--json                  Output as JSON
```

**Examples:**

```bash
# Show all config
memctx config

# Show specific key
memctx config apiKey
```

### `memctx config set`

Set configuration value.

```bash
memctx config set <key> <value>
```

**Examples:**

```bash
# Set API key
memctx config set apiKey "sk-ant-..."

# Set port
memctx config set port 9999

# Set theme
memctx config set theme dark
```

### `memctx config reset`

Reset configuration to defaults.

```bash
memctx config reset

# Options
-f, --force             Skip confirmation
```

---

## Utilities

### `memctx dashboard`

Open dashboard in browser.

```bash
memctx dashboard

# Options
-p, --port <port>       Dashboard port
--no-open               Don't open browser
```

### `memctx export`

Export session data.

```bash
memctx export [options]

# Options
-o, --output <file>     Output file
-f, --format <format>   Format (json, csv, markdown)
-p, --project <name>    Filter by project
-t, --tags <tags>       Filter by tags
--from <date>           Start date
--to <date>             End date
```

**Examples:**

```bash
# Export all sessions as JSON
memctx export --output sessions.json

# Export project sessions as CSV
memctx export --project my-app --format csv --output my-app.csv

# Export date range as markdown
memctx export --from 2026-01-01 --to 2026-03-31 --format markdown
```

### `memctx import`

Import session data.

```bash
memctx import <file>

# Options
-f, --format <format>   Format (json, csv)
--merge                 Merge with existing data
```

### `memctx cleanup`

Clean up old sessions.

```bash
memctx cleanup [options]

# Options
--older-than <days>     Remove sessions older than N days
--dry-run               Show what would be removed
-f, --force             Skip confirmation
```

**Examples:**

```bash
# Preview cleanup
memctx cleanup --older-than 90 --dry-run

# Remove sessions older than 90 days
memctx cleanup --older-than 90
```

### `memctx doctor`

Diagnose issues.

```bash
memctx doctor

# Options
--fix                   Attempt to fix issues
```

---

## Environment Variables

All CLI commands respect these environment variables:

```bash
ANTHROPIC_API_KEY       # API key
MEMCTX_PORT            # Dashboard port
MEMCTX_DB_PATH         # Database location
MEMCTX_LOG_LEVEL       # Log level
MEMCTX_CONFIG_PATH     # Config file location
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Worker not running |
| 4 | API error |
| 5 | Configuration error |

---

## Next Steps

- [🎨 Dashboard Guide](dashboard.md) - Explore the web interface
- [🔧 Troubleshooting](troubleshooting.md) - Common issues and solutions
- [🏗️ Architecture](../developer/architecture.md) - Understand the system

---

<div align="center">

**Need help?** [Open an issue](https://github.com/bbhunterpk-ux/memctx/issues) • [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</div>
