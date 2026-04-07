import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { homedir } from 'os'
import { standardRateLimit } from '../middleware/rate-limit'

const router: Router = Router()

const SETTINGS_FILE = path.join(homedir(), '.memctx', 'settings.json')

interface Settings {
  apiKey?: string
  baseURL?: string
  model?: string
  disableSummaries?: boolean
}

// Ensure settings file exists
function ensureSettingsFile() {
  const dir = path.dirname(SETTINGS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2))
  }
}

/**
 * GET /api/settings
 * Get current settings
 */
router.get('/', standardRateLimit, (req: Request, res: Response) => {
  try {
    ensureSettingsFile()
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))

    // Don't expose full API key, just show if it's set
    const response = {
      ...settings,
      apiKey: settings.apiKey ? '***' + settings.apiKey.slice(-4) : '',
      hasApiKey: !!settings.apiKey,
    }

    res.json({
      success: true,
      settings: response
    })
  } catch (error: any) {
    console.error('[API] Failed to get settings:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/settings
 * Update settings
 */
router.post('/', standardRateLimit, (req: Request, res: Response) => {
  try {
    ensureSettingsFile()
    const currentSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))

    const { apiKey, baseURL, model, disableSummaries } = req.body as Settings

    const newSettings: Settings = {
      ...currentSettings,
    }

    // Only update if provided
    if (apiKey !== undefined && apiKey !== '') {
      newSettings.apiKey = apiKey
    }
    if (baseURL !== undefined) {
      newSettings.baseURL = baseURL
    }
    if (model !== undefined) {
      newSettings.model = model
    }
    if (disableSummaries !== undefined) {
      newSettings.disableSummaries = disableSummaries
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2))

    res.json({
      success: true,
      message: 'Settings updated. Restart worker for changes to take effect.'
    })
  } catch (error: any) {
    console.error('[API] Failed to update settings:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export const settingsRouter = router
