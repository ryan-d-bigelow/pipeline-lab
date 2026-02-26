"""LLM call node (OpenAI-compatible)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from openai import OpenAI

from pipeline_lab.config import PipelineState, StepConfig

# Base directory for resolving relative prompt_file paths.
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _load_prompt_file(prompt_file: str) -> str:
    """Load a prompt from a file path relative to the repo root."""
    path = _REPO_ROOT / prompt_file
    if not path.is_file():
        msg = f"Prompt file not found: {path}"
        raise FileNotFoundError(msg)
    return path.read_text().strip()


def _build_user_message(state: PipelineState, input_vars: list[str]) -> str:
    """Build the user message from one or more state data keys."""
    data = state["data"]
    if len(input_vars) == 1:
        return str(data.get(input_vars[0], ""))
    parts: list[str] = []
    for key in input_vars:
        value = str(data.get(key, ""))
        parts.append(f"[{key}]\n{value}")
    return "\n\n".join(parts)


def create_llm_node(step: StepConfig) -> Any:
    """Create a node function that calls an LLM."""
    cfg = step.config
    model: str = cfg.get("model", "gpt-4o-mini")

    # Prompt resolution: prompt_file takes precedence, then system_prompt, then default.
    prompt_file: str | None = cfg.get("prompt_file")
    system_prompt: str = cfg.get("system_prompt", "You are a helpful assistant.")
    if prompt_file is not None:
        system_prompt = _load_prompt_file(prompt_file)

    # Input: new-style input_vars list or legacy single input_key.
    input_vars: list[str] | None = cfg.get("input_vars")
    input_key: str = cfg.get("input_key", "user_input")

    # Output: new-style output_var or legacy output_key.
    output_key: str = cfg.get("output_var", cfg.get("output_key", "llm_response"))

    def node(state: PipelineState) -> dict[str, Any]:
        if input_vars is not None:
            user_text = _build_user_message(state, input_vars)
        else:
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
