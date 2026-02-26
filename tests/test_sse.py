"""Tests for the SSE streaming endpoint."""

from __future__ import annotations

import json
from collections.abc import Generator
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from pipeline_lab.api import app
from tests.conftest import make_mock_llm_response


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


class TestSSEEndpoint:
    def test_stream_not_found(self, client: TestClient) -> None:
        resp = client.post(
            "/pipelines/nonexistent/run/stream",
            json={"user_input": "hello"},
        )
        assert resp.status_code == 404

    def test_stream_transform_pipeline(self, client: TestClient) -> None:
        """SSE stream should emit run_started, step_complete, and run_complete events."""
        # Register a simple transform pipeline
        client.post(
            "/pipelines",
            json={
                "name": "stream-test",
                "steps": [
                    {
                        "id": "greet",
                        "type": "transform",
                        "config": {
                            "operation": "format_string",
                            "template": "Hello, {name}!",
                            "input_keys": ["name"],
                            "output_key": "greeting",
                        },
                    },
                    {
                        "id": "save",
                        "type": "db",
                        "depends_on": ["greet"],
                        "config": {"table": "stream_test", "data_keys": ["greeting"]},
                    },
                ],
            },
        )

        resp = client.post(
            "/pipelines/stream-test/run/stream",
            json={"user_input": "Alice"},
        )
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers["content-type"]

        # Parse SSE events
        events = _parse_sse(resp.text)
        event_types = [e["event"] for e in events]
        assert "run_started" in event_types
        assert "run_complete" in event_types
        assert "step_complete" in event_types

    @patch("pipeline_lab.nodes.llm.OpenAI")
    def test_stream_llm_pipeline(
        self, mock_openai_cls: MagicMock, client: TestClient
    ) -> None:
        """SSE stream should work with mocked LLM pipeline."""
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.return_value = make_mock_llm_response(
            "streamed response"
        )

        resp = client.post(
            "/pipelines/simple-llm/run/stream",
            json={"user_input": "What is AI?"},
        )
        assert resp.status_code == 200

        events = _parse_sse(resp.text)
        run_complete = [e for e in events if e["event"] == "run_complete"]
        assert len(run_complete) == 1
        assert run_complete[0]["payload"]["status"] == "completed"


class TestPipelineConfigEndpoint:
    def test_get_config(self, client: TestClient) -> None:
        resp = client.get("/pipelines/simple-llm/config")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "simple-llm"
        assert len(data["steps"]) >= 1

    def test_get_config_not_found(self, client: TestClient) -> None:
        resp = client.get("/pipelines/nonexistent/config")
        assert resp.status_code == 404


def _parse_sse(text: str) -> list[dict[str, object]]:
    """Parse SSE text into a list of event dicts."""
    events = []
    for line in text.strip().split("\n"):
        line = line.strip()
        if line.startswith("data: "):
            data = json.loads(line[6:])
            events.append(data)
    return events
