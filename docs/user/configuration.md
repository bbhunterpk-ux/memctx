# ⚙️ Configuration Guide

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [📦 Installation](installation.md) • [💻 CLI Reference](cli-reference.md)

</div>

---

## 📋 Table of Contents

- [Configuration File](#configuration-file)
- [Environment Variables](#environment-variables)
- [Project Settings](#project-settings)
- [Dashboard Settings](#dashboard-settings)
- [Advanced Configuration](#advanced-configuration)

---

## Configuration File

MemCTX stores configuration in `~/.memctx/config.json`:

```json
{
  "apiKey": "your-anthropic-api-key",
  "model": "claude-opus-4",
  "port": 9999,
  "autoStart": true,
  "theme": "dark",
  "projects": []
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | - | Anthropic API key (required) |
| `model` | string | `claude-opus-4` | Claude model to use |
| `port` | number | `9999` | Dashboard port |
| `autoStart` | boolean | `true` | Auto-start worker on CLI init |
| `theme` | string | `dark` | Dashboard theme (`dark`/`light`) |
| `projects` | array | `[]` | Tracked projects |

---

## Environment Variables

### Required

```bash
# Anthropic API Key
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Optional

```bash
# Override config file settings
export MEMCTX_PORT=9999
export MEMCTX_MODEL="claude-opus-4"
export MEMCTX_THEME="dark"

# Database location
export MEMCTX_DB_PATH="~/.memctx/sessions.db"

# Log level
export MEMCTX_LOG_LEVEL="info"  # debug, info, warn, error
```

---

## Project Settings

### Auto-Detection

MemCTX automatically detects projects based on:
- Git repository root
- `package.json` presence
- `.memctx` directory

### Manual Configuration

Create `.memctx/config.json` in your project:

```json
{
  "name": "My Project",
  "description": "Project description",
  "tags": ["frontend", "react"],
  "excludePaths": [
    "node_modules",
    "dist",
    ".git"
  ],
  "summarization": {
    "enabled": true,
    "minDuration": 300,
    "model": "claude-haiku-4"
  }
}
```

### Project Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | Directory name | Project display name |
| `description` | string | - | Project description |
| `tags` | array | `[]` | Project tags for filtering |
| `excludePaths` | array | Standard ignores | Paths to exclude from context |
| `summarization.enabled` | boolean | `true` | Enable AI summarization |
| `summarization.minDuration` | number | `300` | Min session duration (seconds) |
| `summarization.model` | string | `claude-haiku-4` | Model for summarization |

---

## Dashboard Settings

### Theme Customization

```json
{
  "theme": {
    "mode": "dark",
    "colors": {
      "primary": "#3b82f6",
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#ef4444"
    }
  }
}
```

### Display Options

```json
{
  "dashboard": {
    "sessionsPerPage": 20,
    "showTimestamps": true,
    "dateFormat": "relative",
    "groupBy": "project"
  }
}
```

---

## Advanced Configuration

### Custom Summarization Prompts

Create `~/.memctx/prompts/summarize.txt`:

```
Analyze this Claude Code session and provide:
1. Main tasks completed
2. Key decisions made
3. Blockers encountered
4. Next steps

Focus on actionable insights.
```

### Database Configuration

```json
{
  "database": {
    "path": "~/.memctx/sessions.db",
    "backupEnabled": true,
    "backupInterval": 86400,
    "maxBackups": 7
  }
}
```

### Performance Tuning

```json
{
  "performance": {
    "cacheSize": 100,
    "maxConcurrentSummarizations": 3,
    "requestTimeout": 30000
  }
}
```

### Logging Configuration

```json
{
  "logging": {
    "level": "info",
    "file": "~/.memctx/memctx.log",
    "maxSize": "10M",
    "maxFiles": 5,
    "console": true
  }
}
```

---

## Configuration Examples

### Minimal Setup

```json
{
  "apiKey": "sk-ant-..."
}
```

### Development Setup

```json
{
  "apiKey": "sk-ant-...",
  "port": 9999,
  "theme": "dark",
  "logging": {
    "level": "debug",
    "console": true
  }
}
```

### Production Setup

```json
{
  "apiKey": "sk-ant-...",
  "port": 9999,
  "autoStart": true,
  "database": {
    "backupEnabled": true,
    "backupInterval": 86400
  },
  "performance": {
    "cacheSize": 200,
    "maxConcurrentSummarizations": 5
  },
  "logging": {
    "level": "warn",
    "file": "/var/log/memctx.log"
  }
}
```

---

## Troubleshooting

### Configuration Not Loading

```bash
# Check config file exists
ls -la ~/.memctx/config.json

# Validate JSON syntax
cat ~/.memctx/config.json | jq .

# Reset to defaults
memctx config reset
```

### Environment Variables Not Working

```bash
# Check environment
env | grep MEMCTX

# Test with explicit values
MEMCTX_PORT=9999 memctx start
```

### Permission Issues

```bash
# Fix permissions
chmod 600 ~/.memctx/config.json
chmod 755 ~/.memctx
```

---

## Next Steps

- [📖 CLI Reference](cli-reference.md) - Learn all CLI commands
- [🎨 Dashboard Guide](dashboard.md) - Explore the web interface
- [🔧 Troubleshooting](troubleshooting.md) - Common issues and solutions

---

<div align="center">

**Need help?** [Open an issue](https://github.com/bbhunterpk-ux/memctx/issues) • [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</div>
