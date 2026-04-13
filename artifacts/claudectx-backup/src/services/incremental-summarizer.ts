import Anthropic from '@anthropic-ai/sdk'
import { queries } from '../db/queries'
import { CONFIG } from '../config'
import { broadcast } from '../ws/broadcast'
import { logger } from './logger'
import { insertGraphNodes, insertGraphEdges } from '../db/graph-queries'
import { normalizeNodeId } from '../utils/node-id'
import { consolidateGraphNodes } from './graph-consolidator'

interface SessionSummary {
  title: string
  status: 'completed' | 'in_progress' | 'blocked'
  metrics?: {
    momentum: number
    frustration: number
    productivity: number
  }
  learning_progression?: string
  emotional_context?: string
  code_quality_notes?: string
  next_session_starting_point?: string
  open_rabbit_holes?: string[]
  environmental_dependencies?: string[]
  unresolved_tech_debt?: string[]
  testing_coverage_gap?: string
  architectural_drift?: string
  preferred_verbosity?: number
  collaboration_style?: string
  cognitive_load_estimate?: number
  aha_moments_count?: number
  flow_state_duration_mins?: number
  divergence_score?: number
  what_we_did: string[]
  decisions_made: string[]
  files_changed: string[]
  next_steps: string[]
  gotchas: string[]
  tech_stack_notes: string[]
  mood?: string
  complexity?: string
  blockers?: string[]
  resolved?: string[]
  key_insight?: string
  graph?: {
    nodes: Array<{
      id: string
      label: string
      type: 'file' | 'function' | 'class' | 'concept' | 'problem' | 'decision'
      confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS'
      metadata?: Record<string, any>
    }>
    edges: Array<{
      sourceId: string
      targetId: string
      relationship: 'imports' | 'calls' | 'implements' | 'solves' | 'related_to'
      confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS'
      weight?: number
      metadata?: Record<string, any>
    }>
  }
}

function buildPartialTranscript(observations: any[]): string {
  const lines: string[] = []

  for (const obs of observations) {
    if (obs.event_type === 'user_message') {
      lines.push(`USER: ${obs.content}`)
    } else if (obs.event_type === 'assistant_message') {
      lines.push(`CLAUDE: ${obs.content}`)
    } else if (obs.event_type === 'tool_call') {
      const toolName = obs.tool_name || 'unknown'
      const filePath = obs.file_path ? ` file: ${obs.file_path}` : ''
      lines.push(`TOOL(${toolName}):${filePath}`)
    } else if (obs.event_type === 'decision') {
      lines.push(`DECISION: ${obs.content}`)
    }
  }

  return lines.join('\n')
}

