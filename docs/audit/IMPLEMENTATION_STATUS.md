# SENTRIX — Current Implementation Status

**As of:** 2026-10-19
**Baseline commit:** `d68e221` (`main`, tracking `origin/main`)
**Current verification:** See [Phase A verification report](PHASE_A_VERIFICATION_2026-10-19.md).
**Scope:** Foundation MVP only; no correlation or incident workflow.

## Capability status

| Capability | Status | Evidence and limit |
|---|---|---|
| Repository and history | VERIFIED | Valid Git repository, `main` at `d68e221`; two commits visible. Baseline working tree was clean. |
| API health and database reporting | IMPLEMENTED; SQLite-tested | `services/api/src/sentrix/api/routes/health.py`; tests use isolated SQLite. PostgreSQL connectivity was unavailable in this environment. |
| Event ingestion and validation | IMPLEMENTED; SQLite-tested | `api/routes/events.py`, `events/schemas.py`, `events/service.py`; bounded JSON, schema version, IP/time validation, UTC normalization, raw JSON structure preservation. |
| Event persistence and migrations | IMPLEMENTED; SQLite migration-tested | `events/models.py`, Alembic revisions `0001` and `0002`; migrations reach `0002_event_audit_records` and `alembic check` reports no drift on isolated SQLite. PostgreSQL migration remains unverified. |
| Event listing and detail | IMPLEMENTED; SQLite-tested | `GET /events` supports filters, stable order, bounded pagination; `GET /events/{id}` retrieves persisted records. |
| Request and ingestion controls | PARTIAL | Size limit, exact-origin CORS, bounded pool settings, server request ID, transactional ingestion audit metadata. No authenticated actor or read-access audit. |
| Retention | IMPLEMENTED; CLI bounds regression-tested | Preview by default; deletes only with `--apply`; override is limited to 1–36,500 days. No scheduler or backup/restore process. |
| Web application | PARTIAL | Overview, explorer, detail, API loading/error/empty states, incident placeholder. Dependencies installed for Phase A; typecheck and lint pass after a fix. Production build is blocked by local worker process binding under Turbopack; the Webpack fallback also failed. Browser behavior remains unverified. No package lockfile exists. |
| Synthetic data and loader | IMPLEMENTED in source; HTTP loader NOT RUN | Labeled fixture and loopback-target guard in `scripts/load_synthetic.py`. End-to-end HTTP was blocked by local socket restrictions. |
| Correlation and incident lifecycle | MISSING / DEFERRED BY DESIGN | No correlation engine, evidence edges, analyst decisions, incident model, or lifecycle endpoints were found. |
| Authentication and authorization | MISSING CONTROL | API is unauthenticated; any caller who can reach it can read raw submitted telemetry. Local-only development assumption; not suitable for public/shared deployment. |
| Production operations | MISSING CONTROL | No verified PostgreSQL deployment, TLS termination, secret manager, backup/restore, retention scheduler, monitoring, or deployment controls. |

## Evidence rules

`IMPLEMENTED; SQLite-tested` refers to executed in-process tests, not PostgreSQL or browser behavior. See the verification report for exact commands and blocked checks. The 19 passing backend tests include new migration-path and retention-override regression coverage; they do not certify the external runtime workflow.

The historical 15 October empty-workspace observation remains in [INITIAL_AUDIT.md](INITIAL_AUDIT.md). It describes that earlier snapshot and has not been rewritten to imply that source existed then.
