"""Versioned, validated event ingestion and response schemas."""

import ipaddress
import json
from datetime import UTC, datetime
from hashlib import sha256
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, IPvAnyAddress, field_validator

SCHEMA_VERSION = "1.0"
PARSER_NAME = "sentrix-canonical"
PARSER_VERSION = "1.0.0"
MAX_RAW_EVENT_BYTES = 262_144


class EventSubmission(BaseModel):
    """Canonical input with unknown top-level keys retained as raw source data."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    schema_version: Literal["1.0"] = SCHEMA_VERSION
    source: str = Field(min_length=1, max_length=200)
    event_type: str = Field(min_length=1, max_length=200)
    event_timestamp: datetime | None = None
    observed_timestamp: datetime | None = None
    severity: str | None = Field(default=None, max_length=50)
    host: str | None = Field(default=None, max_length=500)
    user: str | None = Field(default=None, max_length=500)
    source_ip: IPvAnyAddress | None = None
    destination_ip: IPvAnyAddress | None = None
    process_name: str | None = Field(default=None, max_length=500)
    raw_event: dict[str, Any] | list[Any] | str | int | float | bool | None = None
    normalized_fields: dict[str, Any] = Field(default_factory=dict)

    @field_validator("event_timestamp", "observed_timestamp")
    @classmethod
    def require_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("timestamp must include a timezone offset")
        return value.astimezone(UTC) if value is not None else None


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    schema_version: str
    source: str
    event_type: str
    event_timestamp: datetime | None
    observed_timestamp: datetime
    ingested_at: datetime
    severity: str | None
    host: str | None
    user: str | None
    source_ip: str | None
    destination_ip: str | None
    process_name: str | None
    raw_event: Any
    normalized_fields: dict[str, Any]
    parser_name: str
    parser_version: str
    event_fingerprint: str
    created_at: datetime


class EventAccepted(BaseModel):
    id: UUID
    status: Literal["persisted"]
    schema_version: str
    event_fingerprint: str


class EventPage(BaseModel):
    items: list[EventRead]
    total: int
    limit: int
    offset: int


def json_compatible(value: Any) -> Any:
    """Convert typed values to JSON-compatible values."""
    if isinstance(value, datetime):
        return value.astimezone(UTC).isoformat()
    if isinstance(value, ipaddress.IPv4Address | ipaddress.IPv6Address):
        return str(value)
    if isinstance(value, dict):
        return {str(key): json_compatible(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_compatible(item) for item in value]
    return value


def fingerprint_for(raw_event: Any) -> str:
    serialized = json.dumps(
        json_compatible(raw_event), sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )
    return sha256(serialized.encode("utf-8")).hexdigest()
