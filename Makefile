.PHONY: db-up db-down migrate api test lint format web-install web-check web-build seed retention-preview retention-apply

db-up:
	docker compose up -d db

db-down:
	docker compose stop db

migrate:
	uv run --project services/api alembic -c services/api/alembic.ini upgrade head

api:
	uv run --project services/api uvicorn sentrix.main:app --app-dir services/api/src --reload --host 127.0.0.1 --port 8000

test:
	uv run --project services/api --extra dev pytest services/api/tests -q

lint:
	uv run --project services/api --extra dev ruff check services/api

format:
	uv run --project services/api --extra dev ruff format services/api

web-install:
	cd apps/web && npm install

web-check:
	cd apps/web && npm run typecheck && npm run lint

web-build:
	cd apps/web && npm run build

seed:
	uv run --project services/api python scripts/load_synthetic.py

retention-preview:
	uv run --project services/api python scripts/purge_expired_events.py

retention-apply:
	uv run --project services/api python scripts/purge_expired_events.py --apply
