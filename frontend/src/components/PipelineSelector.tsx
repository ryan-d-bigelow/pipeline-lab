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
      <label
        htmlFor="pipeline-select"
        className="block text-xs font-medium text-slate-400 mb-1"
      >
        Pipeline
      </label>
      <select
        id="pipeline-select"
        value={selectedName}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2
                   text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500
                   disabled:opacity-50"
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
