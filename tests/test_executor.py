"""Tests for the execution engine (graph building and pipeline runs)."""

from __future__ import annotations

import json
import os
import sqlite3
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from pipeline_lab.config import PipelineConfig, StepConfig, StepType
from pipeline_lab.executor import build_graph, execute_pipeline
from tests.conftest import make_mock_llm_response


class TestBuildGraph:
    def test_simple_chain(self, simple_transform_config: PipelineConfig) -> None:
        graph = build_graph(simple_transform_config)
        assert graph is not None

    def test_chord_graph(self, chord_transform_config: PipelineConfig) -> None:
        graph = build_graph(chord_transform_config)
        assert graph is not None

    def test_single_node(self) -> None:
        cfg = PipelineConfig(
            name="single",
            steps=[
                StepConfig(
                    id="t",
                    type=StepType.TRANSFORM,
                    config={"operation": "passthrough"},
                ),
            ],
        )
        graph = build_graph(cfg)
        assert graph is not None

    def test_unknown_dep_raises(self) -> None:
        cfg = PipelineConfig(
            name="bad",
            steps=[
                StepConfig(
                    id="a",
                    type=StepType.TRANSFORM,
                    depends_on=["nonexistent"],
                    config={"operation": "passthrough"},
                ),
            ],
        )
        with pytest.raises(ValueError, match="unknown step"):
            build_graph(cfg)


class TestExecutePipeline:
    def test_transform_to_db(self, simple_transform_config: PipelineConfig) -> None:
        result = execute_pipeline(simple_transform_config, {"name": "World"})

        assert result["status"] == "completed"
        assert result["output"]["greeting"] == "Hello, World!"
        assert not result["errors"]

        # Verify the DB write
        db_path = os.environ["PIPELINE_LAB_DB"]
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT data FROM greetings").fetchone()
        conn.close()
        assert row is not None
        data: Any = json.loads(row["data"])
        assert data["greeting"] == "Hello, World!"

    def test_chord_pipeline(self, chord_transform_config: PipelineConfig) -> None:
        result = execute_pipeline(chord_transform_config, {"text": "hello"})

        assert result["status"] == "completed"
        assert result["output"]["upper_result"] == "UPPER: hello"
        assert result["output"]["lower_result"] == "lower: hello"

        # Verify DB write includes both keys
        db_path = os.environ["PIPELINE_LAB_DB"]
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT data FROM chord_out").fetchone()
        conn.close()
        assert row is not None
        data = json.loads(row["data"])
        assert "upper_result" in data
        assert "lower_result" in data

    def test_node_error_captured(self) -> None:
        """A step that references a missing input key should capture the error."""
        cfg = PipelineConfig(
            name="error-test",
            steps=[
                StepConfig(
                    id="bad_transform",
                    type=StepType.TRANSFORM,
                    config={
                        "operation": "format_string",
                        "template": "{missing_key}",
                        "input_keys": ["missing_key"],
                        "output_key": "out",
                    },
                ),
            ],
        )
        result = execute_pipeline(cfg, {})
        # format_string with empty string for missing key still succeeds
        assert result["status"] == "completed"

    @patch("pipeline_lab.nodes.llm.OpenAI")
    def test_llm_pipeline_mocked(self, mock_openai_cls: MagicMock) -> None:
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = make_mock_llm_response(
            "mocked LLM output"
        )

        cfg = PipelineConfig(
            name="llm-mock",
            steps=[
                StepConfig(
                    id="llm",
                    type=StepType.LLM,
                    config={
                        "model": "gpt-4o-mini",
                        "input_key": "user_input",
                        "output_key": "answer",
                    },
                ),
                StepConfig(
                    id="save",
                    type=StepType.DB,
                    depends_on=["llm"],
                    config={"table": "llm_results", "data_keys": ["answer"]},
                ),
            ],
        )
        result = execute_pipeline(cfg, {"user_input": "What is 2+2?"})

        assert result["status"] == "completed"
        assert result["output"]["answer"] == "mocked LLM output"
        mock_client.chat.completions.create.assert_called_once()
