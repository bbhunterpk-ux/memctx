#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { execSync, spawn } from 'child_process'
import { CONFIG } from '../src/config'
import { patchClaudeSettings, removeClaudeHooks } from '../installer/patch-settings'
import { startDaemon, stopDaemon, getDaemonStatus } from '../installer/daemon'

const args = process.argv.slice(2)
const command = args[0]

function printUsage() {
  console.log(`
Usage: memctx <command>

Commands:
  install     Install MemCTX — registers hooks, starts daemon
  uninstall   Remove hooks and stop daemon
  start       Start the worker daemon
  stop        Stop the worker daemon
  restart     Restart the worker daemon
  status      Show daemon status and health check
  open        Open dashboard in browser
  export      Export all sessions as markdown files
  search      Search sessions from terminal
  config      Show or edit configuration

Options:
  --port      Port for worker (default: 9999)
  --api-key   Set Anthropic API key
  --sessions  Number of sessions to inject at startup (default: 3)
`)
}

async function checkHealth(): Promise<any> {
  try {
    const { default: http } = await import('http')
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${CONFIG.port}/api/health`, (res) => {
        let data = ''
        res.on('data', (chunk: Buffer) => { data += chunk })
        res.on('end', () => {
          try { resolve(JSON.parse(data)) } catch { resolve(null) }
        })
      })
      req.on('error', () => resolve(null))
      req.setTimeout(2000, () => { req.destroy(); resolve(null) })
    })
  } catch {
    return null
  }
}

async function run() {
  switch (command) {
    case 'install': {
      console.log('\n🚀 Installing MemCTX...\n')

      // 1. Create directories
      const dirs = [CONFIG.dataDir, CONFIG.hooksDir, CONFIG.logsDir]
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
          console.log(`  Created ${dir}`)
        }
      }

      // 2. Copy compiled hook scripts
      const hooksDistDir = path.join(__dirname, '..', 'src', 'hooks')
      const distHooksDir = path.join(__dirname, '..', 'dist', 'src', 'hooks')

      const hookFiles = [
        'session-start', 'session-end', 'post-tool-use',
        'user-prompt-submit', 'stop', 'pre-compact'
      ]

      let hooksSource = ''
      if (fs.existsSync(distHooksDir)) {
        hooksSource = distHooksDir
      }

      if (hooksSource) {
        for (const hook of hookFiles) {
          const src = path.join(hooksSource, `${hook}.js`)
          const dest = path.join(CONFIG.hooksDir, `${hook}.js`)
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest)
            console.log(`  Installed hook: ${hook}.js`)
          }
        }
      } else {
        console.log('  Note: Build hooks first with: npm run build:worker')
        console.log('  Then re-run install to copy hook scripts.')
      }

      // 3. Patch Claude settings
      try {
        patchClaudeSettings()
        console.log('  Hooks registered in ~/.claude/settings.json')
      } catch (err) {
        console.warn('  Could not patch settings.json:', err)
      }

      // 4. Start daemon
      const workerPath = path.join(__dirname, '..', 'dist', 'src', 'index.js')
      if (fs.existsSync(workerPath)) {
        startDaemon(workerPath)
      } else {
        console.log('  Note: Build first with: npm run build')
        console.log('  Then run: claudectx start')
      }

      // 5. Check if API key is set
      if (!CONFIG.apiKey) {
        console.log('\n  ⚠️  ANTHROPIC_API_KEY not set — AI summaries will be disabled.')
        console.log('  Set it with: export ANTHROPIC_API_KEY=sk-ant-...')
      }

      console.log('\n✅ MemCTX installed!')
      console.log(`   Dashboard: http://localhost:${CONFIG.port}`)
      console.log('   Claude Code will now automatically capture and summarize sessions.\n')
      break
    }

    case 'uninstall': {
      console.log('Uninstalling MemCTX...')
      removeClaudeHooks()
      stopDaemon()
      console.log('Done. Data preserved at', CONFIG.dataDir)
      break
    }

    case 'start': {
      const workerPath = path.join(__dirname, '..', 'dist', 'src', 'index.js')
      if (!fs.existsSync(workerPath)) {
        console.error('Worker not built. Run: npm run build')
        process.exit(1)
      }
      startDaemon(workerPath)
      break
    }

    case 'stop': {
      stopDaemon()
      break
    }

    case 'restart': {
      stopDaemon()
      await new Promise(r => setTimeout(r, 1000))
      const workerPath = path.join(__dirname, '..', 'dist', 'src', 'index.js')
      startDaemon(workerPath)
      break
    }

    case 'status': {
      const daemonStatus = getDaemonStatus()
      console.log(`Daemon: ${daemonStatus}`)

      const health = await checkHealth()
      if (health) {
        console.log(`Worker: online (uptime: ${health.uptime}s)`)
        console.log(`DB: ${health.db}`)
        console.log(`API Key: ${health.api_key ? 'configured' : 'not set'}`)
        console.log(`Queue: ${health.queue_size} items pending`)
      } else {
        console.log('Worker: offline (not responding on port', CONFIG.port, ')')
      }
      break
    }

    case 'open': {
      const url = `http://localhost:${CONFIG.port}`
      console.log('Opening', url)
      try {
        execSync(`open "${url}" 2>/dev/null || xdg-open "${url}" 2>/dev/null || start "${url}"`, { stdio: 'ignore' })
      } catch {
        console.log('Could not auto-open browser. Visit:', url)
      }
      break
    }

    case 'export': {
      const { getDB } = await import('../src/db/client')
      const db = getDB()
      const sessions = db.prepare('SELECT * FROM sessions WHERE summary_title IS NOT NULL ORDER BY started_at DESC').all() as any[]

      const exportDir = path.join(process.cwd(), 'memctx-export')
      fs.mkdirSync(exportDir, { recursive: true })

      for (const s of sessions) {
        const date = new Date(s.started_at * 1000).toISOString().split('T')[0]
        const title = (s.summary_title || 'untitled').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
        const fileName = `${date}-${title}.md`

        const lines = [
          `# ${s.summary_title || 'Untitled Session'}`,
          `Date: ${new Date(s.started_at * 1000).toLocaleString()}`,
          `Status: ${s.status}`,
          '',
        ]

        if (s.summary_what_we_did) {
          lines.push('## What We Did')
          try {
            for (const item of JSON.parse(s.summary_what_we_did)) {
              lines.push(`- ${item}`)
            }
          } catch {}
          lines.push('')
        }

        if (s.summary_next_steps) {
          lines.push('## Next Steps')
          try {
            for (const item of JSON.parse(s.summary_next_steps)) {
              lines.push(`- ${item}`)
            }
          } catch {}
          lines.push('')
        }

        if (s.summary_gotchas) {
          lines.push('## Gotchas')
          try {
            for (const item of JSON.parse(s.summary_gotchas)) {
              lines.push(`- ${item}`)
            }
          } catch {}
          lines.push('')
        }

        fs.writeFileSync(path.join(exportDir, fileName), lines.join('\n'), 'utf8')
      }

      console.log(`Exported ${sessions.length} sessions to ${exportDir}`)
      break
    }

    case 'search': {
      const query = args.slice(1).join(' ')
      if (!query) {
        console.error('Usage: memctx search <query>')
        process.exit(1)
      }

      const { queries } = await import('../src/db/queries')
      const { initDB } = await import('../src/db/client')
      initDB()

      const results = queries.searchObservations(query)
      if (results.length === 0) {
        console.log('No results found for:', query)
      } else {
        console.log(`\nFound ${results.length} results for "${query}":\n`)
        for (const r of results.slice(0, 10)) {
          const date = new Date(r.created_at * 1000).toLocaleDateString()
          console.log(`[${date}] ${r.project_name} — ${r.session_title || 'Unknown session'}`)
          console.log(`  ${r.content}`)
          console.log()
        }
      }
      break
    }

    case 'config': {
      console.log('\nMemCTX Configuration:')
      console.log(`  Data dir:    ${CONFIG.dataDir}`)
      console.log(`  DB path:     ${CONFIG.dbPath}`)
      console.log(`  Port:        ${CONFIG.port}`)
      console.log(`  API key:     ${CONFIG.apiKey ? '***set***' : 'NOT SET'}`)
      console.log(`  Summaries:   ${CONFIG.disableSummaries ? 'disabled' : 'enabled'}`)
      console.log(`  Context sessions: ${CONFIG.defaultContextSessions}`)
      console.log()
      break
    }

    default: {
      printUsage()
      break
    }
  }
}

run().catch(console.error)
