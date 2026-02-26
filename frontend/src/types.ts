export interface StepConfig {
  id: string;
  type: string;
  config: Record<string, unknown>;
  depends_on: string[];
}

export interface PipelineConfig {
  name: string;
  description: string;
  steps: StepConfig[];
}

export interface PipelineListItem {
  name: string;
  description: string;
  created_at: string;
}

export type StepStatus = "idle" | "running" | "complete" | "failed";

export interface StepState {
  id: string;
  status: StepStatus;
  output?: Record<string, unknown>;
  errors?: string[];
}

export interface SSEEvent {
  event: string;
  payload: Record<string, unknown>;
}

export interface RunResult {
  run_id: string;
  status: string;
  output: Record<string, unknown>;
  errors: string[];
}
