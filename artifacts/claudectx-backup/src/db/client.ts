// Using Node.js built-in SQLite (Node 22+)
import { DatabaseSync } from 'node:sqlite'
import fs from 'fs'
import { CONFIG } from '../config'
import { SCHEMA_SQL } from './schema'

let _db: DatabaseSync | null = null

export function initDB(): DatabaseSync {
  if (_db) return _db

  if (!fs.existsSync(CONFIG.dataDir)) {
    fs.mkdirSync(CONFIG.dataDir, { recursive: true })
  }

  _db = new DatabaseSync(CONFIG.dbPath)
  _db.exec('PRAGMA journal_mode = WAL')
  _db.exec('PRAGMA foreign_keys = ON')
  _db.exec(SCHEMA_SQL)

  return _db
}

export function getDB(): DatabaseSync {
  if (!_db) return initDB()
  return _db
}
