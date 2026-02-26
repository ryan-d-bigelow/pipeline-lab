export type StepType = "llm" | "transform" | "db" | "http";

export interface StepConfig {
  id: string;
  type: StepType;
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

export type RunStatus = "pending" | "running" | "completed" | "failed";

export type StepStatus = "idle" | "running" | "complete" | "failed";

export interface StepState {
  id: string;
  status: StepStatus;
  output?: Record<string, unknown>;
  errors?: string[];
}

export interface RunResponse {
  run_id: string;
  pipeline_name: string;
  status: RunStatus;
  output: Record<string, unknown>;
  errors: string[];
}

export interface RunRecord {
  id: string;
  pipeline_name: string;
  status: RunStatus;
  input_json: string;
  output_json: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SSEEvent {
  event: "run_started" | "step_complete" | "run_complete" | "error";
  payload: Record<string, unknown>;
}

export interface StepCompletePayload {
  step_id: string;
  output: Record<string, unknown>;
  errors: string[];
}

export interface RunCompletePayload {
  run_id: string;
  status: RunStatus;
  output: Record<string, unknown>;
  errors: string[];
}
