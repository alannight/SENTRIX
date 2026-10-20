"""Event ingestion and retrieval endpoints."""

import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from sentrix.db.session import get_session
from sentrix.events.models import SecurityEvent
from sentrix.events.schemas import EventAccepted, EventPage, EventRead, EventSubmission
from sentrix.events.service import EventPayloadNotJSONSafe, EventPayloadTooLarge, create_event

router = APIRouter(prefix="/events", tags=["events"])
logger = logging.getLogger("sentrix.audit")


@router.post("", response_model=EventAccepted, status_code=status.HTTP_201_CREATED)
async def submit_event(
    submission: EventSubmission,
    request: Request,
    session: Session = Depends(get_session),  # noqa: B008
) -> EventAccepted:
    original_payload = getattr(request.state, "original_payload", None)
    if not isinstance(original_payload, dict):
        raise HTTPException(status_code=400, detail="Event payload must be a JSON object")
    try:
        event = create_event(submission, original_payload, session)
    except EventPayloadTooLarge:
        session.rollback()
        raise HTTPException(
            status_code=413, detail="Event payload exceeds the allowed size"
        ) from None
    except EventPayloadNotJSONSafe:
        session.rollback()
        raise HTTPException(
            status_code=422, detail="Event payload must contain valid JSON values"
        ) from None
    except SQLAlchemyError:
        session.rollback()
        logger.error(
            "Event persistence failed",
            extra={"operation": "event_ingest", "request_id": request.state.request_id},
        )
        raise HTTPException(status_code=503, detail="Event could not be persisted") from None
    logger.info(
        "Event persisted",
        extra={
            "event_id": str(event.id),
            "operation": "event_ingest",
            "request_id": request.state.request_id,
        },
    )
    return EventAccepted(
        id=event.id,
        status="persisted",
        schema_version=event.schema_version,
        event_fingerprint=event.event_fingerprint,
    )


@router.get("", response_model=EventPage)
async def list_events(
    event_type: str | None = Query(default=None, max_length=200),
    severity: str | None = Query(default=None, max_length=50),
    source: str | None = Query(default=None, max_length=200),
    event_fingerprint: str | None = Query(default=None, max_length=128),
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=10_000),
    session: Session = Depends(get_session),  # noqa: B008
) -> EventPage:
    if start_time and (start_time.tzinfo is None or start_time.utcoffset() is None):
        raise HTTPException(status_code=422, detail="start_time must include a timezone offset")
    if end_time and (end_time.tzinfo is None or end_time.utcoffset() is None):
        raise HTTPException(status_code=422, detail="end_time must include a timezone offset")
    if start_time and end_time and start_time > end_time:
        raise HTTPException(status_code=422, detail="start_time must be before end_time")
    filters = []
    if event_type:
        filters.append(SecurityEvent.event_type == event_type)
    if severity:
        filters.append(SecurityEvent.severity == severity.lower())
    if source:
        filters.append(SecurityEvent.source == source)
    if event_fingerprint:
        filters.append(SecurityEvent.event_fingerprint == event_fingerprint)
    if start_time:
        filters.append(SecurityEvent.event_timestamp >= start_time.astimezone(UTC))
    if end_time:
        filters.append(SecurityEvent.event_timestamp <= end_time.astimezone(UTC))
    try:
        total = session.scalar(select(func.count()).select_from(SecurityEvent).where(*filters)) or 0
        events = session.scalars(
            select(SecurityEvent)
            .where(*filters)
            .order_by(SecurityEvent.created_at.desc(), SecurityEvent.id.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    except SQLAlchemyError:
        logger.error("Event query failed", extra={"operation": "event_list"})
        raise HTTPException(status_code=503, detail="Events are temporarily unavailable") from None
    return EventPage(
        items=[EventRead.model_validate(event) for event in events],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{event_id}", response_model=EventRead)
async def get_event(
    event_id: UUID,
    session: Session = Depends(get_session),  # noqa: B008
) -> EventRead:
    try:
        event = session.get(SecurityEvent, event_id)
    except SQLAlchemyError:
        logger.error("Event lookup failed", extra={"operation": "event_detail"})
        raise HTTPException(status_code=503, detail="Event is temporarily unavailable") from None
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventRead.model_validate(event)
