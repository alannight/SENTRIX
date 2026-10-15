"""Event normalization and persistence use cases."""

import json
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from sentrix.events.models import SecurityEvent
from sentrix.events.schemas import (
    MAX_RAW_EVENT_BYTES,
    PARSER_NAME,
    PARSER_VERSION,
    SCHEMA_VERSION,
    EventSubmission,
    fingerprint_for,
    json_compatible,
)


class EventPayloadTooLarge(ValueError):
    pass


class EventPayloadNotJSONSafe(ValueError):
    pass


def create_event(
    submission: EventSubmission, original_payload: dict, session: Session
) -> SecurityEvent:
    raw_event = json_compatible(original_payload)
    try:
        serialized_raw_event = json.dumps(raw_event, ensure_ascii=False, allow_nan=False)
    except (TypeError, ValueError):
        raise EventPayloadNotJSONSafe from None
    if len(serialized_raw_event.encode("utf-8")) > MAX_RAW_EVENT_BYTES:
        raise EventPayloadTooLarge
    now = datetime.now(UTC)
    event = SecurityEvent(
        id=uuid4(),
        schema_version=SCHEMA_VERSION,
        source=submission.source,
        event_type=submission.event_type,
        event_timestamp=submission.event_timestamp,
        observed_timestamp=submission.observed_timestamp or now,
        ingested_at=now,
        severity=submission.severity.lower() if submission.severity else None,
        host=submission.host,
        user=submission.user,
        source_ip=str(submission.source_ip) if submission.source_ip else None,
        destination_ip=str(submission.destination_ip) if submission.destination_ip else None,
        process_name=submission.process_name,
        raw_event=raw_event,
        normalized_fields=json_compatible(submission.normalized_fields),
        parser_name=PARSER_NAME,
        parser_version=PARSER_VERSION,
        event_fingerprint=fingerprint_for(raw_event),
        created_at=now,
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event
