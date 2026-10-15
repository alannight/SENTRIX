# SENTRIX

SENTRIX (Security Event Correlation & Investigation Platform) is an investigation workspace for connecting security telemetry with explicit evidence. The **Foundation MVP** implements one reliable data path: submit an event, validate and normalize it, persist it, retrieve it, and inspect it in a web interface.

## Current scope

Implemented scope is event ingestion and exploration. The API preserves the submitted JSON value, exposes canonical fields and parser version, records UTC ingestion timestamps, supports filters and bounded pagination, and uses Alembic migrations. The web app reads live API records and clearly indicates when the API is unavailable.

Correlation, incident creation, analyst decisions, authentication/authorization, production deployment controls, and detection-performance evaluation are **not implemented**. Synthetic records are test/demo inputs only; they are not real telemetry or correlation ground truth. This foundation is not production-ready and should not be exposed publicly.

## Architecture

```text
Synthetic or external event producer
  → FastAPI request size limit and Pydantic validation
  → canonical field normalization (schema 1.0)
  → SQLAlchemy transaction and PostgreSQL JSON persistence
  → filtered, paginated investigation API
  → Next.js overview, event explorer, and event detail
```

The API is a modular monolith. PostgreSQL is the documented local runtime database. Tests use an isolated in-memory SQLite database and do not touch the local PostgreSQL volume.

## Prerequisites

- Python 3.12 or newer (the lock resolution uses Python 3.12 when available)
- `uv`
- Node.js 20.9 or newer and npm
- Docker Engine with Docker Compose access for the PostgreSQL development service

## Local setup

From the repository root:

```sh
cp .env.example .env
# Replace POSTGRES_PASSWORD and the matching password in DATABASE_URL in .env.
uv sync --project services/api --extra dev
cd apps/web && npm install && cd ../..
```

`.env.example` contains placeholders only. `.env` is ignored by Git. Keep the API bound to loopback for local development.

## Start services

Terminal 1 — database and migration:

```sh
docker compose up -d db
uv run --project services/api alembic -c services/api/alembic.ini upgrade head
```

Terminal 2 — API:

```sh
uv run --project services/api uvicorn sentrix.main:app --app-dir services/api/src --reload --host 127.0.0.1 --port 8000
```

OpenAPI documentation is at `http://127.0.0.1:8000/api/v1/docs`. Health is at `http://127.0.0.1:8000/api/v1/health`.

Terminal 3 — web app:

```sh
cd apps/web
npm run dev
```

Open `http://127.0.0.1:3000`. `NEXT_PUBLIC_API_BASE_URL` defaults to `http://localhost:8000/api/v1`; CORS defaults allow the two local web origins only.

## Submit a synthetic event

With the API running, either load the deterministic, loopback-only fixture set:

```sh
uv run --project services/api python scripts/load_synthetic.py
```

or submit one event:

```sh
curl -i http://127.0.0.1:8000/api/v1/events \
  -H 'Content-Type: application/json' \
  -d '{"schema_version":"1.0","source":"manual-demo","event_type":"authentication.failure","event_timestamp":"2026-01-15T09:05:00Z","severity":"medium","user":"synthetic-user","source_ip":"192.0.2.10","raw_event":{"synthetic":true,"result":"failure"}}'
```

The loader skips records whose deterministic raw-payload fingerprint already exists. It refuses non-loopback or non-HTTP targets. Dataset manifest: `datasets/synthetic/manifest.json`.

## Checks

```sh
uv run --project services/api --extra dev pytest services/api/tests -q
uv run --project services/api --extra dev ruff check --config services/api/pyproject.toml services/api
cd apps/web && npm run typecheck && npm run lint && npm run build
```

Convenience targets are available through `make db-up`, `make migrate`, `make api`, `make test`, `make lint`, `make web-check`, `make web-build`, and `make seed`.

## API

- `GET /api/v1/health` — application and database status separately.
- `POST /api/v1/events` — validate, normalize, and transactionally persist one event; `201` only after commit.
- `GET /api/v1/events` — stable ordering, page size 1–100, offset up to 10,000, and filters `event_type`, `severity`, `source`, `event_fingerprint`, `start_time`, and `end_time`.
- `GET /api/v1/events/{event_id}` — canonical event including the structurally preserved raw JSON value.

Event occurrence time is optional and never inferred. If observed time is not submitted, the API records its receipt time as `observed_timestamp`; `ingested_at` and `created_at` are also server timestamps. Datetimes must include a timezone offset and are stored/returned in UTC. Schema version `1.0` is accepted; unsupported versions are rejected. Extra submitted fields are retained in `raw_event`, not silently promoted to normalized fields. Fingerprints are deterministic identifiers, not uniqueness guarantees or deduplication decisions.

## Security and limitations

Request bodies are capped, CORS origins are explicit, API errors omit connection details and Pydantic input values, and logs do not include submitted payloads. Database migrations are explicit; startup does not create tables. Raw telemetry is available to any caller that can reach this unauthenticated development API. There is no identity/authentication layer, authorization, analyst audit trail, retention control, TLS termination, or production secret management. Do not expose this service beyond a trusted development machine.

The current API calls synchronous SQLAlchemy operations from async handlers; slow database work can block the event loop. Treat this as a development-only limitation and revisit the session/handler model before shared or higher-throughput use.

See [Threat Model](docs/THREAT_MODEL.md), [Test Strategy](docs/TEST_STRATEGY.md), [Canonical Schema](docs/data-dictionary/CANONICAL_EVENT_SCHEMA.md), and [Architecture](docs/architecture/TO_BE_ARCHITECTURE.md).

## Troubleshooting

- **API cannot connect to database:** check `docker compose ps`, `.env` credentials, then rerun the migration command. The health endpoint reports database availability without returning connection details.
- **`DATABASE_URL` missing:** copy `.env.example` to `.env`; the application intentionally fails configuration validation if no database URL is supplied.
- **CORS error:** use `http://localhost:3000` or `http://127.0.0.1:3000`, or add the exact development origin to `SENTRIX_CORS_ORIGINS` in `.env`.
- **API unreachable from UI:** verify the API is listening on `127.0.0.1:8000` and `NEXT_PUBLIC_API_BASE_URL` is correct.
- **Synthetic loader refuses target:** it is intentionally restricted to local loopback HTTP and must not be pointed at production.
