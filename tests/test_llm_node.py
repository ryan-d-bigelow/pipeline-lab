"""Tests for the upgraded LLM node (prompt_file, input_vars, output_var)."""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock, patch

from pipeline_lab.config import PipelineConfig, StepConfig, StepType
from pipeline_lab.executor import execute_pipeline
from pipeline_lab.nodes.llm import _build_user_message, _load_prompt_file
from tests.conftest import make_mock_llm_response


class TestPromptFile:
    def test_load_prompt_file(self) -> None:
        """Bundled prompt files should load correctly."""
        content = _load_prompt_file("prompts/enrich.md")
        assert "research assistant" in content.lower()

    def test_load_prompt_file_not_found(self) -> None:
        """Missing prompt file should raise FileNotFoundError."""
        import pytest

        with pytest.raises(FileNotFoundError, match="not found"):
            _load_prompt_file("prompts/nonexistent.md")

    @patch("pipeline_lab.nodes.llm.OpenAI")
    def test_prompt_file_used_as_system_prompt(self, mock_openai_cls: MagicMock) -> None:
        """When prompt_file is set, its content should be the system prompt."""
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = make_mock_llm_response("ok")

        cfg = PipelineConfig(
            name="prompt-file-test",
            steps=[
                StepConfig(
                    id="llm",
                    type=StepType.LLM,
                    config={
                        "prompt_file": "prompts/enrich.md",
                        "input_vars": ["user_input"],
                        "output_var": "result",
                    },
                ),
            ],
        )
        execute_pipeline(cfg, {"user_input": "test input"})

        call_args = mock_client.chat.completions.create.call_args
        messages: list[dict[str, str]] = call_args.kwargs["messages"]
        system_msg = messages[0]["content"]
        assert "research assistant" in system_msg.lower()


class TestInputVars:
    def test_single_input_var(self) -> None:
        """Single input_var should pass value directly (no label)."""
        state: dict[str, Any] = {
            "data": {"user_input": "hello world"},
            "run_id": "test",
            "pipeline_name": "test",
            "errors": [],
        }
        result = _build_user_message(state, ["user_input"])  # type: ignore[arg-type]
        assert result == "hello world"

    def test_multiple_input_vars(self) -> None:
        """Multiple input_vars should be labeled and concatenated."""
        state: dict[str, Any] = {
            "data": {"user_input": "hello", "enriched": "enriched content"},
            "run_id": "test",
            "pipeline_name": "test",
            "errors": [],
        }
        result = _build_user_message(state, ["user_input", "enriched"])  # type: ignore[arg-type]
        assert "[user_input]" in result
        assert "[enriched]" in result
        assert "hello" in result
        assert "enriched content" in result

    @patch("pipeline_lab.nodes.llm.OpenAI")
    def test_input_vars_pipeline(self, mock_openai_cls: MagicMock) -> None:
        """input_vars should be used when present in config."""
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = make_mock_llm_response("output")

        cfg = PipelineConfig(
            name="input-vars-test",
            steps=[
                StepConfig(
                    id="llm",
                    type=StepType.LLM,
                    config={
                        "input_vars": ["user_input"],
                        "output_var": "result",
                    },
                ),
            ],
        )
        result = execute_pipeline(cfg, {"user_input": "test"})
        assert result["status"] == "completed"
        assert result["output"]["result"] == "output"


class TestOutputVar:
    @patch("pipeline_lab.nodes.llm.OpenAI")
    def test_output_var(self, mock_openai_cls: MagicMock) -> None:
        """output_var should determine the key in state.data."""
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = make_mock_llm_response("answer")

        cfg = PipelineConfig(
            name="output-var-test",
            steps=[
                StepConfig(
                    id="llm",
                    type=StepType.LLM,
                    config={
                        "input_vars": ["user_input"],
                        "output_var": "my_custom_output",
                    },
                ),
            ],
        )
        result = execute_pipeline(cfg, {"user_input": "q"})
        assert result["output"]["my_custom_output"] == "answer"

    @patch("pipeline_lab.nodes.llm.OpenAI")
    def test_legacy_input_key_output_key(self, mock_openai_cls: MagicMock) -> None:
        """Legacy input_key/output_key should still work."""
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = make_mock_llm_response("legacy")

        cfg = PipelineConfig(
            name="legacy-test",
            steps=[
                StepConfig(
                    id="llm",
                    type=StepType.LLM,
                    config={
                        "input_key": "user_input",
                        "output_key": "answer",
                    },
                ),
            ],
        )
        result = execute_pipeline(cfg, {"user_input": "hello"})
        assert result["output"]["answer"] == "legacy"
