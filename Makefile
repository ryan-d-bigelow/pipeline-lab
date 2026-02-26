.PHONY: serve test lint typecheck code-quality deploy

serve:
	cd frontend && npm run dev &
	.venv/bin/uvicorn pipeline_lab.api:app --reload --port 8001

test:
	.venv/bin/pytest tests/ -v

lint:
	.venv/bin/ruff check .
	cd frontend && npm run lint 2>/dev/null || true

typecheck:
	.venv/bin/mypy pipeline_lab/

code-quality: lint typecheck test

deploy:
	./scripts/deploy.sh
