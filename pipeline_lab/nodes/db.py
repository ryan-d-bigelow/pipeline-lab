"""Database sink node — writes pipeline results to SQLite."""

from __future__ import annotations

import json
import os
import re
import sqlite3
from typing import Any

from pipeline_lab.config import PipelineState, StepConfig


def _sanitize_table_name(name: str) -> str:
    """Allow only alphanumeric + underscore table names."""
    if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", name):
        msg = f"Invalid table name: {name}"
        raise ValueError(msg)
    return name


def create_db_node(step: StepConfig) -> Any:
    """Create a node that writes specified keys to a SQLite table."""
    cfg = step.config
    table = _sanitize_table_name(cfg.get("table", "results"))
    data_keys: list[str] = cfg.get("data_keys", [])

    def node(state: PipelineState) -> dict[str, Any]:
        db_path = os.environ.get("PIPELINE_LAB_DB", "pipeline_lab.db")
        data = state["data"]
        result_data = {k: data.get(k) for k in data_keys}

        conn = sqlite3.connect(db_path)
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS "{table}" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT,
                pipeline_name TEXT,
                data TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute(
            f'INSERT INTO "{table}" (run_id, pipeline_name, data) VALUES (?, ?, ?)',
            (state["run_id"], state["pipeline_name"], json.dumps(result_data)),
        )
        conn.commit()
        conn.close()

        return {"data": {"_db_write_status": "success", "_db_table": table}}

    return node
