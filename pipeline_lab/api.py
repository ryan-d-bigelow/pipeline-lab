"""FastAPI application — pipeline management and execution endpoints."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException

from pipeline_lab.config import PipelineConfig, load_pipeline_config
from pipeline_lab.executor import execute_pipeline
from pipeline_lab.models import PipelineListItem, RunRecord, RunResponse
from pipeline_lab.store import (
    create_run,
    get_pipeline,
    get_run,
    init_db,
    list_pipelines,
    list_runs,
    save_pipeline,
    update_run,
)

logger = logging.getLogger(__name__)

PIPELINES_DIR = Path(__file__).resolve().parent.parent / "pipelines"


def _load_example_pipelines() -> None:
    """Auto-register YAML pipeline configs from the pipelines/ directory."""
    if not PIPELINES_DIR.is_dir():
        return
    for path in sorted(PIPELINES_DIR.glob("*.yaml")):
        try:
            cfg = load_pipeline_config(path)
            save_pipeline(cfg)
            logger.info("Loaded pipeline '%s' from %s", cfg.name, path.name)
        except Exception:
            logger.exception("Failed to load pipeline from %s", path)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    init_db()
    _load_example_pipelines()
    yield


app = FastAPI(
    title="pipeline-lab",
    description="LangGraph-native experiment harness for AI pipelines",
    version="0.1.0",
    lifespan=lifespan,
)


# ---- Pipeline CRUD ---------------------------------------------------------


@app.get("/pipelines", response_model=list[PipelineListItem])
def list_pipelines_endpoint() -> list[PipelineListItem]:
    """List all registered pipelines."""
    return list_pipelines()


@app.post("/pipelines")
def register_pipeline(config: PipelineConfig) -> dict[str, str]:
    """Register (or update) a pipeline from a config payload."""
    save_pipeline(config)
    return {"status": "registered", "name": config.name}


# ---- Run execution ----------------------------------------------------------


@app.post("/pipelines/{name}/run", response_model=RunResponse)
def run_pipeline_endpoint(name: str, payload: dict[str, Any]) -> RunResponse:
    """Trigger a pipeline run with the given input data."""
    config = get_pipeline(name)
    if config is None:
        raise HTTPException(status_code=404, detail=f"Pipeline '{name}' not found")

    result = execute_pipeline(config, payload)
    run_id: str = result["run_id"]

    # Persist the run
    create_run(run_id, name, payload)
    if result["status"] == "completed":
        update_run(run_id, status="completed", output=result["output"])
    else:
        update_run(
            run_id,
            status="failed",
            error="; ".join(result.get("errors", [])),
        )

    return RunResponse(
        run_id=run_id,
        pipeline_name=name,
        status=result["status"],
        output=result.get("output", {}),
        errors=result.get("errors", []),
    )


@app.get("/runs/{run_id}", response_model=RunResponse)
def get_run_endpoint(run_id: str) -> RunResponse:
    """Get a run's status and output."""
    run = get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return run


@app.get("/runs", response_model=list[RunRecord])
def list_runs_endpoint(limit: int = 50) -> list[RunRecord]:
    """List recent runs."""
    return list_runs(limit=limit)
