"""SQLite persistence layer for pipelines and runs."""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import UTC, datetime
from typing import Any

from pipeline_lab.config import PipelineConfig
from pipeline_lab.models import PipelineListItem, RunRecord, RunResponse


def _db_path() -> str:
    return os.environ.get("PIPELINE_LAB_DB", "pipeline_lab.db")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    """Create tables if they don't exist."""
    conn = _connect()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pipelines (
            name TEXT PRIMARY KEY,
            description TEXT NOT NULL DEFAULT '',
            config_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            pipeline_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            input_json TEXT NOT NULL DEFAULT '{}',
            output_json TEXT,
            error TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def save_pipeline(config: PipelineConfig) -> None:
    """Insert or replace a pipeline config."""
    conn = _connect()
    now = datetime.now(UTC).isoformat()
    conn.execute(
        "INSERT OR REPLACE INTO pipelines (name, description, config_json, created_at) "
        "VALUES (?, ?, ?, ?)",
        (config.name, config.description, config.model_dump_json(), now),
    )
    conn.commit()
    conn.close()


def get_pipeline(name: str) -> PipelineConfig | None:
    """Retrieve a pipeline config by name."""
    conn = _connect()
    row = conn.execute("SELECT config_json FROM pipelines WHERE name = ?", (name,)).fetchone()
    conn.close()
    if row is None:
        return None
    data: Any = json.loads(row["config_json"])
    return PipelineConfig.model_validate(data)


def list_pipelines() -> list[PipelineListItem]:
    """List all registered pipelines."""
    conn = _connect()
    rows = conn.execute(
        "SELECT name, description, created_at FROM pipelines ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [
        PipelineListItem(
            name=r["name"],
            description=r["description"],
            created_at=datetime.fromisoformat(r["created_at"]),
        )
        for r in rows
    ]


def create_run(
    run_id: str,
    pipeline_name: str,
    input_data: dict[str, Any],
) -> None:
    """Create a new run record."""
    conn = _connect()
    now = datetime.now(UTC).isoformat()
    conn.execute(
        "INSERT INTO runs (id, pipeline_name, status, input_json, created_at, updated_at) "
        "VALUES (?, ?, 'running', ?, ?, ?)",
        (run_id, pipeline_name, json.dumps(input_data), now, now),
    )
    conn.commit()
    conn.close()


def update_run(
    run_id: str,
    *,
    status: str | None = None,
    output: dict[str, Any] | None = None,
    error: str | None = None,
) -> None:
    """Update a run record."""
    conn = _connect()
    now = datetime.now(UTC).isoformat()
    updates: list[str] = ["updated_at = ?"]
    params: list[Any] = [now]

    if status is not None:
        updates.append("status = ?")
        params.append(status)
    if output is not None:
        updates.append("output_json = ?")
        params.append(json.dumps(output))
    if error is not None:
        updates.append("error = ?")
        params.append(error)

    params.append(run_id)
    conn.execute(f"UPDATE runs SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
    conn.close()


def get_run(run_id: str) -> RunResponse | None:
    """Retrieve a run by ID."""
    conn = _connect()
    row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    conn.close()
    if row is None:
        return None
    output: dict[str, Any] = json.loads(row["output_json"]) if row["output_json"] else {}
    return RunResponse(
        run_id=row["id"],
        pipeline_name=row["pipeline_name"],
        status=row["status"],
        output=output,
        errors=[row["error"]] if row["error"] else [],
    )


def list_runs(limit: int = 50) -> list[RunRecord]:
    """List recent runs."""
    conn = _connect()
    rows = conn.execute(
        "SELECT * FROM runs ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [
        RunRecord(
            id=r["id"],
            pipeline_name=r["pipeline_name"],
            status=r["status"],
            input_json=r["input_json"],
            output_json=r["output_json"],
            error=r["error"],
            created_at=datetime.fromisoformat(r["created_at"]),
            updated_at=datetime.fromisoformat(r["updated_at"]),
        )
        for r in rows
    ]
