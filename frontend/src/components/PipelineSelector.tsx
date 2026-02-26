import type { PipelineListItem } from "../types";

interface PipelineSelectorProps {
  pipelines: PipelineListItem[];
  selectedName: string;
  disabled: boolean;
  onSelect: (name: string) => void;
}

export default function PipelineSelector({
  pipelines,
  selectedName,
  disabled,
  onSelect,
}: PipelineSelectorProps) {
  return (
    <div>
      <select
        id="pipeline-select"
        value={selectedName}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'var(--void)',
          border: '1px solid var(--border)',
          borderRadius: 0,
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-primary)',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none' as const,
          WebkitAppearance: 'none' as const,
          opacity: disabled ? 0.4 : 1,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--phosphor-dim)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {pipelines.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name} — {p.description}
          </option>
        ))}
      </select>
    </div>
  );
}
