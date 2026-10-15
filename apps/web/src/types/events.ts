export type SecurityEvent = {
  id: string;
  schema_version: string;
  source: string;
  event_type: string;
  event_timestamp: string | null;
  observed_timestamp: string;
  ingested_at: string;
  severity: string | null;
  host: string | null;
  user: string | null;
  source_ip: string | null;
  destination_ip: string | null;
  process_name: string | null;
  raw_event: unknown;
  normalized_fields: Record<string, unknown>;
  parser_name: string;
  parser_version: string;
  event_fingerprint: string;
  created_at: string;
};

export type EventPage = {
  items: SecurityEvent[];
  total: number;
  limit: number;
  offset: number;
};

export type EventAccepted = {
  id: string;
  status: "persisted";
  schema_version: string;
  event_fingerprint: string;
};

