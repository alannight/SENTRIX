# SENTRIX Phase A — Verification and Reconciliation

**Date:** 2026-10-19  
**Baseline commit:** `d68e221` (`main`, `origin/main`)  
**Repository root:** `/home/night/Cyber Security/SENTRIX`  
**Result:** **PASS WITH CONDITIONS**

## 1. Baseline

The initial inspection found the repository root above, branch `main`, and a clean working tree at `d68e221` (`Update`). The visible history contains `d68e221` and `ab934c3` (`Initial commit`). No applicable `AGENTS.md` was found under the workspace or its parent search paths. The original 15 October audit remains intact as a historical record; its description of the earlier empty workspace is not a current-state claim.

The environment provided Python 3.14.8, `uv` 0.13.1, Node 26.11.1, npm 12.2.1 and Docker Compose 5.6.0. Cached project dependencies provided a Python 3.12.15 test runtime (pytest 8.3.5, FastAPI 0.115.12, SQLAlchemy 2.0.40, Alembic 1.15.2, Ruff 0.11.12). There is no `uv.lock`, no web `node_modules`, and no `package-lock.json`.

## 2. Verification matrix

| Area | Status | Command/evidence | Limit |
|---|---|---|---|
| Python dependency imports | PASS | `UV_CACHE_DIR=/tmp/sentrix-phasea-uv-cache uv run --no-sync --project services/api --extra dev python -c 'import alembic, fastapi, httpx, pydantic, sqlalchemy, pytest; print("python-deps", alembic.__version__, fastapi.__version__, httpx.__version__, pydantic.__version__, sqlalchemy.__version__, pytest.__version__)'` | Uses already cached packages and skips package synchronization. No lockfile or reproducible clean install was verified. |
| Backend tests | PASS | `UV_CACHE_DIR=/tmp/sentrix-phasea-uv-cache uv run --no-sync --project services/api --extra dev python -m pytest services/api/tests -q` → `19 passed` | SQLite/in-process tests, not PostgreSQL or socket-level E2E. Pytest emits a pytest-asyncio loop-scope deprecation warning. |
| Ruff lint | PASS | Ruff 0.11.12: `ruff check --config services/api/pyproject.toml services/api` → all checks passed | Initially found four import-order violations; fixed. |
| Ruff formatting | PASS | Ruff 0.11.12: `ruff format --check --config services/api/pyproject.toml services/api` → 26 files already formatted | Three pre-existing formatting differences were corrected. |
| Python syntax | PASS | `python3 -m compileall -q services/api/src services/api/migrations services/api/tests scripts` | Syntax validation only. |
| Alembic upgrade and drift | PASS | Against a fresh `mktemp` SQLite database: `DATABASE_URL="sqlite:///$dbfile" SENTRIX_APP_ENV=test PYTHONPATH=services/api/src UV_CACHE_DIR=/tmp/sentrix-phasea-uv-cache uv run --no-sync --project services/api python -m alembic -c services/api/alembic.ini upgrade head`, then `current` and `check` | Revisions reach `0002_event_audit_records`; `check` reports no new operations. This does not verify PostgreSQL dialect/operation. |
| Migration path regression | PASS | `UV_CACHE_DIR=/tmp/sentrix-phasea-uv-cache uv run --no-sync --project services/api --extra dev python -m pytest services/api/tests/test_migrations.py -q` → `1 passed` | Test changes to an unrelated temporary working directory and applies migrations to its isolated SQLite file. |
| Retention safety regression | PASS | Covered by full pytest run: `test_retention_cli_rejects_age_above_configured_maximum` | Rejects `--older-than-days 36501 --apply` before opening a database. No deletion was run. |
| Compose syntax | PASS | `docker compose --env-file .env.example config --quiet` | Configuration parsing only; no service started. |
| PostgreSQL connectivity/runtime | NOT RUN | `docker info` → permission denied connecting to `/var/run/docker.sock` | Docker daemon is inaccessible. No container or existing volume was touched. PostgreSQL health, migration, and persistence are unverified. |
| Web dependency installation | PASS (audit environment only) | `npm install --ignore-scripts --package-lock=false --no-audit --no-fund --prefix apps/web` → `added 386 packages` | Run with network permission after offline cache miss. No lockfile was generated; dependencies remain ignored/untracked. |
| Web typecheck | PASS | `npm run typecheck --prefix apps/web` → exit 0 | Does not prove browser behavior or production bundling. |
| Web lint | PASS | `npm run lint --prefix apps/web` → exit 0 after fixing one React effect error and one config warning | No dedicated frontend test suite is configured. |
| Web production build | FAIL / environment-blocked | `npm run build --prefix apps/web` failed in Turbopack while creating a worker process: bind to a port returned `Operation not permitted`; same failure after escalation. `npm run build --prefix apps/web -- --webpack` failed with `Could not parse output from TypeScript's --showConfig`. | The ordinary build did not complete. The alternate bundler attempt also failed; no build pass is claimed. |
| API process startup | PASS | Uvicorn log reported application startup complete and listening on loopback with an isolated SQLite URL | HTTP requests could not connect due sandbox local-socket restrictions. |
| Process-level ingestion/query/restart E2E | NOT RUN | Attempted Uvicorn + loopback `curl` workflow; listener started, client connection failed | No claim of HTTP ingestion, filter/detail flow, or restart persistence from this attempt. SQLite application recreation is covered by an existing automated test. |
| Browser/UI states | NOT RUN | No successful production build or browser session available | Source implements loading, error and empty states; populated browser rendering is not verified. |

