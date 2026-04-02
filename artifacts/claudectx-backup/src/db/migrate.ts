import { getDB } from './client'
import fs from 'fs'
import path from 'path'

export function runMigrations() {
  const db = getDB()
  const migrationsDir = path.join(__dirname, 'migrations')

  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at INTEGER DEFAULT (unixepoch())
    )
  `)

  // Get applied migrations
  const applied = new Set(
    db.prepare('SELECT filename FROM migrations').all().map((r: any) => r.filename)
  )

  // Get all migration files
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found, skipping migrations')
    return
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  let appliedCount = 0

  for (const file of files) {
    if (applied.has(file)) {
      continue
    }

    console.log(`Applying migration: ${file}`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

    try {
      db.exec(sql)
      db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file)
      appliedCount++
      console.log(`✓ Applied: ${file}`)
    } catch (err) {
      console.error(`✗ Failed to apply ${file}:`, err)
      throw err
    }
  }

  if (appliedCount === 0) {
    console.log('No new migrations to apply')
  } else {
    console.log(`Applied ${appliedCount} migration(s)`)
  }
}
