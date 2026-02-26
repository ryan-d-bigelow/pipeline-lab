import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import type { StepConfig, StepStatus } from "../types";

export interface StepNodeData extends Record<string, unknown> {
  step: StepConfig;
  status: StepStatus;
  label: string;
}

type StepNodeType = Node<StepNodeData, "stepNode">;

const TYPE_COLORS: Record<string, { bg: string; badge: string; text: string }> = {
  llm: { bg: "bg-blue-950", badge: "bg-blue-600", text: "text-blue-300" },
  transform: { bg: "bg-purple-950", badge: "bg-purple-600", text: "text-purple-300" },
  db: { bg: "bg-emerald-950", badge: "bg-emerald-600", text: "text-emerald-300" },
  http: { bg: "bg-orange-950", badge: "bg-orange-600", text: "text-orange-300" },
};

const STATUS_BORDER: Record<StepStatus, string> = {
  idle: "border-slate-600",
  running: "border-blue-500",
  complete: "border-emerald-500",
  failed: "border-red-500",
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

function StepNodeComponent({ data }: NodeProps<StepNodeType>) {
  const { step, status } = data;
  const colors = TYPE_COLORS[step.type] ?? TYPE_COLORS.llm;
  const borderClass = STATUS_BORDER[status];
  const icon = STATUS_ICON[status];
  const typeLabel = TYPE_LABELS[step.type] ?? step.type;

  const model = step.type === "llm" ? (step.config.model as string) : null;

  return (
    <div
      className={`
        ${colors.bg} ${borderClass} border-2 rounded-lg px-4 py-3 min-w-[180px]
        shadow-lg shadow-black/20
        ${status === "running" ? "node-running" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-500 !border-slate-400 !w-2 !h-2"
      />
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-slate-100 truncate">
          {step.id}
        </span>
        {icon && (
          <span
            className={`text-sm font-bold ${
              status === "complete"
                ? "text-emerald-400"
                : status === "failed"
                  ? "text-red-400"
                  : "text-blue-400"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`${colors.badge} text-white text-[10px] font-medium px-1.5 py-0.5 rounded`}
        >
          {typeLabel}
        </span>
        {model && (
          <span className={`${colors.text} text-[10px]`}>{model}</span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-500 !border-slate-400 !w-2 !h-2"
      />
    </div>
  );
}

export default memo(StepNodeComponent);
