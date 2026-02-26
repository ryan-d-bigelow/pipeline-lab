import { useCallback, useState } from "react";
import { streamRun } from "../api";
import type {
  PipelineConfig,
  RunCompletePayload,
  SSEEvent,
  StepCompletePayload,
  StepState,
} from "../types";

interface UseRunPipelineResult {
  isRunning: boolean;
  stepStates: Record<string, StepState>;
  runResult: RunCompletePayload | null;
  error: string | null;
  run: (pipelineName: string, userInput: string, config: PipelineConfig) => Promise<void>;
  reset: () => void;
}

export function useRunPipeline(): UseRunPipelineResult {
  const [isRunning, setIsRunning] = useState(false);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({});
  const [runResult, setRunResult] = useState<RunCompletePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStepStates({});
    setRunResult(null);
    setError(null);
  }, []);

  const run = useCallback(
    async (
      pipelineName: string,
      userInput: string,
      config: PipelineConfig,
    ) => {
      setIsRunning(true);
      setRunResult(null);
      setError(null);

      const states: Record<string, StepState> = {};
      for (const step of config.steps) {
        states[step.id] = { id: step.id, status: "running" };
      }
      setStepStates({ ...states });

      try {
        await streamRun(pipelineName, userInput, (event: SSEEvent) => {
          if (event.event === "step_complete") {
            const payload = event.payload as unknown as StepCompletePayload;
            const hasErrors = payload.errors && payload.errors.length > 0;
            states[payload.step_id] = {
              id: payload.step_id,
              status: hasErrors ? "failed" : "complete",
              output: payload.output,
              errors: payload.errors,
            };
            setStepStates({ ...states });
          } else if (event.event === "run_complete") {
            const payload = event.payload as unknown as RunCompletePayload;
            setRunResult(payload);
            for (const id of Object.keys(states)) {
              if (states[id].status === "running") {
                states[id] = { ...states[id], status: "complete" };
              }
            }
            setStepStates({ ...states });
          } else if (event.event === "error") {
            const payload = event.payload as { error: string };
            setError(payload.error);
            for (const id of Object.keys(states)) {
              states[id] = { ...states[id], status: "failed" };
            }
            setStepStates({ ...states });
          }
        });
      } catch (err: unknown) {
        setError(String(err));
      } finally {
        setIsRunning(false);
      }
    },
    [],
  );

  return { isRunning, stepStates, runResult, error, run, reset };
}
