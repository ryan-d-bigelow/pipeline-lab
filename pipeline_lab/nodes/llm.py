"""LLM call node (OpenAI-compatible)."""

from __future__ import annotations

from typing import Any

from openai import OpenAI

from pipeline_lab.config import PipelineState, StepConfig


def create_llm_node(step: StepConfig) -> Any:
    """Create a node function that calls an LLM."""
    cfg = step.config
    model: str = cfg.get("model", "gpt-4o-mini")
    system_prompt: str = cfg.get("system_prompt", "You are a helpful assistant.")
    input_key: str = cfg.get("input_key", "user_input")
    output_key: str = cfg.get("output_key", "llm_response")

    def node(state: PipelineState) -> dict[str, Any]:
        user_text = str(state["data"].get(input_key, ""))
        client = OpenAI()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
        )
        content = response.choices[0].message.content or ""
        return {"data": {output_key: content}}

    return node
