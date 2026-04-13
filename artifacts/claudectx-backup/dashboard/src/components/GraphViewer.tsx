import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  confidence: string;
  metadata?: string;
}

interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  confidence: string;
  weight: number;
}

interface GraphViewerProps {
  projectId: string;
}

export function GraphViewer({ projectId }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    loadGraph();
  }, [projectId]);

  async function loadGraph() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/graph/${projectId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load graph');
      }

      const { nodes, edges } = result.data;
      setStats({ nodes: nodes.length, edges: edges.length });

      if (!containerRef.current) return;

      // Color mapping by node type
      const typeColors: Record<string, string> = {
        file: '#3b82f6',
        function: '#10b981',
        class: '#8b5cf6',
        concept: '#f59e0b',
        problem: '#ef4444',
        decision: '#06b6d4',
      };

      // Convert to vis-network format
      const visNodes = new DataSet(
        nodes.map((node: GraphNode) => ({
          id: node.id,
          label: node.label,
          title: `Type: ${node.type}\nConfidence: ${node.confidence}`,
          color: typeColors[node.type] || '#6b7280',
          shape: node.type === 'file' ? 'box' : 'dot',
          font: { color: '#ffffff' },
        }))
      );

      const visEdges = new DataSet(
        edges.map((edge: GraphEdge) => ({
          id: edge.id,
          from: edge.sourceId,
          to: edge.targetId,
          label: edge.relationship,
          arrows: 'to',
          width: edge.weight,
          color: {
            color: edge.confidence === 'EXTRACTED' ? '#10b981' : '#6b7280',
            opacity: edge.confidence === 'AMBIGUOUS' ? 0.3 : 0.7,
          },
        }))
      );

      // Network options
      const options = {
        nodes: {
          borderWidth: 2,
          borderWidthSelected: 4,
          size: 25,
        },
        edges: {
          smooth: {
            type: 'continuous',
          },
        },
        physics: {
          stabilization: {
            iterations: 200,
          },
          barnesHut: {
            gravitationalConstant: -8000,
            springConstant: 0.04,
            springLength: 95,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
        },
      };

      // Create network
      networkRef.current = new Network(
        containerRef.current,
        { nodes: visNodes, edges: visEdges },
        options
      );

      // Add click handler
      networkRef.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          console.log('Clicked node:', nodeId);
          // TODO: Show node details in sidebar
        }
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading graph:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  async function extractGraph() {
    try {
      setLoading(true);
      // TODO: Get session ID from UI
      const sessionId = 'latest'; // placeholder

      const response = await fetch(
        `/api/graph/${projectId}/extract/${sessionId}`,
        { method: 'POST' }
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to extract graph');
      }

      // Reload graph
      await loadGraph();
    } catch (err) {
      console.error('Error extracting graph:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-red-400">Error: {error}</div>
        <button
          onClick={loadGraph}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex gap-4 text-sm text-gray-400">
          <span>{stats.nodes} nodes</span>
          <span>{stats.edges} edges</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={extractGraph}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Extract from Session
          </button>
          <button
            onClick={loadGraph}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 bg-gray-900" />
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            File
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Function
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            Class
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            Concept
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Problem
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
            Decision
          </span>
        </div>
      </div>
    </div>
  );
}
