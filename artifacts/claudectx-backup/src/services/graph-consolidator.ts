import { getGraphForProject, remapNodeEdges, deleteGraphNode } from '../db/graph-queries'
import { logger } from './logger'

/**
 * Levenshtein distance algorithm (reused from fuzzy-task-matcher)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Calculate similarity between two strings (0-1)
 */
function similarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase())
  return (longer.length - distance) / longer.length
}

/**
 * Consolidate graph nodes by merging similar entities
 *
 * Strategy:
 * 1. Group nodes by type (only dedup within same type)
 * 2. Within each type, find similar pairs using Levenshtein (0.80 threshold)
 * 3. For matched pairs: keep node with more edges, remap edges from duplicate, delete duplicate
 */
export async function consolidateGraphNodes(projectId: string): Promise<void> {
  try {
    logger.info('GraphConsolidator', `Starting consolidation for project ${projectId}`)

    const { nodes, edges } = getGraphForProject(projectId)

    if (nodes.length === 0) {
      logger.info('GraphConsolidator', 'No nodes to consolidate')
      return
    }

    // Group nodes by type
    const nodesByType = new Map<string, typeof nodes>()
    for (const node of nodes) {
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, [])
      }
      nodesByType.get(node.type)!.push(node)
    }

    let totalMerged = 0

    // Process each type group
    for (const [type, typeNodes] of nodesByType.entries()) {
      if (typeNodes.length < 2) continue // Need at least 2 nodes to find duplicates

      logger.info('GraphConsolidator', `Checking ${typeNodes.length} nodes of type '${type}'`)

      const processed = new Set<string>()

      for (let i = 0; i < typeNodes.length; i++) {
        const nodeA = typeNodes[i]
        if (processed.has(nodeA.id)) continue

        for (let j = i + 1; j < typeNodes.length; j++) {
          const nodeB = typeNodes[j]
          if (processed.has(nodeB.id)) continue

          // Calculate similarity between labels
          const sim = similarity(nodeA.label, nodeB.label)

          if (sim >= 0.80) {
            // Found a duplicate pair - merge them
            logger.info('GraphConsolidator', `Found similar nodes (${sim.toFixed(2)}): "${nodeA.label}" vs "${nodeB.label}"`)

            // Count edges for each node to decide which to keep
            const nodeAEdgeCount = edges.filter(e => e.sourceId === nodeA.id || e.targetId === nodeA.id).length
            const nodeBEdgeCount = edges.filter(e => e.sourceId === nodeB.id || e.targetId === nodeB.id).length

            let keepNode, discardNode

            if (nodeAEdgeCount >= nodeBEdgeCount) {
              keepNode = nodeA
              discardNode = nodeB
            } else {
              keepNode = nodeB
              discardNode = nodeA
            }

            logger.info('GraphConsolidator', `Merging "${discardNode.label}" into "${keepNode.label}" (${nodeAEdgeCount} vs ${nodeBEdgeCount} edges)`)

            // Remap all edges pointing to discardNode to point to keepNode
            remapNodeEdges(discardNode.id, keepNode.id)

            // Delete the duplicate node
            deleteGraphNode(discardNode.id)

            processed.add(discardNode.id)
            totalMerged++
          }
        }

        processed.add(nodeA.id)
      }
    }

    logger.info('GraphConsolidator', `Consolidation complete for project ${projectId}`, { mergedNodes: totalMerged })

  } catch (err) {
    logger.error('GraphConsolidator', `Consolidation failed for project ${projectId}`, { error: err })
    // Don't throw - consolidation failure shouldn't break summarization
  }
}
