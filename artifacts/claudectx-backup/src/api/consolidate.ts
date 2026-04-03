import { Router, Request, Response } from 'express'
import { consolidator } from '../services/memory-consolidator'

const router: Router = Router()

/**
 * POST /api/consolidate/:projectId
 * Trigger memory consolidation for a project
 */
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params

    console.log(`[API] Starting memory consolidation for project ${projectId}`)
    const result = await consolidator.consolidateProject(projectId)

    res.json({
      success: true,
      result
    })
  } catch (error: any) {
    console.error('[API] Consolidation failed:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
