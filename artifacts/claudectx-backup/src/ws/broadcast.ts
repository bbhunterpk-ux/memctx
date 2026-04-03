import { WebSocketServer, WebSocket } from 'ws'

let wss: WebSocketServer | null = null

export function initWS(server: WebSocketServer): void {
  wss = server

  server.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }))
  })
}

export function broadcast(data: object): void {
  if (!wss) return
  const payload = JSON.stringify({ ...data, timestamp: Date.now() })

  console.log('[Broadcast]', JSON.stringify(data))

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}
