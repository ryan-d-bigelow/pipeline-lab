"""Node registry — maps step types to node factory functions."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from pipeline_lab.config import PipelineState, StepConfig
from pipeline_lab.nodes.db import create_db_node
from pipeline_lab.nodes.http import create_http_node
from pipeline_lab.nodes.llm import create_llm_node
from pipeline_lab.nodes.transform import create_transform_node

NodeFn = Callable[[PipelineState], dict[str, Any]]
NodeFactory = Callable[[StepConfig], NodeFn]

NODE_REGISTRY: dict[str, NodeFactory] = {
    "llm": create_llm_node,
    "transform": create_transform_node,
    "db": create_db_node,
    "http": create_http_node,
}

__all__ = ["NODE_REGISTRY", "NodeFn", "NodeFactory"]