export async function incrementalSummarize(
  sessionId: string,
  projectId: string,
  checkpointNumber: number,
  turnRange: [number, number]
): Promise<void> {
  if (!CONFIG.apiKey || CONFIG.disableSummaries) {
    logger.warn('IncrementalSummarizer', 'API key missing or summaries disabled')
    return
  }

  try {
    const startTime = Date.now()

    const observations = queries.getSessionObservations(sessionId)

    if (observations.length === 0) {
      logger.warn('IncrementalSummarizer', `No observations found for session ${sessionId}`)
      return
    }

    const partialTranscript = buildPartialTranscript(observations)

    const client = new Anthropic({
      apiKey: CONFIG.apiKey,
      baseURL: CONFIG.apiBaseUrl
    })

    logger.info('IncrementalSummarizer', `Processing checkpoint ${checkpointNumber} for session ${sessionId}`, {
      turnRange,
      observationCount: observations.length
    })

    const response = await client.messages.create({
      model: CONFIG.summaryModel,
      max_tokens: CONFIG.summaryMaxTokens,
      stream: false,
      system: `You are processing a PARTIAL session transcript for incremental checkpointing.
This is checkpoint #${checkpointNumber} covering turns ${turnRange[0]}-${turnRange[1]}.

Extract the same information as full summarization, but focus on what happened in THIS segment.
Always respond with ONLY valid JSON matching the exact schema provided. No preamble, no markdown, no explanation.`,
      messages: [{
        role: 'user',
        content: `Summarize this partial Claude Code session transcript (checkpoint #${checkpointNumber}).

TRANSCRIPT (turns ${turnRange[0]}-${turnRange[1]}):
${partialTranscript}

Return this exact JSON schema:
{
  "title": "5-8 word title describing the main work done",
  "status": "completed OR in_progress OR blocked",
  "metrics": {
    "momentum": 85,
    "frustration": 20,
    "productivity": 90
  },
    "learning_progression": "What the user learned during the session",
    "emotional_context": "The user's overall emotional state (e.g., focused, frustrated, exploring)",
    "code_quality_notes": "Observations about code structure, technical debt, or patterns",
    "next_session_starting_point": "Exact file, command, or thought to pick up on next session",
    "open_rabbit_holes": ["unresolved tangent 1"],
    "environmental_dependencies": ["required running process 1"],
    "unresolved_tech_debt": ["hacky code added 1"],
    "testing_coverage_gap": "Description of untested logic",
    "architectural_drift": "Description of anti-patterns introduced",
    "preferred_verbosity": 50,
    "collaboration_style": "Pair Programmer, Rubber Duck, Direct Implementer",
    "cognitive_load_estimate": 50,
    "aha_moments_count": 0,
    "flow_state_duration_mins": 0,
    "divergence_score": 0,
    "what_we_did": ["specific thing 1", "specific thing 2"],
  "decisions_made": ["architectural or technical decision made"],
  "files_changed": ["relative/path/to/file.ts"],
  "next_steps": ["concrete next thing to do"],
  "gotchas": ["important warning or thing to remember"],
  "tech_stack_notes": ["framework/library/pattern note"],
  "mood": "productive OR frustrated OR exploratory OR debugging OR blocked",
  "complexity": "trivial OR simple OR moderate OR complex OR very_complex",
  "blockers": ["thing that blocked progress"],
  "resolved": ["problem that was solved"],
  "key_insight": "single most important learning or realization",
  "graph": {
    "nodes": [
      {"id": "file:src/index.ts", "label": "src/index.ts", "type": "file", "confidence": "EXTRACTED"}
    ],
    "edges": [
      {"sourceId": "file:src/index.ts", "targetId": "function:main", "relationship": "calls", "confidence": "EXTRACTED"}
    ]
  }
}`
      }]
    })

    let raw = ''
    if (response.content && response.content[0]) {
      raw = response.content[0].type === 'text' ? response.content[0].text : ''
    } else if ((response as any).choices && (response as any).choices[0]) {
      raw = (response as any).choices[0].message.content || ''
    } else {
      throw new Error(`Invalid API response: ${JSON.stringify(response)}`)
    }

    const summary: SessionSummary = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())

    const checkpointId = `${sessionId}_checkpoint_${checkpointNumber}`
    queries.insertCheckpoint({
      id: checkpointId,
      session_id: sessionId,
      project_id: projectId,
      checkpoint_number: checkpointNumber,
      turn_count: turnRange[1],
      created_at: Math.floor(Date.now() / 1000),
      summary_title: summary.title,
      summary_data: JSON.stringify(summary),
      transcript_range: `turns ${turnRange[0]}-${turnRange[1]}`
    })

    let nodesAdded = 0
    let edgesAdded = 0

    if (CONFIG.checkpointIncludeGraph && summary.graph) {
      const normalizedNodes = summary.graph.nodes.map(node => ({
        id: normalizeNodeId(node.type, node.label),
        label: node.label,
        type: node.type,
        confidence: node.confidence,
        metadata: node.metadata ? JSON.stringify(node.metadata) : null
      }))

      if (normalizedNodes.length > 0) {
        insertGraphNodes(projectId, normalizedNodes)
        nodesAdded = normalizedNodes.length
      }

      if (summary.graph.edges.length > 0) {
        const edgesForDb = summary.graph.edges.map(edge => ({
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          relationship: edge.relationship,
          confidence: edge.confidence,
          weight: edge.weight || 1.0,
          metadata: edge.metadata ? JSON.stringify(edge.metadata) : null
        }))
        insertGraphEdges(projectId, edgesForDb)
        edgesAdded = summary.graph.edges.length
      }

      await consolidateGraphNodes(projectId)
    }

    queries.updateSession(sessionId, {
      last_checkpoint_turn: turnRange[1],
      last_checkpoint_time: Math.floor(Date.now() / 1000),
      checkpoint_count: checkpointNumber,
      metric_momentum: summary.metrics?.momentum ?? null,
      metric_frustration: summary.metrics?.frustration ?? null,
      metric_productivity: summary.metrics?.productivity ?? null,
          learning_progression: summary.learning_progression ?? null,
          emotional_context: summary.emotional_context ?? null,
          code_quality_notes: summary.code_quality_notes ?? null,
          next_session_starting_point: summary.next_session_starting_point || null,
          open_rabbit_holes: summary.open_rabbit_holes ? JSON.stringify(summary.open_rabbit_holes) : null,
          environmental_dependencies: summary.environmental_dependencies ? JSON.stringify(summary.environmental_dependencies) : null,
          unresolved_tech_debt: summary.unresolved_tech_debt ? JSON.stringify(summary.unresolved_tech_debt) : null,
          testing_coverage_gap: summary.testing_coverage_gap || null,
          architectural_drift: summary.architectural_drift || null,
          preferred_verbosity: summary.preferred_verbosity ?? 50,
          collaboration_style: summary.collaboration_style || null,
          cognitive_load_estimate: summary.cognitive_load_estimate ?? 50,
          aha_moments_count: summary.aha_moments_count ?? 0,
          flow_state_duration_mins: summary.flow_state_duration_mins ?? 0,
          divergence_score: summary.divergence_score ?? 0
        })

        broadcast({
      type: 'checkpoint_complete',
      session_id: sessionId,
      checkpoint_number: checkpointNumber,
      title: summary.title,
      nodes_added: nodesAdded,
      edges_added: edgesAdded
    })

    const duration = Date.now() - startTime
    logger.info('IncrementalSummarizer', `Checkpoint ${checkpointNumber} completed for session ${sessionId}`, {
      duration: `${duration}ms`,
      nodesAdded,
      edgesAdded
    })

  } catch (err) {
    logger.error('IncrementalSummarizer', `Checkpoint failed for session ${sessionId}`, { error: err })
    throw err
  }
}
