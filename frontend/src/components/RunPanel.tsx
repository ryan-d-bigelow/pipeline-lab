import { useState } from "react";
import type {
  PipelineConfig,
  PipelineListItem,
  StepState,
  SSEEvent,
  RunResult,
} from "../types";
import { listPipelines, getPipelineConfig, streamRun } from "../api";

interface RunPanelProps {
  onConfigLoaded: (config: PipelineConfig) => void;
  onStepStatesChange: (states: Record<string, StepState>) => void;
}

export default function RunPanel({
  onConfigLoaded,
  onStepStatesChange,
}: RunPanelProps) {
  const [pipelines, setPipelines] = useState<PipelineListItem[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [stepOutputs, setStepOutputs] = useState<
    { stepId: string; output: Record<string, unknown> }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load pipelines on first render
  if (!loaded) {
    setLoaded(true);
    listPipelines()
      .then((list) => {
        setPipelines(list);
        if (list.length > 0) {
          const first = list[0].name;
          setSelectedPipeline(first);
          getPipelineConfig(first).then(onConfigLoaded).catch(() => {});
        }
      })
      .catch((err) => setError(String(err)));
  }

  async function handlePipelineChange(name: string) {
    setSelectedPipeline(name);
    setRunResult(null);
    setStepOutputs([]);
    onStepStatesChange({});
    try {
      const config = await getPipelineConfig(name);
      onConfigLoaded(config);
    } catch {
      setError(`Failed to load config for ${name}`);
    }
  }

  async function handleRun() {
    if (!selectedPipeline || isRunning) return;
    setIsRunning(true);
    setRunResult(null);
    setStepOutputs([]);
    setError(null);

    // Mark all steps as idle initially, then running as SSE arrives
    const states: Record<string, StepState> = {};
    onStepStatesChange(states);

    try {
      const config = await getPipelineConfig(selectedPipeline);
      // Mark all as running at start
      for (const step of config.steps) {
        states[step.id] = { id: step.id, status: "running" };
      }
      onStepStatesChange({ ...states });

      await streamRun(selectedPipeline, userInput, (event: SSEEvent) => {
        if (event.event === "step_complete") {
          const payload = event.payload as {
            step_id: string;
            output: Record<string, unknown>;
            errors: string[];
          };
          const hasErrors = payload.errors && payload.errors.length > 0;
          states[payload.step_id] = {
            id: payload.step_id,
            status: hasErrors ? "failed" : "complete",
            output: payload.output,
            errors: payload.errors,
          };
          onStepStatesChange({ ...states });
          setStepOutputs((prev) => [
            ...prev,
            { stepId: payload.step_id, output: payload.output },
          ]);
        } else if (event.event === "run_complete") {
          const payload = event.payload as unknown as RunResult;
          setRunResult(payload);
          // Mark any still-running steps as complete
          for (const id of Object.keys(states)) {
            if (states[id].status === "running") {
              states[id] = { ...states[id], status: "complete" };
            }
          }
          onStepStatesChange({ ...states });
        } else if (event.event === "error") {
          const payload = event.payload as { error: string };
          setError(payload.error);
          for (const id of Object.keys(states)) {
            states[id] = { ...states[id], status: "failed" };
          }
          onStepStatesChange({ ...states });
        }
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="run-panel">
      <div className="input-section">
        <label htmlFor="pipeline-select">Pipeline</label>
        <select
          id="pipeline-select"
          value={selectedPipeline}
          onChange={(e) => handlePipelineChange(e.target.value)}
          disabled={isRunning}
        >
          {pipelines.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <label htmlFor="user-input">Your Input</label>
        <textarea
          id="user-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your input here..."
          rows={4}
          disabled={isRunning}
        />

        <button onClick={handleRun} disabled={isRunning || !selectedPipeline}>
          {isRunning ? "Running..." : "Run Pipeline"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {stepOutputs.length > 0 && (
        <div className="results-section">
          <h3>Step Outputs</h3>
          {stepOutputs.map((so, i) => (
            <div key={i} className="step-output-card">
              <div className="step-output-header">{so.stepId}</div>
              <div className="step-output-body">
                {Object.entries(so.output).map(([k, v]) => (
                  <div key={k} className="output-entry">
                    <span className="output-key">{k}:</span>
                    <span className="output-value">
                      {typeof v === "string" ? v : JSON.stringify(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {runResult && (
        <div className="run-result">
          <h3>
            Run {runResult.status === "completed" ? "Complete" : "Failed"}
          </h3>
          <div className="run-meta">
            Run ID: <code>{runResult.run_id}</code>
          </div>
          {runResult.errors.length > 0 && (
            <div className="error-list">
              {runResult.errors.map((e, i) => (
                <div key={i} className="error-item">
                  {e}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
