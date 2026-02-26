"""Data models for pipeline and run persistence."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

RunStatus = Literal["pending", "running", "completed", "failed"]


class PipelineRecord(BaseModel):
    """Stored pipeline record."""

    name: str
    description: str
    config_json: str
    created_at: datetime = Field(default_factory=datetime.now)


class RunRecord(BaseModel):
    """Stored run record."""

    id: str
    pipeline_name: str
    status: RunStatus
    input_json: str
    output_json: str | None = None
    error: str | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class RunResponse(BaseModel):
    """API response for a pipeline run."""

    run_id: str
    pipeline_name: str
    status: RunStatus
    output: dict[str, Any] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)


class PipelineListItem(BaseModel):
    """Summary of a pipeline for listing."""

    name: str
    description: str
    created_at: datetime
