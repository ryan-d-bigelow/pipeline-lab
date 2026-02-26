import type { PipelineConfig, PipelineListItem, RunCompletePayload, RunRecord, StepState } from "../types";
import PipelineSelector from "./PipelineSelector";
import InputForm from "./InputForm";
import RunHistory from "./RunHistory";
import OutputDisplay from "./OutputDisplay";

interface LeftPanelProps {
  pipelines: PipelineListItem[];
  selectedName: string;
  config: PipelineConfig | null;
  userInput: string;
  isRunning: boolean;
  runResult: RunCompletePayload | null;
  error: string | null;
  runs: RunRecord[];
  stepStates: Record<string, StepState>;
  onSelectPipeline: (name: string) => void;
  onInputChange: (value: string) => void;
  onRun: () => void;
  onSelectRun: (run: RunRecord) => void;
}

export default function LeftPanel({
  pipelines,
  selectedName,
  userInput,
  isRunning,
  runResult,
  error,
  runs,
  onSelectPipeline,
  onInputChange,
  onRun,
  onSelectRun,
}: LeftPanelProps) {
  return (
    <div className="h-full flex flex-col bg-slate-800 border-r border-slate-700 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <PipelineSelector
          pipelines={pipelines}
          selectedName={selectedName}
          disabled={isRunning}
          onSelect={onSelectPipeline}
        />

        <InputForm
          userInput={userInput}
          isRunning={isRunning}
          disabled={isRunning || !selectedName}
          onInputChange={onInputChange}
          onRun={onRun}
        />

        <div>
          <h3 className="text-xs font-medium text-slate-400 mb-2">
            Run History
          </h3>
          <RunHistory runs={runs} onSelectRun={onSelectRun} />
        </div>

        {(runResult || error) && (
          <div>
            <h3 className="text-xs font-medium text-slate-400 mb-2">
              Output
            </h3>
            <OutputDisplay runResult={runResult} error={error} />
          </div>
        )}
      </div>
    </div>
  );
}
