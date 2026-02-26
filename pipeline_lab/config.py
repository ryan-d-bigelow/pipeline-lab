"""Pipeline configuration schema and state definitions."""

from __future__ import annotations

import operator
from enum import StrEnum
from pathlib import Path
from typing import Annotated, Any

import yaml
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class StepType(StrEnum):
    """Supported pipeline step types."""

    LLM = "llm"
    TRANSFORM = "transform"
    DB = "db"
    HTTP = "http"


class StepConfig(BaseModel):
    """Configuration for a single pipeline step."""

    id: str
    type: StepType
    config: dict[str, Any] = Field(default_factory=dict)
    depends_on: list[str] = Field(default_factory=list)


class PipelineConfig(BaseModel):
    """Top-level pipeline configuration."""

    name: str
    description: str = ""
    steps: list[StepConfig] = Field(min_length=1)


def merge_dicts(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    """Reducer: merge two dicts (b overwrites a on conflicts)."""
    result = {**a}
    result.update(b)
    return result


class PipelineState(TypedDict):
    """LangGraph state flowing through the pipeline."""

    data: Annotated[dict[str, Any], merge_dicts]
    run_id: str
    pipeline_name: str
    errors: Annotated[list[str], operator.add]


def load_pipeline_config(path: str | Path) -> PipelineConfig:
    """Load a pipeline config from a YAML or JSON file."""
    p = Path(path)
    raw = p.read_text()
    parsed: Any = yaml.safe_load(raw)
    return PipelineConfig.model_validate(parsed)
