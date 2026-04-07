import { homedir } from 'os'
import path from 'path'
import fs from 'fs'

// Load settings from file if exists
const SETTINGS_FILE = path.join(homedir(), '.claudectx', 'settings.json')
let userSettings: any = {}
try {
  if (fs.existsSync(SETTINGS_FILE)) {
    userSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
  }
} catch (err) {
  console.warn('Could not load settings file:', err)
}

export const CONFIG = {
  dataDir: path.join(homedir(), '.claudectx'),
  dbPath: path.join(homedir(), '.claudectx', 'db.sqlite'),
  hooksDir: path.join(homedir(), '.claudectx', 'hooks'),
  logsDir: path.join(homedir(), '.claudectx', 'logs'),

  claudeDir: path.join(homedir(), '.claude'),
  claudeProjectsDir: path.join(homedir(), '.claude', 'projects'),
  claudeSettingsPath: path.join(homedir(), '.claude', 'settings.json'),

  port: parseInt(process.env.CLAUDECTX_PORT || process.env.PORT || '8000'),

  // API configuration - prioritize user settings, then env vars, then defaults
  apiBaseUrl: userSettings.baseURL || process.env.ANTHROPIC_BASE_URL || 'http://localhost:20128/v1',
  apiKey: userSettings.apiKey || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || 'sk_9router',

  defaultContextSessions: parseInt(process.env.CLAUDECTX_SESSIONS || '3'),
  maxContextTokens: 2000,
  summaryModel: userSettings.model || process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'AWS',
  summaryMaxTokens: 2500,
  disableSummaries: userSettings.disableSummaries || process.env.CLAUDECTX_DISABLE_SUMMARIES === '1',
}
