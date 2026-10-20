# SENTRIX — Security Event Investigation Platform

A traceable security event ingestion and investigation workspace.

```
SENTRIX/
├── frontend/          ← Next.js 16 web application
│   ├── Dockerfile
│   ├── src/
│   └── ...
├── backend/           ← FastAPI + SQLAlchemy API
│   ├── Dockerfile
│   ├── src/sentrix/
│   ├── migrations/    (Alembic)
│   └── ...
├── compose.yaml       ← Full stack: db + backend + frontend
├── .env.example
└── Makefile           ← Convenience targets
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Docker + Docker Compose
- Node.js 22+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### 2. Environment
```bash
cp .env.example .env
# Edit .env — at minimum change POSTGRES_PASSWORD
```

### 3. Run the full stack with Docker
```bash
make docker-up
```
This starts Postgres, the backend API on `:8000`, and the frontend on `:3000`.

> **Note:** When using Docker compose, update `DATABASE_URL` in `.env` to use `@db:` instead of `@localhost:`.

---

## Running Services Individually

### Database only
```bash
make db-up
```

### Backend (hot-reload)
```bash
make migrate          # Run database migrations first
make api              # Start FastAPI dev server on :8000
```

### Frontend (hot-reload)
```bash
make frontend-install # Only needed once
make frontend-dev     # Start Next.js dev server on :3000
```

---

## All Makefile Targets

| Target | Description |
|---|---|
| `make help` | Show all targets |
| `make db-up / db-down` | Start/stop Postgres only |
| `make docker-build` | Build all Docker images |
| `make docker-up / docker-down` | Start/stop full stack |
| `make migrate` | Run Alembic migrations |
| `make api` | FastAPI dev server with hot-reload |
| `make test` | Run pytest |
| `make lint / format` | ruff check / format |
| `make seed` | Load synthetic event data |
| `make retention-preview` | Preview events to purge |
| `make retention-apply` | Purge expired events |
| `make frontend-install` | npm install |
| `make frontend-dev` | Next.js dev server |
| `make frontend-check` | typecheck + eslint |
| `make frontend-build` | Production build |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | — | Database name |
| `POSTGRES_USER` | — | Database user |
| `POSTGRES_PASSWORD` | — | Database password |
| `DATABASE_URL` | — | SQLAlchemy connection string |
| `SENTRIX_APP_ENV` | `production` | `development` or `production` |
| `SENTRIX_CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `SENTRIX_MAX_REQUEST_BYTES` | `262144` | Max request body size (256 KB) |
| `SENTRIX_EVENT_RETENTION_DAYS` | `0` | Days to keep events (0 = disabled) |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | API URL used by frontend |

---

## API Documentation

Swagger UI is available at: `http://localhost:8000/api/v1/docs`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS |
| Backend | FastAPI · SQLAlchemy 2 · Alembic · Pydantic |
| Database | PostgreSQL 16 |
| Packaging | uv (Python) · npm (Node) |
| Deployment | Docker + Docker Compose |
