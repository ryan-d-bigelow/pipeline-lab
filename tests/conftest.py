"""Shared test fixtures."""

from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path
from typing import Any

import pytest

from pipeline_lab.config import PipelineConfig, StepConfig
from pipeline_lab.store import init_db


@pytest.fixture(autouse=True)
def _temp_db(tmp_path: Path) -> Generator[None, None, None]:
    """Point all DB operations at a temporary SQLite file."""
    db_path = str(tmp_path / "test.db")
    os.environ["PIPELINE_LAB_DB"] = db_path
    init_db()
    yield
    os.environ.pop("PIPELINE_LAB_DB", None)


@pytest.fixture()
def simple_transform_config() -> PipelineConfig:
    """A minimal transform → db pipeline (no LLM needed)."""
    return PipelineConfig(
        name="test-transform",
        description="Transform then save",
        steps=[
            StepConfig(
                id="format",
                type="transform",  # type: ignore[arg-type]
                config={
                    "operation": "format_string",
                    "template": "Hello, {name}!",
                    "input_keys": ["name"],
                    "output_key": "greeting",
                },
            ),
            StepConfig(
                id="save",
                type="db",  # type: ignore[arg-type]
                depends_on=["format"],
                config={
                    "table": "greetings",
                    "data_keys": ["greeting"],
                },
            ),
        ],
    )


@pytest.fixture()
def chord_transform_config() -> PipelineConfig:
    """A fan-out / fan-in pipeline using only transforms (no LLM)."""
    return PipelineConfig(
        name="test-chord",
        description="Parallel transforms then merge",
        steps=[
            StepConfig(
                id="upper",
                type="transform",  # type: ignore[arg-type]
                config={
                    "operation": "format_string",
                    "template": "UPPER: {text}",
                    "input_keys": ["text"],
                    "output_key": "upper_result",
                },
            ),
            StepConfig(
                id="lower",
                type="transform",  # type: ignore[arg-type]
                config={
                    "operation": "format_string",
                    "template": "lower: {text}",
                    "input_keys": ["text"],
                    "output_key": "lower_result",
                },
            ),
            StepConfig(
                id="save",
                type="db",  # type: ignore[arg-type]
                depends_on=["upper", "lower"],
                config={
                    "table": "chord_out",
                    "data_keys": ["upper_result", "lower_result"],
                },
            ),
        ],
    )


def make_mock_llm_response(content: str = "mocked response") -> Any:
    """Build a minimal object mimicking openai ChatCompletion."""

    class _Msg:
        def __init__(self, c: str) -> None:
            self.content = c

    class _Choice:
        def __init__(self, c: str) -> None:
            self.message = _Msg(c)

    class _Response:
        def __init__(self, c: str) -> None:
            self.choices = [_Choice(c)]

    return _Response(content)
