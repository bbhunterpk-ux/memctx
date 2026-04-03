import { Router } from 'express'
import type { Router as ExpressRouter } from 'express'
import { queries } from '../db/queries'

export const memoryRouter: ExpressRouter = Router()

memoryRouter.get('/', (req, res) => {
  try {
    const projectId = req.query.project_id as string | undefined
    if (!projectId) {
      return res.status(400).json({ error: 'project_id is required' })
    }

    const preferences = queries.getPreferences(projectId)
    const knowledge = queries.getKnowledge(undefined, 50, projectId)
    const patterns = queries.getPatterns(undefined, 50, projectId)
    const tasks = queries.getTasks(undefined, projectId)
    const contacts = queries.getContacts(projectId)

    res.json({
      preferences,
      knowledge,
      patterns,
      tasks,
      contacts,
      stats: {
        total_preferences: preferences.length,
        total_knowledge: knowledge.length,
        total_patterns: patterns.length,
        total_tasks: tasks.length,
        total_contacts: contacts.length
      }
    })
  } catch (err) {
    console.error('Memory fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch memory' })
  }
})

memoryRouter.get('/preferences', (req, res) => {
  try {
    const projectId = req.query.project_id as string | undefined
    const prefs = queries.getPreferences(projectId)
    res.json(prefs)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preferences' })
  }
})

memoryRouter.get('/knowledge', (req, res) => {
  try {
    const category = req.query.category as string | undefined
    const projectId = req.query.project_id as string | undefined
    const limit = parseInt(req.query.limit as string) || 50
    const knowledge = queries.getKnowledge(category, limit, projectId)
    res.json(knowledge)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge' })
  }
})

memoryRouter.get('/patterns', (req, res) => {
  try {
    const type = req.query.type as string | undefined
    const projectId = req.query.project_id as string | undefined
    const limit = parseInt(req.query.limit as string) || 50
    const patterns = queries.getPatterns(type, limit, projectId)
    res.json(patterns)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patterns' })
  }
})

memoryRouter.get('/tasks', (req, res) => {
  try {
    const status = req.query.status as string | undefined
    const projectId = req.query.project_id as string | undefined
    const tasks = queries.getTasks(status, projectId)
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

memoryRouter.get('/contacts', (req, res) => {
  try {
    const projectId = req.query.project_id as string | undefined
    const contacts = queries.getContacts(projectId)
    res.json(contacts)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' })
  }
})
