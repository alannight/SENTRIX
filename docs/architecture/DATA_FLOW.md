# Foundation MVP Data Flow

```mermaid
sequenceDiagram
  participant P as Producer / synthetic loader
  participant A as FastAPI
  participant V as Pydantic validation
  participant N as Event service
  participant D as PostgreSQL
  participant W as Next.js UI

  P->>A: POST /api/v1/events (JSON)
  A->>A: enforce configured request-body limit
  A->>V: validate schema 1.0, timestamps, IPs, lengths
  V->>N: typed submission + original JSON object
  N->>N: normalize known values; assign ID, receipt time, fingerprint
  N->>D: insert canonical columns + original JSON in one transaction
  D-->>A: commit
  A-->>P: 201 + persisted event ID
  W->>A: GET /api/v1/events (filters + bounded page)
  A->>D: ordered query + count
  D-->>A: persisted records
  A-->>W: canonical page
  W->>A: GET /api/v1/events/{id}
  A-->>W: canonical detail + raw submitted JSON
```

If validation fails, no persistence is attempted. If the transaction fails, the API rolls it back and returns a generic service error. Receipt time (`observed_timestamp` when omitted), ingestion time, and record creation time are server-generated and are not substitutes for event occurrence time.

