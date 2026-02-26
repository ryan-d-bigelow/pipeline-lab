"""Tests for pipeline configuration parsing and validation."""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from pipeline_lab.config import PipelineConfig, StepConfig, StepType, load_pipeline_config


class TestStepConfig:
    def test_basic_step(self) -> None:
        step = StepConfig(
            id="my_step",
            type=StepType.LLM,
            config={"model": "gpt-4o-mini"},
        )
        assert step.id == "my_step"
        assert step.type == StepType.LLM
        assert step.depends_on == []

    def test_step_with_depends(self) -> None:
        step = StepConfig(
            id="save",
            type=StepType.DB,
            depends_on=["step_a", "step_b"],
            config={"table": "results"},
        )
        assert step.depends_on == ["step_a", "step_b"]

    def test_invalid_type_rejected(self) -> None:
        with pytest.raises(ValueError):
            StepConfig(id="bad", type="nonexistent", config={})  # type: ignore[arg-type]


class TestPipelineConfig:
    def test_minimal_pipeline(self) -> None:
        cfg = PipelineConfig(
            name="test",
            steps=[StepConfig(id="a", type=StepType.TRANSFORM, config={})],
        )
        assert cfg.name == "test"
        assert len(cfg.steps) == 1

    def test_empty_steps_rejected(self) -> None:
        with pytest.raises(ValueError):
            PipelineConfig(name="empty", steps=[])

    def test_from_dict(self) -> None:
        raw = {
            "name": "from-dict",
            "description": "built from dict",
            "steps": [
                {"id": "s1", "type": "llm", "config": {"model": "gpt-4o-mini"}},
                {"id": "s2", "type": "db", "depends_on": ["s1"], "config": {"table": "t"}},
            ],
        }
        cfg = PipelineConfig.model_validate(raw)
        assert cfg.name == "from-dict"
        assert cfg.steps[1].depends_on == ["s1"]


class TestLoadPipelineConfig:
    def test_load_yaml(self, tmp_path: Path) -> None:
        data = {
            "name": "yaml-test",
            "description": "loaded from yaml",
            "steps": [
                {"id": "x", "type": "transform", "config": {"operation": "passthrough"}},
            ],
        }
        path = tmp_path / "test.yaml"
        path.write_text(yaml.dump(data))

        cfg = load_pipeline_config(path)
        assert cfg.name == "yaml-test"
        assert cfg.steps[0].type == StepType.TRANSFORM

    def test_load_example_pipelines(self) -> None:
        """Ensure the bundled example YAML files all parse correctly."""
        pipelines_dir = Path(__file__).resolve().parent.parent / "pipelines"
        for path in pipelines_dir.glob("*.yaml"):
            cfg = load_pipeline_config(path)
            assert cfg.name
            assert len(cfg.steps) >= 1
