"""Tests for the FastAPI endpoints."""

from __future__ import annotations

from collections.abc import Generator
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from pipeline_lab.api import app
from tests.conftest import make_mock_llm_response


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    """Create a TestClient whose lifespan runs *after* the temp DB fixture."""
    with TestClient(app) as c:
        yield c


class TestPipelineEndpoints:
    def test_list_pipelines_includes_examples(self, client: TestClient) -> None:
        resp = client.get("/pipelines")
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        # Example pipelines are loaded on startup
        assert "simple-llm" in names
        assert "chain" in names
        assert "chord" in names

    def test_register_pipeline(self, client: TestClient) -> None:
        payload = {
            "name": "api-test",
            "description": "registered via API",
            "steps": [
                {
                    "id": "t",
                    "type": "transform",
                    "config": {"operation": "passthrough"},
                }
            ],
        }
        resp = client.post("/pipelines", json=payload)
        assert resp.status_code == 200
        assert resp.json()["name"] == "api-test"

        # Should appear in list
        names = [p["name"] for p in client.get("/pipelines").json()]
        assert "api-test" in names

    def test_register_invalid_pipeline(self, client: TestClient) -> None:
        resp = client.post("/pipelines", json={"name": "bad", "steps": []})
        assert resp.status_code == 422  # validation error


class TestRunEndpoints:
    def _register_transform_pipeline(self, client: TestClient) -> None:
        client.post(
            "/pipelines",
            json={
                "name": "run-test",
                "description": "for run testing",
                "steps": [
                    {
                        "id": "greet",
                        "type": "transform",
                        "config": {
                            "operation": "format_string",
                            "template": "Hi, {name}!",
                            "input_keys": ["name"],
                            "output_key": "greeting",
                        },
                    },
                    {
                        "id": "save",
                        "type": "db",
                        "depends_on": ["greet"],
                        "config": {"table": "run_test", "data_keys": ["greeting"]},
                    },
                ],
            },
        )

    def test_run_pipeline(self, client: TestClient) -> None:
        self._register_transform_pipeline(client)
        resp = client.post("/pipelines/run-test/run", json={"name": "Alice"})
        assert resp.status_code == 200
        body: dict[str, Any] = resp.json()
        assert body["status"] == "completed"
        assert body["output"]["greeting"] == "Hi, Alice!"

    def test_run_not_found(self, client: TestClient) -> None:
        resp = client.post("/pipelines/nonexistent/run", json={})
        assert resp.status_code == 404

    def test_get_run(self, client: TestClient) -> None:
        self._register_transform_pipeline(client)
        run_resp = client.post("/pipelines/run-test/run", json={"name": "Bob"})
        run_id = run_resp.json()["run_id"]

        resp = client.get(f"/runs/{run_id}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    def test_get_run_not_found(self, client: TestClient) -> None:
        resp = client.get("/runs/nonexistent-id")
        assert resp.status_code == 404

    def test_list_runs(self, client: TestClient) -> None:
        self._register_transform_pipeline(client)
        client.post("/pipelines/run-test/run", json={"name": "Charlie"})

        resp = client.get("/runs")
        assert resp.status_code == 200
        runs = resp.json()
        assert len(runs) >= 1

    @patch("pipeline_lab.nodes.llm.OpenAI")
    def test_run_llm_pipeline_mocked(
        self, mock_openai_cls: MagicMock, client: TestClient
    ) -> None:
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = make_mock_llm_response(
            "API mock response"
        )

        resp = client.post(
            "/pipelines/simple-llm/run",
            json={"user_input": "Tell me a joke"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "completed"
        assert body["output"]["llm_response"] == "API mock response"
