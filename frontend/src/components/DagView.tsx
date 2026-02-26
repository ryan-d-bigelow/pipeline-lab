import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
} from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import StepNodeComponent from "./StepNode";
import type { StepNodeData } from "./StepNode";
import type { PipelineConfig, StepState } from "../types";

interface DagViewProps {
  config: PipelineConfig | null;
  stepStates: Record<string, StepState>;
}

const nodeTypes = { stepNode: StepNodeComponent };

const NODE_X_GAP = 280;
const NODE_Y_GAP = 120;

function buildLayout(config: PipelineConfig, stepStates: Record<string, StepState>) {
  const steps = config.steps;
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  // Compute depth (column) for each step
  const depth: Record<string, number> = {};
  const visited = new Set<string>();

  function getDepth(id: string): number {
    if (depth[id] !== undefined) return depth[id];
    if (visited.has(id)) return 0;
    visited.add(id);
    const step = stepMap.get(id);
    if (!step || step.depends_on.length === 0) {
      depth[id] = 0;
      return 0;
    }
    const maxParent = Math.max(...step.depends_on.map((d) => getDepth(d)));
    depth[id] = maxParent + 1;
    return depth[id];
  }

  steps.forEach((s) => getDepth(s.id));

  // Group by column
  const columns = new Map<number, string[]>();
  for (const step of steps) {
    const col = depth[step.id];
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(step.id);
  }

  const nodes: Node<StepNodeData>[] = [];
  for (const [col, ids] of columns.entries()) {
    const totalHeight = ids.length * NODE_Y_GAP;
    const startY = -totalHeight / 2 + NODE_Y_GAP / 2;
    ids.forEach((id, row) => {
      const step = stepMap.get(id)!;
      const state = stepStates[id];
      nodes.push({
        id,
        type: "stepNode",
        position: { x: col * NODE_X_GAP, y: startY + row * NODE_Y_GAP },
        data: {
          step,
          status: state?.status ?? "idle",
          label: step.id,
        },
      });
    });
  }

  const edges: Edge[] = [];
  for (const step of steps) {
    for (const dep of step.depends_on) {
      edges.push({
        id: `${dep}->${step.id}`,
        source: dep,
        target: step.id,
        animated: stepStates[dep]?.status === "running",
        style: { stroke: "#64748b", strokeWidth: 2 },
      });
    }
  }

  // For steps with no depends_on, add edges from prior step in order (linear chain)
  // if they are sequential in the YAML and only one root exists
  const roots = steps.filter((s) => s.depends_on.length === 0);
  if (roots.length === 1 && steps.length > 1) {
    // Check if there are steps without explicit depends_on that should chain
    // (already handled by explicit depends_on in YAML)
  }

  return { nodes, edges };
}

export default function DagView({ config, stepStates }: DagViewProps) {
  const { nodes, edges } = useMemo(() => {
    if (!config) return { nodes: [], edges: [] };
    return buildLayout(config, stepStates);
  }, [config, stepStates]);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Select a pipeline to view its graph
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.3}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
    >
      <Background variant={BackgroundVariant.Dots} color="#334155" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
