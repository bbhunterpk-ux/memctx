import { Router } from 'express'
import { queries } from '../db/queries'

export const tagsRouter: import("express").Router = Router()

// Get all tags for a project
tagsRouter.get('/', (req, res) => {
  try {
    const { project_id } = req.query
    if (!project_id) {
      res.status(400).json({ error: 'project_id is required' })
      return
    }

    const tags = queries.getTags(project_id as string)
    res.json(tags)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Create a new tag
tagsRouter.post('/', (req, res) => {
  try {
    const { project_id, name, color } = req.body
    if (!project_id || !name) {
      res.status(400).json({ error: 'project_id and name are required' })
      return
    }

    const tagId = queries.createTag(project_id, name, color)
    const tag = queries.getTags(project_id).find((t: any) => t.id === tagId)

    console.log(`[API] Created tag: ${name} for project ${project_id}`)
    res.json(tag)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Delete a tag
tagsRouter.delete('/:id', (req, res) => {
  try {
    const tagId = parseInt(req.params.id)
    queries.deleteTag(tagId)

    console.log(`[API] Deleted tag: ${tagId}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Get tags for a session
tagsRouter.get('/session/:sessionId', (req, res) => {
  try {
    const tags = queries.getSessionTags(req.params.sessionId)
    res.json(tags)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Add tag to session
tagsRouter.post('/session/:sessionId', (req, res) => {
  try {
    const { tag_id } = req.body
    if (!tag_id) {
      res.status(400).json({ error: 'tag_id is required' })
      return
    }

    queries.addSessionTag(req.params.sessionId, tag_id)

    console.log(`[API] Added tag ${tag_id} to session ${req.params.sessionId.slice(0, 8)}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Remove tag from session
tagsRouter.delete('/session/:sessionId/:tagId', (req, res) => {
  try {
    const tagId = parseInt(req.params.tagId)
    queries.removeSessionTag(req.params.sessionId, tagId)

    console.log(`[API] Removed tag ${tagId} from session ${req.params.sessionId.slice(0, 8)}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})
