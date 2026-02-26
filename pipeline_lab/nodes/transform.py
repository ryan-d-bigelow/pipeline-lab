"""Data transformation node."""

from __future__ import annotations

from typing import Any

from pipeline_lab.config import PipelineState, StepConfig


def create_transform_node(step: StepConfig) -> Any:
    """Create a node that transforms data in the pipeline state."""
    cfg = step.config
    operation: str = cfg.get("operation", "passthrough")

    def node(state: PipelineState) -> dict[str, Any]:
        data = state["data"]

        if operation == "format_string":
            template: str = cfg["template"]
            input_keys: list[str] = cfg.get("input_keys", [])
            values = {k: data.get(k, "") for k in input_keys}
            result = template.format(**values)
            return {"data": {cfg["output_key"]: result}}

        if operation == "rename":
            from_key: str = cfg["from_key"]
            to_key: str = cfg["to_key"]
            return {"data": {to_key: data.get(from_key)}}

        if operation == "combine_keys":
            input_keys = cfg["input_keys"]
            separator: str = cfg.get("separator", "\n")
            combined = separator.join(str(data.get(k, "")) for k in input_keys)
            return {"data": {cfg["output_key"]: combined}}

        if operation == "passthrough":
            return {"data": {}}

        return {"errors": [f"Unknown transform operation: {operation}"]}

    return node
