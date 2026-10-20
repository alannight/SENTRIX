"""Persisted canonical event model."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import JSON, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from sentrix.db.base import Base, UTCDateTime


class SecurityEvent(Base):
    __tablename__ = "security_events"
    __table_args__ = (
        Index("ix_security_events_event_timestamp", "event_timestamp"),
        Index("ix_security_events_event_type", "event_type"),
        Index("ix_security_events_source", "source"),
        Index("ix_security_events_severity", "severity"),
        Index("ix_security_events_created_at_id", "created_at", "id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True)
    schema_version: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(200), nullable=False)
    event_type: Mapped[str] = mapped_column(String(200), nullable=False)
    event_timestamp: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    observed_timestamp: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    severity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    host: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    destination_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    process_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    raw_event: Mapped[object] = mapped_column(JSON, nullable=False)
    normalized_fields: Mapped[dict] = mapped_column(JSON, nullable=False)
    parser_name: Mapped[str] = mapped_column(String(100), nullable=False)
    parser_version: Mapped[str] = mapped_column(String(50), nullable=False)
    event_fingerprint: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)


class EventAuditRecord(Base):
    """Append-only record of event ingestion; excludes submitted telemetry."""

    __tablename__ = "event_audit_records"
    __table_args__ = (Index("ix_event_audit_records_occurred_at", "occurred_at"),)

    id: Mapped[UUID] = mapped_column(primary_key=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    event_id: Mapped[UUID] = mapped_column(nullable=False)
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
