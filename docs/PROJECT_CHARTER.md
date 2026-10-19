# SENTRIX Foundation MVP — Project Charter

## Problem

Security analysts receive fragmented events and need traceable context before deciding whether events belong together. SENTRIX aims to make event provenance, normalized facts, correlation evidence, and uncertainty inspectable.

## Phase 1 objective

Deliver an executable vertical slice from event submission through validated normalization, transactional persistence, API retrieval, and frontend presentation.

## Users and workflow

The initial user is a SOC analyst or engineer running a local development instance. They submit or load clearly synthetic events, browse persisted records, filter the event list, and inspect normalized fields alongside the submitted JSON.

## MVP scope

- Versioned canonical event schema and bounded JSON ingestion.
- PostgreSQL persistence with Alembic migration.
- Health, create, list, and detail API endpoints.
- Next.js overview, event explorer, detail page, and an honest incident placeholder.
- Reproducible synthetic examples and automated validation/API tests.

## Non-goals

Correlation, incident creation, detection logic, production connectors, response automation, identity management, advanced RBAC, AI-generated analysis, and claims of detection accuracy.

## Acceptance

The API must validate, normalize, and persist events; preserve submitted JSON structure; expose bounded retrieval; and support a frontend backed by real API data. Migration, tests, lint/type/build, local E2E, and persistence restart checks must be reported with actual results. Any unrun check blocks an unconditional PASS.

## Design principles

Observed fields remain distinct from server-derived receipt/ingestion metadata. Missing event time and entities remain unknown. A fingerprint is not event identity. No incident or correlation is created by temporal proximity.

