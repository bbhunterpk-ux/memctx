# 🎨 Dashboard Guide

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [💻 CLI Reference](cli-reference.md) • [🔧 Troubleshooting](troubleshooting.md)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Interface Tour](#interface-tour)
- [Features](#features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips & Tricks](#tips--tricks)

---

## Overview

The MemCTX dashboard provides a beautiful web interface for exploring your Claude Code sessions, viewing AI-generated summaries, and managing projects.

**Access:** `http://localhost:9999` (default)

---

## Getting Started

### Launch Dashboard

```bash
# Start worker and open dashboard
memctx dashboard

# Or visit directly
open http://localhost:9999
```

### First Time Setup

1. **Verify Worker Status** - Green indicator in top-right
2. **Check API Key** - Settings → Configuration
3. **Add Projects** - Projects → Add Project

---

## Interface Tour

### Main Navigation

```
┌─────────────────────────────────────────────────────┐
│  MemCTX                    🔍 Search    ⚙️  Settings │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 Dashboard  │  📁 Projects  │  📝 Sessions      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dashboard View

**Overview Cards:**
- Total Sessions
- Active Projects
- Recent Activity
- Summarization Status

**Recent Sessions:**
- Session list with summaries
- Quick filters (project, tags, date)
- Search functionality

**Activity Timeline:**
- Visual timeline of sessions
- Grouped by project
- Interactive date navigation

### Projects View

**Project List:**
- All tracked projects
- Session count per project
- Last activity timestamp
- Quick actions (view, edit, remove)

**Project Details:**
- Session history
- Statistics
- Configuration
- Tags and metadata

### Sessions View

**Session List:**
- Filterable and searchable
- Sort by date, duration, project
- Bulk actions
- Export options

**Session Details:**
- Full summary
- Metadata (duration, files, commands)
- Context injection preview
- Related sessions

---

## Features

### 🔍 Search

**Global Search:**
- Search across all sessions
- Filter by project, tags, date
- Full-text search in summaries

**Advanced Filters:**
```
project:my-app tags:bugfix,urgent date:2026-04
```

### 📊 Analytics

**Session Statistics:**
- Total sessions
- Average duration
- Most active projects
- Tag distribution

**Time Analysis:**
- Sessions per day/week/month
- Peak activity times
- Project time allocation

### 🏷️ Tags

**Tag Management:**
- Create custom tags
- Auto-suggest from history
- Tag-based filtering
- Tag statistics

### 📝 Notes

**Session Notes:**
- Add notes to sessions
- Edit existing notes
- Search notes
- Export with sessions

### 🎨 Themes

**Theme Options:**
- Dark mode (default)
- Light mode
- Auto (system preference)

**Customization:**
- Accent colors
- Font size
- Compact/comfortable view

### 📤 Export

**Export Formats:**
- JSON (full data)
- CSV (spreadsheet)
- Markdown (documentation)

**Export Options:**
- All sessions
- Filtered sessions
- Single project
- Date range

---

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `?` | Show shortcuts |
| `Esc` | Close modal/clear search |
| `g d` | Go to dashboard |
| `g p` | Go to projects |
| `g s` | Go to sessions |

### Navigation

| Shortcut | Action |
|----------|--------|
| `j` / `↓` | Next item |
| `k` / `↑` | Previous item |
| `Enter` | Open selected |
| `Backspace` | Go back |

### Actions

| Shortcut | Action |
|----------|--------|
| `n` | New session |
| `e` | Edit selected |
| `d` | Delete selected |
| `r` | Refresh |
| `x` | Toggle selection |

### Filters

| Shortcut | Action |
|----------|--------|
| `f p` | Filter by project |
| `f t` | Filter by tags |
| `f d` | Filter by date |
| `f c` | Clear filters |

---

## Tips & Tricks

### Quick Filters

Use URL parameters for instant filtering:

```
http://localhost:9999/sessions?project=my-app
http://localhost:9999/sessions?tags=bugfix,urgent
http://localhost:9999/sessions?date=2026-04
```

### Bookmarkable Views

Create bookmarks for common views:

```
# Today's sessions
http://localhost:9999/sessions?date=today

# Current project
http://localhost:9999/sessions?project=current

# Urgent items
http://localhost:9999/sessions?tags=urgent
```

### Bulk Operations

1. Select multiple sessions (click checkboxes)
2. Use bulk actions menu
3. Apply tags, export, or delete

### Custom Dashboards

Create custom views with URL parameters:

```
# Project dashboard
http://localhost:9999/dashboard?project=my-app&view=stats

# Weekly review
http://localhost:9999/sessions?date=this-week&sort=duration
```

### Mobile Access

Access dashboard from mobile devices:

```
# Find your local IP
ifconfig | grep "inet "

# Access from mobile
http://192.168.1.x:9999
```

### Dark Mode Scheduling

Auto-switch themes based on time:

```json
{
  "theme": {
    "mode": "auto",
    "schedule": {
      "dark": "18:00",
      "light": "08:00"
    }
  }
}
```

---

## Troubleshooting

### Dashboard Won't Load

```bash
# Check worker status
memctx worker status

# Check port availability
lsof -i :9999

# Restart worker
memctx worker restart
```

### Slow Performance

```bash
# Clear cache
memctx cleanup --cache

# Reduce session limit
memctx config set dashboard.sessionsPerPage 10

# Check database size
du -h ~/.memctx/sessions.db
```

### Missing Sessions

```bash
# Verify database
memctx doctor

# Check worker logs
memctx worker logs --level error

# Reimport sessions
memctx import ~/.memctx/backup.json
```

---

## Next Steps

- [🔧 Troubleshooting](troubleshooting.md) - Common issues and solutions
- [🏗️ Architecture](../developer/architecture.md) - Understand the system
- [🔌 API Reference](../developer/api-reference.md) - Build integrations

---

<div align="center">

**Need help?** [Open an issue](https://github.com/bbhunterpk-ux/memctx/issues) • [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</div>
