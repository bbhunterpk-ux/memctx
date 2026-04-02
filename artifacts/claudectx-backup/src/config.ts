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

  port: parseInt(process.env.CLAUDECTX_PORT || process.env.PORT || '9999'),
  apiKey: process.env.ANTHROPIC_API_KEY || '',

  defaultContextSessions: parseInt(process.env.CLAUDECTX_SESSIONS || '3'),
  maxContextTokens: 2000,
  summaryModel: 'claude-haiku-4-5-20251001' as const,
  summaryMaxTokens: 1500,
  disableSummaries: process.env.CLAUDECTX_DISABLE_SUMMARIES === '1',
}
