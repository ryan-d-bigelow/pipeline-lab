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

const TYPE_LABELS: Record<string, string> = {
  llm: '◈ LLM',
  transform: '⟳ XFORM',
  db: '▣ STORE',
  http: '↗ HTTP',
};

const STATUS_LABEL: Record<StepStatus, { text: string; color: string }> = {
  idle: { text: '[idle]', color: 'var(--text-dim)' },
  running: { text: '[EXEC]', color: 'var(--amber)' },
  complete: { text: '[OK]', color: 'var(--phosphor)' },
  failed: { text: '[ERR]', color: 'var(--signal-red)' },
};

const STATUS_BORDER: Record<StepStatus, string> = {
  idle: 'var(--border)',
  running: 'var(--amber)',
  complete: 'var(--phosphor)',
  failed: 'var(--signal-red)',
};

const HANDLE_COLORS: Record<string, string> = {
  llm: '#3b82f6',
  transform: '#a855f7',
  db: '#10b981',
  http: '#f97316',
};

function StepNodeComponent({ data }: NodeProps<StepNodeType>) {
  const { step, status } = data;
  const typeLabel = TYPE_LABELS[step.type] ?? step.type;
  const statusCfg = STATUS_LABEL[status];
  const borderColor = STATUS_BORDER[status];
  const handleColor = HANDLE_COLORS[step.type] ?? 'var(--border-bright)';
  const model = step.type === "llm" ? (step.config.model as string) : null;

  const nodeClass = status === 'running' ? 'node-running' : status === 'complete' ? 'node-complete' : '';

  return (
    <div
      className={nodeClass}
      style={{
        background: status === 'complete'
          ? 'rgba(0, 255, 148, 0.03)'
          : 'var(--surface)',
        border: `1px solid ${borderColor}`,
        borderRadius: 0,
        padding: '10px 14px',
        minWidth: 200,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 4,
          height: 4,
          borderRadius: 0,
          background: handleColor,
          border: 'none',
        }}
      />

      {/* Row 1: type badge + status */}
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
          {typeLabel}
        </span>
        <span style={{ fontSize: 10, color: statusCfg.color, fontWeight: 500 }}>
          {statusCfg.text}
        </span>
      </div>

      {/* Row 2: step ID */}
      <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: model ? 4 : 0 }}>
        {step.id}
      </div>

      {/* Row 3: model (if LLM) */}
      {model && (
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
          {model}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 4,
          height: 4,
          borderRadius: 0,
          background: handleColor,
          border: 'none',
        }}
      />
    </div>
  );
}

export default memo(StepNodeComponent);
