# SENTRIX — Security and Technical-Debt Register

**Current review:** 2026-10-19
**Evidence:** [Phase A verification report](PHASE_A_VERIFICATION_2026-10-19.md), source at baseline `d68e221`, and Phase A working changes.
**Historical note:** The 15 October register described an empty workspace. That snapshot is preserved in Git history; this file tracks the current source state.

## Open items

| ID | Priority | Classification | Finding and evidence | Impact / next action |
|---|---|---|---|---|
| SEC-001 | P0 before any shared deployment | MISSING CONTROL | No authentication or authorization on event routes; `api/routes/events.py` returns `raw_event` to any reachable caller. | Keep API bound to trusted loopback. Before shared use, select an identity provider and define producer/analyst principals, least-privilege ingest/read scopes, session/token handling, and authorization tests. Never expose publicly in current form. |
| OPS-001 | P1 before persistent use | MISSING CONTROL | No backup, restore, or recovery test. Retention script is manual; there is no scheduler. | Define encrypted backup cadence, retention, access, restore target and recovery test before relying on stored telemetry. Only schedule event cleanup after backup policy is approved operationally. |
| SEC-002 | P1 before analyst/shared use | MISSING CONTROL | `event_audit_records` records ingestion only and labels actor `unauthenticated-api-client`; no read audit or human identity. | Add principal identity and read/administrative audit events with a retention/access policy as part of the authentication design. Current audit is provenance metadata, not accountability. |
| REL-001 | P1 before shared/high-throughput use | CONFIRMED DEFECT (runtime impact unmeasured) | `async def` routes in `api/routes/events.py` and `health.py` call synchronous SQLAlchemy methods directly. A blocking database call blocks that process's event loop. | Before shared deployment, use synchronous FastAPI routes/dependencies to dispatch DB work through the threadpool, or adopt async SQLAlchemy. Add an in-process concurrency regression test and PostgreSQL load/failure check. Phase A did not retain a conversion because the current custom ASGI test client hangs with synchronous handlers and process HTTP is blocked here; test-harness compatibility must be solved before a safe change. |
| VER-001 | P1 | UNVERIFIED | Docker daemon denied access to `/var/run/docker.sock`; PostgreSQL health, migration, pool timeout/failure, and persistence after process restart were not executed. | Run the documented flow against a disposable PostgreSQL instance in an environment with Docker access; record migration, ingest/list/detail and restart results. |
| VER-002 | P1 | UNVERIFIED | TypeScript and ESLint pass after audit-environment dependency installation; production build and browser behavior are unverified. No committed web lockfile pins the dependency graph. | Add a lockfile through the normal dependency workflow; resolve the Turbopack local worker bind restriction or verify the production build in CI; inspect API-connected UI states in a browser. |
| OPS-002 | P1 before production | MISSING CONTROL | No verified TLS termination, production secret manager, deployment isolation, rate limiting, dependency scanning, or monitoring. | Define deployment boundary and secrets management, turn off debug/docs as appropriate, add request/rate/availability controls and operational monitoring before production. |
| DATA-001 | P2 before correlation | DEFERRED BY DESIGN / contract gap | `id` is row identity; `event_fingerprint` is a digest of raw JSON and duplicates are accepted. Event times may be null; entity fields are strings without resolution history. | Define producer identity/idempotency, entity resolution, event-time/late-arrival semantics, rule/evidence/edge and incident contracts before correlation. See [correlation readiness](../CORRELATION_READINESS.md). Do not treat fingerprints as dedupe keys. |
| OBS-001 | P2 | MISSING CONTROL | Request ID is generated and returned; ingestion logs carry it. List/detail DB error logs do not attach it, and no browser read/access audit exists. | Include request ID in all request-scoped API logs and expose it to browser code if support workflows need it; pair with principal identity before shared deployment. |

## Closed during Phase A

| ID | Finding | Resolution/evidence |
|---|---|---|
| FIX-001 | Alembic `script_location = migrations` was resolved relative to caller cwd, so root-level documented invocation could not find `services/api/migrations`. | `services/api/alembic.ini` now anchors script/source paths to `%(here)s`; migration regression test passes from an unrelated cwd. |
| FIX-002 | `--older-than-days` accepted positive values above the settings maximum, permitting an unexpectedly broad deletion cutoff when combined with `--apply`. | CLI now enforces 1–36,500 days; regression test rejects 36,501 with `--apply` before creating a DB connection. No event deletion was executed. |
| FIX-003 | Ruff import-order and formatting checks failed. | Corrected; Ruff lint and format checks pass. |

## Deferred capabilities (not current code defects)

- Correlation engine, correlation evidence/edges, incident creation and incident lifecycle.
- Analyst notes/decisions and automated response.
- Production connectors and detection-performance claims.

These remain explicitly out of Phase A scope. The synthetic data is not correlation ground truth.

## Historical snapshot — 2026-10-15

The audit at that time observed an empty workspace, invalid/empty `.git` metadata, and no source, manifests, documentation or tests in the inspected checkout. Those findings applied to that dated snapshot only. They are preserved in [INITIAL_AUDIT.md](INITIAL_AUDIT.md) and in the earlier version of this register in Git history; they are not current setup defects.
