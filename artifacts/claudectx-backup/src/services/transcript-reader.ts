import fs from 'fs'
import readline from 'readline'

interface Turn {
  role?: string
  type?: string
  name?: string
  content?: string
  input?: any
}

export async function readTranscript(filePath: string): Promise<Turn[]> {
  if (!fs.existsSync(filePath)) return []

  const turns: Turn[] = []
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)

      if (entry.type === 'user' && entry.message?.content) {
        const content = Array.isArray(entry.message.content)
          ? entry.message.content.map((c: any) => c.text || '').join(' ')
          : String(entry.message.content)
        turns.push({ role: 'user', content })
      }

      if (entry.type === 'assistant' && entry.message?.content) {
        const content = Array.isArray(entry.message.content)
          ? entry.message.content
              .filter((c: any) => c.type === 'text')
              .map((c: any) => c.text || '').join(' ')
          : String(entry.message.content)
        turns.push({ role: 'assistant', content })

        if (Array.isArray(entry.message.content)) {
          for (const block of entry.message.content) {
            if (block.type === 'tool_use') {
              turns.push({ type: 'tool_use', name: block.name, input: block.input })
            }
          }
        }
      }
    } catch {
      // Skip malformed lines
    }
  }

  return turns
}
