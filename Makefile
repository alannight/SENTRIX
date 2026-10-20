.PHONY: help db-up db-down migrate api test lint format \
        frontend-install frontend-dev frontend-check frontend-build \
        seed retention-preview retention-apply docker-up docker-down docker-build

# ── Default target ──────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  SENTRIX – available make targets"
	@echo ""
	@echo "  Infrastructure"
	@echo "    db-up              Start only the Postgres container"
	@echo "    db-down            Stop the Postgres container"
	@echo "    docker-build       Build all Docker images (backend + frontend)"
	@echo "    docker-up          Start all services via docker compose"
	@echo "    docker-down        Stop all docker compose services"
	@echo ""
	@echo "  Backend (./backend)"
	@echo "    migrate            Run Alembic migrations"
	@echo "    api                Run FastAPI dev server (hot-reload)"
	@echo "    test               Run pytest"
	@echo "    lint               Run ruff linter"
	@echo "    format             Run ruff formatter"
	@echo "    seed               Load synthetic events"
	@echo "    retention-preview  Preview events that would be purged"
	@echo "    retention-apply    Purge expired events"
	@echo ""
	@echo "  Frontend (./frontend)"
	@echo "    frontend-install   npm install"
	@echo "    frontend-dev       Start Next.js dev server"
	@echo "    frontend-check     typecheck + lint"
	@echo "    frontend-build     Production build"
	@echo ""

# ── Database ─────────────────────────────────────────────────────────────
db-up:
	docker compose up -d db

db-down:
	docker compose stop db

# ── Docker full stack ────────────────────────────────────────────────────
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

# ── Backend ──────────────────────────────────────────────────────────────
migrate:
	uv run --project backend alembic -c backend/alembic.ini upgrade head

api:
	uv run --project backend uvicorn sentrix.main:app --app-dir backend/src --reload --host 127.0.0.1 --port 8000

test:
	uv run --project backend --extra dev pytest backend/tests -q

lint:
	uv run --project backend --extra dev ruff check backend

format:
	uv run --project backend --extra dev ruff format backend

seed:
	uv run --project backend python backend/scripts/load_synthetic.py

retention-preview:
	uv run --project backend python backend/scripts/purge_expired_events.py

retention-apply:
	uv run --project backend python backend/scripts/purge_expired_events.py --apply

# ── Frontend ─────────────────────────────────────────────────────────────
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-check:
	cd frontend && npm run typecheck && npm run lint

frontend-build:
	cd frontend && npm run build
