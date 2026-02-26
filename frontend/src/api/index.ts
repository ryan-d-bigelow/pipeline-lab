import type {
  PipelineConfig,
  PipelineListItem,
  RunRecord,
  RunResponse,
  SSEEvent,
} from "../types";

export async function listPipelines(): Promise<PipelineListItem[]> {
  const res = await fetch("/pipelines");
  if (!res.ok) throw new Error(`Failed to list pipelines: ${res.status}`);
  return res.json() as Promise<PipelineListItem[]>;
}

export async function getPipelineConfig(
  name: string,
): Promise<PipelineConfig> {
  const res = await fetch(`/pipelines/${encodeURIComponent(name)}/config`);
  if (!res.ok) throw new Error(`Failed to get pipeline config: ${res.status}`);
  return res.json() as Promise<PipelineConfig>;
}

export async function runPipeline(
  name: string,
  input: Record<string, unknown>,
): Promise<RunResponse> {
  const res = await fetch(`/pipelines/${encodeURIComponent(name)}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to run pipeline: ${res.status}`);
  return res.json() as Promise<RunResponse>;
}

export async function getRun(runId: string): Promise<RunResponse> {
  const res = await fetch(`/runs/${encodeURIComponent(runId)}`);
  if (!res.ok) throw new Error(`Failed to get run: ${res.status}`);
  return res.json() as Promise<RunResponse>;
}

export async function listRuns(limit = 50): Promise<RunRecord[]> {
  const res = await fetch(`/runs?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to list runs: ${res.status}`);
  return res.json() as Promise<RunRecord[]>;
}

export async function streamRun(
  pipelineName: string,
  userInput: string,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const res = await fetch(
    `/pipelines/${encodeURIComponent(pipelineName)}/run/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_input: userInput }),
    },
  );

  if (!res.ok) throw new Error(`Stream request failed: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmed.slice(6)) as SSEEvent;
          onEvent(data);
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}
