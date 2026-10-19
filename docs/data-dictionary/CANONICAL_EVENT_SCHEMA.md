# Canonical Event Schema — Version 1.0

## Submission contract

The API accepts a JSON object with required `source` and `event_type`. The current version is `schema_version: "1.0"`; omission defaults to 1.0, while any unsupported explicit version is rejected. The machine-readable shape is in `schemas/canonical-event-v1.schema.json`; Pydantic is the runtime authority.

| Field | Type | Required | Meaning and behavior |
|---|---|---:|---|
| `id` | UUID | generated | Stable internal record identifier. |
| `schema_version` | string | default | Canonical schema version stored as `1.0`. |
| `source` | string | yes | Producer/collector name; 1–200 characters. |
| `event_type` | string | yes | Normalized category; 1–200 characters. Unknown categories are accepted as supplied. |
| `event_timestamp` | timestamp or null | no | Source event occurrence time; no value is inferred. Naive timestamps are rejected. |
| `observed_timestamp` | timestamp | server default | Submitted aware timestamp if supplied; otherwise API receipt time. |
| `ingested_at` | timestamp | generated | Server ingestion time. |
| `severity` | string or null | no | Trimmed and lowercased when present; no classification is inferred. |
| `host`, `user`, `process_name` | string or null | no | Optional source-provided entity values. |
| `source_ip`, `destination_ip` | IP or null | no | Validated IPv4/IPv6, canonical string form. |
| `raw_event` | JSON value | no | Entire original submitted object is stored structurally. JSON key order/whitespace/byte encoding are not preserved. |
| `normalized_fields` | JSON object | default `{}` | Explicit additional normalized data submitted by the producer; current MVP does not infer these values. |
| `parser_name`, `parser_version` | string | generated | `sentrix-canonical` / `1.0.0`. |
| `event_fingerprint` | SHA-256 hex string | generated | Deterministic lookup aid over submitted raw JSON; not unique, not trusted as identity, and does not suppress duplicates. It is output-only in this API version. |
| `created_at` | timestamp | generated | Database record creation time. |

## Timestamp and identity rules

All accepted input timestamps require an explicit offset and are converted to UTC. The raw JSON retains the submitted timestamp string, so source representation remains inspectable. SQLite may not preserve timezone metadata in its native datetime storage; the SQLAlchemy type restores UTC awareness on reads. PostgreSQL stores timezone-aware values.

Every accepted submission receives a new UUID and record. Duplicate detection is not implemented. A fingerprint is based on deterministic JSON serialization (`sort_keys`, compact separators, UTF-8 SHA-256) and is not a guaranteed unique event identity.

## Example

```json
{
  "schema_version": "1.0",
  "source": "synthetic-auth-demo",
  "event_type": "authentication.failure",
  "event_timestamp": "2026-01-15T09:05:00Z",
  "severity": "medium",
  "user": "synthetic-user-02",
  "source_ip": "198.51.100.23",
  "raw_event": {"synthetic": true, "result": "failure"}
}
```
