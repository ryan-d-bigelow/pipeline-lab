import { useCallback, useState } from "react";
import { getRun } from "./api";
import { usePipelines } from "./hooks/usePipelines";
import { useRunPipeline } from "./hooks/useRunPipeline";
import { useRuns } from "./hooks/useRuns";
import type { RunCompletePayload, RunRecord } from "./types";
import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";

export default function App() {
  const {
    pipelines,
    selectedName,
    config,
    loading,
    error: pipelineError,
    selectPipeline,
  } = usePipelines();

  const {
    isRunning,
    stepStates,
    runResult,
    error: runError,
    run,
    reset,
  } = useRunPipeline();

  const { runs, refresh: refreshRuns } = useRuns();
  const [userInput, setUserInput] = useState("");

  const handleRun = useCallback(async () => {
    if (!selectedName || !config || isRunning) return;
    await run(selectedName, userInput, config);
    refreshRuns();
  }, [selectedName, config, isRunning, userInput, run, refreshRuns]);

  const handleSelectPipeline = useCallback(
    (name: string) => {
      selectPipeline(name);
      reset();
    },
    [selectPipeline, reset],
  );

  const handleSelectRun = useCallback(
    async (record: RunRecord) => {
      try {
        const result = await getRun(record.id);
        // Show this run's result in the output panel
        const payload: RunCompletePayload = {
          run_id: result.run_id,
          status: result.status,
          output: result.output,
          errors: result.errors,
        };
        // We need to expose a way to set the result — for now use reset + the run hook result
        // Instead, let's just show output via a local state approach
        reset();
        // Select the pipeline this run belongs to
        if (result.pipeline_name !== selectedName) {
          selectPipeline(result.pipeline_name);
        }
        // Set run result directly — we'll need a setter. For now show via overriding
        setSelectedRunResult(payload);
      } catch {
        // ignore
      }
    },
    [selectedName, selectPipeline, reset],
  );

  // Extra state for viewing historical run results
  const [selectedRunResult, setSelectedRunResult] =
    useState<RunCompletePayload | null>(null);

  // Clear selected run result when a new run starts
  const handleRunWrapped = useCallback(async () => {
    setSelectedRunResult(null);
    await handleRun();
  }, [handleRun]);

  const displayResult = runResult ?? selectedRunResult;
  const displayError = pipelineError ?? runError;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <p className="text-sm text-slate-500">Loading pipelines...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-slate-700 bg-slate-800 shrink-0">
        <h1 className="text-sm font-bold text-slate-100">Pipeline Lab</h1>
        <span className="text-[10px] text-slate-500">
          LangGraph Pipeline Visualizer
        </span>
      </header>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel ~40% */}
        <div className="w-[40%] min-w-[320px] max-w-[500px] shrink-0">
          <LeftPanel
            pipelines={pipelines}
            selectedName={selectedName}
            config={config}
            userInput={userInput}
            isRunning={isRunning}
            runResult={displayResult}
            error={displayError}
            runs={runs}
            stepStates={stepStates}
            onSelectPipeline={handleSelectPipeline}
            onInputChange={setUserInput}
            onRun={handleRunWrapped}
            onSelectRun={handleSelectRun}
          />
        </div>

        {/* Right panel ~60% */}
        <div className="flex-1">
          <RightPanel config={config} stepStates={stepStates} />
        </div>
      </div>
    </div>
  );
}
