# SENTRIX Foundation MVP Threat Model

## Assets

- Submitted and normalized event data, including potentially sensitive raw telemetry.
- Database credentials and event database contents.
- Integrity and provenance of stored event records.
- API availability and accurate health state.

## Trust boundaries and actors

The API accepts untrusted JSON over HTTP from an event producer or local synthetic loader. The API process connects to PostgreSQL using configured credentials. The browser reads event records from the API. A local developer, another process on the development host, or a network caller able to reach the API may submit or read telemetry.

## Threats and current mitigations

| Threat | Current mitigation | Residual risk |
|---|---|---|
| Oversized or malformed payload | ASGI request-size limit, Pydantic validation, explicit raw JSON byte cap | No rate limiting; CPU/memory exposure remains bounded only by body size and process limits. |
| Invalid IP/timestamp/schema fields | IPv4/IPv6 and timestamp validation; explicit schema version | Unknown event types and extra fields are accepted and retained as raw input by design. |
| SQL injection | SQLAlchemy ORM and bound parameters | Database permissions and credential rotation are operational responsibilities. |
| Credential leakage through API errors | Generic DB failure responses; validation errors omit rejected input | Logs and deployment environment still require access control and review. |
| CORS misuse | Exact local origins; wildcard rejected; credentials disabled | CORS is not authentication and does not block non-browser clients. |
| Raw telemetry exposure | Development commands bind API to loopback; no payload logging; ingestion audit records omit telemetry | API has no authentication or authorization; any reachable caller can read raw events. Audit records do not identify callers or capture read access. |
| Duplicate or ambiguous event identity | Fingerprint is explicitly non-unique and does not suppress records | No idempotency key or duplicate workflow exists. |
| Data loss / schema drift | Alembic migrations, transactionally coupled ingestion audit record, and an explicit retention preview/apply command | Backups and restore are still undefined; audit records are not a backup and retention must be scheduled and reviewed operationally. |
| Log injection / sensitive content in logs | Structured JSON logging uses fixed messages and event IDs, not raw input; each response has a server-generated request ID | Infrastructure log collection and retention are not configured. |

## Deferred controls

Authentication, authorization/RBAC, TLS termination, request rate limits, audit trail for analyst access, encrypted backups, secret manager integration, production CORS origin review, database least privilege, dependency scanning, and deployment hardening are not implemented. A configurable event retention policy and cleanup command exist, but no scheduler or backup/restore process is provided. The service must remain a local development foundation and must not be exposed publicly.
