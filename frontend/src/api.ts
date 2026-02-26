import type { PipelineConfig, PipelineListItem, SSEEvent } from "./types";

const BASE = "";

export async function listPipelines(): Promise<PipelineListItem[]> {
  const res = await fetch(`${BASE}/pipelines`);
  if (!res.ok) throw new Error(`Failed to list pipelines: ${res.status}`);
  return res.json();
}

export async function getPipelineConfig(
  name: string
): Promise<PipelineConfig> {
  const res = await fetch(`${BASE}/pipelines/${encodeURIComponent(name)}/config`);
  if (!res.ok) throw new Error(`Failed to get pipeline config: ${res.status}`);
  return res.json();
}

export async function streamRun(
  pipelineName: string,
  userInput: string,
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const res = await fetch(
    `${BASE}/pipelines/${encodeURIComponent(pipelineName)}/run/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_input: userInput }),
    }
  );

  if (!res.ok) throw new Error(`Stream request failed: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmed.slice(6));
          onEvent(data as SSEEvent);
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}
