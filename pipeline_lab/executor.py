"""Core execution engine — builds a LangGraph StateGraph from pipeline config."""

from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Any

from langgraph.graph import END, START, StateGraph

from pipeline_lab.config import PipelineConfig, PipelineState, StepConfig
from pipeline_lab.nodes import NODE_REGISTRY


def _wrap_node(
    fn: Callable[[PipelineState], dict[str, Any]],
    step_id: str,
) -> Callable[[PipelineState], dict[str, Any]]:
    """Wrap a node function with error handling."""

    def wrapper(state: PipelineState) -> dict[str, Any]:
        try:
            return fn(state)
        except Exception as exc:
            return {"errors": [f"Step '{step_id}' failed: {exc}"]}

    return wrapper


def _create_node_fn(step: StepConfig) -> Callable[[PipelineState], dict[str, Any]]:
    """Look up the node factory and create the node function."""
    factory = NODE_REGISTRY.get(step.type.value)
    if factory is None:
        msg = f"Unknown step type: {step.type}"
        raise ValueError(msg)
    return factory(step)


def build_graph(config: PipelineConfig) -> Any:
    """Build and compile a LangGraph StateGraph from a pipeline config.

    The topology is derived from each step's ``depends_on`` list:

    * Steps with no dependencies are **entry** nodes (connected from START).
    * If a node has one successor, ``add_edge`` links them.
    * If a node has multiple successors, ``add_conditional_edges`` fans out.
    * Fan-in is implicit — LangGraph waits for all predecessors.
    """
    builder = StateGraph(PipelineState)

    # ---- compute adjacency --------------------------------------------------
    successors: dict[str, list[str]] = {s.id: [] for s in config.steps}
    for step in config.steps:
        for dep_id in step.depends_on:
            if dep_id not in successors:
                msg = f"Step '{step.id}' depends on unknown step '{dep_id}'"
                raise ValueError(msg)
            successors[dep_id].append(step.id)

    entries = [s.id for s in config.steps if not s.depends_on]
    if not entries:
        msg = "Pipeline has no entry steps (every step has depends_on)"
        raise ValueError(msg)

    # ---- add nodes ----------------------------------------------------------
    for step in config.steps:
        node_fn = _wrap_node(_create_node_fn(step), step.id)
        builder.add_node(step.id, node_fn)  # type: ignore[call-overload]

    # ---- connect START → entries --------------------------------------------
    if len(entries) == 1:
        builder.add_edge(START, entries[0])
    else:
        # Fan-out from START to multiple entry nodes
        entry_list = list(entries)
        builder.add_conditional_edges(
            START,
            lambda _state: entry_list,
            path_map=entry_list,
        )

    # ---- connect each node to its successors --------------------------------
    for step_id, succs in successors.items():
        if not succs:
            builder.add_edge(step_id, END)
        elif len(succs) == 1:
            builder.add_edge(step_id, succs[0])
        else:
            succ_list = list(succs)
            builder.add_conditional_edges(
                step_id,
                lambda _state, _s=succ_list: _s,
                path_map=succ_list,
            )

    return builder.compile()


def execute_pipeline(
    config: PipelineConfig,
    input_data: dict[str, Any],
) -> dict[str, Any]:
    """Execute a pipeline synchronously and return the result."""
    graph = build_graph(config)
    run_id = str(uuid.uuid4())

    initial_state: dict[str, Any] = {
        "data": input_data,
        "run_id": run_id,
        "pipeline_name": config.name,
        "errors": [],
    }

    result: dict[str, Any] = graph.invoke(initial_state)
    errors: list[str] = result.get("errors", [])

    return {
        "run_id": run_id,
        "status": "failed" if errors else "completed",
        "output": result.get("data", {}),
        "errors": errors,
    }
