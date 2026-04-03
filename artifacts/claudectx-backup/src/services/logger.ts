/**
 * Structured Logging System
 * Provides consistent log formatting with levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private minLevel: LogLevel

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel
  }

  private log(level: LogLevel, component: string, message: string, meta?: any): void {
    if (level < this.minLevel) return

    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''

    console.log(`[${timestamp}] [${levelName}] [${component}] ${message}${metaStr}`)
  }

  debug(component: string, message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, component, message, meta)
  }

  info(component: string, message: string, meta?: any): void {
    this.log(LogLevel.INFO, component, message, meta)
  }

  warn(component: string, message: string, meta?: any): void {
    this.log(LogLevel.WARN, component, message, meta)
  }

  error(component: string, message: string, meta?: any): void {
    this.log(LogLevel.ERROR, component, message, meta)
  }
}

export const logger = new Logger(
  process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO
)
