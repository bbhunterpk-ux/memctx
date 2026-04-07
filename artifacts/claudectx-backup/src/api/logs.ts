import { Router } from 'express'
import { spawn } from 'child_process'
import { CONFIG } from '../config'
import { standardRateLimit, strictRateLimit } from '../middleware/rate-limit'

export const logsRouter: Router = Router()

const LOG_FILE = '/tmp/memctx.log'

// Get logs with optional filtering
logsRouter.get('/', standardRateLimit, (req, res) => {
  try {
    const lines = parseInt(req.query.lines as string || '100')
    const level = req.query.level as string // info, error, warn, etc.
    const search = req.query.search as string
    const minutes = parseInt(req.query.minutes as string || '0')

    let command = `tail -n ${lines} ${LOG_FILE}`

    // If minutes filter is set, use time-based filtering
    if (minutes > 0) {
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString()
      command = `tail -n 10000 ${LOG_FILE} | grep -E "\\[${cutoffTime.slice(0, 16)}" || tail -n ${lines} ${LOG_FILE}`
    }

    const tail = spawn('sh', ['-c', command])
    let output = ''

    tail.stdout.on('data', (data) => {
      output += data.toString()
    })

    tail.stderr.on('data', (data) => {
      console.error('Tail error:', data.toString())
    })

    tail.on('close', () => {
      let logs = output.split('\n').filter(line => line.trim())

      // Apply level filter
      if (level) {
        logs = logs.filter(line => line.toLowerCase().includes(`[${level.toLowerCase()}]`))
      }

      // Apply search filter
      if (search) {
        logs = logs.filter(line => line.toLowerCase().includes(search.toLowerCase()))
      }

      res.json({ logs, total: logs.length })
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Stream logs in real-time (SSE)
logsRouter.get('/stream', strictRateLimit, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const tail = spawn('tail', ['-f', '-n', '50', LOG_FILE])

  tail.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim())
    lines.forEach(line => {
      res.write(`data: ${JSON.stringify({ log: line, timestamp: Date.now() })}\n\n`)
    })
  })

  tail.stderr.on('data', (data) => {
    console.error('Tail stream error:', data.toString())
  })

  req.on('close', () => {
    tail.kill()
    res.end()
  })
})
