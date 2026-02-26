import type { StepConfig, StepStatus } from "../types";

interface StepNodeProps {
  step: StepConfig;
  status: StepStatus;
  x: number;
  y: number;
}

const STATUS_COLORS: Record<StepStatus, { border: string; bg: string }> = {
  idle: { border: "#6b7280", bg: "#f3f4f6" },
  running: { border: "#3b82f6", bg: "#eff6ff" },
  complete: { border: "#22c55e", bg: "#f0fdf4" },
  failed: { border: "#ef4444", bg: "#fef2f2" },
};

const STATUS_ICON: Record<StepStatus, string> = {
  idle: "",
  running: "⟳",
  complete: "✓",
  failed: "✗",
};

const TYPE_LABELS: Record<string, string> = {
  llm: "LLM",
  transform: "Transform",
  db: "Database",
  http: "HTTP",
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 72;

export function StepNodeSVG({ step, status, x, y }: StepNodeProps) {
  const colors = STATUS_COLORS[status];
  const icon = STATUS_ICON[status];
  const typeLabel = TYPE_LABELS[step.type] ?? step.type;

  // Extract data flow info
  const inputVars = (step.config.input_vars as string[]) ?? [];
  const inputKey = step.config.input_key as string | undefined;
  const outputVar =
    (step.config.output_var as string) ??
    (step.config.output_key as string) ??
    "";
  const inputs = inputVars.length > 0 ? inputVars : inputKey ? [inputKey] : [];

  return (
    <g className={status === "running" ? "node-pulse" : ""}>
      <rect
        x={x}
        y={y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        ry={8}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={2.5}
      />
      {/* Step ID */}
      <text
        x={x + 12}
        y={y + 22}
        fontSize={13}
        fontWeight={600}
        fill="#1f2937"
      >
        {step.id}
      </text>
      {/* Type badge */}
      <text x={x + 12} y={y + 40} fontSize={11} fill="#6b7280">
        {typeLabel}
      </text>
      {/* Status icon */}
      {icon && (
        <text
          x={x + NODE_WIDTH - 24}
          y={y + 26}
          fontSize={18}
          fill={colors.border}
          fontWeight={700}
          textAnchor="middle"
        >
          {icon}
        </text>
      )}
      {/* Data flow labels */}
      {inputs.length > 0 && (
        <text x={x + 12} y={y + 56} fontSize={9} fill="#9ca3af">
          in: {inputs.join(", ")}
        </text>
      )}
      {outputVar && (
        <text
          x={x + NODE_WIDTH - 12}
          y={y + 56}
          fontSize={9}
          fill="#9ca3af"
          textAnchor="end"
        >
          out: {outputVar}
        </text>
      )}
    </g>
  );
}

export { NODE_WIDTH, NODE_HEIGHT };
