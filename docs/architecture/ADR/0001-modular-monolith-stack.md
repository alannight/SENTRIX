# ADR 0001: Modular monolith and foundation stack

- **Status:** Accepted for Foundation MVP
- **Date:** 2026-10-15

## Context

The initial workspace had no application source, and the first deliverable is a modest ingestion-to-investigation vertical slice. Distributed infrastructure would add operational cost before a scaling or isolation requirement is measured.

## Decision

Use a Next.js App Router/TypeScript/Tailwind frontend, a Python FastAPI/Pydantic/SQLAlchemy backend, PostgreSQL, Alembic, and Docker Compose for local database orchestration. Keep API and domain modules in one deployable backend. Use a deterministic JSON SHA-256 fingerprint as a lookup aid, not a uniqueness constraint. Keep tests isolated from the local PostgreSQL volume.

## Consequences

- One API process is simple to run and reason about.
- Schema changes are versioned and explicit.
- JSON storage preserves submitted event structure while canonical columns support the initial filters.
- There is no queue or asynchronous processing; the request commits synchronously.
- A monolith may later need extraction if measured scale, availability, or team boundaries justify it.
- Authentication, retention, production deployment, and correlation remain open work.

