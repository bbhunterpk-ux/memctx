import * as http from 'http'

const WORKER_PORT = process.env.CLAUDECTX_PORT || '9999'

export async function readStdin(): Promise<any> {
  return new Promise((resolve) => {
    let data = ''
    let resolved = false

    const doResolve = (val: any) => {
      if (resolved) return
      resolved = true
      resolve(val)
    }

    process.stdin.on('data', (chunk: Buffer) => { data += chunk })
    process.stdin.on('end', () => {
      try { doResolve(JSON.parse(data)) }
      catch { doResolve({}) }
    })

    setTimeout(() => doResolve({}), 1000)
  })
}

export async function postToWorker(urlPath: string, body: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const req = http.request({
      hostname: 'localhost',
      port: WORKER_PORT,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve({}) }
      })
    })
    req.on('error', reject)
    req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(payload)
    req.end()
  })
}

export function safeExit(code = 0): never {
  process.exit(code)
}
