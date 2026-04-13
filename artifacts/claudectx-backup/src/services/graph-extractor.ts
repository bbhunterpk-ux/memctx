import Anthropic from '@anthropic-ai/sdk';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
  metadata?: Record<string, any>;
}

interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  confidence: 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS';
  weight?: number;
  metadata?: Record<string, any>;
}

interface ExtractionResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphExtractor {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, baseURL?: string, model?: string) {
    this.client = new Anthropic({
      apiKey,
      baseURL: baseURL || undefined
    });
    this.model = model || 'claude-sonnet-4-6';
  }

  async extractFromTranscript(
    sessionId: string,
    transcript: string
  ): Promise<ExtractionResult> {
    const prompt = `Extract a knowledge graph from this AI coding session transcript.

Identify:
1. Files mentioned (type: 'file')
2. Functions/classes discussed (type: 'function', 'class')
3. Concepts explained (type: 'concept')
4. Problems solved (type: 'problem')
5. Decisions made (type: 'decision')

For each entity, provide:
- id: unique identifier (e.g., "file:src/index.ts", "concept:authentication")
- label: human-readable name
- type: entity type
- confidence: EXTRACTED (explicitly mentioned), INFERRED (implied), or AMBIGUOUS (unclear)

Also identify relationships:
- imports: file A imports file B
- calls: function A calls function B
- implements: class A implements concept B
- solves: solution A solves problem B
- related_to: general relationship

Return JSON:
{
  "nodes": [{"id": "...", "label": "...", "type": "...", "confidence": "..."}],
  "edges": [{"sourceId": "...", "targetId": "...", "relationship": "...", "confidence": "..."}]
}

Transcript:
${transcript}`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    // Handle both Anthropic format (content array) and OpenAI format (choices array)
    let raw = ''
    if (response.content && response.content[0]) {
      // Anthropic format
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }
      raw = content.text;
    } else if ((response as any).choices && (response as any).choices[0]) {
      // OpenAI format (from 9router)
      raw = (response as any).choices[0].message.content || '';
    } else {
      throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
    }

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as ExtractionResult;

    // Add unique IDs to edges
    result.edges = result.edges.map((edge, idx) => ({
      ...edge,
      id: `${sessionId}_edge_${idx}`,
    }));

    return result;
  }
}
