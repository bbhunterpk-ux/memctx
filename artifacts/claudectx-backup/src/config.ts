import { homedir } from 'os'
import path from 'path'

export const CONFIG = {
  dataDir: path.join(homedir(), '.claudectx'),
  dbPath: path.join(homedir(), '.claudectx', 'db.sqlite'),
  hooksDir: path.join(homedir(), '.claudectx', 'hooks'),
  logsDir: path.join(homedir(), '.claudectx', 'logs'),

  claudeDir: path.join(homedir(), '.claude'),
  claudeProjectsDir: path.join(homedir(), '.claude', 'projects'),
  claudeSettingsPath: path.join(homedir(), '.claude', 'settings.json'),

  port: parseInt(process.env.CLAUDECTX_PORT || process.env.PORT || '8000'),

  // Use 9router endpoint from Claude Code settings
  apiBaseUrl: process.env.ANTHROPIC_BASE_URL || 'http://localhost:20128/v1',
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || 'sk_9router',

  defaultContextSessions: parseInt(process.env.CLAUDECTX_SESSIONS || '3'),
  maxContextTokens: 2000,
  summaryModel: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'AWS',
  summaryMaxTokens: 1500,
  disableSummaries: process.env.CLAUDECTX_DISABLE_SUMMARIES === '1',
}
