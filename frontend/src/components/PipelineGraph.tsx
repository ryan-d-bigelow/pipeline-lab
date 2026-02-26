import type { PipelineConfig, StepState, StepStatus } from "../types";
import { StepNodeSVG, NODE_WIDTH, NODE_HEIGHT } from "./StepNode";

interface PipelineGraphProps {
  config: PipelineConfig | null;
  stepStates: Record<string, StepState>;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  col: number;
  row: number;
}

function layoutSteps(config: PipelineConfig): LayoutNode[] {
  const steps = config.steps;
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  // Assign column (depth) via topological levels
  const depth: Record<string, number> = {};
  const computed = new Set<string>();

  function getDepth(id: string): number {
    if (depth[id] !== undefined) return depth[id];
    if (computed.has(id)) return 0;
    computed.add(id);
    const step = stepMap.get(id);
    if (!step || step.depends_on.length === 0) {
      depth[id] = 0;
      return 0;
    }
    const maxParent = Math.max(
      ...step.depends_on.map((d) => getDepth(d))
    );
    depth[id] = maxParent + 1;
    return depth[id];
  }

  steps.forEach((s) => getDepth(s.id));

  // Group by column
  const columns: Map<number, string[]> = new Map();
  for (const step of steps) {
    const col = depth[step.id];
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(step.id);
  }

  const xGap = NODE_WIDTH + 80;
  const yGap = NODE_HEIGHT + 40;
  const padding = 40;

  const nodes: LayoutNode[] = [];
  for (const [col, ids] of columns.entries()) {
    const totalHeight = ids.length * NODE_HEIGHT + (ids.length - 1) * (yGap - NODE_HEIGHT);
    const startY = Math.max(padding, (3 * yGap - totalHeight) / 2);
    ids.forEach((id, row) => {
      nodes.push({
        id,
        x: padding + col * xGap,
        y: startY + row * yGap,
        col,
        row,
      });
    });
  }

  return nodes;
}

export default function PipelineGraph({
  config,
  stepStates,
}: PipelineGraphProps) {
  if (!config) {
    return <div className="graph-placeholder">Select a pipeline to view its graph</div>;
  }

  const layout = layoutSteps(config);
  const posMap = new Map(layout.map((n) => [n.id, n]));

  // Compute SVG dimensions
  const maxX = Math.max(...layout.map((n) => n.x)) + NODE_WIDTH + 40;
  const maxY = Math.max(...layout.map((n) => n.y)) + NODE_HEIGHT + 40;

  // Build edges
  const edges: { from: string; to: string }[] = [];
  for (const step of config.steps) {
    for (const dep of step.depends_on) {
      edges.push({ from: dep, to: step.id });
    }
  }

  return (
    <div className="graph-container">
      <h3>Pipeline: {config.name}</h3>
      <svg
        width={Math.max(maxX, 300)}
        height={Math.max(maxY, 200)}
        viewBox={`0 0 ${Math.max(maxX, 300)} ${Math.max(maxY, 200)}`}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e) => {
          const from = posMap.get(e.from);
          const to = posMap.get(e.to);
          if (!from || !to) return null;
          const x1 = from.x + NODE_WIDTH;
          const y1 = from.y + NODE_HEIGHT / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_HEIGHT / 2;
          const midX = (x1 + x2) / 2;
          return (
            <path
              key={`${e.from}-${e.to}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="#9ca3af"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {layout.map((n) => {
          const step = config.steps.find((s) => s.id === n.id)!;
          const state = stepStates[n.id];
          const status: StepStatus = state?.status ?? "idle";
          return (
            <StepNodeSVG
              key={n.id}
              step={step}
              status={status}
              x={n.x}
              y={n.y}
            />
          );
        })}
      </svg>
    </div>
  );
}
