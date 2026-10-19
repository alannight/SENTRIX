# SENTRIX — Correlation-Engine Readiness Contract

**Status:** Prerequisites only; no correlation implementation is part of this document.  
**Applies after:** Foundation verification gaps and security controls for the intended deployment are addressed.

Correlation must be explainable from persisted event facts and versioned rules. Every proposed event relationship must retain evidence, rule/data provenance, uncertainty and rejection context. Temporal proximity alone must never create an incident or assert causation.

## Prerequisites

### 1. Event identity and deduplication

Define producer identity and the scope of an event's stable source identifier. Specify behavior for retries, source replays, payload corrections, and identical payloads representing distinct real events. Decide whether the ingestion API accepts an idempotency key, a source-scoped `source_event_id`, or both; define uniqueness scope and conflict response before adding a uniqueness constraint.

Current `security_events.id` is a storage-row UUID. `event_fingerprint` is a deterministic digest of the complete raw JSON structure, is not unique, and is not used to suppress ingestion. It cannot identify corrected events or distinguish intentional identical records. Keep existing rows readable and add producer identity/idempotency fields and constraints through a new migration only after the retry/correction semantics are agreed.

### 2. Entity types and resolution

Define typed entities rather than matching free-form strings implicitly: for example, host/device, user/account, IP address, process/image, domain, file/hash, cloud resource and session. For each type, specify canonicalization, case rules, namespace/tenant/source scope, alias handling, confidence, validity interval, and merge/split history. Store the observed value and source alongside any resolved entity; preserve the unresolved state. Do not equate a hostname, user name, or IP globally without a resolution rule.

The current `host`, `user`, `source_ip`, `destination_ip` and `process_name` fields are values only; no entity registry, namespace or resolution history exists. Correlation that depends on resolved identities will need an additive entity/observation model or equivalent versioned mapping table.

### 3. Event time and late arrivals

Specify which timestamps a rule may use (`event_timestamp`, `observed_timestamp`, `ingested_at`), allowed skew, missing-time behavior, clock correction, timezone conversion, window boundaries, and how late or out-of-order events trigger recomputation. State whether old results are revised, superseded, or immutable and how analysts see the revision.

Currently `event_timestamp` is optional; `observed_timestamp` defaults to API receipt time; `ingested_at` is server receipt time. Do not silently substitute receipt time for occurrence time in a rule. Any watermark/late-arrival state should be explicit and versioned.

### 4. Versioned rules and execution provenance

Each rule set needs an immutable identifier/version, source revision, configuration hash, activation interval, supported schema range, evaluator version, and deterministic ordering/precedence. A result must point to the exact rule version and input event versions. Reprocessing should be idempotent and produce an auditable new run/revision rather than overwriting provenance.

No rule registry or evaluator exists today. Keep candidate scoring separate from incident grouping and avoid calling uncalibrated scores probabilities.

### 5. Evidence and correlation edge schema

An edge must identify source event, target event, relationship type, rule/version, execution/run, evidence references, matched entity/time constraints, created time, and optional confidence with documented calibration semantics. Evidence should reference canonical values or safely redacted raw paths and explain which facts caused the match. Preserve rejected candidates/negative evidence where needed to support evaluation and analyst review. Define edge direction, duplicate handling, expiration and supersession.

No edge/evidence model exists. Add an append-only correlation-run/edge model with foreign keys to events and indexes for both endpoints; preserve prior runs when a rule or entity resolution changes. Migration must be additive so existing event queries and records remain valid.

### 6. Incident grouping semantics

Define whether an incident is a mutable analyst-owned case, a deterministic grouping projection, or both. Specify group merge/split behavior, membership history, status/ownership, analyst override, closure/reopen, and how conflicting correlations are represented. A correlation edge is not itself an incident. Grouping must cite its source edges and grouping policy version.

There is currently only a UI placeholder. No incident table, lifecycle, API, analyst decision or grouping behavior exists. Add incident and membership history only after product semantics and authorization are specified.

### 7. Ground truth and evaluation

Create independently authored, versioned scenarios with event identity, positive and negative event-pair/edge labels, incident groups, ambiguity and late-arrival cases. Keep tuning and evaluation splits separate and freeze dataset/ground-truth versions before rule evaluation. Synthetic ingestion fixtures are not ground truth.

At minimum report pairwise precision, recall, F1, false-correlation rate, missed-correlation rate, and incident grouping metrics, plus counts and representative error cases. Compare with a no-correlation baseline and publish the rule version, dataset manifest, ground-truth version, run timestamp and artifacts for each result. Define metric denominators and treatment of ambiguous labels before measuring.

## Expected additive data/API work (after decisions)

Likely additions, each backed by an Alembic migration and compatibility tests:

1. Producer/source identity plus an idempotency or source-event key, with explicitly scoped uniqueness and retry/correction semantics.
2. Typed entity observations and optional resolution records with namespace and history.
3. Immutable correlation run/rule version records and event-pair evidence edges.
4. If approved, incident, incident membership history and analyst decision records that reference edge/run provenance.
5. Paginated read APIs for edges/runs/incidents with authorization before any raw/evidence data is returned.

Do not add these tables or endpoints until identity, time, evidence, grouping and access-control semantics have been reviewed. Changes should be additive; avoid changing the meaning of existing `id`, `event_fingerprint`, or timestamps.

## Entry criteria for implementation

- Identity/deduplication, entity resolution and late-arrival contracts approved.
- Rule and edge evidence schema reviewed with analyst workflows.
- Incident grouping semantics approved separately from edge generation.
- Independent ground-truth scenarios and metric definitions available.
- PostgreSQL migrations and app/browser Foundation workflow verified.
- Authentication/authorization design protects event and raw payload access.
- Regression tests cover positive, negative, ambiguous, duplicate, out-of-order, replay and rule-version cases.
