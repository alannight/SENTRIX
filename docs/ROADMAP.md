# SENTRIX Roadmap

## Phase A — Verification and Foundation hardening

**Status: PASS WITH CONDITIONS, 2026-10-19.** Backend SQLite tests, isolated migration upgrade/drift check, Ruff lint/format, Python syntax, Compose configuration, web typecheck and web lint passed. Migration cwd dependence, an unbounded retention override, and a frontend effect lint error were fixed. PostgreSQL runtime, web production build, browser behavior, and process-level HTTP E2E remain unverified because Docker access and local worker/socket restrictions blocked them. See [verification report](audit/PHASE_A_VERIFICATION_2026-10-19.md) and [technical debt](audit/TECHNICAL_DEBT.md).

## Foundation MVP — current scope

Validated event intake, PostgreSQL/Alembic persistence, bounded list/filter/detail API, overview/event explorer/detail UI source, synthetic development fixture and local workflow. Correlation and incidents remain intentionally absent.

## Before shared or production use

1. Add authentication, authorization and caller identity for ingestion/read scopes; keep raw telemetry inaccessible to anonymous users.
2. Define analyst/read audit, database least privilege, secret management, TLS/deployment boundary, rate limits and monitoring.
3. Define and test encrypted backup/restore and operational retention scheduling.
4. Move blocking synchronous DB work off the async event loop or use an async DB path, after adding concurrency regression coverage.
5. Verify migrations, health, ingestion/query, restart persistence and failure behavior against PostgreSQL; install/build the web app and inspect it in a browser.

## Next product phase — correlation readiness only

Before implementing correlation, satisfy [the correlation readiness contract](CORRELATION_READINESS.md): identity/idempotency, entity resolution, event-time/late-arrival rules, versioned rules, provenance/evidence edges, incident grouping semantics, and independent ground truth/metrics. The schema/API changes must be additive and migration-backed after the contract is agreed. Do not infer correlation from time proximity or claim detection quality from the synthetic fixture.

## Later, evidence permitting

Analyst notes/decisions, incident lifecycle, evaluation views, and advanced graph/probabilistic experiments may follow only when validated use cases and reproducible evaluation justify them. Do not present a heuristic score as calibrated probability without calibration evidence.
