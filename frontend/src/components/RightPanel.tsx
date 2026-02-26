import type { PipelineConfig, StepState } from "../types";
import DagView from "./DagView";

interface RightPanelProps {
  config: PipelineConfig | null;
  stepStates: Record<string, StepState>;
}

export default function RightPanel({ config, stepStates }: RightPanelProps) {
  return (
    <div className="h-full flex flex-col bg-slate-900">
      {config && (
        <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-200">
            {config.name}
          </h2>
          <span className="text-xs text-slate-500">{config.description}</span>
          <span className="text-[10px] text-slate-600 ml-auto">
            {config.steps.length} steps
          </span>
        </div>
      )}
      <div className="flex-1">
        <DagView config={config} stepStates={stepStates} />
      </div>
    </div>
  );
}
