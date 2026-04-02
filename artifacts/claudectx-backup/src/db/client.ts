import Database from 'better-sqlite3'
import fs from 'fs'
import { CONFIG } from '../config'
import { SCHEMA_SQL } from './schema'

let _db: Database.Database | null = null

export function initDB(): Database.Database {
  if (_db) return _db

  if (!fs.existsSync(CONFIG.dataDir)) {
    fs.mkdirSync(CONFIG.dataDir, { recursive: true })
  }

  _db = new Database(CONFIG.dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  _db.exec(SCHEMA_SQL)

  // Run migrations after initial schema
  try {
    const { runMigrations } = require('./migrate')
    runMigrations()
  } catch (err) {
    console.error('Migration error:', err)
  }

  return _db
}

export function getDB(): Database.Database {
  if (!_db) return initDB()
  return _db
}
