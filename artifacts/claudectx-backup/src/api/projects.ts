import { Router } from 'express'
import { queries } from '../db/queries'

export const projectsRouter = Router()

projectsRouter.get('/', (_req, res) => {
  try {
    const projects = queries.getAllProjects()
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

projectsRouter.get('/:id', (req, res) => {
  try {
    const project = queries.getProjectWithSessions(req.params.id)
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json(project)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})
