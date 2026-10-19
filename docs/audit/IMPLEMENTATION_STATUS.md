# SENTRIX — Implementation Status

**As of:** 2026-10-19  
**Evidence base:** Current source tree, project documentation, and Git status. Checks were not run during this status refresh.

## Current state

| Capability | Status | Evidence / limitation |
|---|---|---|
| Repository and source history | PARTIAL | Git metadata is valid and contains one initial commit; implementation history beyond it is unavailable. |
| Project documentation | IMPLEMENTED | README, charter, architecture, threat model, test strategy, evaluation plan, and roadmap are present. Some historical reports describe earlier workspace states and should be read with their dates. |
| Backend application and API | IMPLEMENTED | FastAPI health, ingestion, list, and detail routes are present. Database access uses synchronous SQLAlchemy from async handlers. |
| Canonical schema and persistence | IMPLEMENTED | Versioned event schema, raw JSON preservation, PostgreSQL model, and Alembic migrations are present. |
| Request and persistence hardening | PARTIAL | Request size/CORS validation, bounded DB pool configuration, request IDs, and transactionally coupled ingestion audit metadata exist. Caller authentication and read audit are absent. |
| Retention | PARTIAL | Configurable event age and explicit preview/apply cleanup command exist; scheduling and backup/restore are operational follow-up. |
| Frontend | PARTIAL | Overview, event list/detail, and an explicit incident placeholder are present. Current build and browser behavior were not verified in this refresh. |
| Synthetic fixture | IMPLEMENTED | Deterministic, clearly labeled local fixture and loopback-only loader are present. |
| Correlation and incident workflow | MISSING | No correlation engine, evidence model, analyst decisions, or incident lifecycle exists. |
| Authentication and authorization | MISSING | API access is unauthenticated; keep bound to a trusted development machine. |
| Tests and CI | PARTIAL | Backend test files exist. No checks were run in this refresh; frontend/runtime and PostgreSQL integration remain unverified. |
| Production readiness | MISSING | No identity/access controls, TLS/deployment controls, backup/restore, operational retention scheduler, or production validation. |

## Audit disposition

The Foundation MVP implements a local event intake and exploration vertical slice. This status does not certify the current code by execution: follow `docs/IMPLEMENTATION_REPORT_PHASE_1.md` for dated prior verification evidence and rerun the documented checks in the intended environment. Do not expose this service publicly. Correlation and incident features remain out of scope until the data and evaluation prerequisites in the roadmap are met.
