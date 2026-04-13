import { homedir } from 'os'
import path from 'path'
import fs from 'fs'

// Load settings from file if exists
const SETTINGS_FILE = path.join(homedir(), '.memctx', 'settings.json')
let userSettings: any = {}
try {
  if (fs.existsSync(SETTINGS_FILE)) {
    userSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
  }
} catch (err) {
  console.warn('Could not load settings file:', err)
}

export const CONFIG = {
  dataDir: path.join(homedir(), '.memctx'),
  dbPath: path.join(homedir(), '.memctx', 'db.sqlite'),
  hooksDir: path.join(homedir(), '.memctx', 'hooks'),
  logsDir: path.join(homedir(), '.memctx', 'logs'),

  claudeDir: path.join(homedir(), '.claude'),
  claudeProjectsDir: path.join(homedir(), '.claude', 'projects'),
  claudeSettingsPath: path.join(homedir(), '.claude', 'settings.json'),

  port: parseInt(process.env.MEMCTX_PORT || process.env.PORT || '9999'),

  // API configuration - prioritize user settings, then env vars, then defaults
  apiBaseUrl: userSettings.baseURL || process.env.ANTHROPIC_BASE_URL || 'http://localhost:20128/v1',
  apiKey: userSettings.apiKey || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || 'sk_9router',

  defaultContextSessions: parseInt(process.env.MEMCTX_SESSIONS || '3'),
  maxContextTokens: 2000,
  summaryModel: userSettings.model || process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'AWS',
  summaryMaxTokens: 2500,
  disableSummaries: userSettings.disableSummaries || process.env.MEMCTX_DISABLE_SUMMARIES === '1',

  // Incremental checkpointing
  enableIncrementalCheckpoints: process.env.ENABLE_INCREMENTAL === 'true',
  checkpointTurnThreshold: parseInt(process.env.CHECKPOINT_TURNS || '10'),
  checkpointTimeThreshold: parseInt(process.env.CHECKPOINT_TIME || '300'),
  checkpointIncludeGraph: process.env.CHECKPOINT_GRAPH !== 'false',
}
