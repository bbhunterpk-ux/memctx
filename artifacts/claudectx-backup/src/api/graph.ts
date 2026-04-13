import { Router, Request, Response } from 'express';
import { GraphExtractor } from '../services/graph-extractor';
import {
  getGraphForProject,
  insertGraphNodes,
  insertGraphEdges,
  searchGraphNodes,
  deleteGraphForProject,
} from '../db/graph-queries';
import { getDB } from '../db/client';

const router: Router = Router();

// GET /api/graph/:projectId - Get full graph for project
router.get('/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const graph = getGraphForProject(projectId);
    res.json({ success: true, data: graph });
  } catch (error) {
    console.error('Error fetching graph:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch graph' });
  }
});

// POST /api/graph/:projectId/extract/:sessionId - Extract graph from session
router.post('/:projectId/extract/:sessionId', async (req, res) => {
  try {
    const { projectId, sessionId } = req.params;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'ANTHROPIC_API_KEY not configured',
      });
    }

    // Get session transcript
    const db = getDB();
    const session = db
      .prepare('SELECT * FROM sessions WHERE id = ? AND project_id = ?')
      .get(sessionId, projectId) as any;

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    // Read transcript from file
    const fs = require('fs');
    let transcript = '';
    if (session.transcript_path && fs.existsSync(session.transcript_path)) {
      transcript = fs.readFileSync(session.transcript_path, 'utf-8');
    }

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Session has no transcript',
      });
    }

    // Extract graph
    const extractor = new GraphExtractor(apiKey);
    const result = await extractor.extractFromTranscript(sessionId, transcript);

    // Save to database - convert metadata to JSON strings
    if (result.nodes.length > 0) {
      const nodesForDb = result.nodes.map(node => ({
        ...node,
        metadata: node.metadata ? JSON.stringify(node.metadata) : null,
      }));
      insertGraphNodes(projectId, nodesForDb);
    }
    if (result.edges.length > 0) {
      const edgesForDb = result.edges.map(edge => ({
        ...edge,
        weight: edge.weight || 1.0,
        metadata: edge.metadata ? JSON.stringify(edge.metadata) : null,
      }));
      insertGraphEdges(projectId, edgesForDb);
    }

    res.json({
      success: true,
      data: {
        nodesAdded: result.nodes.length,
        edgesAdded: result.edges.length,
      },
    });
  } catch (error) {
    console.error('Error extracting graph:', error);
    res.status(500).json({ success: false, error: 'Failed to extract graph' });
  }
});

// GET /api/graph/:projectId/search?q=query - Search graph nodes
router.get('/:projectId/search', (req, res) => {
  try {
    const { projectId } = req.params;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    const nodes = searchGraphNodes(projectId, q);
    res.json({ success: true, data: nodes });
  } catch (error) {
    console.error('Error searching graph:', error);
    res.status(500).json({ success: false, error: 'Failed to search graph' });
  }
});

// DELETE /api/graph/:projectId - Delete entire graph for project
router.delete('/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    deleteGraphForProject(projectId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting graph:', error);
    res.status(500).json({ success: false, error: 'Failed to delete graph' });
  }
});

export default router;
