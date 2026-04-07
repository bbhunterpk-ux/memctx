# 🔧 Troubleshooting

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [💻 CLI Reference](cli-reference.md) • [🎨 Dashboard](dashboard.md)

</div>

---

## 📋 Table of Contents

- [Common Issues](#common-issues)
- [Worker Problems](#worker-problems)
- [Dashboard Issues](#dashboard-issues)
- [API Errors](#api-errors)
- [Database Issues](#database-issues)
- [Getting Help](#getting-help)

---

## Common Issues

### MemCTX Command Not Found

**Problem:** `memctx: command not found`

**Solutions:**

```bash
# 1. Verify installation
npm list -g memctx

# 2. Reinstall globally
npm install -g memctx

# 3. Check PATH
echo $PATH | grep npm

# 4. Use npx as fallback
npx memctx --version
```

### API Key Not Configured

**Problem:** `Error: ANTHROPIC_API_KEY not configured`

**Solutions:**

```bash
# 1. Set environment variable
export ANTHROPIC_API_KEY="sk-ant-..."

# 2. Add to shell profile
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.zshrc
source ~/.zshrc

# 3. Set via CLI
memctx config set apiKey "sk-ant-..."

# 4. Verify configuration
memctx config apiKey
```

### Sessions Not Being Tracked

**Problem:** Sessions not appearing in dashboard

**Solutions:**

```bash
# 1. Check worker status
memctx worker status

# 2. Start worker if stopped
memctx worker start

# 3. Check Claude Code hook
cat ~/.claude/settings.json | grep SessionStart

# 4. Verify project detection
memctx projects

# 5. Check logs
memctx worker logs --level error
```

---

## Worker Problems

### Worker Won't Start

**Problem:** `Error: Failed to start worker`

**Diagnosis:**

```bash
# Check if port is in use
lsof -i :9999

# Check for existing process
ps aux | grep memctx

# Check logs
cat /tmp/memctx.log
```

**Solutions:**

```bash
# 1. Kill existing process
pkill -f memctx-worker

# 2. Use different port
memctx worker start --port 9998

# 3. Check permissions
chmod +x ~/.memctx/worker

# 4. Reinstall
npm install -g memctx --force
```

### Worker Crashes Repeatedly

**Problem:** Worker starts but crashes immediately

**Diagnosis:**

```bash
# Check error logs
memctx worker logs --level error

# Check system resources
free -h
df -h ~/.memctx

# Check database integrity
sqlite3 ~/.memctx/sessions.db "PRAGMA integrity_check;"
```

**Solutions:**

```bash
# 1. Clear cache
rm -rf ~/.memctx/cache

# 2. Repair database
memctx doctor --fix

# 3. Reset configuration
memctx config reset

# 4. Reinstall with clean state
npm uninstall -g memctx
rm -rf ~/.memctx
npm install -g memctx
```

### Worker High CPU Usage

**Problem:** Worker consuming excessive CPU

**Solutions:**

```bash
# 1. Reduce concurrent summarizations
memctx config set performance.maxConcurrentSummarizations 1

# 2. Increase summarization threshold
memctx config set summarization.minDuration 600

# 3. Disable auto-summarization temporarily
memctx config set summarization.enabled false

# 4. Check for stuck jobs
memctx worker logs | grep "Summarizing"
```

---

## Dashboard Issues

### Dashboard Won't Load

**Problem:** `ERR_CONNECTION_REFUSED` or blank page

**Diagnosis:**

```bash
# 1. Check worker status
memctx worker status

# 2. Check port
lsof -i :9999

# 3. Test API directly
curl http://localhost:9999/api/health
```

**Solutions:**

```bash
# 1. Restart worker
memctx worker restart

# 2. Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete

# 3. Try different browser

# 4. Check firewall
sudo ufw status
```

### Dashboard Shows No Data

**Problem:** Dashboard loads but shows no sessions

**Diagnosis:**

```bash
# Check database
sqlite3 ~/.memctx/sessions.db "SELECT COUNT(*) FROM sessions;"

# Check API response
curl http://localhost:9999/api/sessions
```

**Solutions:**

```bash
# 1. Verify sessions exist
memctx list --all

# 2. Check project filter
# Clear filters in dashboard UI

# 3. Reimport data
memctx import ~/.memctx/backup.json

# 4. Check database permissions
ls -la ~/.memctx/sessions.db
```

### Dashboard Performance Issues

**Problem:** Dashboard slow or unresponsive

**Solutions:**

```bash
# 1. Reduce sessions per page
memctx config set dashboard.sessionsPerPage 10

# 2. Clean up old sessions
memctx cleanup --older-than 90

# 3. Optimize database
sqlite3 ~/.memctx/sessions.db "VACUUM;"

# 4. Clear cache
rm -rf ~/.memctx/cache
```

---

## API Errors

### Rate Limit Errors

**Problem:** `Error: Rate limit exceeded`

**Solutions:**

```bash
# 1. Reduce concurrent requests
memctx config set performance.maxConcurrentSummarizations 1

# 2. Increase request timeout
memctx config set performance.requestTimeout 60000

# 3. Check API usage
# Visit: https://console.anthropic.com/settings/usage

# 4. Upgrade API tier
# Visit: https://console.anthropic.com/settings/plans
```

### Authentication Errors

**Problem:** `Error: Invalid API key`

**Solutions:**

```bash
# 1. Verify API key format
memctx config apiKey
# Should start with: sk-ant-

# 2. Generate new key
# Visit: https://console.anthropic.com/settings/keys

# 3. Update configuration
memctx config set apiKey "sk-ant-..."

# 4. Restart worker
memctx worker restart
```

### Timeout Errors

**Problem:** `Error: Request timeout`

**Solutions:**

```bash
# 1. Increase timeout
memctx config set performance.requestTimeout 60000

# 2. Check network connectivity
ping api.anthropic.com

# 3. Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 4. Use different model
memctx config set model "claude-haiku-4"
```

---

## Database Issues

### Database Corruption

**Problem:** `Error: database disk image is malformed`

**Solutions:**

```bash
# 1. Backup current database
cp ~/.memctx/sessions.db ~/.memctx/sessions.db.backup

# 2. Try to repair
sqlite3 ~/.memctx/sessions.db "PRAGMA integrity_check;"

# 3. Export and reimport
memctx export --output backup.json
rm ~/.memctx/sessions.db
memctx import backup.json

# 4. Restore from backup
cp ~/.memctx/backups/sessions-latest.db ~/.memctx/sessions.db
```

### Database Locked

**Problem:** `Error: database is locked`

**Solutions:**

```bash
# 1. Check for multiple processes
ps aux | grep memctx

# 2. Kill competing processes
pkill -f memctx-worker

# 3. Remove lock file
rm ~/.memctx/sessions.db-wal
rm ~/.memctx/sessions.db-shm

# 4. Restart worker
memctx worker start
```

### Database Too Large

**Problem:** Database file growing too large

**Solutions:**

```bash
# 1. Check database size
du -h ~/.memctx/sessions.db

# 2. Clean up old sessions
memctx cleanup --older-than 90

# 3. Vacuum database
sqlite3 ~/.memctx/sessions.db "VACUUM;"

# 4. Archive old data
memctx export --older-than 180 --output archive.json
memctx cleanup --older-than 180 --force
```

---

## Getting Help

### Diagnostic Information

When reporting issues, include:

```bash
# System information
memctx --version
node --version
npm --version
uname -a

# Configuration
memctx config --json

# Worker status
memctx worker status --json

# Recent logs
memctx worker logs --lines 50

# Database stats
sqlite3 ~/.memctx/sessions.db "SELECT COUNT(*) FROM sessions;"
```

### Run Diagnostics

```bash
# Comprehensive health check
memctx doctor

# With auto-fix
memctx doctor --fix
```

### Enable Debug Logging

```bash
# Temporary debug mode
MEMCTX_LOG_LEVEL=debug memctx worker start

# Permanent debug mode
memctx config set logging.level debug
memctx worker restart

# View debug logs
memctx worker logs --level debug --follow
```

### Report an Issue

1. **Check existing issues:** [GitHub Issues](https://github.com/bbhunterpk-ux/memctx/issues)
2. **Gather diagnostic info** (see above)
3. **Create new issue** with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information
   - Relevant logs

### Community Support

- **GitHub Discussions:** [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)
- **Discord:** [Join server](https://discord.gg/memctx)
- **Email:** support@memctx.dev

---

## Next Steps

- [🏗️ Architecture](../developer/architecture.md) - Understand the system
- [🔌 API Reference](../developer/api-reference.md) - Build integrations
- [🤝 Contributing](../developer/contributing.md) - Help improve MemCTX

---

<div align="center">

**Still stuck?** [Open an issue](https://github.com/bbhunterpk-ux/memctx/issues) • [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</div>
