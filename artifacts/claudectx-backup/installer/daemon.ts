import { execSync, spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { CONFIG } from '../src/config'

const DAEMON_NAME = 'claudectx'

export function startDaemon(workerPath: string): void {
  try {
    // Try to use pm2 if available
    execSync('which pm2', { stdio: 'pipe' })
    execSync(`pm2 start ${workerPath} --name ${DAEMON_NAME} --interpreter node`, { stdio: 'inherit' })
    execSync('pm2 save', { stdio: 'inherit' })
    console.log('Daemon started with pm2')
  } catch {
    // pm2 not available — use nohup
    const logPath = path.join(CONFIG.logsDir, 'worker.log')
    fs.mkdirSync(CONFIG.logsDir, { recursive: true })

    const child = spawn('node', [workerPath], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
      env: { ...process.env }
    })
    child.unref()
    console.log(`Daemon started (PID: ${child.pid}), logs at ${logPath}`)

    // Save PID
    const pidFile = path.join(CONFIG.dataDir, 'worker.pid')
    fs.writeFileSync(pidFile, String(child.pid), 'utf8')
  }
}

export function stopDaemon(): void {
  try {
    execSync('which pm2', { stdio: 'pipe' })
    execSync(`pm2 stop ${DAEMON_NAME}`, { stdio: 'inherit' })
    console.log('Daemon stopped')
  } catch {
    // Try PID file
    const pidFile = path.join(CONFIG.dataDir, 'worker.pid')
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf8').trim()
      try {
        process.kill(parseInt(pid), 'SIGTERM')
        fs.unlinkSync(pidFile)
        console.log('Daemon stopped (PID:', pid, ')')
      } catch {
        console.log('Could not stop daemon — may not be running')
      }
    }
  }
}

export function getDaemonStatus(): string {
  try {
    execSync('which pm2', { stdio: 'pipe' })
    const out = execSync(`pm2 describe ${DAEMON_NAME}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    return out.includes('online') ? 'running' : 'stopped'
  } catch {
    const pidFile = path.join(CONFIG.dataDir, 'worker.pid')
    if (!fs.existsSync(pidFile)) return 'stopped'
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim())
    try {
      process.kill(pid, 0)
      return 'running'
    } catch {
      return 'stopped'
    }
  }
}
