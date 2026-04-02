import fs from 'fs'
import path from 'path'
import { CONFIG } from '../src/config'

export function patchClaudeSettings(): void {
  const settingsPath = CONFIG.claudeSettingsPath
  const claudeDir = path.dirname(settingsPath)

  // Ensure ~/.claude directory exists
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true })
  }

  // Read existing settings or start fresh
  let existing: any = {}
  if (fs.existsSync(settingsPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    } catch {
      console.warn('Could not parse existing settings.json, will overwrite hooks section')
    }
  }

  // Load our hooks config
  const hooksConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'hooks-settings.json'), 'utf8')
  )

  // Merge hooks (deep merge by event type)
  if (!existing.hooks) {
    existing.hooks = {}
  }

  for (const [event, eventHooks] of Object.entries(hooksConfig.hooks)) {
    if (!existing.hooks[event]) {
      existing.hooks[event] = eventHooks
    } else {
      // Add our hooks if not already present
      const existingHooks = existing.hooks[event] as any[]
      const ourHooks = eventHooks as any[]
      for (const ourHook of ourHooks) {
        const alreadyExists = existingHooks.some((h: any) =>
          JSON.stringify(h) === JSON.stringify(ourHook)
        )
        if (!alreadyExists) {
          existingHooks.push(ourHook)
        }
      }
    }
  }

  fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2), 'utf8')
  console.log('Hooks patched into', settingsPath)
}

export function removeClaudeHooks(): void {
  const settingsPath = CONFIG.claudeSettingsPath
  if (!fs.existsSync(settingsPath)) return

  try {
    const existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    if (!existing.hooks) return

    // Remove our hooks from each event
    for (const event of Object.keys(existing.hooks)) {
      if (Array.isArray(existing.hooks[event])) {
        existing.hooks[event] = existing.hooks[event].filter((h: any) => {
          if (h.hooks) {
            h.hooks = h.hooks.filter((inner: any) =>
              !inner.command?.includes('~/.claudectx/hooks/')
            )
            return h.hooks.length > 0
          }
          return !h.command?.includes('~/.claudectx/hooks/')
        })
        if (existing.hooks[event].length === 0) {
          delete existing.hooks[event]
        }
      }
    }

    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2), 'utf8')
    console.log('Hooks removed from', settingsPath)
  } catch (err) {
    console.error('Could not remove hooks:', err)
  }
}
