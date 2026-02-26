"""HTTP fetch node."""

from __future__ import annotations

from typing import Any

import httpx

from pipeline_lab.config import PipelineState, StepConfig


def create_http_node(step: StepConfig) -> Any:
    """Create a node that makes an HTTP request."""
    cfg = step.config
    url_template: str = cfg["url"]
    method: str = cfg.get("method", "GET").upper()
    output_key: str = cfg.get("output_key", "http_response")
    timeout: float = cfg.get("timeout", 30.0)
    headers: dict[str, str] = cfg.get("headers", {})

    def node(state: PipelineState) -> dict[str, Any]:
        data = state["data"]
        url = url_template.format(**data)

        response = httpx.request(method, url, headers=headers, timeout=timeout)

        result: dict[str, Any] = {
            "status_code": response.status_code,
            "body": response.text,
        }
        try:
            result["json"] = response.json()
        except Exception:
            pass

        return {"data": {output_key: result}}

    return node
