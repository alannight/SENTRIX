# SENTRIX Foundation MVP Test Strategy

## Layers

- **Unit/schema:** canonical event parsing, timestamp/IP validation, version rejection, deterministic fingerprints, and unknown optional fields.
- **API integration:** health, ingestion and raw payload retention, detail retrieval, listing filters/pagination, validation errors, bounded requests, and missing record handling.
- **Migration:** apply Alembic migration to an empty isolated database and verify schema compatibility.
- **Frontend:** TypeScript checking, lint, production build, and manual integration against live API records, including empty/error states.
- **End-to-end:** migrate isolated PostgreSQL, start API, submit event, list/detail the persisted record, inspect through web UI, restart API, confirm persistence.

## Data isolation

Automated API tests use in-memory SQLite with a fresh schema per test and never connect to the local PostgreSQL volume. Migration/E2E checks must use a disposable test database or a uniquely named temporary database. Never delete user data to prepare a test.

## Reporting

Record exact commands and `PASS`, `FAIL`, or `NOT RUN` with concise evidence. A TypeScript check or build does not substitute for browser interaction. No results are inferred from files existing or dependencies being declared.