The offline npm attempt missed cached packages; a network-enabled install then succeeded with `--package-lock=false`. This proves current-environment installation only, not reproducibility from a committed lockfile. Python commands used the pre-existing read-only cache with a task-specific cache directory in `/tmp`; no Python lockfile was generated.

## 3. Confirmed capabilities

- FastAPI routes implement health, create, filtered/paginated list, and event detail.
- Pydantic accepts schema version `1.0`, validates timestamps with offsets and IP values, normalizes known canonical fields, and retains extra submitted properties in the raw JSON structure.
- SQLAlchemy models persist canonical event fields, JSON payloads, parser metadata, and an ingestion audit row in the same transaction. Alembic owns two revisions.
- Event fingerprint is a deterministic raw-payload digest; it is neither a unique event identity nor a deduplication mechanism.
- The frontend source contains overview, event browsing and detail; incident page is an explicit placeholder.
- Synthetic fixture rows are labeled and use documentation IP ranges. The loader checks the configured target is HTTP on a loopback host before making calls.
- Retention defaults to disabled; preview is the default; `--apply` is explicit. It deletes event rows while retaining metadata-only audit rows.

These are source-backed claims. Dynamic evidence is limited to the SQLite tests, isolated migration checks, and configuration parsing above.

## 4. Findings and remediation

### Fixed

1. **Migration command depended on the caller's current directory.** `script_location = migrations` resolved against the root when invoked with the documented root command, while files live beside `services/api/alembic.ini`. It now uses Alembic's `%(here)s` for both migration and source paths. A regression test applies the migration while the current directory is an unrelated temporary directory.
2. **Retention CLI override bypassed the configured upper bound.** `--older-than-days` previously accepted any positive integer, so a very large value combined with `--apply` could select almost all event rows. It now shares the 36,500-day maximum with validated settings and rejects out-of-range CLI input before database initialization. Regression test covers an excessive value; no delete was executed.
3. **Ruff lint/format failures.** Four import-order findings and three formatting differences were corrected. Final Ruff lint and format checks pass.
4. **Frontend effect lint error.** `EventBrowser` called a helper that synchronously changed state from an effect. Fetch completion now owns asynchronous result/error/loading updates, stale requests are ignored, and filter/page/retry handlers own the loading transition. ESLint and TypeScript checks pass.

### Remaining controls and risks

- **MISSING CONTROL — authentication/authorization (high):** all callers that can reach the API can read submitted raw events and ingest new ones. Bind to loopback and do not expose publicly or as a shared service.
- **MISSING CONTROL — read audit and caller identity (medium):** the audit table records ingestion metadata only, with a fixed unauthenticated actor label. It cannot identify a human or record reads.
- **MISSING CONTROL — backup/restore and scheduled retention (high for persistent use):** retention command is manual; no backup/restore procedure, tested recovery point, or scheduler exists.
- **CONFIRMED DESIGN RISK — synchronous SQLAlchemy in async handlers (medium):** event and health handlers call synchronous SQLAlchemy operations without yielding. A slow database call blocks that process's event loop. Current ASGI tests do not characterize production concurrency and socket-based tests are blocked here. No speculative refactor was retained; before shared deployment, move DB handlers/dependency to FastAPI's synchronous threadpool path and add a concurrency regression check, or adopt async SQLAlchemy after a measured need.
- **UNVERIFIED — PostgreSQL behavior:** SQLite validates model and migration structure but does not establish PostgreSQL connectivity, migration execution, pool behavior, or restart persistence.
- **UNVERIFIED — frontend behavior:** typecheck and lint pass, but the production build did not complete; API connectivity and browser rendering remain unverified.
- **MISSING CONTROL — secrets/deployment:** `.env.example` is placeholders and `.env` is gitignored, but there is no production secret manager, TLS/deployment boundary, rate limiting, dependency scanning, or monitoring.
- **DEFERRED BY DESIGN — correlation and incident workflow:** no engine, edge evidence, incident grouping, decisions, or response automation exists.

## 5. Correlation readiness

The Foundation MVP is not yet a safe correlation data contract. Existing UUID `id` identifies a stored row; the raw JSON fingerprint is a deterministic payload digest and currently permits duplicate ingestion. Event time is optional; `observed_timestamp` is receipt fallback, and `ingested_at` is server receipt time. Entities are plain strings/IP fields without resolution history. The complete next-phase prerequisites and additive schema/API recommendations are in [CORRELATION_READINESS.md](../CORRELATION_READINESS.md).

## 6. Overall disposition

**PASS WITH CONDITIONS.** Backend behavior and both local SQLite migrations are verified; the two backend defects and one frontend lint defect in scope were fixed. Backend tests, Ruff, TypeScript and ESLint pass. PostgreSQL runtime and migration, successful production build, browser/API E2E, and production controls remain incomplete due Docker daemon and local worker/socket restrictions. This result does not authorize shared or public deployment.
