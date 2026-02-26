# pipeline-lab

A standalone, LangGraph-native experiment harness for configuring and running AI pipelines.

Pipelines are **data-driven DAGs** defined in YAML — swap steps, chain them, fan-out with chords, and route outputs without touching Python code.

## Quickstart (5 minutes)

### 1. Install

```bash
# Clone and install with uv
cd pipeline-lab
uv sync
```

### 2. Run the server

```bash
# Set your OpenAI key (needed for LLM nodes)
export OPENAI_API_KEY="sk-..."

# Start the API
uv run uvicorn pipeline_lab.api:app --reload
```

The server starts at `http://localhost:8000`. Three example pipelines are auto-loaded from `pipelines/`.

### 3. Try it out

```bash
# List available pipelines
curl http://localhost:8000/pipelines | python -m json.tool

# Run the simple LLM pipeline
curl -X POST http://localhost:8000/pipelines/simple-llm/run \
  -H "Content-Type: application/json" \
  -d '{"user_input": "Explain quantum computing in one sentence."}' \
  | python -m json.tool

# Check run status
curl http://localhost:8000/runs | python -m json.tool
```

### 4. Run without an LLM

The transform and DB nodes work without an API key:

```bash
# Register a custom pipeline
curl -X POST http://localhost:8000/pipelines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "greeter",
    "description": "Simple greeting pipeline",
    "steps": [
      {
        "id": "greet",
        "type": "transform",
        "config": {
          "operation": "format_string",
          "template": "Hello, {name}! Welcome to pipeline-lab.",
          "input_keys": ["name"],
          "output_key": "greeting"
        }
      },
      {
        "id": "save",
        "type": "db",
        "depends_on": ["greet"],
        "config": { "table": "greetings", "data_keys": ["greeting"] }
      }
    ]
  }'

# Run it
curl -X POST http://localhost:8000/pipelines/greeter/run \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}' | python -m json.tool
```

## Pipeline Config Schema

Pipelines are defined as YAML or JSON:

```yaml
name: "my-pipeline"
description: "What this pipeline does"
steps:
  - id: "step_1"
    type: "llm"          # llm | transform | db | http
    config:
      model: "gpt-4o-mini"
      system_prompt: "You are helpful."
      input_key: "user_input"
      output_key: "response"

  - id: "step_2"
    type: "db"
    depends_on: ["step_1"]  # DAG edges — runs after step_1
    config:
      table: "results"
      data_keys: ["response"]
```

### Step Types

| Type | Description | Key Config |
|------|-------------|------------|
| `llm` | OpenAI-compatible LLM call | `model`, `system_prompt`, `input_key`, `output_key` |
| `transform` | Data transformation | `operation` (`format_string`, `rename`, `combine_keys`), keys |
| `db` | SQLite write | `table`, `data_keys` |
| `http` | HTTP request | `url`, `method`, `output_key` |

### Chords (Fan-out / Fan-in)

Steps with no `depends_on` run in parallel. Steps that depend on multiple predecessors wait for all of them:

```yaml
steps:
  - id: "summarize"    # ─┐ parallel
    type: "llm"        #  │
    config: ...        #  │
  - id: "sentiment"    # ─┘ parallel
    type: "llm"        #
    config: ...        #
  - id: "save"         # waits for both
    type: "db"
    depends_on: ["summarize", "sentiment"]
    config: ...
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pipelines` | List registered pipelines |
| `POST` | `/pipelines` | Register a new pipeline |
| `POST` | `/pipelines/{name}/run` | Trigger a run with input payload |
| `GET` | `/runs/{run_id}` | Get run status and output |
| `GET` | `/runs` | List recent runs |

## Development

```bash
# Install dev dependencies
uv sync --group dev

# Run tests
uv run pytest

# Lint and type-check
uv run ruff check .
uv run mypy pipeline_lab/
```

## Example Pipelines

- `pipelines/simple_llm.yaml` — Single LLM call: input → LLM → DB
- `pipelines/chain.yaml` — Transform chain: input → transform → LLM → DB
- `pipelines/chord.yaml` — Parallel chord: input → [LLM, LLM] → merge → DB

## Architecture

The executor dynamically builds a LangGraph `StateGraph` from the pipeline config. Each step type maps to a node function. State flows as a dict with each step reading/writing specific keys. Parallel branches use the `merge_dicts` reducer to combine outputs.

```
YAML Config → PipelineConfig (Pydantic) → StateGraph (LangGraph) → Execute → SQLite
```
